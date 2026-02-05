export default function AgencyDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Agency Dashboard</h1>

      {/* Compliance Overview */}
      <div className="rounded-lg bg-brand-pink p-6 text-white shadow-md">
        <p className="text-sm opacity-90">Fleet Compliance Rate</p>
        <p className="mt-1 text-3xl font-bold">---%</p>
        <p className="mt-2 text-sm opacity-90">0 of 0 drivers compliant</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Drivers</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Warnings</p>
          <p className="mt-1 text-2xl font-bold text-status-pending">0</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-status-overdue">0</p>
        </div>
      </div>

      {/* Driver List */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Drivers Needing Attention</h2>
        <p className="text-sm text-gray-500">All drivers are compliant</p>
      </div>
    </div>
  );
}
