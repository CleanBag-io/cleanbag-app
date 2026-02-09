import { redirect } from "next/navigation";
import { getAgency } from "@/lib/agency/actions";

export default async function AgencyPage() {
  const { data: agency } = await getAgency();

  if (!agency) {
    redirect("/agency/onboarding");
  }

  redirect("/agency/dashboard");
}
