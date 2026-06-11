"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { geocodeAddress } from "@/lib/google-maps/geocode";
import type { Facility, Order, Driver, Profile } from "@/types";
import type { OrderStatus } from "@/config/constants";
import { COMMISSION_RATES } from "@/config/constants";
import { createNotification } from "@/lib/notifications/actions";

export type ActionResult<T = void> = {
  error?: string;
  data?: T;
};

// Create a new facility (onboarding)
export async function createFacility(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const phone = formData.get("phone") as string;

  if (!name || !address || !city) {
    return { error: "Name, address, and city are required" };
  }

  // Check if facility already exists
  const { data: existing } = await supabase
    .from("facilities")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { error: "Facility already exists" };
  }

  // Create facility with default service
  const defaultServices = [
    { type: "standard", price: 4.0, duration: 20 },
  ];

  // Geocode address to lat/lng
  const coords = await geocodeAddress(address, city);

  const { error } = await supabase.from("facilities").insert({
    user_id: user.id,
    name,
    address,
    city,
    phone: phone || null,
    services: defaultServices,
    commission_rate: COMMISSION_RATES.default,
    is_active: true,
    rating: 0,
    total_orders: 0,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  // Update profile role to facility
  await supabase
    .from("profiles")
    .update({ role: "facility" })
    .eq("id", user.id);

  revalidatePath("/facility", "layout");
  return {};
}

// Get current facility profile
export async function getCurrentFacility(): Promise<ActionResult<Facility | null>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null };
  }

  const { data: facility, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return { error: error.message };
  }

  return { data: facility || null };
}

// Get facility orders with driver info
export async function getFacilityOrders(
  status?: OrderStatus | "all"
): Promise<ActionResult<(Order & { driver: Driver & { profile: Profile } })[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get facility ID
  const { data: facility } = await supabase
    .from("facilities")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!facility) {
    return { error: "Facility not found" };
  }

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      driver:drivers(
        *,
        profile:profiles(*)
      )
    `
    )
    .eq("facility_id", facility.id)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: orders, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data: orders || [] };
}

// Get single order by ID (for facility)
export async function getFacilityOrder(
  orderId: string
): Promise<ActionResult<(Order & { driver: Driver & { profile: Profile } }) | null>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get facility ID
  const { data: facility } = await supabase
    .from("facilities")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!facility) {
    return { error: "Facility not found" };
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      driver:drivers(
        *,
        profile:profiles(*)
      )
    `
    )
    .eq("id", orderId)
    .eq("facility_id", facility.id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: order };
}

// Accept an order
export async function acceptOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get facility ID
  const { data: facility } = await supabase
    .from("facilities")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!facility) {
    return { error: "Facility not found" };
  }

  // Verify order belongs to this facility and is pending
  const { data: order } = await supabase
    .from("orders")
    .select("status, payment_status, driver_id, order_number")
    .eq("id", orderId)
    .eq("facility_id", facility.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.payment_status !== "paid") {
    return { error: "Payment has not been completed for this order" };
  }

  if (order.status !== "pending") {
    return { error: "Only pending orders can be accepted" };
  }

  // Compare-and-set: status predicate makes concurrent accepts race-safe
  const { data: accepted, error } = await supabase
    .from("orders")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("facility_id", facility.id)
    .eq("status", "pending")
    .eq("payment_status", "paid")
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!accepted) {
    return { error: "Only pending orders can be accepted" };
  }

  // Notify the driver
  const { data: acceptDriver } = await supabase
    .from("drivers")
    .select("user_id")
    .eq("id", order.driver_id)
    .single();

  if (acceptDriver) {
    await createNotification({
      userId: acceptDriver.user_id,
      title: "Order Accepted",
      message: `Your order #${order.order_number} has been accepted`,
      type: "order",
      data: { url: `/driver/orders/${orderId}` },
    });
  }

  revalidatePath("/facility", "layout");
  return {};
}

