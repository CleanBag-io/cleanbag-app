"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Driver, Profile, AgencyRequest } from "@/types";
import { getRelativeTime } from "@/lib/utils";
import {
  respondToRequest,
  cancelInvitation,
  removeDriver,
  sendInvitation,
} from "@/lib/agency/actions";

interface DriversClientProps {
  drivers: (Driver & { profile: Profile })[];
  pendingRequests: AgencyRequest[];
  availableDrivers: (Driver & { profile: Profile })[];
}

export function DriversClient({
  drivers,
  pendingRequests,
  availableDrivers,
}: DriversClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"drivers" | "pending">("drivers");
  const [loading, setLoading] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const complianceStatusMap = {
    compliant: { label: "Compliant", variant: "success" as const },
    warning: { label: "Due Soon", variant: "warning" as const },
    overdue: { label: "Overdue", variant: "error" as const },
  };

  // Split pending requests
  const incomingRequests = pendingRequests.filter(
    (r) => r.initiated_by === "driver"
  );
  const outgoingInvitations = pendingRequests.filter(
    (r) => r.initiated_by === "agency"
  );

  const handleRemove = async (driverId: string) => {
    if (!confirm("Remove this driver from your company?")) return;
    setLoading(driverId);
    await removeDriver(driverId);
    setLoading(null);
    router.refresh();
  };

  const handleRespond = async (requestId: string, accept: boolean) => {
    setLoading(requestId);
    await respondToRequest(requestId, accept);
    setLoading(null);
    router.refresh();
  };

  const handleCancelInvite = async (requestId: string) => {
    setLoading(requestId);
    await cancelInvitation(requestId);
    setLoading(null);
    router.refresh();
  };

  const handleInvite = async (driverId: string) => {
    setLoading(driverId);
    await sendInvitation(driverId);
    setLoading(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Drivers</h1>
        <Button size="sm" onClick={() => setShowInvite(!showInvite)}>
          {showInvite ? "Close" : "Invite Driver"}
        </Button>
      </div>

      {/* Invite Driver Section */}
      {showInvite && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Invite a Driver
            </h3>
            {availableDrivers.length > 0 ? (
              <div className="space-y-2">
                {availableDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {driver.profile?.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {driver.vehicle_type || "No vehicle"} &middot;{" "}
                        {driver.city}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={loading === driver.id}
                      onClick={() => handleInvite(driver.id)}
                    >
                      {loading === driver.id ? "Sending..." : "Invite"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No unaffiliated drivers found in your city.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "drivers"
              ? "border-brand-pink text-brand-pink"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("drivers")}
        >
          My Drivers ({drivers.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-brand-pink text-brand-pink"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({pendingRequests.length})
        </button>
      </div>

      {/* My Drivers Tab */}
      {activeTab === "drivers" && (
        <div>
          {drivers.length > 0 ? (
            <div className="space-y-3">
              {drivers.map((driver) => {
                const statusInfo =
                  complianceStatusMap[driver.compliance_status];
                return (
                  <Card key={driver.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {driver.profile?.full_name || "Unknown Driver"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {driver.vehicle_type
                              ? driver.vehicle_type.charAt(0).toUpperCase() +
                                driver.vehicle_type.slice(1)
                              : "No vehicle"}{" "}
                            &middot; Last clean:{" "}
                            {getRelativeTime(driver.last_cleaning_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={loading === driver.id}
                            onClick={() => handleRemove(driver.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  No drivers in your company yet. Use the Invite button to add
                  drivers.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pending Tab */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {/* Incoming Join Requests */}
          {incomingRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Join Requests
              </h3>
              <div className="space-y-2">
                {incomingRequests.map((req) => (
                  <Card key={req.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {req.driver?.profile?.full_name || "Unknown Driver"}
                          </p>
                          {req.message && (
                            <p className="text-sm text-gray-500">
                              &ldquo;{req.message}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={loading === req.id}
                            onClick={() => handleRespond(req.id, true)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={loading === req.id}
                            onClick={() => handleRespond(req.id, false)}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Invitations */}
          {outgoingInvitations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Sent Invitations
              </h3>
              <div className="space-y-2">
                {outgoingInvitations.map((req) => (
                  <Card key={req.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {req.driver?.profile?.full_name || "Unknown Driver"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Invitation sent
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={loading === req.id}
                          onClick={() => handleCancelInvite(req.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pendingRequests.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No pending requests.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
