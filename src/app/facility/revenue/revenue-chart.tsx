"use client";

import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: { date: string; revenue: number; orders: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-52 gap-1">
        {data.map((day, index) => {
          const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
          const dateObj = new Date(day.date);
          const dayLabel = dateObj.toLocaleDateString("en-GB", {
            weekday: "short",
          });
          const dateLabel = dateObj.getDate();

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="w-full flex flex-col items-center justify-end h-44">
                {day.revenue > 0 && (
                  <span className="text-xs text-gray-500 mb-1">
                    {formatCurrency(day.revenue)}
                  </span>
                )}
                <div
                  className="w-full bg-brand-pink rounded-t-sm transition-all duration-300 hover:bg-brand-pink-hover"
                  style={{
                    height: `${Math.max(height, day.revenue > 0 ? 4 : 0)}%`,
                    minHeight: day.revenue > 0 ? "4px" : "0",
                  }}
                  title={`${day.date}: ${formatCurrency(day.revenue)} (${day.orders} orders)`}
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">{dayLabel}</p>
                <p className="text-xs font-medium text-gray-600">{dateLabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