// Start cleaning an order
export async function startOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get facility ID
  const { data: facility } = await supabase
    .from("facilities")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!facility) {
    return { error: "Facility not found" };
  }

  // Verify order belongs to this facility and is accepted
  const { data: order } = await supabase
    .from("orders")
    .select("status, payment_status, driver_id, order_number")
    .eq("id", orderId)
    .eq("facility_id", facility.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.payment_status !== "paid") {
    return { error: "Payment has not been completed for this order" };
  }

  if (order.status !== "accepted") {
    return { error: "Only accepted orders can be started" };
  }

  // Compare-and-set: status predicate makes concurrent starts race-safe
  const { data: started, error } = await supabase
    .from("orders")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("facility_id", facility.id)
    .eq("status", "accepted")
    .eq("payment_status", "paid")
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!started) {
    return { error: "Only accepted orders can be started" };
  }

  // Notify the driver
  const { data: startDriver } = await supabase
    .from("drivers")
    .select("user_id")
    .eq("id", order.driver_id)
    .single();

  if (startDriver) {
    await createNotification({
      userId: startDriver.user_id,
      title: "Cleaning Started",
      message: `Your bag cleaning #${order.order_number} is now in progress`,
      type: "order",
      data: { url: `/driver/orders/${orderId}` },
    });
  }

  revalidatePath("/facility", "layout");
  return {};
}

// Complete an order
export async function completeOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get facility
  const { data: facility } = await supabase
    .from("facilities")
    .select("id, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!facility) {
    return { error: "Facility not found" };
  }

  // Pre-check for friendly error messages (the RPC re-checks atomically)
  const { data: order } = await supabase
    .from("orders")
    .select("status, payment_status")
    .eq("id", orderId)
    .eq("facility_id", facility.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.payment_status !== "paid") {
    return { error: "Payment has not been completed for this order" };
  }

  if (order.status !== "in_progress") {
    return { error: "Only in-progress orders can be completed" };
  }

  // Atomic completion: status-gated order update + transaction records +
  // driver compliance + facility counter in one DB transaction (migration 009).
  // The status predicate inside the RPC means only one of two concurrent
  // completions wins; the loser gets ORDER_NOT_COMPLETABLE.
  const serviceClient = createServiceRoleClient();
  const { data: completed, error: rpcError } = await serviceClient.rpc("complete_order", {
    p_order_id: orderId,
    p_facility_id: facility.id,
  });

  if (rpcError) {
    if (rpcError.message.includes("ORDER_NOT_COMPLETABLE")) {
      return { error: "Only in-progress orders can be completed" };
    }
    return { error: rpcError.message };
  }

  // Stripe transfer AFTER the committed transaction — payout row starts
  // 'pending' and is flipped to 'completed'/'failed' based on the real outcome.
  if (facility.stripe_account_id && completed.stripe_payment_intent_id && stripe) {
    const payoutAmount = Math.round((completed.base_price - completed.commission_amount) * 100); // cents
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(completed.stripe_payment_intent_id);
      const chargeId =
        typeof paymentIntent.latest_charge === "string"
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge?.id;

      const transfer = await stripe.transfers.create(
        {
          amount: payoutAmount,
          currency: "eur",
          destination: facility.stripe_account_id,
          // Draw from this order's charge (settles even while platform balance is pending)
          ...(chargeId ? { source_transaction: chargeId } : {}),
          transfer_group: orderId,
        },
        { idempotencyKey: `transfer-${orderId}` }
      );

      const { error: payoutUpdateError } = await serviceClient
        .from("transactions")
        .update({ status: "completed", stripe_transfer_id: transfer.id })
        .eq("order_id", orderId)
        .eq("type", "payout");
      if (payoutUpdateError) {
        console.error("completeOrder: failed to record transfer", transfer.id, payoutUpdateError);
      }
    } catch (err) {
      console.error("Stripe transfer failed for order", orderId, err);
      await serviceClient
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", orderId)
        .eq("type", "payout");
      // Do not fail the completion — the driver's order is done; the payout
      // shows as 'failed' on the admin transactions page for follow-up.
    }
  }

  // Notify the driver that their order is complete
  const { data: completeDriver } = await serviceClient
    .from("drivers")
    .select("user_id")
    .eq("id", completed.driver_id)
    .single();

  if (completeDriver) {
    await createNotification({
      userId: completeDriver.user_id,
      title: "Cleaning Complete",
      message: `Your bag cleaning #${completed.order_number} is done! You can now rate the service.`,
      type: "order",
      data: { url: `/driver/orders/${orderId}` },
    });
  }

  revalidatePath("/facility", "layout");
  revalidatePath("/driver", "layout");
  return {};
}

