import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getUser } from "@/lib/auth/actions";

const agencyNavItems = [
  { href: "/agency/dashboard", label: "Dashboard", icon: "home" },
  { href: "/agency/drivers", label: "Drivers", icon: "users" },
  { href: "/agency/compliance", label: "Compliance", icon: "shield" },
  { href: "/agency/reports", label: "Reports", icon: "chart" },
];

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar navItems={agencyNavItems} role="agency" />
      <div className="md:pl-sidebar">
        <Header
          title="Company Management"
          role="agency"
          userName={profile?.full_name || undefined}
        />
        <main className="p-4 pb-20 md:pb-4">{children}</main>
        <MobileNav navItems={agencyNavItems} />
      </div>
    </div>
  );
}
