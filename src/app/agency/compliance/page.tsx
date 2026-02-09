import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getAgency, getAgencyStats, getAgencyDrivers } from "@/lib/agency/actions";
import { getRelativeTime } from "@/lib/utils";
import { ExportButton } from "./export-button";

export default async function AgencyCompliancePage() {
  const { data: agency } = await getAgency();

  if (!agency) {
    redirect("/agency/onboarding");
  }

  const { data: stats } = await getAgencyStats();
  const { data: drivers } = await getAgencyDrivers();

  const totalDrivers = stats?.totalDrivers ?? 0;
  const compliantDrivers = stats?.compliantDrivers ?? 0;
  const complianceRate = stats?.complianceRate ?? 0;

  const complianceStatusMap = {
    compliant: { label: "Compliant", variant: "success" as const },
    warning: { label: "Due Soon", variant: "warning" as const },
    overdue: { label: "Overdue", variant: "error" as const },
  };

  // Sort: overdue first, then warning, then compliant
  const sortedDrivers = [...(drivers || [])].sort((a, b) => {
    const order = { overdue: 0, warning: 1, compliant: 2 };
    return order[a.compliance_status] - order[b.compliance_status];
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Compliance</h1>
        <ExportButton />
      </div>

      {/* Compliance Overview */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Fleet Compliance</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalDrivers > 0 ? `${complianceRate}%` : "---"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Target</p>
            <p className="text-3xl font-bold text-brand-pink">
              {stats?.complianceTarget ?? 80}%
            </p>
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              complianceRate >= (stats?.complianceTarget ?? 80)
                ? "bg-status-completed"
                : "bg-brand-pink"
            }`}
            style={{ width: `${Math.min(complianceRate, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {compliantDrivers} of {totalDrivers} drivers compliant
        </p>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-status-completed">
            {stats?.compliantDrivers ?? 0}
          </p>
          <p className="text-sm text-gray-500">Compliant</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-status-pending">
            {stats?.warningDrivers ?? 0}
          </p>
          <p className="text-sm text-gray-500">Warning</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-status-overdue">
            {stats?.overdueDrivers ?? 0}
          </p>
          <p className="text-sm text-gray-500">Overdue</p>
        </div>
      </div>

      {/* Driver Compliance Table */}
      <div className="rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Driver Compliance
          </h2>
        </div>
        {sortedDrivers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Clean
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Cleanings
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedDrivers.map((driver) => {
                  const statusInfo =
                    complianceStatusMap[driver.compliance_status];
                  return (
                    <tr key={driver.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {driver.profile?.full_name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                        {driver.vehicle_type || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getRelativeTime(driver.last_cleaning_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {driver.total_cleanings}
                      </td>
                    </tr>
                  );
                })}
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
