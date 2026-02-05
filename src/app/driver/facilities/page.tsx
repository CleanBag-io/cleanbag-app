import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDriver, getFacilities } from "@/lib/driver/actions";
import { formatCurrency } from "@/lib/utils";
import { CITIES, type City } from "@/config/constants";

interface PageProps {
  searchParams: Promise<{ city?: string }>;
}

export default async function FacilitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { data: driver } = await getDriver();

  // Use filter city from URL, or driver's city, or show all
  const filterCity = (params.city as City) || driver?.city;
  const { data: facilities } = await getFacilities(filterCity || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Find a Facility</h1>
        <p className="text-gray-600 mt-1">
          {filterCity
            ? `Showing facilities in ${filterCity}`
            : "Showing all facilities in Cyprus"}
        </p>
      </div>

      {/* City Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link href="/driver/facilities">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !filterCity
                ? "bg-brand-pink text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Cities
          </button>
        </Link>
        {CITIES.map((city) => (
          <Link key={city} href={`/driver/facilities?city=${city}`}>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterCity === city
                  ? "bg-brand-pink text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {city}
            </button>
          </Link>
        ))}
      </div>

      {/* Map Placeholder */}
      <div className="relative h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-5xl">🗺️</span>
            <p className="text-gray-500 mt-2">Map view coming soon</p>
          </div>
        </div>
        {/* Fake map markers */}
        <div className="absolute top-1/4 left-1/3 text-2xl">📍</div>
        <div className="absolute top-1/2 left-2/3 text-2xl">📍</div>
        <div className="absolute top-2/3 left-1/2 text-2xl">📍</div>
      </div>

      {/* Facilities List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {facilities?.length || 0} Facilities Available
        </h2>

        {facilities?.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <h3 className="font-medium text-gray-900">No facilities found</h3>
            <p className="text-sm text-gray-500 mt-1">
              Try selecting a different city or check back later.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {facilities?.map((facility) => {
              // Extract pricing from services
              const services = facility.services as { type: string; price: number; duration: number }[] || [];
              const standardService = services.find((s) => s.type === "standard");
              const basePrice = standardService?.price || 6.5;

              return (
                <Link key={facility.id} href={`/driver/facilities/${facility.id}`}>
                  <Card variant="clickable" className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{facility.name}</h3>
                          {facility.is_active && (
                            <Badge variant="success" className="text-xs">Open</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{facility.address}</p>
                        <p className="text-xs text-gray-400 mt-1">{facility.city}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(basePrice)}
                        </p>
                        <p className="text-xs text-gray-500">from</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500">⭐</span>
                        <span className="font-medium text-sm">{facility.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {facility.total_orders} orders completed
                      </div>
                      {facility.phone && (
                        <div className="text-sm text-gray-500 ml-auto">
                          📞 {facility.phone}
                        </div>
                      )}
                    </div>

                    {/* Services Preview */}
                    {services.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {services.map((service) => (
                          <Badge key={service.type} variant="inactive" className="text-xs">
                            {service.type === "standard" && "Standard"}
                            {service.type === "express" && "Express"}
                            {service.type === "deep" && "Deep Clean"}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
