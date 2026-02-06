import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentFacility, getFacilityStats } from "@/lib/facility/actions";
import { getUser } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/utils";
import { SERVICE_TYPES } from "@/config/constants";
import { FacilityProfileForm } from "./profile-form";

export default async function FacilitySettingsPage() {
  const profile = await getUser();
  const { data: facility, error: facilityError } = await getCurrentFacility();
  const { data: stats } = await getFacilityStats();

  if (!facility && !facilityError) {
    redirect("/facility/onboarding");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      {/* Account Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{profile?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact Name</p>
            <p className="font-medium text-gray-900">
              {profile?.full_name || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="font-medium text-gray-900">
              {facility?.created_at
                ? new Date(facility.created_at).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
      </Card>

      {/* Facility Profile */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Cleaning Facility Profile
        </h2>
        <FacilityProfileForm facility={facility} />
      </Card>

      {/* Services */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Services</h2>
        <div className="space-y-3">
          {facility?.services && facility.services.length > 0 ? (
            facility.services.map((service) => {
              const serviceInfo =
                SERVICE_TYPES[service.type as keyof typeof SERVICE_TYPES];
              return (
                <div
                  key={service.type}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {serviceInfo?.name || service.type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {serviceInfo?.duration || `${service.duration} min`}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(service.price)}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No services configured</p>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Contact support to modify your service offerings.
        </p>
      </Card>

      {/* Statistics */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.totalOrders || facility?.total_orders || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rating</p>
            <div className="flex items-center gap-1">
              <span className="text-amber-500">⭐</span>
              <span className="text-2xl font-bold text-gray-900">
                {facility?.rating.toFixed(1) || "0.0"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Commission Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {((facility?.commission_rate || 0.15) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Cleaning Facility Status
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {facility?.is_active
                ? "Your cleaning facility is visible to drivers"
                : "Your cleaning facility is hidden from drivers"}
            </p>
          </div>
          <Badge variant={facility?.is_active ? "success" : "inactive"}>
            {facility?.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Contact support to change your cleaning facility status.
        </p>
      </Card>

      {/* Payout Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Payout Settings
        </h2>
        {facility?.stripe_account_id ? (
          <div>
            <Badge variant="success">Stripe Connected</Badge>
            <p className="text-sm text-gray-500 mt-2">
              Your Stripe account is connected for payouts.
            </p>
          </div>
        ) : (
          <div>
            <Badge variant="warning">Not Connected</Badge>
            <p className="text-sm text-gray-500 mt-2">
              Connect your Stripe account to receive payouts.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Stripe integration coming soon.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
