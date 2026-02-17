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
                          {driver.profile?.phone && (
                            <>
                              <a
                                href={`tel:${driver.profile.phone}`}
                                className="text-trust-blue hover:text-trust-blue-hover"
                                title="Call"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                              </a>
                              <a
                                href={`https://wa.me/${driver.profile.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-80"
                                title="WhatsApp"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="#25D366"/><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/></svg>
                              </a>
                            </>
                          )}
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
