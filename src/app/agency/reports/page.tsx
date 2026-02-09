import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getAgency, getAgencyDrivers } from "@/lib/agency/actions";
import { getRelativeTime, formatDate } from "@/lib/utils";

export default async function AgencyReportsPage() {
  const { data: agency } = await getAgency();

  if (!agency) {
    redirect("/agency/onboarding");
  }

  const { data: drivers } = await getAgencyDrivers();
  const allDrivers = drivers || [];

  // Calculate summary stats
  const totalCleanings = allDrivers.reduce(
    (sum, d) => sum + d.total_cleanings,
    0
  );

  // Estimate recent activity: count drivers cleaned in last 7 days and last 30 days
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const cleanedThisWeek = allDrivers.filter(
    (d) => d.last_cleaning_date && new Date(d.last_cleaning_date).getTime() >= weekAgo
  ).length;

  const cleanedThisMonth = allDrivers.filter(
    (d) => d.last_cleaning_date && new Date(d.last_cleaning_date).getTime() >= monthAgo
  ).length;

  // Sort drivers by total cleanings (desc)
  const driversByCleanings = [...allDrivers].sort(
    (a, b) => b.total_cleanings - a.total_cleanings
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>

      {/* Activity Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-brand-pink">{totalCleanings}</p>
          <p className="text-sm text-gray-500">Total Cleanings</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{cleanedThisWeek}</p>
          <p className="text-sm text-gray-500">Cleaned This Week</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{cleanedThisMonth}</p>
          <p className="text-sm text-gray-500">Cleaned This Month</p>
        </Card>
      </div>

      {/* Per-Driver Breakdown */}
      <div className="rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Per-Driver Breakdown
          </h2>
        </div>
        {driversByCleanings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    City
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Cleanings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Clean
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Member Since
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {driversByCleanings.map((driver) => (
                  <tr key={driver.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {driver.profile?.full_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {driver.city}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {driver.total_cleanings}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {getRelativeTime(driver.last_cleaning_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(driver.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No drivers in your company yet.
          </div>
        )}
      </div>
    </div>
  );
}
