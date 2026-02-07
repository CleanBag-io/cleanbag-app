import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDriver, getDriverOrders } from "@/lib/driver/actions";
import { formatCurrency, formatDate, getRelativeTime, getServiceName } from "@/lib/utils";

export default async function HistoryPage() {
  const { data: driver } = await getDriver();
  const { data: orders } = await getDriverOrders();

  // Only show completed orders
  const completedOrders = orders?.filter((o) => o.status === "completed") || [];

  // Calculate statistics
  const totalSpent = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
  const averageRating =
    completedOrders.filter((o) => o.rating).length > 0
      ? completedOrders.filter((o) => o.rating).reduce((sum, o) => sum + (o.rating || 0), 0) /
        completedOrders.filter((o) => o.rating).length
      : null;

  // Group by month
  const ordersByMonth: Record<string, typeof completedOrders> = {};
  completedOrders.forEach((order) => {
    const date = new Date(order.completed_at || order.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    if (!ordersByMonth[monthLabel]) {
      ordersByMonth[monthLabel] = [];
    }
    ordersByMonth[monthLabel].push(order);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cleaning History</h1>
        <p className="text-gray-600 mt-1">Your completed cleanings and statistics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-brand-pink">
              {driver?.total_cleanings || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total Cleanings</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total Spent</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-500">
              {averageRating ? averageRating.toFixed(1) : "-"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Avg. Rating Given</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-trust-blue">
              {getRelativeTime(driver?.last_cleaning_date || null)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Last Cleaned</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Compliance Progress</h2>
            <Badge
              variant={
                driver?.compliance_status === "compliant"
                  ? "success"
                  : driver?.compliance_status === "warning"
                  ? "warning"
                  : "error"
              }
            >
              {driver?.compliance_status === "compliant"
                ? "Compliant"
                : driver?.compliance_status === "warning"
                ? "Due Soon"
                : "Overdue"}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  driver?.compliance_status === "compliant"
                    ? "bg-brand-pink"
                    : driver?.compliance_status === "warning"
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${
                    driver?.compliance_status === "compliant"
                      ? "100%"
                      : driver?.compliance_status === "warning"
                      ? "50%"
                      : "15%"
                  }`,
                }}
              />
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <div>
              <p className="text-gray-500">Last cleaned</p>
              <p className="font-medium">{getRelativeTime(driver?.last_cleaning_date || null)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Next cleaning due</p>
              <p className="font-medium">
                {driver?.last_cleaning_date
                  ? formatDate(
                      new Date(
                        new Date(driver.last_cleaning_date).getTime() + 7 * 24 * 60 * 60 * 1000
                      )
                    )
                  : "ASAP"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cleaning History by Month */}
      {completedOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900">No cleaning history yet</h3>
          <p className="text-gray-500 mt-2">
            Complete your first cleaning to see it here!
          </p>
          <Link href="/driver/facilities" className="text-trust-blue hover:underline mt-4 inline-block">
            Find a cleaning facility →
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(ordersByMonth).map(([month, monthOrders]) => (
            <div key={month}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{month}</h3>
              <div className="space-y-3">
                {monthOrders.map((order) => (
                    <Link key={order.id} href={`/driver/orders/${order.id}`}>
                      <Card variant="clickable" className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {order.facility?.name || "Cleaning Facility"}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {getServiceName(order.service_type)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(order.completed_at || order.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(order.total_price)}
                            </p>
                            {order.rating && (
                              <p className="text-sm text-amber-500 mt-1">
                                {"⭐".repeat(order.rating)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
