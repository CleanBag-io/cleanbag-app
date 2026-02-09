"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import type { Transaction, Facility, Order } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface TransactionsClientProps {
  transactions: (Transaction & { facility?: Facility; order?: Order })[];
  total: number;
  currentPage: number;
  pageSize: number;
  currentType?: string;
}

export function TransactionsClient({
  transactions,
  total,
  currentPage,
  pageSize,
  currentType,
}: TransactionsClientProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);

  const typeLabels: Record<string, string> = {
    order_payment: "Payment",
    commission: "Commission",
    payout: "Payout",
  };

  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    router.push(`/admin/transactions?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (currentType) params.set("type", currentType);
    params.set("page", page.toString());
    router.push(`/admin/transactions?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={currentType || ""}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-48"
        >
          <option value="">All Types</option>
          <option value="order_payment">Payments</option>
          <option value="commission">Commissions</option>
          <option value="payout">Payouts</option>
        </Select>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg bg-white shadow-sm overflow-hidden">
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cleaning Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => {
                  const statusVariant =
                    tx.status === "completed"
                      ? ("success" as const)
                      : tx.status === "failed"
                        ? ("error" as const)
                        : ("pending" as const);

                  return (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(tx.order as { order_number?: string } | undefined)
                          ?.order_number || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {(tx.facility as { name?: string } | undefined)?.name ||
                          "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {typeLabels[tx.type] || tx.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant}>
                          {tx.status.charAt(0).toUpperCase() +
                            tx.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No transactions found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
