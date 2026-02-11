"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/google-maps/geocode";
import { COMMISSION_RATES } from "@/config/constants";
import type { Facility, Transaction, Order } from "@/types";

export type ActionResult<T = void> = {
  error?: string;
  data?: T;
};

// Verify the current user is an admin before using service role
async function verifyAdmin(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Not authorized" };
  }

  return {};
}

// Get platform-wide statistics
export async function getPlatformStats(): Promise<
  ActionResult<{
    totalRevenue: number;
    activeFacilities: number;
    totalDrivers: number;
    ordersToday: number;
  }>
> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return { error: adminCheck.error };

  const sb = createServiceRoleClient();

  // Total revenue from completed order payments
  const { data: completedOrders } = await sb
    .from("orders")
    .select("total_price")
    .eq("status", "completed");

  const totalRevenue =
    completedOrders?.reduce((sum, o) => sum + o.total_price, 0) || 0;

  // Active facilities count
  const { count: activeFacilities } = await sb
    .from("facilities")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  // Total drivers count
  const { count: totalDrivers } = await sb
    .from("drivers")
    .select("id", { count: "exact", head: true });

  // Orders today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: ordersToday } = await sb
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  return {
    data: {
      totalRevenue,
      activeFacilities: activeFacilities || 0,
      totalDrivers: totalDrivers || 0,
      ordersToday: ordersToday || 0,
    },
  };
}

// Get all facilities with stats (for admin management)
export async function getAllFacilities(filters?: {
  city?: string;
  isActive?: boolean;
}): Promise<ActionResult<Facility[]>> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return { error: adminCheck.error };

  const sb = createServiceRoleClient();

  let query = sb.from("facilities").select("*").order("created_at", { ascending: false });

  if (filters?.city) {
    query = query.eq("city", filters.city);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  const { data: facilities, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data: facilities || [] };
}

// Toggle facility active/inactive
export async function updateFacilityStatus(
  facilityId: string,
  isActive: boolean
): Promise<ActionResult> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return { error: adminCheck.error };

  const sb = createServiceRoleClient();

  const { error } = await sb
    .from("facilities")
    .update({ is_active: isActive })
    .eq("id", facilityId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/facilities", "page");
  return {};
}

// Get all transactions with optional filters
export async function getAllTransactions(filters?: {
  type?: string;
  facilityId?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<{ transactions: (Transaction & { facility?: Facility; order?: Order })[]; total: number }>> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return { error: adminCheck.error };

  const sb = createServiceRoleClient();

  // Get total count
  let countQuery = sb
    .from("transactions")
    .select("id", { count: "exact", head: true });

  if (filters?.type) {
    countQuery = countQuery.eq("type", filters.type);
  }
  if (filters?.facilityId) {
    countQuery = countQuery.eq("facility_id", filters.facilityId);
  }

  const { count: total } = await countQuery;

  // Get transactions with joins
  let query = sb
    .from("transactions")
    .select("*, facility:facilities(id, name, city), order:orders(id, order_number)")
    .order("created_at", { ascending: false });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.facilityId) {
    query = query.eq("facility_id", filters.facilityId);
  }

  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data: transactions, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data: { transactions: transactions || [], total: total || 0 } };
}

// Get recent orders across the platform
export async function getRecentOrders(
  limit = 10
): Promise<ActionResult<(Order & { facility?: Facility })[]>> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return { error: adminCheck.error };

  const sb = createServiceRoleClient();

  const { data: orders, error } = await sb
    .from("orders")
    .select("*, facility:facilities(id, name, city)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  return { data: orders || [] };
}

// Get analytics data for charts
export async function getAnalytics(
  period: "week" | "month" = "week"
): Promise<
  ActionResult<{
    dailyRevenue: { date: string; revenue: number; orders: number }[];
    totalRevenue: number;
    totalOrders: number;
  }>
> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return { error: adminCheck.error };

  const sb = createServiceRoleClient();

  const days = period === "week" ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const { data: orders } = await sb
    .from("orders")
    .select("completed_at, total_price")
    .eq("status", "completed")
    .gte("completed_at", startDate.toISOString())
    .order("completed_at", { ascending: true });

  // Group by day
  const dailyMap = new Map<string, { revenue: number; orders: number }>();

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split("T")[0];
    dailyMap.set(dateStr, { revenue: 0, orders: 0 });
  }

  orders?.forEach((order) => {
    if (order.completed_at) {
      const dateStr = order.completed_at.split("T")[0];
      const existing = dailyMap.get(dateStr) || { revenue: 0, orders: 0 };
      dailyMap.set(dateStr, {
        revenue: existing.revenue + order.total_price,
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

  return {
    data: {
      dailyRevenue,
      totalRevenue,
      totalOrders,
    },
  };
}

// Create a new facility account (auth user + profile + facility record)
export async function createFacilityAccount(data: {
  email: string;
  password: string;
  contactName: string;
  facilityName: string;
  address: string;
  city: string;
  phone?: string;
}): Promise<ActionResult<{ email: string; tempPassword: string }>> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return { error: adminCheck.error };

  const { email, password, contactName, facilityName, address, city, phone } = data;

  if (!email || !password || !contactName || !facilityName || !address || !city) {
    return { error: "All required fields must be provided" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const sb = createServiceRoleClient();

  // Create auth user with email pre-confirmed
  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: contactName,
      role: "facility",
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user.id;

  // Insert facility record
  const defaultServices = [{ type: "standard", price: 4.5, duration: 20 }];

  // Geocode address to lat/lng
  const coords = await geocodeAddress(address, city);

  const { error: facilityError } = await sb.from("facilities").insert({
    user_id: userId,
    name: facilityName,
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

  if (facilityError) {
    // Clean up: delete the auth user if facility insert fails
    await sb.auth.admin.deleteUser(userId);
    return { error: facilityError.message };
  }

  revalidatePath("/admin/facilities", "page");
  return { data: { email, tempPassword: password } };
}

// Backfill coordinates for facilities with null lat/lng
export async function backfillFacilityCoordinates(): Promise<
  ActionResult<{ updated: number; failed: number }>
> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return { error: adminCheck.error };

  const sb = createServiceRoleClient();

  const { data: facilities, error } = await sb
    .from("facilities")
    .select("id, address, city")
    .is("latitude", null);

  if (error) {
    return { error: error.message };
  }

  if (!facilities || facilities.length === 0) {
    return { data: { updated: 0, failed: 0 } };
  }

  let updated = 0;
  let failed = 0;

  for (const facility of facilities) {
    const coords = await geocodeAddress(facility.address, facility.city);
    if (coords) {
      const { error: updateError } = await sb
        .from("facilities")
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq("id", facility.id);

      if (updateError) {
        failed++;
      } else {
        updated++;
      }
    } else {
      failed++;
    }
  }

  revalidatePath("/admin/facilities", "page");
  return { data: { updated, failed } };
}
