"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FILTER_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface OrderFiltersProps {
  currentFilter: string;
}

export function OrderFilters({ currentFilter }: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/facility/orders?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => handleFilterChange(option.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            currentFilter === option.value
              ? "bg-brand-pink text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
