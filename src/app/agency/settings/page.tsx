import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getAgency, getAgencyStats } from "@/lib/agency/actions";
import { getUser } from "@/lib/auth/actions";
import { CompanySettingsForm } from "./settings-form";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function AgencySettingsPage() {
  const profile = await getUser();
  const { data: agency } = await getAgency();
  const { data: stats } = await getAgencyStats();

  if (!agency) {
    redirect("/agency/onboarding");
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
            <p className="text-sm text-gray-500">Total Drivers</p>
            <p className="font-medium text-gray-900">
              {stats?.totalDrivers ?? 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="font-medium text-gray-900">
              {new Date(agency.created_at).toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
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

      {/* Company Profile */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Company Profile
        </h2>
        <CompanySettingsForm agency={agency} />
      </Card>
    </div>
  );
}
