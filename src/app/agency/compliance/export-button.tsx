"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getComplianceReport } from "@/lib/agency/actions";

export function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    const { data, error } = await getComplianceReport();

    if (error || !data) {
      alert(error || "Failed to generate report");
      setLoading(false);
      return;
    }

    // Build CSV
    const headers = [
      "Driver Name",
      "Vehicle Type",
      "City",
      "Compliance Status",
      "Last Cleaning Date",
      "Total Cleanings",
    ];
    const rows = data.map((d) => [
      d.driverName,
      d.vehicleType || "N/A",
      d.city,
      d.complianceStatus,
      d.lastCleaningDate || "Never",
      d.totalCleanings.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setLoading(false);
  };

  return (
    <Button size="sm" variant="secondary" onClick={handleExport} disabled={loading}>
      {loading ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
