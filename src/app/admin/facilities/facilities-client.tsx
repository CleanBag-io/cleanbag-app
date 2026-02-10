"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import type { Facility } from "@/types";
import { CITIES } from "@/config/constants";
import { formatCurrency } from "@/lib/utils";
import { updateFacilityStatus } from "@/lib/admin/actions";

interface FacilitiesClientProps {
  facilities: Facility[];
}

export function FacilitiesClient({ facilities }: FacilitiesClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = facilities.filter((f) => {
    if (cityFilter && f.city !== cityFilter) return false;
    if (statusFilter === "active" && !f.is_active) return false;
    if (statusFilter === "inactive" && f.is_active) return false;
    return true;
  });

  const handleToggle = async (facilityId: string, currentActive: boolean) => {
    setLoading(facilityId);
    await updateFacilityStatus(facilityId, !currentActive);
    setLoading(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Cleaning Facilities
        </h1>
        <Link href="/admin/facilities/create">
          <Button size="sm">Create Facility</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All Cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "inactive")
          }
          className="w-40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {/* Facilities Table */}
      <div className="rounded-lg bg-white shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    City
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stripe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((facility) => (
                  <tr key={facility.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {facility.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {facility.city}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {facility.total_orders}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {facility.rating > 0
                        ? facility.rating.toFixed(1)
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          facility.stripe_account_id ? "success" : "inactive"
                        }
                      >
                        {facility.stripe_account_id
                          ? "Connected"
                          : "Not Connected"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={facility.is_active ? "success" : "inactive"}
                      >
                        {facility.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant={facility.is_active ? "danger" : "primary"}
                        disabled={loading === facility.id}
                        onClick={() =>
                          handleToggle(facility.id, facility.is_active)
                        }
                      >
                        {loading === facility.id
                          ? "..."
                          : facility.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No cleaning facilities found.
          </div>
        )}
      </div>

      <p className="text-sm text-gray-400">
        {filtered.length} of {facilities.length} cleaning facilities shown
      </p>
    </div>
  );
}
