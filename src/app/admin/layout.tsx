import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getUser } from "@/lib/auth/actions";

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "home" },
  { href: "/admin/facilities", label: "Facilities", icon: "building" },
  { href: "/admin/transactions", label: "Transactions", icon: "credit-card" },
  { href: "/admin/analytics", label: "Analytics", icon: "chart" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar navItems={adminNavItems} role="admin" />
      <div className="md:pl-sidebar">
        <Header
          title="Admin Panel"
          role="admin"
          userName={profile?.full_name || undefined}
        />
        <main className="p-4 pb-20 md:pb-4">{children}</main>
        <MobileNav navItems={adminNavItems} />
      </div>
    </div>
  );
}
