import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getCurrentFacility,
  getFacilityOrders,
} from "@/lib/facility/actions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { SERVICE_TYPES, ORDER_STATUSES } from "@/config/constants";
import { OrderActionButtons } from "../dashboard/order-actions";
import { OrderFilters } from "./order-filters";
import type { Order, Driver, Profile } from "@/types";

type FacilityOrder = Order & { driver: Driver & { profile: Profile } };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function FacilityOrdersPage({ searchParams }: PageProps) {
  const { data: facility, error: facilityError } = await getCurrentFacility();

  if (!facility && !facilityError) {
    redirect("/facility/onboarding");
  }

  const params = await searchParams;
  const statusFilter = params.status || "all";
  const { data: orders } = await getFacilityOrders(
    statusFilter === "all" ? "all" : (statusFilter as "pending" | "accepted" | "in_progress" | "completed" | "cancelled")
  );

  // Group orders by status for display
  const activeOrders = orders?.filter((o) =>
    ["pending", "accepted", "in_progress"].includes(o.status)
  ) || [];
  const completedOrders = orders?.filter((o) => o.status === "completed") || [];
  const cancelledOrders = orders?.filter((o) => o.status === "cancelled") || [];

  const displayOrders =
    statusFilter === "all"
      ? orders
      : statusFilter === "active"
      ? activeOrders
      : statusFilter === "completed"
      ? completedOrders
      : statusFilter === "cancelled"
      ? cancelledOrders
      : orders?.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <div className="text-sm text-gray-500">
          {displayOrders?.length || 0} orders
        </div>
      </div>

      <OrderFilters currentFilter={statusFilter} />

      {/* Active Orders Section */}
      {(statusFilter === "all" || statusFilter === "active") && activeOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Active Orders ({activeOrders.length})
          </h2>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} showActions />
            ))}
          </div>
        </div>
      )}

      {/* Completed Orders Section */}
      {(statusFilter === "all" || statusFilter === "completed") && completedOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Completed ({completedOrders.length})
          </h2>
          <div className="space-y-3">
            {completedOrders.slice(0, statusFilter === "completed" ? undefined : 5).map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Orders Section */}
      {(statusFilter === "all" || statusFilter === "cancelled") && cancelledOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Cancelled ({cancelledOrders.length})
          </h2>
          <div className="space-y-3">
            {cancelledOrders.slice(0, statusFilter === "cancelled" ? undefined : 3).map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!displayOrders || displayOrders.length === 0) && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-medium text-gray-900">No orders found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {statusFilter === "all"
              ? "Orders will appear here when drivers book your services."
              : `No ${statusFilter} orders found.`}
          </p>
        </Card>
      )}
    </div>
  );
}

function OrderCard({
  order,
  showActions = false,
}: {
  order: FacilityOrder;
  showActions?: boolean;
}) {
  if (!order) return null;

  const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
  const serviceInfo = SERVICE_TYPES[order.service_type as keyof typeof SERVICE_TYPES];
  const driverName = order.driver?.profile?.full_name || "Unknown Driver";

  const badgeVariant =
    order.status === "completed"
      ? "completed"
      : order.status === "pending"
      ? "pending"
      : order.status === "accepted"
      ? "info"
      : order.status === "in_progress"
      ? "in-progress"
      : order.status === "cancelled"
      ? "cancelled"
      : "inactive";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{order.order_number}</h3>
            <Badge variant={badgeVariant}>
              {statusInfo?.label || order.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">{driverName}</p>
          <p className="text-sm text-gray-500">
            {serviceInfo?.name} - {serviceInfo?.duration}
          </p>
          {order.driver?.vehicle_type && (
            <p className="text-xs text-gray-400 mt-1">
              {order.driver.vehicle_type} {order.driver.license_plate ? `(${order.driver.license_plate})` : ""}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {formatCurrency(order.base_price - order.commission_amount)}
          </p>
          <p className="text-xs text-gray-500">
            {formatDateTime(order.created_at)}
          </p>
          {order.rating && (
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-amber-500 text-sm">⭐</span>
              <span className="text-sm">{order.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timestamps */}
      {(order.accepted_at || order.started_at || order.completed_at) && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
          {order.accepted_at && (
            <p>Accepted: {formatDateTime(order.accepted_at)}</p>
          )}
          {order.started_at && (
            <p>Started: {formatDateTime(order.started_at)}</p>
          )}
          {order.completed_at && (
            <p>Completed: {formatDateTime(order.completed_at)}</p>
          )}
        </div>
      )}

      {showActions && ["pending", "accepted", "in_progress"].includes(order.status) && (
        <OrderActionButtons orderId={order.id} status={order.status} />
      )}
    </Card>
  );
}
