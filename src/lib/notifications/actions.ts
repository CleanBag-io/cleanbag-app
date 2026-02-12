"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push/actions";
import type { Notification } from "@/types";

export type ActionResult<T = void> = {
  error?: string;
  data?: T;
};

// Get notifications for the current user
export async function getNotifications(
  limit = 50
): Promise<ActionResult<Notification[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  return { data: data || [] };
}

// Get unread notification count
export async function getUnreadCount(): Promise<ActionResult<number>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    return { error: error.message };
  }

  return { data: count || 0 };
}

// Mark a single notification as read
export async function markAsRead(
  notificationId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return {};
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    return { error: error.message };
  }

  return {};
}

// Create a notification (uses service role — caller is not the recipient)
export async function createNotification({
  userId,
  title,
  message,
  type,
  data,
}: {
  userId: string;
  title: string;
  message: string;
  type: "order" | "compliance" | "payment" | "system";
  data?: Record<string, unknown>;
}): Promise<ActionResult> {
  const serviceClient = createServiceRoleClient();

  const { error } = await serviceClient.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    data: data || null,
  });

  if (error) {
    console.error("Failed to create notification:", error.message);
    return { error: error.message };
  }

  // Fire-and-forget push notification
  sendPushNotification({
    userId,
    title,
    message,
    url: (data?.url as string) || undefined,
  }).catch(() => {
    // Silently ignore push failures — in-app notification is the primary channel
  });

  return {};
}
