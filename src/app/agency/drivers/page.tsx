import { redirect } from "next/navigation";
import {
  getAgency,
  getAgencyDrivers,
  getAgencyRequests,
  searchDrivers,
} from "@/lib/agency/actions";
import { DriversClient } from "./drivers-client";

export default async function AgencyDriversPage() {
  const { data: agency } = await getAgency();

  if (!agency) {
    redirect("/agency/onboarding");
  }

  const [driversResult, requestsResult, searchResult] = await Promise.all([
    getAgencyDrivers(),
    getAgencyRequests("pending"),
    searchDrivers(),
  ]);

  return (
    <DriversClient
      drivers={driversResult.data || []}
      pendingRequests={requestsResult.data || []}
      availableDrivers={searchResult.data || []}
    />
  );
}
