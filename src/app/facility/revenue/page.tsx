import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  getCurrentFacility,
  getFacilityStats,
  getFacilityRevenue,
} from "@/lib/facility/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RevenueChart } from "./revenue-chart";
import { PeriodSelector } from "./period-selector";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function FacilityRevenuePage({ searchParams }: PageProps) {
  const { data: facility, error: facilityError } = await getCurrentFacility();

  if (!facility && !facilityError) {
    redirect("/facility/onboarding");
  }

  const params = await searchParams;
  const period = (params.period || "week") as "week" | "month";

  const { data: stats } = await getFacilityStats();
  const { data: revenueData } = await getFacilityRevenue(period);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Revenue</h1>
        <PeriodSelector currentPeriod={period} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">
            {period === "week" ? "This Week" : "This Month"}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(revenueData?.totalRevenue || 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {revenueData?.totalOrders || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Avg. Order Value</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(revenueData?.averageOrderValue || 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">All-Time Revenue</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(stats?.totalRevenue || 0)}
          </p>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Revenue
        </h2>
        {revenueData?.dailyRevenue && revenueData.dailyRevenue.length > 0 ? (
          <RevenueChart data={revenueData.dailyRevenue} />
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
        {revenueData?.dailyRevenue && revenueData.dailyRevenue.length > 0 ? (
          <div className="space-y-2">
            {[...revenueData.dailyRevenue].reverse().map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(day.date)}
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

      {/* Commission Info */}
      <Card className="p-6 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Commission Rate
        </h2>
        <p className="text-3xl font-bold text-brand-pink">
          {((facility?.commission_rate || 0.15) * 100).toFixed(0)}%
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Revenue shown is after CleanBag&apos;s commission has been deducted.
        </p>
      </Card>
    </div>
  );
}
