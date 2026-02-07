import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.order_id;

      if (orderId) {
        // Idempotent: only update if not already paid
        const { data: order } = await supabase
          .from("orders")
          .select("payment_status")
          .eq("id", orderId)
          .single();

        if (order && order.payment_status !== "paid") {
          await supabase
            .from("orders")
            .update({ payment_status: "paid" })
            .eq("id", orderId);
        }
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;

      if (account.details_submitted) {
        // Update facility record to reflect onboarding completion
        // The stripe_account_id is already saved, but we can verify it's current
        await supabase
          .from("facilities")
          .update({ stripe_account_id: account.id })
          .eq("stripe_account_id", account.id);
      }
      break;
    }

    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return NextResponse.json({ received: true });
}
