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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Contact
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
                      <td className="px-6 py-4 text-center">
                        {driver.profile?.phone ? (
                          <div className="flex items-center justify-center gap-2">
                            <a
                              href={`tel:${driver.profile.phone}`}
                              className="text-trust-blue hover:text-trust-blue-hover"
                              title="Call"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                            </a>
                            <a
                              href={`https://wa.me/${driver.profile.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:opacity-80"
                              title="WhatsApp"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="#25D366"/><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/></svg>
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
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
