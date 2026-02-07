import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrder } from "@/lib/driver/actions";
import { formatCurrency, formatDateTime, getServiceName } from "@/lib/utils";
import { ORDER_STATUSES } from "@/config/constants";
import { OrderActions } from "./order-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data: order, error } = await getOrder(id);

  if (error || !order) {
    notFound();
  }

  const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
  const serviceName = getServiceName(order.service_type);

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

  // Order status steps
  const steps = [
    { key: "pending", label: "Order Placed", icon: "📝" },
    { key: "accepted", label: "Accepted", icon: "✅" },
    { key: "in_progress", label: "In Progress", icon: "🧹" },
    { key: "completed", label: "Completed", icon: "🎉" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/driver/orders"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        ← Back to Orders
      </Link>

      {/* Order Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-mono">{order.order_number}</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">
                {order.facility?.name || "Cleaning Facility"}
              </h1>
              <p className="text-gray-600 mt-1">{order.facility?.address}</p>
            </div>
            <Badge variant={badgeVariant} withDot className="text-base px-4 py-2">
              {statusInfo?.label || order.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Status Progress */}
      {!isCancelled && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200" />
              <div
                className="absolute left-6 top-6 w-0.5 bg-brand-pink transition-all"
                style={{
                  height: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                }}
              />

              {/* Steps */}
              <div className="space-y-8">
                {steps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div
                        className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                          isCompleted
                            ? "bg-brand-pink text-white"
                            : "bg-gray-100 text-gray-400"
                        } ${isCurrent ? "ring-4 ring-brand-pink-light" : ""}`}
                      >
                        {step.icon}
                      </div>
                      <div>
                        <p
                          className={`font-medium ${
                            isCompleted ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-brand-pink">Current status</p>
                        )}
                        {step.key === "pending" && order.created_at && isCompleted && (
                          <p className="text-xs text-gray-500">
                            {formatDateTime(order.created_at)}
                          </p>
                        )}
                        {step.key === "accepted" && order.accepted_at && isCompleted && (
                          <p className="text-xs text-gray-500">
                            {formatDateTime(order.accepted_at)}
                          </p>
                        )}
                        {step.key === "in_progress" && order.started_at && isCompleted && (
                          <p className="text-xs text-gray-500">
                            {formatDateTime(order.started_at)}
                          </p>
                        )}
                        {step.key === "completed" && order.completed_at && isCompleted && (
                          <p className="text-xs text-gray-500">
                            {formatDateTime(order.completed_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Notice */}
      {isCancelled && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <div>
                <h3 className="font-semibold text-red-800">Order Cancelled</h3>
                {order.cancellation_reason && (
                  <p className="text-sm text-red-600 mt-1">
                    Reason: {order.cancellation_reason}
                  </p>
                )}
                {order.cancelled_at && (
                  <p className="text-xs text-red-500 mt-1">
                    {formatDateTime(order.cancelled_at)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Service</span>
              <span className="font-medium">{serviceName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">15-20 min</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Cleaning Facility</span>
              <span className="font-medium">{order.facility?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Location</span>
              <span className="font-medium text-right">
                {order.facility?.address}
                <br />
                <span className="text-gray-400">{order.facility?.city}</span>
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Payment Status</span>
              <Badge
                variant={order.payment_status === "paid" ? "success" : "pending"}
              >
                {order.payment_status}
              </Badge>
            </div>
            <div className="flex justify-between pt-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-brand-pink">
                {formatCurrency(order.total_price)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating (if completed and not yet rated) */}
      {order.status === "completed" && !order.rating && (
        <Card className="bg-brand-pink-light border-brand-pink">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              How was your experience?
            </h2>
            <p className="text-gray-600 mb-4">
              Rate your cleaning to help other drivers.
            </p>
            <OrderActions orderId={order.id} showRating />
          </CardContent>
        </Card>
      )}

      {/* Existing Rating */}
      {order.rating && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Rating</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl text-amber-500">
                {"⭐".repeat(order.rating)}
                {"☆".repeat(5 - order.rating)}
              </span>
              <span className="text-lg font-medium">{order.rating}/5</span>
            </div>
            {order.review && (
              <p className="text-gray-600 mt-3 italic">&quot;{order.review}&quot;</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {order.status === "pending" && (
        <Card>
          <CardContent className="p-6">
            <OrderActions orderId={order.id} showCancel />
          </CardContent>
        </Card>
      )}

      {/* Facility Contact */}
      {order.facility?.phone && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
            <a
              href={`tel:${order.facility.phone}`}
              className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">📞</span>
              <span className="font-medium text-gray-900">
                Contact Cleaning Facility
              </span>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
