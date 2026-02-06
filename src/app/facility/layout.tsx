import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getUser } from "@/lib/auth/actions";

const facilityNavItems = [
  { href: "/facility/dashboard", label: "Dashboard", icon: "home" },
  { href: "/facility/orders", label: "Orders", icon: "clipboard" },
  { href: "/facility/revenue", label: "Revenue", icon: "chart" },
  { href: "/facility/settings", label: "Settings", icon: "settings" },
];

export default async function FacilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar navItems={facilityNavItems} role="facility" />
      <div className="md:pl-sidebar">
        <Header
          title="Cleaning Facility Dashboard"
          role="facility"
          userName={profile?.full_name || undefined}
        />
        <main className="p-4 pb-20 md:pb-4">{children}</main>
        <MobileNav navItems={facilityNavItems} />
      </div>
    </div>
  );
}
