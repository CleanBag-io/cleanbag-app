import { Badge } from "@/components/ui/badge";
import { getPlatformStats, getAllTransactions } from "@/lib/admin/actions";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const { data: stats } = await getPlatformStats();
  const { data: txData } = await getAllTransactions({ limit: 10 });

  const recentTransactions = txData?.transactions || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg bg-brand-pink p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(stats?.totalRevenue || 0)}
          </p>
        </div>
        <div className="rounded-lg bg-trust-blue p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Active Cleaning Facilities</p>
          <p className="mt-1 text-2xl font-bold">
            {stats?.activeFacilities || 0}
          </p>
        </div>
        <div className="rounded-lg bg-status-completed p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Total Drivers</p>
          <p className="mt-1 text-2xl font-bold">
            {stats?.totalDrivers || 0}
          </p>
        </div>
        <div className="rounded-lg bg-gray-700 p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Orders Today</p>
          <p className="mt-1 text-2xl font-bold">
            {stats?.ordersToday || 0}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cleaning Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((tx) => {
                  const typeLabels: Record<string, string> = {
                    order_payment: "Payment",
                    commission: "Commission",
                    payout: "Payout",
                  };
                  const statusVariant =
                    tx.status === "completed"
                      ? ("success" as const)
                      : tx.status === "failed"
                        ? ("error" as const)
                        : ("pending" as const);

                  return (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(tx.order as { order_number?: string } | undefined)?.order_number || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {(tx.facility as { name?: string } | undefined)?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {typeLabels[tx.type] || tx.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(tx.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No recent transactions
          </div>
        )}
      </div>
    </div>
  );
}
