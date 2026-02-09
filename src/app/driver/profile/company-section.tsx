"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, Label } from "@/components/ui/input";
import type { Agency, AgencyRequest } from "@/types";
import {
  sendJoinRequest,
  respondToInvitation,
  cancelJoinRequest,
  leaveCompany,
} from "@/lib/driver/actions";

interface CompanySectionProps {
  currentAgency: Agency | null;
  requests: AgencyRequest[];
  availableCompanies: Agency[];
}

export function CompanySection({
  currentAgency,
  requests,
  availableCompanies,
}: CompanySectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgencyId, setSelectedAgencyId] = useState("");

  // Find pending outgoing request (initiated by driver)
  const pendingOutgoing = requests.find(
    (r) => r.initiated_by === "driver" && r.status === "pending"
  );

  // Find pending incoming invitation (initiated by agency)
  const pendingIncoming = requests.find(
    (r) => r.initiated_by === "agency" && r.status === "pending"
  );

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this company?")) return;
    setLoading(true);
    setError(null);
    const result = await leaveCompany();
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
    router.refresh();
  };

  const handleSendRequest = async () => {
    if (!selectedAgencyId) return;
    setLoading(true);
    setError(null);
    const result = await sendJoinRequest(selectedAgencyId);
    if (result.error) {
      setError(result.error);
    }
    setSelectedAgencyId("");
    setLoading(false);
    router.refresh();
  };

  const handleCancelRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);
    const result = await cancelJoinRequest(requestId);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
    router.refresh();
  };

  const handleRespondToInvitation = async (
    requestId: string,
    accept: boolean
  ) => {
    setLoading(true);
    setError(null);
    const result = await respondToInvitation(requestId, accept);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-status-overdue mb-3">{error}</p>
        )}

        {/* State 1: Affiliated with a company */}
        {currentAgency && (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Company</span>
              <span className="font-medium">{currentAgency.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">City</span>
              <span className="font-medium">{currentAgency.city}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleLeave}
              disabled={loading}
            >
              {loading ? "Leaving..." : "Leave Company"}
            </Button>
          </div>
        )}

        {/* State 2: Pending outgoing request */}
        {!currentAgency && pendingOutgoing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  Request sent to {pendingOutgoing.agency?.name || "company"}
                </p>
                <p className="text-sm text-gray-500">Waiting for response</p>
              </div>
              <Badge variant="pending">Pending</Badge>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCancelRequest(pendingOutgoing.id)}
              disabled={loading}
            >
              {loading ? "Cancelling..." : "Cancel Request"}
            </Button>
          </div>
        )}

        {/* State 3: Pending incoming invitation */}
        {!currentAgency && !pendingOutgoing && pendingIncoming && (
          <div className="space-y-3">
            <div className="p-4 bg-trust-blue-light rounded-lg">
              <p className="font-medium text-trust-blue-dark">
                Invitation from {pendingIncoming.agency?.name || "a company"}
              </p>
              {pendingIncoming.message && (
                <p className="text-sm text-gray-600 mt-1">
                  &ldquo;{pendingIncoming.message}&rdquo;
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  handleRespondToInvitation(pendingIncoming.id, true)
                }
                disabled={loading}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleRespondToInvitation(pendingIncoming.id, false)
                }
                disabled={loading}
              >
                Decline
              </Button>
            </div>
          </div>
        )}

        {/* State 4: No affiliation, no pending requests */}
        {!currentAgency && !pendingOutgoing && !pendingIncoming && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              You are not associated with any company.
            </p>
            {availableCompanies.length > 0 ? (
              <>
                <div>
                  <Label htmlFor="company_select">Join a Company</Label>
                  <Select
                    id="company_select"
                    value={selectedAgencyId}
                    onChange={(e) => setSelectedAgencyId(e.target.value)}
                  >
                    <option value="">Select a company</option>
                    {availableCompanies.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.city})
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  size="sm"
                  disabled={!selectedAgencyId || loading}
                  onClick={handleSendRequest}
                >
                  {loading ? "Sending..." : "Request to Join"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                No companies available in your city yet.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
