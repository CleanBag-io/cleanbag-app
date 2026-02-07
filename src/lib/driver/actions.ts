"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { createRefund } from "@/lib/stripe/actions";
import type { Driver, Order, Facility } from "@/types";
import type { City } from "@/config/constants";
import { PRICING, COMMISSION_RATES } from "@/config/constants";

export type ActionResult<T = void> = {
  error?: string;
  data?: T;
};

// Get current driver profile
export async function getDriver(): Promise<ActionResult<Driver | null>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null };
  }

  const { data: driver, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    return { error: error.message };
  }

  return { data: driver || null };
}

// Create or update driver profile (onboarding)
export async function upsertDriver(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const vehicleType = formData.get("vehicle_type") as
    | "motorcycle"
    | "car"
    | "bicycle"
    | null;
  const licensePlate = formData.get("license_plate") as string | null;
  const platformsRaw = formData.getAll("platforms") as string[];
  const city = formData.get("city") as City;

  if (!city) {
    return { error: "City is required" };
  }

  // Check if driver exists
  const { data: existingDriver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingDriver) {
    // Update existing driver
    const { error } = await supabase
      .from("drivers")
      .update({
        vehicle_type: vehicleType || null,
        license_plate: licensePlate || null,
        platforms: platformsRaw,
        city,
      })
      .eq("user_id", user.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Create new driver
    const { error } = await supabase.from("drivers").insert({
      user_id: user.id,
      vehicle_type: vehicleType || null,
      license_plate: licensePlate || null,
      platforms: platformsRaw,
      city,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/driver", "layout");
  return {};
}

// Get active facilities, optionally filtered by city
export async function getFacilities(
  city?: City
): Promise<ActionResult<Facility[]>> {
  const supabase = await createClient();

  let query = supabase
    .from("facilities")
    .select("*")
    .eq("is_active", true)
    .order("rating", { ascending: false });

  if (city) {
    query = query.eq("city", city);
  }

  const { data: facilities, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data: facilities || [] };
}

// Get single facility by ID
export async function getFacility(
  facilityId: string
): Promise<ActionResult<Facility | null>> {
  const supabase = await createClient();

  const { data: facility, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", facilityId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: facility };
}

// Create a new order (booking) — returns clientSecret for Stripe payment
export async function createOrder(formData: FormData): Promise<ActionResult<Order & { clientSecret?: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get driver ID
  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (driverError || !driver) {
    return { error: "Driver profile not found. Please complete onboarding." };
  }

  const facilityId = formData.get("facility_id") as string;

  if (!facilityId) {
    return { error: "Facility is required" };
  }

  // Get facility to calculate pricing
  const { data: facility, error: facilityError } = await supabase
    .from("facilities")
    .select("commission_rate")
    .eq("id", facilityId)
    .single();

  if (facilityError || !facility) {
    return { error: "Facility not found" };
  }

  // Calculate pricing — single service model
  const basePrice = PRICING.bagClean;
  const commissionRate = facility.commission_rate || COMMISSION_RATES.default;
  const commissionAmount = Math.round(basePrice * commissionRate * 100) / 100;
  const totalPrice = basePrice;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      driver_id: driver.id,
      facility_id: facilityId,
      service_type: "standard",
      base_price: basePrice,
      commission_amount: commissionAmount,
      total_price: totalPrice,
      status: "pending",
      payment_status: "pending",
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Create Stripe PaymentIntent for upfront payment
  let clientSecret: string | undefined;
  if (stripe) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * 100), // cents
        currency: "eur",
        metadata: {
          order_id: order.id,
          facility_id: facilityId,
        },
        transfer_group: order.id,
      });

      clientSecret = paymentIntent.client_secret ?? undefined;

      // Save PaymentIntent ID on the order
      await supabase
        .from("orders")
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq("id", order.id);
    } catch (err) {
      console.error("Stripe PaymentIntent creation failed:", err);
      // Order is created but payment failed — return order without clientSecret
    }
  }

  revalidatePath("/driver/orders", "page");
  return { data: { ...order, clientSecret } };
}

// Get driver's orders
export async function getDriverOrders(): Promise<ActionResult<(Order & { facility: Facility })[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get driver ID
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!driver) {
    return { data: [] };
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      facility:facilities(*)
    `
    )
    .eq("driver_id", driver.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: orders || [] };
}

// Get single order by ID
export async function getOrder(
  orderId: string
): Promise<ActionResult<(Order & { facility: Facility }) | null>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      facility:facilities(*)
    `
    )
    .eq("id", orderId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: order };
}

// Cancel an order
export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get driver's order
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!driver) {
    return { error: "Driver not found" };
  }

  // Verify the order belongs to this driver and is cancellable
  const { data: order } = await supabase
    .from("orders")
    .select("status, payment_status, stripe_payment_intent_id")
    .eq("id", orderId)
    .eq("driver_id", driver.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.status !== "pending") {
    return { error: "Only pending orders can be cancelled" };
  }

  // If paid, issue Stripe refund
  if (order.payment_status === "paid" && order.stripe_payment_intent_id) {
    const refundResult = await createRefund(orderId);
    if (refundResult.error) {
      return { error: `Cancellation failed: ${refundResult.error}` };
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: "Cancelled by driver",
      payment_status: order.payment_status === "paid" ? "refunded" : order.payment_status,
    })
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/driver/orders", "page");
  return {};
}

// Rate an order
export async function rateOrder(
  orderId: string,
  rating: number,
  review?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      rating,
      review: review || null,
    })
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/driver/orders", "page");
  return {};
}
