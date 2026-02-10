import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentFacility, getFacilityStats } from "@/lib/facility/actions";
import { getUser } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/utils";
import { PRICING } from "@/config/constants";
import { StripeConnectSection } from "./stripe-connect";
import { FacilityProfileForm } from "./profile-form";
import { ChangePasswordForm } from "@/components/change-password-form";

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

      {/* Change Password */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h2>
        <ChangePasswordForm />
      </Card>

      {/* Facility Profile */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Cleaning Facility Profile
        </h2>
        <FacilityProfileForm facility={facility} />
      </Card>

      {/* Service & Earnings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Service & Earnings</h2>
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Clean Delivery Bag</p>
            <p className="text-sm text-gray-500">15-20 min</p>
          </div>
          <p className="font-semibold text-gray-900">
            {formatCurrency(PRICING.bagClean)}
          </p>
        </div>
        <div className="mt-4 p-4 bg-brand-pink-light rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            You earn {formatCurrency(PRICING.bagClean * (1 - (facility?.commission_rate || 0.471)))} per cleaning
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Driver pays {formatCurrency(PRICING.bagClean)} — CleanBag platform fee is deducted automatically
          </p>
        </div>
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
            <p className="text-sm text-gray-500">Payout per Clean</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(PRICING.bagClean * (1 - (facility?.commission_rate || 0.471)))}
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Payout Settings
        </h2>
        <StripeConnectSection
          facilityId={facility?.id || ""}
          stripeAccountId={facility?.stripe_account_id || null}
        />
      </Card>
    </div>
  );
}
