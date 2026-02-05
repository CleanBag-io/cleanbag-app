"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFacility } from "@/lib/facility/actions";
import type { Facility } from "@/types";

interface FacilityProfileFormProps {
  facility: Facility | null | undefined;
}

export function FacilityProfileForm({ facility }: FacilityProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateFacility(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Facility Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={facility?.name || ""}
          required
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          defaultValue={facility?.address || ""}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={facility?.phone || ""}
          placeholder="+357 XX XXX XXX"
        />
      </div>

      <div>
        <Label>City</Label>
        <Input value={facility?.city || ""} disabled className="bg-gray-50" />
        <p className="text-xs text-gray-400 mt-1">
          Contact support to change your city.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {success && (
        <p className="text-sm text-green-600">Profile updated successfully!</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
