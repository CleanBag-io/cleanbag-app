"use server";

import webpush from "web-push";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type ActionResult<T = void> = {
  error?: string;
  data?: T;
};

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@cleanbag.io",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

// Save a push subscription for the current user
export async function savePushSubscription(
  subscription: PushSubscriptionJSON
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!subscription.endpoint) {
    return { error: "Invalid subscription" };
  }

  const keys = subscription.keys as Record<string, string> | undefined;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: keys?.p256dh || "",
      auth: keys?.auth || "",
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}

// Remove a push subscription
export async function removePushSubscription(
  endpoint: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return { error: error.message };
  }

  return {};
}

// Send push notification to a user (fire-and-forget, used server-side)
export async function sendPushNotification({
  userId,
  title,
  message,
  url,
}: {
  userId: string;
  title: string;
  message: string;
  url?: string;
}): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return; // Push not configured
  }

  const serviceClient = createServiceRoleClient();

  const { data: subscriptions } = await serviceClient
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) {
    return;
  }

  const payload = JSON.stringify({ title, message, url: url || "/" });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // Remove expired or invalid subscriptions
        if (statusCode === 404 || statusCode === 410) {
          await serviceClient
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
        throw err;
      }
    })
  );

  const failures = results.filter((r) => r.status === "rejected").length;
  if (failures > 0) {
    console.warn(
      `Push: ${failures}/${subscriptions.length} notifications failed for user ${userId}`
    );
  }
}
