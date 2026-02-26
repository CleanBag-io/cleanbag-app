"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InputError } from "@/components/ui/input";
import { StripeProvider } from "@/components/ui/stripe-provider";
import { PaymentForm } from "@/components/ui/payment-form";
import { initiatePayment, confirmOrder } from "@/lib/driver/actions";
import { formatCurrency } from "@/lib/utils";
import { PRICING, SERVICE_TYPES } from "@/config/constants";

interface BookingFormProps {
  facilityId: string;
}

export function BookingForm({ facilityId }: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"service" | "payment">("service");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const service = SERVICE_TYPES.standard;

  const handleBookAndPay = async () => {
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("facility_id", facilityId);

    const result = await initiatePayment(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data && "clientSecret" in result.data) {
      // Stripe flow — show payment form (no order created yet)
      setClientSecret(result.data.clientSecret);
      setPaymentIntentId(result.data.paymentIntentId);
      setStep("payment");
    } else if (result.data && "id" in result.data) {
      // No Stripe configured — order created directly
      router.push(`/driver/orders/${result.data.id}`);
    }

    setLoading(false);
  };

  const handlePaymentSuccess = async () => {
    if (!paymentIntentId) {
      router.push("/driver/orders");
      return;
    }

    // Payment succeeded — now create the order
    const result = await confirmOrder(paymentIntentId);

    if (result.error) {
      // Payment went through but order creation failed — redirect to orders list
      // The webhook safety net will create the order
      console.error("confirmOrder failed:", result.error);
      router.push("/driver/orders");
      return;
    }

    if (result.data) {
      router.push(`/driver/orders/${result.data.id}`);
    } else {
      router.push("/driver/orders");
    }
  };

  return (
    <div className="space-y-4">
      {step === "service" && (
        <>
          {/* Service Card */}
          <div className="w-full p-4 rounded-lg border-2 border-brand-pink bg-brand-pink-light">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                <p className="text-xs text-gray-400 mt-1">~{service.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(PRICING.bagClean)}
                </p>
                <span className="text-brand-pink text-xl">✓</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Service</span>
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span>{service.duration}</span>
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-brand-pink">
                  {formatCurrency(PRICING.bagClean)}
                </span>
              </div>
            </div>
          </div>

          {error && <InputError>{error}</InputError>}

          <Button
            fullWidth
            disabled={loading}
            onClick={handleBookAndPay}
            className="mt-4"
          >
            {loading ? "Setting up payment..." : `Book & Pay ${formatCurrency(PRICING.bagClean)}`}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Payment is processed securely via Stripe
          </p>
        </>
      )}

      {step === "payment" && clientSecret && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">{service.name}</span>
              <span className="text-xl font-bold text-brand-pink">
                {formatCurrency(PRICING.bagClean)}
              </span>
            </div>
          </div>

          <StripeProvider clientSecret={clientSecret}>
            <PaymentForm
              amount={PRICING.bagClean}
              onSuccess={handlePaymentSuccess}
            />
          </StripeProvider>

          <button
            type="button"
            onClick={() => setStep("service")}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
