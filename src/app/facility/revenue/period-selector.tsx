"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PeriodSelectorProps {
  currentPeriod: "week" | "month";
}

export function PeriodSelector({ currentPeriod }: PeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (period === "week") {
      params.delete("period");
    } else {
      params.set("period", period);
    }
    router.push(`/facility/revenue?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handlePeriodChange("week")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentPeriod === "week"
            ? "bg-brand-pink text-white"
            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
        }`}
      >
        7 Days
      </button>
      <button
        onClick={() => handlePeriodChange("month")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentPeriod === "month"
            ? "bg-brand-pink text-white"
            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
        }`}
      >
        30 Days
      </button>
    </div>
  );
}
