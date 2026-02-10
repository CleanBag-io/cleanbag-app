import { type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Read .env.local for Supabase credentials
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  const content = fs.readFileSync(envPath, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
  return vars;
}

const env = loadEnv();

export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Test accounts ─────────────────────────────────────────────

export const TEST_PASSWORD = "testpass123";
export const TEST_CITY = "Limassol";

export const ACCOUNTS = {
  driver: {
    email: "e2e-driver@test.com",
    name: "E2E Driver",
    role: "driver",
  },
  facility: {
    email: "e2e-facility@test.com",
    name: "E2E Facility",
    role: "facility",
  },
  agency: {
    email: "e2e-agency@test.com",
    name: "E2E Company",
    role: "agency",
  },
  admin: {
    email: "e2e-admin@test.com",
    name: "E2E Admin",
    role: "admin",
  },
};

// ─── Setup: create users via admin API ─────────────────────────

export async function createTestUser(
  email: string,
  name: string,
  role: string
): Promise<string> {
  // Delete existing user with this email if any
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email === email);
  if (existing) {
    await supabaseAdmin.auth.admin.deleteUser(existing.id);
    // Wait a moment for deletion to propagate
    await new Promise((r) => setTimeout(r, 500));
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name, role },
  });

  if (error) throw new Error(`Failed to create ${role} user: ${error.message}`);

  // Ensure profile has the correct role (the trigger should set it, but just in case)
  await new Promise((r) => setTimeout(r, 300));
  await supabaseAdmin
    .from("profiles")
    .update({ role, full_name: name })
    .eq("id", data.user.id);

  return data.user.id;
}

// Email used by admin "Create Facility" E2E test (cleaned up in globalTeardown)
export const ADMIN_CREATED_FACILITY_EMAIL = "e2e-created-facility@test.com";

// ─── Page helpers ──────────────────────────────────────────────

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  // Wait for the actual form to render (Suspense may show fallback first)
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Click and wait for navigation
  await Promise.all([
    page.waitForURL(
      (url) =>
        url.pathname.startsWith("/driver") ||
        url.pathname.startsWith("/facility") ||
        url.pathname.startsWith("/agency") ||
        url.pathname.startsWith("/admin"),
      { timeout: 15000 }
    ),
    page.click('button[type="submit"]'),
  ]);
}