// Get facility statistics
export async function getFacilityStats(): Promise<
  ActionResult<{
    todayOrders: number;
    pendingOrders: number;
    completedOrders: number;
    todayRevenue: number;
    totalRevenue: number;
    averageRating: number;
    totalOrders: number;
  }>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get facility
  const { data: facility } = await supabase
    .from("facilities")
    .select("id, rating, total_orders")
    .eq("user_id", user.id)
    .single();

  if (!facility) {
    return { error: "Facility not found" };
  }

  // Get today's start (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Get today's orders
  const { data: todayOrdersData } = await supabase
    .from("orders")
    .select("id, status, base_price, commission_amount")
    .eq("facility_id", facility.id)
    .gte("created_at", todayISO);

  const todayOrders = todayOrdersData?.length || 0;

  // Get pending orders count
  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("facility_id", facility.id)
    .in("status", ["pending", "accepted", "in_progress"]);

  // Get completed orders count
  const { count: completedOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("facility_id", facility.id)
    .eq("status", "completed");

  // Calculate today's revenue (base_price - commission for completed orders)
  const todayRevenue =
    todayOrdersData
      ?.filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.base_price - o.commission_amount), 0) || 0;

  // Get total revenue from all completed orders
  const { data: allCompletedOrders } = await supabase
    .from("orders")
    .select("base_price, commission_amount")
    .eq("facility_id", facility.id)
    .eq("status", "completed");

  const totalRevenue =
    allCompletedOrders?.reduce((sum, o) => sum + (o.base_price - o.commission_amount), 0) || 0;

  return {
    data: {
      todayOrders,
      pendingOrders: pendingOrders || 0,
      completedOrders: completedOrders || 0,
      todayRevenue,
      totalRevenue,
      averageRating: facility.rating,
      totalOrders: facility.total_orders,
    },
  };
}

// Update facility profile
export async function updateFacility(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;

  if (!name || !address) {
    return { error: "Name and address are required" };
  }

  // Fetch current facility to get city for geocoding
  const { data: current } = await supabase
    .from("facilities")
    .select("city, address")
    .eq("user_id", user.id)
    .single();

  // Re-geocode if address changed
  let coords: { lat: number; lng: number } | null = null;
  if (current && address !== current.address) {
    coords = await geocodeAddress(address, current.city);
  }

  const updateData: Record<string, unknown> = {
    name,
    address,
    phone: phone || null,
  };
  if (coords) {
    updateData.latitude = coords.lat;
    updateData.longitude = coords.lng;
  }

  const { error } = await supabase
    .from("facilities")
    .update(updateData)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/facility", "layout");
  return {};
}

// Get revenue data for charts (last 7 days or 30 days)
export async function getFacilityRevenue(
  period: "week" | "month" = "week"
): Promise<
  ActionResult<{
    dailyRevenue: { date: string; revenue: number; orders: number }[];
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  }>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get facility
  const { data: facility } = await supabase
    .from("facilities")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!facility) {
    return { error: "Facility not found" };
  }

  // Calculate date range
  const days = period === "week" ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get completed orders in period
  const { data: orders } = await supabase
    .from("orders")
    .select("completed_at, base_price, commission_amount")
    .eq("facility_id", facility.id)
    .eq("status", "completed")
    .gte("completed_at", startDate.toISOString())
    .order("completed_at", { ascending: true });

  // Group by day
  const dailyMap = new Map<string, { revenue: number; orders: number }>();

  // Initialize all days with zero
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split("T")[0];
    dailyMap.set(dateStr, { revenue: 0, orders: 0 });
  }

  // Fill in actual data
  orders?.forEach((order) => {
    if (order.completed_at) {
      const dateStr = order.completed_at.split("T")[0];
      const existing = dailyMap.get(dateStr) || { revenue: 0, orders: 0 };
      dailyMap.set(dateStr, {
        revenue: existing.revenue + (order.base_price - order.commission_amount),
        orders: existing.orders + 1,
      });
    }
  });

  const dailyRevenue = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    orders: data.orders,
  }));

  const totalRevenue = dailyRevenue.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = dailyRevenue.reduce((sum, d) => sum + d.orders, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    data: {
      dailyRevenue,
      totalRevenue,
      totalOrders,
      averageOrderValue,
    },
  };
}
