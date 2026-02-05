"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InputError } from "@/components/ui/input";
import { createOrder } from "@/lib/driver/actions";
import { formatCurrency } from "@/lib/utils";
import { SERVICE_TYPES } from "@/config/constants";

interface Service {
  type: string;
  price: number;
  duration: number;
}

interface BookingFormProps {
  facilityId: string;
  services: Service[];
}

export function BookingForm({ facilityId, services }: BookingFormProps) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedServiceData = services.find((s) => s.type === selectedService);

  const handleSubmit = async () => {
    if (!selectedService) return;

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("facility_id", facilityId);
    formData.append("service_type", selectedService);

    const result = await createOrder(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Redirect to order confirmation/status page
    if (result.data) {
      router.push(`/driver/orders/${result.data.id}`);
    } else {
      router.push("/driver/orders");
    }
  };

  return (
    <div className="space-y-4">
      {/* Service Selection */}
      <div className="space-y-3">
        {services.map((service) => {
          const serviceInfo = SERVICE_TYPES[service.type as keyof typeof SERVICE_TYPES];
          const isSelected = selectedService === service.type;

          return (
            <button
              key={service.type}
              type="button"
              onClick={() => setSelectedService(service.type)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? "border-brand-pink bg-brand-pink-light"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {serviceInfo?.name || service.type}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {serviceInfo?.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    ~{service.duration} minutes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(service.price)}
                  </p>
                  {isSelected && (
                    <span className="text-brand-pink text-xl">✓</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Order Summary */}
      {selectedService && selectedServiceData && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Service</span>
              <span className="font-medium">
                {SERVICE_TYPES[selectedService as keyof typeof SERVICE_TYPES]?.name || selectedService}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span>~{selectedServiceData.duration} min</span>
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-brand-pink">
                {formatCurrency(selectedServiceData.price)}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && <InputError>{error}</InputError>}

      {/* Book Button */}
      <Button
        fullWidth
        disabled={!selectedService || loading}
        onClick={handleSubmit}
        className="mt-4"
      >
        {loading ? "Booking..." : "Confirm Booking"}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Payment will be processed after service completion
      </p>
    </div>
  );
}
