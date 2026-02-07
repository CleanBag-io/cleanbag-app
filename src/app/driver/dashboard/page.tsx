import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDriver, getDriverOrders, getFacilities } from "@/lib/driver/actions";
import { getUser } from "@/lib/auth/actions";
import { getRelativeTime, formatCurrency, formatDateTime, getServiceName } from "@/lib/utils";
import { PRICING, ORDER_STATUSES } from "@/config/constants";

export default async function DriverDashboardPage() {
  const profile = await getUser();
  const { data: driver, error: driverError } = await getDriver();

  // If no driver record, redirect to onboarding
  if (!driver && !driverError) {
    redirect("/driver/onboarding");
  }

  // Get recent orders
  const { data: orders } = await getDriverOrders();
  const recentOrders = orders?.slice(0, 3) || [];

  // Get nearby facilities (same city as driver)
  const { data: facilities } = await getFacilities(driver?.city);
  const nearbyFacilities = facilities?.slice(0, 3) || [];

  const complianceStatusMap = {
    compliant: { label: "Compliant", variant: "success" as const },
    warning: { label: "Due Soon", variant: "warning" as const },
    overdue: { label: "Overdue", variant: "error" as const },
  };

  const complianceInfo = driver
    ? complianceStatusMap[driver.compliance_status]
    : complianceStatusMap.overdue;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-gray-600 mt-1">
          {driver?.city ? `Based in ${driver.city}` : "Complete your profile to get started"}
        </p>
      </div>

      {/* Compliance Status */}
      <Card
        className={`p-6 ${
          driver?.compliance_status === "compliant"
            ? "bg-brand-pink"
            : driver?.compliance_status === "warning"
            ? "bg-amber-500"
            : "bg-red-500"
        } text-white border-0`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-90">Compliance Status</p>
            <p className="mt-1 text-3xl font-bold">{complianceInfo.label}</p>
            <p className="mt-2 text-sm opacity-90">
              Last cleaned: {getRelativeTime(driver?.last_cleaning_date || null)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{driver?.total_cleanings || 0}</p>
            <p className="text-sm opacity-90">total cleanings</p>
          </div>
        </div>

        {driver?.compliance_status !== "compliant" && (
          <Link href="/driver/facilities">
            <Button
              variant="secondary"
              className="mt-4 bg-white text-gray-900 hover:bg-gray-100"
              fullWidth
            >
              Book a Cleaning Now
            </Button>
          </Link>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/driver/facilities">
          <Card variant="clickable" className="flex flex-col items-center justify-center p-6 h-full">
            <span className="text-3xl mb-2">🔍</span>
            <span className="text-sm font-medium text-gray-900">Find Cleaning Facility</span>
          </Card>
        </Link>
        <Link href="/driver/orders">
          <Card variant="clickable" className="flex flex-col items-center justify-center p-6 h-full">
            <span className="text-3xl mb-2">📋</span>
            <span className="text-sm font-medium text-gray-900">My Orders</span>
          </Card>
        </Link>
      </div>

      {/* Nearby Facilities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Nearby Cleaning Facilities</h2>
          <Link href="/driver/facilities" className="text-sm text-trust-blue hover:underline">
            View all
          </Link>
        </div>

        {nearbyFacilities.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">No cleaning facilities found in your area</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {nearbyFacilities.map((facility) => (
              <Link key={facility.id} href={`/driver/facilities/${facility.id}`}>
                <Card variant="clickable" className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{facility.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{facility.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(PRICING.bagClean)}
                      </p>
                      <p className="text-xs text-gray-500">{facility.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-amber-500">⭐</span>
                    <span className="text-sm font-medium">{facility.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">
                      ({facility.total_orders} orders)
                    </span>
                    {facility.is_active && (
                      <Badge variant="success" className="ml-auto">
                        Available
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/driver/orders" className="text-sm text-trust-blue hover:underline">
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-medium text-gray-900">No orders yet</h3>
            <p className="text-sm text-gray-500 mt-1">
              Book your first cleaning to get started!
            </p>
            <Link href="/driver/facilities">
              <Button className="mt-4">Find a Cleaning Facility</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
              const serviceName = getServiceName(order.service_type);

              return (
                <Link key={order.id} href={`/driver/orders/${order.id}`}>
                  <Card variant="clickable" className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {order.facility?.name || "Cleaning Facility"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          order.status === "completed"
                            ? "completed"
                            : order.status === "pending"
                            ? "pending"
                            : order.status === "in_progress"
                            ? "in-progress"
                            : order.status === "cancelled"
                            ? "cancelled"
                            : "inactive"
                        }
                      >
                        {statusInfo?.label || order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-gray-600">
                        {serviceName}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(order.total_price)}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
