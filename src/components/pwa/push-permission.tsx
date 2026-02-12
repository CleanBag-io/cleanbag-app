"use client";

import { useState, useEffect } from "react";
import { savePushSubscription } from "@/lib/push/actions";

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Only show if push is supported and permission is not yet decided
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("PushManager" in window) ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    if (Notification.permission !== "default") {
      return;
    }

    // Show after a brief delay so it doesn't interrupt page load
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setShow(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      await savePushSubscription(subscription.toJSON());
      setShow(false);
    } catch (err) {
      console.error("Push subscription failed:", err);
      setShow(false);
    } finally {
      setSubscribing(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-pink-light flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-brand-pink"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Enable Notifications
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Get notified about order updates and important messages
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={subscribing}
                className="px-3 py-1.5 text-xs font-medium text-white bg-brand-pink rounded-md hover:bg-brand-pink-hover disabled:opacity-50"
              >
                {subscribing ? "Enabling..." : "Enable"}
              </button>
              <button
                onClick={() => setShow(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Convert base64 VAPID key to Uint8Array for pushManager.subscribe()
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
