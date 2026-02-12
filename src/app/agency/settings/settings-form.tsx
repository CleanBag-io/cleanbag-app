"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { CITIES } from "@/config/constants";
import { upsertAgency } from "@/lib/agency/actions";
import type { Agency } from "@/types";

interface CompanySettingsFormProps {
  agency: Agency;
}

export function CompanySettingsForm({ agency }: CompanySettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [complianceTarget, setComplianceTarget] = useState(
    Math.round(agency.compliance_target * 100)
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.set("compliance_target", complianceTarget.toString());

    const result = await upsertAgency(formData);

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
        <Label htmlFor="name" required>
          Company Name
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={agency.name}
          required
        />
      </div>

      <div>
        <Label htmlFor="city" required>
          City
        </Label>
        <Select
          id="city"
          name="city"
          defaultValue={agency.city}
          required
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="compliance_target">
          Compliance Target: {complianceTarget}%
        </Label>
        <input
          id="compliance_target"
          type="range"
          min="50"
          max="100"
          step="5"
          value={complianceTarget}
          onChange={(e) => setComplianceTarget(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-pink"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {success && (
        <p className="text-sm text-green-600">Settings updated successfully!</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
