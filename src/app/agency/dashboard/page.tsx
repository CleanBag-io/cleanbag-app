import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getAgency, getAgencyStats, getAgencyDrivers } from "@/lib/agency/actions";
import { getRelativeTime } from "@/lib/utils";

export default async function AgencyDashboardPage() {
  const { data: agency } = await getAgency();

  if (!agency) {
    redirect("/agency/onboarding");
  }

  const { data: stats } = await getAgencyStats();
  const { data: drivers } = await getAgencyDrivers();

  const complianceRate = stats?.complianceRate ?? 0;
  const totalDrivers = stats?.totalDrivers ?? 0;
  const compliantDrivers = stats?.compliantDrivers ?? 0;

  // Drivers needing attention (warning or overdue)
  const driversNeedingAttention = (drivers || []).filter(
    (d) => d.compliance_status === "warning" || d.compliance_status === "overdue"
  );

  const complianceStatusMap = {
    compliant: { label: "Compliant", variant: "success" as const },
    warning: { label: "Due Soon", variant: "warning" as const },
    overdue: { label: "Overdue", variant: "error" as const },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Company Dashboard</h1>

      {/* Compliance Overview */}
      <div className="rounded-lg bg-brand-pink p-6 text-white shadow-md">
        <p className="text-sm opacity-90">Fleet Compliance Rate</p>
        <p className="mt-1 text-3xl font-bold">
          {totalDrivers > 0 ? `${complianceRate}%` : "---"}
        </p>
        <p className="mt-2 text-sm opacity-90">
          {compliantDrivers} of {totalDrivers} drivers compliant
        </p>
        {stats && stats.complianceTarget > 0 && (
          <div className="mt-3">
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min(complianceRate, 100)}%` }}
              />
            </div>
            <p className="text-xs mt-1 opacity-75">
              Target: {stats.complianceTarget}%
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Drivers</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalDrivers}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Warnings</p>
          <p className="mt-1 text-2xl font-bold text-status-pending">
            {stats?.warningDrivers ?? 0}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-status-overdue">
            {stats?.overdueDrivers ?? 0}
          </p>
        </div>
      </div>

      {/* Pending Requests */}
      {(stats?.pendingRequests ?? 0) > 0 && (
        <Link href="/agency/drivers" className="block">
          <div className="rounded-lg bg-trust-blue-light p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-trust-blue-dark">Pending Requests</p>
                <p className="text-sm text-gray-600">
                  {stats!.pendingRequests} driver{stats!.pendingRequests !== 1 ? "s" : ""} want to join your company
                </p>
              </div>
              <span className="text-trust-blue-dark text-lg">&rarr;</span>
            </div>
          </div>
        </Link>
      )}

      {/* Drivers Needing Attention */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Drivers Needing Attention
        </h2>
        {driversNeedingAttention.length > 0 ? (
          <div className="space-y-3">
            {driversNeedingAttention.map((driver) => {
              const statusInfo = complianceStatusMap[driver.compliance_status];
              return (
                <div
                  key={driver.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {driver.profile?.full_name || "Unknown Driver"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Last clean: {getRelativeTime(driver.last_cleaning_date)}
                    </p>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {totalDrivers > 0
              ? "All drivers are compliant"
              : "No drivers yet. Invite drivers from the Drivers page."}
          </p>
        )}
      </div>
    </div>
  );
}
