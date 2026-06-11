import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/actions";

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
      const meta = paymentIntent.metadata;

      // Check if an order already exists for this PaymentIntent
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, payment_status")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (existingOrder) {
        // Order exists — ensure payment_status is "paid"
        if (existingOrder.payment_status !== "paid") {
          const { error } = await supabase
            .from("orders")
            .update({ payment_status: "paid" })
            .eq("id", existingOrder.id);
          if (error) {
            console.error("Webhook: failed to mark order paid:", error);
            // Non-2xx → Stripe retries (up to ~3 days)
            return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
          }
        }
      } else if (meta.driver_id && meta.facility_id) {
        // Safety net: order not yet created (driver closed browser before confirmOrder ran)
        // Create the order from PaymentIntent metadata
        const { data: order, error } = await supabase
          .from("orders")
          .insert({
            driver_id: meta.driver_id,
            facility_id: meta.facility_id,
            service_type: meta.service_type || "standard",
            base_price: parseFloat(meta.base_price),
            commission_amount: parseFloat(meta.commission_amount),
            total_price: parseFloat(meta.total_price),
            status: "pending",
            payment_status: "paid",
            stripe_payment_intent_id: paymentIntent.id,
          })
          .select()
          .single();

        if (error) {
          // Unique index (migration 009): concurrent confirmOrder won the race — fine.
          if (error.code !== "23505") {
            console.error("Webhook: failed to create order from PI metadata:", error);
            // Non-2xx → Stripe retries; a charged driver must not end up with no order
            return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
          }
        } else if (order && meta.facility_user_id) {
          await createNotification({
            userId: meta.facility_user_id,
            title: "New Order",
            message: `A driver has placed a new cleaning order #${order.order_number}`,
            type: "order",
            data: { url: "/facility/orders" },
          });
        }
      }
      break;
    }

    case "charge.refunded": {
      // Manual refunds from the Stripe Dashboard (or any full refund) must be
      // reflected here, or the facility could still process the refunded order.
      // The payment gate (payment_status === "paid") then blocks accept/start/complete.
      const charge = event.data.object as Stripe.Charge;
      if (!charge.refunded) break; // only fully refunded charges

      const piId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (piId) {
        const { error } = await supabase
          .from("orders")
          .update({ payment_status: "refunded" })
          .eq("stripe_payment_intent_id", piId)
          .neq("payment_status", "refunded");
        if (error) {
          console.error("Webhook: failed to mark order refunded:", error);
          return NextResponse.json({ error: "Failed to mark refunded" }, { status: 500 });
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
