import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getUser } from "@/lib/auth/actions";
import { PushPermissionPrompt } from "@/components/pwa/push-permission";

const agencyNavItems = [
  { href: "/agency/dashboard", label: "Dashboard", icon: "home" },
  { href: "/agency/drivers", label: "Drivers", icon: "users" },
  { href: "/agency/compliance", label: "Compliance", icon: "shield" },
  { href: "/agency/reports", label: "Reports", icon: "chart" },
  { href: "/agency/settings", label: "Settings", icon: "settings" },
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
          userId={profile?.id}
        />
        <main className="p-4 pb-20 md:pb-4">{children}</main>
        <PushPermissionPrompt />
        <MobileNav navItems={agencyNavItems} />
      </div>
    </div>
  );
}
