import { getAllFacilities } from "@/lib/admin/actions";
import { FacilitiesClient } from "./facilities-client";

export default async function AdminFacilitiesPage() {
  const { data: facilities, error } = await getAllFacilities();

  if (error) {
    return (
      <div className="p-6 text-center text-status-overdue">
        {error}
      </div>
    );
  }

  return <FacilitiesClient facilities={facilities || []} />;
}
