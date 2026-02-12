"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAsRead, markAllAsRead } from "@/lib/notifications/actions";
import type { Notification } from "@/types";

interface NotificationListProps {
  initialNotifications: Notification[];
}

function getTimeGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return "Earlier";
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-CY", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_ICONS: Record<string, string> = {
  order: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  system:
    "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  compliance:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  payment:
    "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
};

export function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const hasUnread = notifications.some((n) => !n.read);

  const handleClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }
    const url = (notification.data as Record<string, string>)?.url;
    if (url) {
      router.push(url);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Group notifications by time
  const groups: { label: string; items: Notification[] }[] = [];
  for (const notification of notifications) {
    const label = getTimeGroup(notification.created_at);
    const existing = groups.find((g) => g.label === label);
    if (existing) {
      existing.items.push(notification);
    } else {
      groups.push({ label, items: [notification] });
    }
  }

  return (
    <div>
      {/* Header with mark all read */}
      {hasUnread && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-brand-pink hover:text-brand-pink-hover"
          >
            Mark all as read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {group.label}
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {group.items.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleClick(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                      !notification.read ? "bg-pink-50/50" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !notification.read
                          ? "bg-brand-pink-light text-brand-pink"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={
                            TYPE_ICONS[notification.type || "system"] ||
                            TYPE_ICONS.system
                          }
                        />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm ${!notification.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-brand-pink flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
