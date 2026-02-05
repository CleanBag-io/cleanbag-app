"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea, InputError } from "@/components/ui/input";
import { cancelOrder, rateOrder } from "@/lib/driver/actions";

interface OrderActionsProps {
  orderId: string;
  showCancel?: boolean;
  showRating?: boolean;
}

export function OrderActions({ orderId, showCancel, showRating }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setError(null);
    setLoading(true);

    const result = await cancelOrder(orderId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.refresh();
  };

  const handleRate = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setError(null);
    setLoading(true);

    const result = await rateOrder(orderId, rating, review || undefined);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-4">
      {showCancel && (
        <>
          <Button
            variant="danger"
            fullWidth
            disabled={loading}
            onClick={handleCancel}
          >
            {loading ? "Cancelling..." : "Cancel Order"}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            You can only cancel orders that haven&apos;t been accepted yet
          </p>
        </>
      )}

      {showRating && (
        <div className="space-y-4">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-4xl transition-transform hover:scale-110"
              >
                {star <= (hoverRating || rating) ? "⭐" : "☆"}
              </button>
            ))}
          </div>

          {/* Review Text */}
          <Textarea
            placeholder="Share your experience (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
          />

          <Button
            fullWidth
            disabled={loading || rating === 0}
            onClick={handleRate}
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      )}

      {error && <InputError>{error}</InputError>}
    </div>
  );
}
