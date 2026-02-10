import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/actions";
import { CreateFacilityForm } from "./create-facility-form";

export default async function CreateFacilityPage() {
  const profile = await getUser();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Create Cleaning Facility
      </h1>
      <CreateFacilityForm />
    </div>
  );
}
