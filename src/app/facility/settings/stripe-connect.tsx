"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createConnectAccountLink,
  getConnectAccountStatus,
} from "@/lib/stripe/actions";

interface StripeConnectSectionProps {
  facilityId: string;
  stripeAccountId: string | null;
}

interface AccountStatus {
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: string[];
}

export function StripeConnectSection({
  facilityId,
  stripeAccountId,
}: StripeConnectSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AccountStatus>({
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    requirements: [],
  });

  useEffect(() => {
    if (stripeAccountId && facilityId) {
      getConnectAccountStatus(facilityId).then((result) => {
        if (result.data) {
          setStatus({
            detailsSubmitted: result.data.detailsSubmitted,
            chargesEnabled: result.data.chargesEnabled,
            payoutsEnabled: result.data.payoutsEnabled,
            requirements: result.data.requirements,
          });
        }
      });
    }
  }, [stripeAccountId, facilityId]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await createConnectAccountLink();

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        setError("No redirect URL received from Stripe");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to connect with Stripe. Please try again.");
      setLoading(false);
    }
  };

  // Fully connected — details submitted and both charges + payouts enabled
  if (stripeAccountId && status.detailsSubmitted && status.chargesEnabled && status.payoutsEnabled) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="success">Connected</Badge>
          <span className="text-sm text-gray-600">
            Your Stripe account is set up for payouts.
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Earnings are transferred automatically when orders are completed.
        </p>
      </div>
    );
  }

  // Account created but setup incomplete (details submitted but capabilities pending, or details not submitted)
  if (stripeAccountId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="warning">Setup Incomplete</Badge>
          <span className="text-sm text-gray-600">
            {status.detailsSubmitted
              ? "Your account is being reviewed by Stripe."
              : "Complete your Stripe account setup to receive payouts."}
          </span>
        </div>
        {status.detailsSubmitted && !status.chargesEnabled && (
          <p className="text-xs text-gray-500">
            Stripe is verifying your account. This usually takes 1-2 business days.
          </p>
        )}
        {status.requirements.length > 0 && (
          <p className="text-xs text-gray-500">
            {status.requirements.length} item{status.requirements.length > 1 ? "s" : ""} still needed to complete setup.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <Button onClick={handleConnect} disabled={loading}>
          {loading ? "Redirecting..." : "Complete Setup"}
        </Button>
      </div>
    );
  }

  // Not connected
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Badge variant="warning">Not Connected</Badge>
        <span className="text-sm text-gray-600">
          Connect your Stripe account to receive payouts.
        </span>
      </div>
      <p className="text-sm text-gray-500">
        CleanBag uses Stripe to securely transfer your earnings. Setup takes about 5 minutes.
      </p>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <Button onClick={handleConnect} disabled={loading}>
        {loading ? "Redirecting..." : "Connect with Stripe"}
      </Button>
    </div>
  );
}
