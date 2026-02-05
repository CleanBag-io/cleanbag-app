import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getUser } from "@/lib/auth/actions";

const driverNavItems = [
  { href: "/driver/dashboard", label: "Dashboard", icon: "home" },
  { href: "/driver/facilities", label: "Find Facility", icon: "search" },
  { href: "/driver/orders", label: "My Orders", icon: "clipboard" },
  { href: "/driver/history", label: "History", icon: "clock" },
  { href: "/driver/profile", label: "Profile", icon: "user" },
];

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar navItems={driverNavItems} role="driver" />
      <div className="md:pl-sidebar">
        <Header
          title="Driver Portal"
          role="driver"
          userName={profile?.full_name || undefined}
        />
        <main className="p-4 pb-20 md:pb-4">{children}</main>
        <MobileNav navItems={driverNavItems} />
      </div>
    </div>
  );
}
