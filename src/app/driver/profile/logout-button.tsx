"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;
    setLoading(true);
    await logout();
  };

  return (
    <Button
      variant="danger"
      fullWidth
      disabled={loading}
      onClick={handleLogout}
    >
      {loading ? "Logging out..." : "Log Out"}
    </Button>
  );
}
