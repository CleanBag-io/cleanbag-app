"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptOrder, startOrder, completeOrder } from "@/lib/facility/actions";

interface OrderActionButtonsProps {
  orderId: string;
  status: string;
}

export function OrderActionButtons({ orderId, status }: OrderActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    const result = await acceptOrder(orderId);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
    router.refresh();
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    const result = await startOrder(orderId);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
    router.refresh();
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    const result = await completeOrder(orderId);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}
      <div className="flex gap-2">
        {status === "pending" && (
          <Button
            onClick={handleAccept}
            disabled={loading}
            size="sm"
            className="flex-1"
          >
            {loading ? "..." : "Accept Order"}
          </Button>
        )}
        {status === "accepted" && (
          <Button
            onClick={handleStart}
            disabled={loading}
            size="sm"
            variant="secondary"
            className="flex-1"
          >
            {loading ? "..." : "Start Cleaning"}
          </Button>
        )}
        {status === "in_progress" && (
          <Button
            onClick={handleComplete}
            disabled={loading}
            size="sm"
            className="flex-1 bg-status-completed hover:bg-green-600"
          >
            {loading ? "..." : "Mark Complete"}
          </Button>
        )}
      </div>
    </div>
  );
}
