export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg bg-brand-pink p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold">€0</p>
        </div>
        <div className="rounded-lg bg-trust-blue p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Active Facilities</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg bg-status-completed p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Total Drivers</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg bg-gray-700 p-4 text-white shadow-md">
          <p className="text-sm opacity-90">Orders Today</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <p className="text-sm text-gray-500">No recent transactions</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Pending Approvals</h2>
          <p className="text-sm text-gray-500">No pending approvals</p>
        </div>
      </div>
    </div>
  );
}
