import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFacility } from "@/lib/driver/actions";
import { formatCurrency } from "@/lib/utils";
import { SERVICE_TYPES } from "@/config/constants";
import { BookingForm } from "./booking-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FacilityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data: facility, error } = await getFacility(id);

  if (error || !facility) {
    notFound();
  }

  const services = (facility.services as { type: string; price: number; duration: number }[]) || [];
  const operatingHours = facility.operating_hours as Record<string, { open: string; close: string }> | null;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = dayNames[new Date().getDay()].toLowerCase().slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/driver/facilities"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        ← Back to Cleaning Facilities
      </Link>

      {/* Facility Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{facility.name}</h1>
              {facility.is_active && (
                <Badge variant="success">Open Now</Badge>
              )}
            </div>
            <p className="text-gray-600 mt-2">{facility.address}</p>
            <p className="text-gray-500">{facility.city}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-amber-500 text-xl">⭐</span>
              <span className="text-2xl font-bold">{facility.rating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {facility.total_orders} orders completed
            </p>
          </div>
        </div>

        {/* Contact Info */}
        {facility.phone && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href={`tel:${facility.phone}`}
              className="inline-flex items-center gap-2 text-trust-blue hover:underline"
            >
              📞 {facility.phone}
            </a>
          </div>
        )}
      </div>

      {/* Services & Booking */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Book a Cleaning</h2>

          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                This cleaning facility hasn&apos;t set up their services yet.
              </p>
            </div>
          ) : (
            <BookingForm facilityId={facility.id} services={services} />
          )}
        </CardContent>
      </Card>

      {/* Operating Hours */}
      {operatingHours && Object.keys(operatingHours).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h2>
            <div className="space-y-2">
              {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => {
                const hours = operatingHours[day];
                const isToday = day === today;

                return (
                  <div
                    key={day}
                    className={`flex justify-between py-2 ${
                      isToday ? "bg-brand-pink-light rounded px-3 -mx-3" : ""
                    }`}
                  >
                    <span className={`capitalize ${isToday ? "font-semibold" : ""}`}>
                      {day === "mon" && "Monday"}
                      {day === "tue" && "Tuesday"}
                      {day === "wed" && "Wednesday"}
                      {day === "thu" && "Thursday"}
                      {day === "fri" && "Friday"}
                      {day === "sat" && "Saturday"}
                      {day === "sun" && "Sunday"}
                      {isToday && " (Today)"}
                    </span>
                    <span className={isToday ? "font-semibold" : "text-gray-600"}>
                      {hours ? `${hours.open} - ${hours.close}` : "Closed"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Info */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h2>
          <div className="space-y-4">
            {services.map((service) => {
              const serviceInfo = SERVICE_TYPES[service.type as keyof typeof SERVICE_TYPES];
              return (
                <div
                  key={service.type}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {serviceInfo?.name || service.type}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {serviceInfo?.description || ""}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Duration: ~{service.duration} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(service.price)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl">📍</span>
                <p className="text-gray-500 mt-2">{facility.address}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${facility.address}, ${facility.city}, Cyprus`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-trust-blue hover:underline text-sm mt-2 inline-block"
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
