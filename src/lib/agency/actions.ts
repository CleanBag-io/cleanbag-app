"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Agency, Driver, Profile, AgencyRequest } from "@/types";
import type { City } from "@/config/constants";
import { createNotification } from "@/lib/notifications/actions";

export type ActionResult<T = void> = {
  error?: string;
  data?: T;
};

// Get current user's agency record
export async function getAgency(): Promise<ActionResult<Agency | null>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null };
  }

  const { data: agency, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return { error: error.message };
  }

  return { data: agency || null };
}

// Create or update agency (onboarding + settings)
export async function upsertAgency(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const city = formData.get("city") as City;
  const complianceTargetPct = parseInt(formData.get("compliance_target") as string) || 80;
  // DB stores as DECIMAL(3,2), e.g. 0.80 for 80%
  const complianceTarget = complianceTargetPct / 100;

  if (!name || !city) {
    return { error: "Company name and city are required" };
  }

  const { data: existing } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("agencies")
      .update({ name, city, compliance_target: complianceTarget })
      .eq("user_id", user.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("agencies").insert({
      user_id: user.id,
      name,
      city,
      compliance_target: complianceTarget,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/agency", "layout");
  return {};
}

// Get all drivers associated with this agency
export async function getAgencyDrivers(): Promise<
  ActionResult<(Driver & { profile: Profile })[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return { error: "Company not found" };
  }

  const { data: drivers, error } = await supabase
    .from("drivers")
    .select("*, profile:profiles(*)")
    .eq("agency_id", agency.id);

  if (error) {
    return { error: error.message };
  }

  return { data: drivers || [] };
}

// Get requests for this agency
export async function getAgencyRequests(
  status?: string
): Promise<ActionResult<AgencyRequest[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return { error: "Company not found" };
  }

  let query = supabase
    .from("agency_requests")
    .select("*, driver:drivers(*, profile:profiles(*))")
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: requests, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data: requests || [] };
}

// Send invitation to a driver
export async function sendInvitation(
  driverId: string,
  message?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return { error: "Company not found" };
  }

  // Check driver isn't already affiliated
  const { data: driver } = await supabase
    .from("drivers")
    .select("agency_id")
    .eq("id", driverId)
    .single();

  if (!driver) {
    return { error: "Driver not found" };
  }

  if (driver.agency_id) {
    return { error: "Driver is already associated with a company" };
  }

  const { error } = await supabase.from("agency_requests").insert({
    agency_id: agency.id,
    driver_id: driverId,
    initiated_by: "agency",
    message: message || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "An invitation is already pending for this driver" };
    }
    return { error: error.message };
  }

  // Notify the driver about the invitation
  const { data: invitedDriver } = await supabase
    .from("drivers")
    .select("user_id")
    .eq("id", driverId)
    .single();

  if (invitedDriver) {
    await createNotification({
      userId: invitedDriver.user_id,
      title: "Company Invitation",
      message: "A company has invited you to join. Check your profile to respond.",
      type: "system",
      data: { url: "/driver/profile" },
    });
  }

  revalidatePath("/agency/drivers", "page");
  return {};
}

// Accept or reject a join request from a driver
export async function respondToRequest(
  requestId: string,
  accept: boolean
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return { error: "Company not found" };
  }

  // Get the request
  const { data: request } = await supabase
    .from("agency_requests")
    .select("*")
    .eq("id", requestId)
    .eq("agency_id", agency.id)
    .eq("status", "pending")
    .single();

  if (!request) {
    return { error: "Request not found or already resolved" };
  }

  const newStatus = accept ? "accepted" : "rejected";

  const { error: updateError } = await supabase
    .from("agency_requests")
    .update({
      status: newStatus,
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    return { error: updateError.message };
  }

  // If accepted, set the driver's agency_id
  if (accept) {
    const { error: driverError } = await supabase
      .from("drivers")
      .update({ agency_id: agency.id })
      .eq("id", request.driver_id);

    if (driverError) {
      return { error: driverError.message };
    }
  }

  // Notify the driver about the response
  const { data: requestDriver } = await supabase
    .from("drivers")
    .select("user_id")
    .eq("id", request.driver_id)
    .single();

  if (requestDriver) {
    await createNotification({
      userId: requestDriver.user_id,
      title: accept ? "Request Accepted" : "Request Declined",
      message: accept
        ? "Your request to join the company has been accepted!"
        : "Your request to join the company has been declined.",
      type: "system",
      data: { url: "/driver/profile" },
    });
  }

  revalidatePath("/agency", "layout");
  revalidatePath("/driver/profile", "page");
  return {};
}

