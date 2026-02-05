import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCurrentFacility,
  getFacilityOrders,
  getFacilityStats,
} from "@/lib/facility/actions";
import { formatCurrency, getRelativeTime } from "@/lib/utils";
import { SERVICE_TYPES, ORDER_STATUSES } from "@/config/constants";
import { OrderActionButtons } from "./order-actions";

export default async function FacilityDashboardPage() {
  const { data: facility, error: facilityError } = await getCurrentFacility();

  if (!facility && !facilityError) {
    redirect("/facility/onboarding");
  }

  const { data: stats } = await getFacilityStats();
  const { data: orders } = await getFacilityOrders();

  // Filter to pending/active orders for the queue
  const activeOrders =
    orders?.filter((o) =>
      ["pending", "accepted", "in_progress"].includes(o.status)
    ) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg bg-brand-pink p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Today&apos;s Orders</p>
          <p className="mt-1 text-2xl font-bold">{stats?.todayOrders || 0}</p>
        </div>
        <div className="rounded-lg bg-trust-blue p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Pending</p>
          <p className="mt-1 text-2xl font-bold">{stats?.pendingOrders || 0}</p>
        </div>
        <div className="rounded-lg bg-status-completed p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Completed</p>
          <p className="mt-1 text-2xl font-bold">
            {stats?.completedOrders || 0}
          </p>
        </div>
        <div className="rounded-lg bg-gray-700 p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Revenue Today</p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(stats?.todayRevenue || 0)}
          </p>
        </div>
      </div>

      {/* Facility Info */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {facility?.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{facility?.address}</p>
            <p className="text-sm text-gray-500">{facility?.city}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className="text-amber-500">⭐</span>
              <span className="font-semibold">
                {facility?.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {facility?.total_orders} total orders
            </p>
          </div>
        </div>
      </Card>

      {/* Order Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Order Queue</h2>
          <Link
            href="/facility/orders"
            className="text-sm text-trust-blue hover:underline"
          >
            View all
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-medium text-gray-900">No active orders</h3>
            <p className="text-sm text-gray-500 mt-1">
              New orders will appear here when drivers book your services.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeOrders.slice(0, 5).map((order) => {
              const statusInfo =
                ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
              const serviceInfo =
                SERVICE_TYPES[order.service_type as keyof typeof SERVICE_TYPES];
              const driverName =
                order.driver?.profile?.full_name || "Unknown Driver";

              return (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {order.order_number}
                        </h3>
                        <Badge
                          variant={
                            order.status === "pending"
                              ? "pending"
                              : order.status === "accepted"
                              ? "info"
                              : "in-progress"
                          }
                        >
                          {statusInfo?.label || order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{driverName}</p>
                      <p className="text-sm text-gray-500">
                        {serviceInfo?.name} - {serviceInfo?.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(order.base_price - order.commission_amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(order.created_at)}
                      </p>
                    </div>
                  </div>

                  <OrderActionButtons
                    orderId={order.id}
                    status={order.status}
                  />
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/facility/orders">
          <Card
            variant="clickable"
            className="flex flex-col items-center justify-center p-6 h-full"
          >
            <span className="text-3xl mb-2">📋</span>
            <span className="text-sm font-medium text-gray-900">
              All Orders
            </span>
          </Card>
        </Link>
        <Link href="/facility/revenue">
          <Card
            variant="clickable"
            className="flex flex-col items-center justify-center p-6 h-full"
          >
            <span className="text-3xl mb-2">📊</span>
            <span className="text-sm font-medium text-gray-900">Revenue</span>
          </Card>
        </Link>
      </div>
    </div>
  );
}
