"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "./client";

export type ActionResult<T = void> = {
  error?: string;
  data?: T;
};

// Create or retrieve a Stripe Connect account link for facility onboarding
export async function createConnectAccountLink(): Promise<
  ActionResult<{ url: string }>
> {
  if (!stripe) {
    return { error: "Stripe is not configured" };
  }

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

  let accountId = facility.stripe_account_id;

  try {
    // Create Stripe Connect account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        metadata: { facility_id: facility.id },
      });

      accountId = account.id;

      // Save to DB
      await supabase
        .from("facilities")
        .update({ stripe_account_id: accountId })
        .eq("id", facility.id);
    }

    // Create account link for onboarding/setup
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/facility/settings`,
      return_url: `${siteUrl}/facility/settings`,
      type: "account_onboarding",
    });

    return { data: { url: accountLink.url } };
  } catch (err) {
    console.error("Stripe Connect error:", err);
    const message = err instanceof Error ? err.message : "Failed to connect with Stripe";
    return { error: message };
  }
}

// Check if a facility's Stripe account is fully onboarded
export async function getConnectAccountStatus(
  facilityId: string
): Promise<ActionResult<{ connected: boolean; detailsSubmitted: boolean }>> {
  if (!stripe) {
    return { data: { connected: false, detailsSubmitted: false } };
  }

  const supabase = await createClient();

  const { data: facility } = await supabase
    .from("facilities")
    .select("stripe_account_id")
    .eq("id", facilityId)
    .single();

  if (!facility?.stripe_account_id) {
    return { data: { connected: false, detailsSubmitted: false } };
  }

  const account = await stripe.accounts.retrieve(facility.stripe_account_id);

  return {
    data: {
      connected: true,
      detailsSubmitted: account.details_submitted ?? false,
    },
  };
}

// Create a refund for a cancelled order
export async function createRefund(
  orderId: string
): Promise<ActionResult> {
  if (!stripe) {
    return { error: "Stripe is not configured" };
  }

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("stripe_payment_intent_id, payment_status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.payment_status !== "paid" || !order.stripe_payment_intent_id) {
    return { error: "Order is not eligible for refund" };
  }

  await stripe.refunds.create({
    payment_intent: order.stripe_payment_intent_id,
  });

  // Update payment status
  await supabase
    .from("orders")
    .update({ payment_status: "refunded" })
    .eq("id", orderId);

  return {};
}
