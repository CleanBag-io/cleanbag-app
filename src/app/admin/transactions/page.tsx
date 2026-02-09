import { getAllTransactions } from "@/lib/admin/actions";
import { TransactionsClient } from "./transactions-client";

interface PageProps {
  searchParams: Promise<{ type?: string; page?: string }>;
}

export default async function AdminTransactionsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const type = params.type || undefined;
  const page = parseInt(params.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, error } = await getAllTransactions({ type, limit, offset });

  if (error) {
    return (
      <div className="p-6 text-center text-status-overdue">{error}</div>
    );
  }

  return (
    <TransactionsClient
      transactions={data?.transactions || []}
      total={data?.total || 0}
      currentPage={page}
      pageSize={limit}
      currentType={type}
    />
  );
}
