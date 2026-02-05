import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "€"): string {
  return `${currency}${amount.toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function getComplianceStatus(
  lastCleaningDate: Date | string | null
): "compliant" | "warning" | "overdue" {
  if (!lastCleaningDate) return "overdue";

  const lastCleaning =
    typeof lastCleaningDate === "string"
      ? new Date(lastCleaningDate)
      : lastCleaningDate;
  const daysSinceLastCleaning = Math.floor(
    (Date.now() - lastCleaning.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastCleaning <= 7) return "compliant";
  if (daysSinceLastCleaning <= 14) return "warning";
  return "overdue";
}

export function getDaysSince(date: Date | string | null): number {
  if (!date) return 999;
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function getRelativeTime(date: Date | string | null): string {
  if (!date) return "Never";

  const d = typeof date === "string" ? new Date(date) : date;
  const days = getDaysSince(d);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(d);
}
