import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth/actions";
import { getDriver, getCompanies, getMyRequests } from "@/lib/driver/actions";
import { formatDate, getRelativeTime } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import { LogoutButton } from "./logout-button";
import { CompanySection } from "./company-section";

export default async function ProfilePage() {
  const profile = await getUser();
  const { data: driver } = await getDriver();

  // Fetch company data for the driver
  let currentAgency = null;
  let requests: Awaited<ReturnType<typeof getMyRequests>>["data"] = [];
  let availableCompanies: Awaited<ReturnType<typeof getCompanies>>["data"] = [];

  if (driver) {
    if (driver.agency_id) {
      // Fetch the agency record
      const { data: agencies } = await getCompanies();
      currentAgency = agencies?.find((a) => a.id === driver.agency_id) || null;
    } else {
      // Fetch pending requests and available companies
      const [reqResult, compResult] = await Promise.all([
        getMyRequests(),
        getCompanies(driver.city),
      ]);
      requests = reqResult.data || [];
      availableCompanies = compResult.data || [];
    }
  }

  if (!profile) {
    redirect("/login");
  }

  const complianceStatusMap = {
    compliant: { label: "Compliant", variant: "success" as const, color: "text-green-600" },
    warning: { label: "Due Soon", variant: "warning" as const, color: "text-amber-600" },
    overdue: { label: "Overdue", variant: "error" as const, color: "text-red-600" },
  };

  const complianceInfo = driver
    ? complianceStatusMap[driver.compliance_status]
    : complianceStatusMap.overdue;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-brand-pink-light flex items-center justify-center text-3xl">
              {profile.full_name?.charAt(0)?.toUpperCase() || "👤"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.full_name || "Driver"}
              </h2>
              <p className="text-gray-500">{driver?.city || "No city set"}</p>
              <Badge variant={complianceInfo.variant} className="mt-2">
                {complianceInfo.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Stats */}
      {driver && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-brand-pink">
                {driver.total_cleanings}
              </p>
              <p className="text-xs text-gray-500 mt-1">Cleanings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${complianceInfo.color}`}>
                {complianceInfo.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">Status</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {getRelativeTime(driver.last_cleaning_date)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last Clean</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      {/* Driver Information */}
      {driver && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Driver Information</CardTitle>
            <Link href="/driver/onboarding">
              <Button size="sm" variant="secondary">
                Edit
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Vehicle Type</span>
                <span className="font-medium capitalize">
                  {driver.vehicle_type || "Not set"}
                </span>
              </div>
              {driver.license_plate && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">License Plate</span>
                  <span className="font-medium">{driver.license_plate}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">City</span>
                <span className="font-medium">{driver.city}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Platforms</span>
                <div className="flex gap-2 flex-wrap justify-end">
                  {driver.platforms?.length > 0 ? (
                    driver.platforms.map((platform) => (
                      <Badge key={platform} variant="inactive">
                        {platform}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">{formatDate(driver.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Section */}
      {driver && (
        <CompanySection
          currentAgency={currentAgency}
          requests={requests || []}
          availableCompanies={availableCompanies || []}
        />
      )}

      {/* No Driver Profile */}
      {!driver && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">🚗</div>
            <h3 className="font-semibold text-gray-900">
              Complete Your Driver Profile
            </h3>
            <p className="text-gray-600 mt-2">
              Set up your vehicle and delivery information to start booking cleanings.
            </p>
            <Link href="/driver/onboarding">
              <Button className="mt-4">Complete Profile</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
