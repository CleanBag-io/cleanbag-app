"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { ReactNode } from "react";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface StripeProviderProps {
  clientSecret: string;
  children: ReactNode;
}

export function StripeProvider({ clientSecret, children }: StripeProviderProps) {
  if (!stripePromise) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#E91E8C",
          },
        },
      }}
    >
      {children}
    </Elements>
  );
}
