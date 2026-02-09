import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getAnalytics, getPlatformStats } from "@/lib/admin/actions";
import { formatCurrency } from "@/lib/utils";
import { AnalyticsChart } from "./analytics-chart";
import { PeriodSelector } from "./period-selector";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = (params.period || "week") as "week" | "month";

  const [analyticsResult, statsResult] = await Promise.all([
    getAnalytics(period),
    getPlatformStats(),
  ]);

  if (analyticsResult.error) {
    return (
      <div className="p-6 text-center text-status-overdue">
        {analyticsResult.error}
      </div>
    );
  }

  const analytics = analyticsResult.data;
  const stats = statsResult.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <PeriodSelector currentPeriod={period} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">
            {period === "week" ? "This Week" : "This Month"}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(analytics?.totalRevenue || 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {analytics?.totalOrders || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">All-Time Revenue</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(stats?.totalRevenue || 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Active Cleaning Facilities</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats?.activeFacilities || 0}
          </p>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Revenue
        </h2>
        {analytics?.dailyRevenue && analytics.dailyRevenue.length > 0 ? (
          <AnalyticsChart data={analytics.dailyRevenue} />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No revenue data available
          </div>
        )}
      </Card>

      {/* Daily Breakdown */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Breakdown
        </h2>
        {analytics?.dailyRevenue && analytics.dailyRevenue.length > 0 ? (
          <div className="space-y-2">
            {[...analytics.dailyRevenue].reverse().map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {day.orders} {day.orders === 1 ? "order" : "orders"}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(day.revenue)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No orders completed in this period
          </p>
        )}
      </Card>
    </div>
  );
}
