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
    { type: "standard", price: 4.5, duration: 20 },
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
    .select("status, driver_id, order_number")
    .eq("id", orderId)
    .eq("facility_id", facility.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.status !== "pending") {
    return { error: "Only pending orders can be accepted" };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
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
    .select("status, driver_id, order_number")
    .eq("id", orderId)
    .eq("facility_id", facility.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.status !== "accepted") {
    return { error: "Only accepted orders can be started" };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
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
    .select("id, total_orders, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (!facility) {
    return { error: "Facility not found" };
  }

  // Verify order belongs to this facility and is in progress
  const { data: order } = await supabase
    .from("orders")
    .select("status, driver_id, base_price, commission_amount, stripe_payment_intent_id, order_number")
    .eq("id", orderId)
    .eq("facility_id", facility.id)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.status !== "in_progress") {
    return { error: "Only in-progress orders can be completed" };
  }

  const now = new Date().toISOString();

  // Update order status (payment_status already set to 'paid' by webhook on upfront payment)
  const { error: orderError } = await supabase
    .from("orders")
    .update({
      status: "completed",
      completed_at: now,
    })
    .eq("id", orderId);

  if (orderError) {
    return { error: orderError.message };
  }

  // Calculate payout (base_price - commission)
  const payoutAmount = Math.round((order.base_price - order.commission_amount) * 100); // cents

  // Create Stripe transfer if facility has connected account and order was paid
  let stripeTransferId: string | null = null;
  const txStatus = facility.stripe_account_id && order.stripe_payment_intent_id ? "completed" : "pending";

  if (facility.stripe_account_id && order.stripe_payment_intent_id && stripe) {
    try {
      const transfer = await stripe.transfers.create({
        amount: payoutAmount,
        currency: "eur",
        destination: facility.stripe_account_id,
        transfer_group: orderId,
      });
      stripeTransferId = transfer.id;
    } catch (err) {
      console.error("Stripe transfer failed:", err);
      // Continue — transactions recorded as pending
    }
  }

  // Insert transaction records
  await supabase.from("transactions").insert([
    {
      order_id: orderId,
      facility_id: facility.id,
      type: "order_payment",
      amount: order.base_price,
      status: txStatus,
    },
    {
      order_id: orderId,
      facility_id: facility.id,
      type: "commission",
      amount: order.commission_amount,
      status: txStatus,
    },
    {
      order_id: orderId,
      facility_id: facility.id,
      type: "payout",
      amount: order.base_price - order.commission_amount,
      status: txStatus,
      stripe_transfer_id: stripeTransferId,
    },
  ]);

  // Update driver's last cleaning date and total cleanings
  // Uses service role to bypass RLS (facility user can't update drivers table directly)
  // compliance_status is auto-computed by the check_driver_compliance trigger
  const serviceClient = createServiceRoleClient();

  const { data: driver } = await serviceClient
    .from("drivers")
    .select("total_cleanings")
    .eq("id", order.driver_id)
    .single();

  await serviceClient
    .from("drivers")
    .update({
      last_cleaning_date: now,
      total_cleanings: (driver?.total_cleanings || 0) + 1,
    })
    .eq("id", order.driver_id);

  // Update facility total orders
  await supabase
    .from("facilities")
    .update({
      total_orders: (facility.total_orders || 0) + 1,
    })
    .eq("id", facility.id);

  // Notify the driver that their order is complete
  const { data: completeDriver } = await serviceClient
    .from("drivers")
    .select("user_id")
    .eq("id", order.driver_id)
    .single();

  if (completeDriver) {
    await createNotification({
      userId: completeDriver.user_id,
      title: "Cleaning Complete",
      message: `Your bag cleaning #${order.order_number} is done! You can now rate the service.`,
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
