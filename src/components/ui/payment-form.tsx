"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { InputError } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError?: (message: string) => void;
}

export function PaymentForm({ amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${siteUrl}/driver/orders`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      const message = submitError.message || "Payment failed. Please try again.";
      setError(message);
      onError?.(message);
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && <InputError>{error}</InputError>}

      <Button
        type="submit"
        fullWidth
        disabled={!stripe || loading}
        className="mt-4"
      >
        {loading ? "Processing..." : `Pay ${formatCurrency(amount)}`}
      </Button>
    </form>
  );
}
