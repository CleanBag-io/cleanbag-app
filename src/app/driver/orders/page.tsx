import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDriverOrders } from "@/lib/driver/actions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { SERVICE_TYPES, ORDER_STATUSES } from "@/config/constants";

export default async function OrdersPage() {
  const { data: orders, error } = await getDriverOrders();

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
        <Card className="p-6">
          <p className="text-red-500">Error loading orders: {error}</p>
        </Card>
      </div>
    );
  }

  // Group orders by status
  const activeOrders = orders?.filter(
    (o) => o.status === "pending" || o.status === "accepted" || o.status === "in_progress"
  ) || [];
  const completedOrders = orders?.filter((o) => o.status === "completed") || [];
  const cancelledOrders = orders?.filter((o) => o.status === "cancelled") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
        <Link href="/driver/facilities">
          <Button size="sm">+ New Order</Button>
        </Link>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Orders ({activeOrders.length})
          </h2>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Completed ({completedOrders.length})
          </h2>
          <div className="space-y-3">
            {completedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Orders */}
      {cancelledOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Cancelled ({cancelledOrders.length})
          </h2>
          <div className="space-y-3">
            {cancelledOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {orders?.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900">No orders yet</h3>
          <p className="text-gray-500 mt-2">
            Book your first bag cleaning to get started!
          </p>
          <Link href="/driver/facilities">
            <Button className="mt-6">Find a Facility</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

interface Order {
  id: string;
  order_number: string;
  service_type: string;
  status: string;
  total_price: number;
  created_at: string;
  completed_at: string | null;
  rating: number | null;
  facility?: {
    name: string;
    address: string;
    city: string;
  };
}

function OrderCard({ order }: { order: Order }) {
  const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
  const serviceInfo = SERVICE_TYPES[order.service_type as keyof typeof SERVICE_TYPES];

  const badgeVariant =
    order.status === "completed"
      ? "completed"
      : order.status === "pending"
      ? "pending"
      : order.status === "in_progress"
      ? "in-progress"
      : order.status === "cancelled"
      ? "cancelled"
      : "inactive";

  return (
    <Link href={`/driver/orders/${order.id}`}>
      <Card variant="clickable" className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-mono">{order.order_number}</p>
            <h3 className="font-semibold text-gray-900 mt-1">
              {order.facility?.name || "Facility"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {order.facility?.address}
            </p>
          </div>
          <Badge variant={badgeVariant} withDot>
            {statusInfo?.label || order.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-600">
              {serviceInfo?.name || order.service_type}
            </p>
            <p className="text-xs text-gray-400">
              {formatDateTime(order.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(order.total_price)}
            </p>
            {order.rating && (
              <p className="text-sm text-amber-500">
                {"⭐".repeat(order.rating)}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