// Cancel a pending invitation
export async function cancelInvitation(
  requestId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return { error: "Company not found" };
  }

  const { error } = await supabase
    .from("agency_requests")
    .update({
      status: "cancelled",
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("agency_id", agency.id)
    .eq("status", "pending")
    .eq("initiated_by", "agency");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/agency/drivers", "page");
  return {};
}

// Remove a driver from the company
export async function removeDriver(driverId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return { error: "Company not found" };
  }

  // Verify driver belongs to this agency
  const { data: driver } = await supabase
    .from("drivers")
    .select("agency_id")
    .eq("id", driverId)
    .single();

  if (!driver || driver.agency_id !== agency.id) {
    return { error: "Driver not found in your company" };
  }

  // Remove affiliation
  const { error } = await supabase
    .from("drivers")
    .update({ agency_id: null })
    .eq("id", driverId);

  if (error) {
    return { error: error.message };
  }

  // Cancel any pending requests between this driver and agency
  await supabase
    .from("agency_requests")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("agency_id", agency.id)
    .eq("driver_id", driverId)
    .eq("status", "pending");

  revalidatePath("/agency", "layout");
  revalidatePath("/driver/profile", "page");
  return {};
}

// Search unaffiliated drivers for invitation (filtered by city)
export async function searchDrivers(
  city?: City
): Promise<ActionResult<(Driver & { profile: Profile })[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id, city")
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return { error: "Company not found" };
  }

  const searchCity = city || agency.city;

  const { data: drivers, error } = await supabase
    .from("drivers")
    .select("*, profile:profiles(*)")
    .is("agency_id", null)
    .eq("city", searchCity);

  if (error) {
    return { error: error.message };
  }

  // Filter out drivers who already have a pending request with this agency
  const { data: pendingRequests } = await supabase
    .from("agency_requests")
    .select("driver_id")
    .eq("agency_id", agency.id)
    .eq("status", "pending");

  const pendingDriverIds = new Set(pendingRequests?.map((r) => r.driver_id) || []);
  const availableDrivers = (drivers || []).filter(
    (d) => !pendingDriverIds.has(d.id)
  );

  return { data: availableDrivers };
}

// Get agency dashboard statistics
export async function getAgencyStats(): Promise<
  ActionResult<{
    totalDrivers: number;
    compliantDrivers: number;
    warningDrivers: number;
    overdueDrivers: number;
    complianceRate: number;
    complianceTarget: number;
    pendingRequests: number;
  }>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id, compliance_target")
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return { error: "Company not found" };
  }

  // Get all agency drivers
  const { data: drivers } = await supabase
    .from("drivers")
    .select("compliance_status")
    .eq("agency_id", agency.id);

  const totalDrivers = drivers?.length || 0;
  const compliantDrivers = drivers?.filter((d) => d.compliance_status === "compliant").length || 0;
  const warningDrivers = drivers?.filter((d) => d.compliance_status === "warning").length || 0;
  const overdueDrivers = drivers?.filter((d) => d.compliance_status === "overdue").length || 0;
  const complianceRate = totalDrivers > 0 ? Math.round((compliantDrivers / totalDrivers) * 100) : 0;

  // Get pending incoming requests
  const { count: pendingRequests } = await supabase
    .from("agency_requests")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agency.id)
    .eq("status", "pending")
    .eq("initiated_by", "driver");

  return {
    data: {
      totalDrivers,
      compliantDrivers,
      warningDrivers,
      overdueDrivers,
      complianceRate,
      complianceTarget: Math.round(agency.compliance_target * 100),
      pendingRequests: pendingRequests || 0,
    },
  };
}

// Get compliance report data (for export)
export async function getComplianceReport(): Promise<
  ActionResult<
    {
      driverName: string;
      vehicleType: string | null;
      city: string;
      complianceStatus: string;
      lastCleaningDate: string | null;
      totalCleanings: number;
    }[]
  >
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agency) {
    return { error: "Company not found" };
  }

  const { data: drivers, error } = await supabase
    .from("drivers")
    .select("*, profile:profiles(full_name)")
    .eq("agency_id", agency.id)
    .order("compliance_status", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  const report = (drivers || []).map((d) => ({
    driverName: (d.profile as unknown as { full_name: string })?.full_name || "Unknown",
    vehicleType: d.vehicle_type,
    city: d.city,
    complianceStatus: d.compliance_status,
    lastCleaningDate: d.last_cleaning_date,
    totalCleanings: d.total_cleanings,
  }));

  return { data: report };
}
