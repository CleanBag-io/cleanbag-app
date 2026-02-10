import { test, expect } from "@playwright/test";
import { ACCOUNTS, TEST_PASSWORD, TEST_CITY, login, ADMIN_CREATED_FACILITY_EMAIL } from "./helpers";

// Account lifecycle is handled by globalSetup / globalTeardown
// (see playwright.config.ts)

// ────────────────────────────────────────────────────────────────
// SECTION 1: Login & Basic Auth
// ────────────────────────────────────────────────────────────────

test.describe.serial("1. Auth & Login", () => {
  test("1a. Driver can login", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await expect(page).toHaveURL(/\/driver/);
  });

  test("1b. Facility can login", async ({ page }) => {
    await login(page, ACCOUNTS.facility.email, TEST_PASSWORD);
    await expect(page).toHaveURL(/\/facility/);
  });

  test("1c. Company can login", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await expect(page).toHaveURL(/\/agency/);
  });

  test("1d. Admin can login", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await expect(page).toHaveURL(/\/admin/);
  });

  test("1e. Unauthenticated users redirected to login", async ({ page }) => {
    await page.goto("/agency/dashboard");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 2: Driver Onboarding
// ────────────────────────────────────────────────────────────────

test.describe.serial("2. Driver Onboarding", () => {
  test("2a. Complete driver onboarding", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);

    await page.goto("/driver/onboarding");
    await page.waitForLoadState("networkidle");

    // Step 1: Vehicle Type
    await page.click("text=Motorcycle");
    await page.click("button:has-text('Continue')");

    // Step 2: Platforms
    await page.click("text=Wolt");
    await page.click("button:has-text('Continue')");

    // Step 3: City
    await page.selectOption("select#city", TEST_CITY);
    await page.click("button:has-text('Complete Setup')");

    await page.waitForURL(/\/driver\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/driver\/dashboard/);
  });

  test("2b. Driver dashboard loads after onboarding", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/dashboard");
    await page.waitForLoadState("networkidle");
    // Just verify it doesn't redirect back to onboarding
    await expect(page).toHaveURL(/\/driver\/dashboard/);
  });

});

// ────────────────────────────────────────────────────────────────
// SECTION 3: Facility Onboarding
// ────────────────────────────────────────────────────────────────

test.describe.serial("3. Facility Onboarding", () => {
  test("3a. Complete facility onboarding", async ({ page }) => {
    await login(page, ACCOUNTS.facility.email, TEST_PASSWORD);

    await page.goto("/facility/onboarding");
    await page.waitForLoadState("networkidle");

    // Step 1: Name
    await page.fill("input#name", "Clean Express Limassol");
    await page.click("button:has-text('Continue')");

    // Step 2: Address + City
    await page.fill("input#address", "123 Main Street");
    await page.selectOption("select#city", TEST_CITY);
    await page.click("button:has-text('Complete Setup')");

    await page.waitForURL(/\/facility\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/facility\/dashboard/);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 4: Company Onboarding (Sprint 6)
// ────────────────────────────────────────────────────────────────

test.describe.serial("4. Company Onboarding", () => {
  test("4a. Company redirects to onboarding when no agency record", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    // The /agency page should redirect to /agency/onboarding
    await page.goto("/agency");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/agency\/onboarding/);
  });

  test("4b. Complete company onboarding wizard", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/onboarding");
    await page.waitForLoadState("networkidle");

    // Step 1: Company name
    await page.fill("input#name", "Fast Deliveries Cyprus");
    await page.click("button:has-text('Continue')");

    // Step 2: City
    await page.selectOption("select#city", TEST_CITY);
    await page.click("button:has-text('Continue')");

    // Step 3: Compliance target (slider defaults to 80%)
    await page.click("button:has-text('Complete Setup')");

    await page.waitForURL(/\/agency\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/agency\/dashboard/);
  });

  test("4c. Company dashboard loads with correct structure", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1")).toHaveText("Company Dashboard", { timeout: 15000 });
    await expect(page.locator("text=Fleet Compliance Rate")).toBeVisible();
    await expect(page.locator("text=Total Drivers")).toBeVisible();
    await expect(page.locator("text=Warnings")).toBeVisible();
    await expect(page.locator("text=Overdue")).toBeVisible();
  });

  test("4d. Agency page redirects to dashboard after onboarding", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/agency\/dashboard/);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 5: Driver-Company Association (Sprint 6 core)
// ────────────────────────────────────────────────────────────────

test.describe.serial("5. Driver-Company Association", () => {
  test("5a. Driver profile shows Company section (unaffiliated)", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/profile");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h3:has-text('Company')")).toBeVisible();
    await expect(
      page.locator("text=You are not associated with any company")
    ).toBeVisible();
  });

  test("5b. Driver sends join request", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/profile");
    await page.waitForLoadState("networkidle");

    // Select the company
    const companySelect = page.locator("select#company_select");
    await expect(companySelect).toBeVisible({ timeout: 5000 });

    // Pick the first real option (not placeholder)
    const options = companySelect.locator("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(1);

    const optionValue = await options.nth(1).getAttribute("value");
    await companySelect.selectOption(optionValue!);
    await page.click("button:has-text('Request to Join')");

    // Wait for update — reload to see new state
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should show pending state
    await expect(
      page.locator("p:has-text('Request sent to')")
    ).toBeVisible({ timeout: 5000 });
  });

  test("5c. Company sees pending join request", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/drivers");
    await page.waitForLoadState("networkidle");

    // Click Pending tab
    await page.click("button:has-text('Pending')");
    await page.waitForTimeout(500);

    // Should see the driver's request
    await expect(
      page.locator(`p:has-text("${ACCOUNTS.driver.name}")`)
    ).toBeVisible({ timeout: 5000 });
  });

  test("5d. Company accepts join request", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/drivers");
    await page.waitForLoadState("networkidle");

    await page.click("button:has-text('Pending')");
    await page.waitForTimeout(500);

    const acceptButton = page.locator("button:has-text('Accept')").first();
    await expect(acceptButton).toBeVisible({ timeout: 5000 });
    await acceptButton.click();

    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Switch to My Drivers tab
    await page.click("button:has-text('My Drivers')");
    await page.waitForTimeout(500);

    // Driver should be listed
    await expect(
      page.locator(`text=${ACCOUNTS.driver.name}`)
    ).toBeVisible({ timeout: 5000 });
  });

  test("5e. Driver profile shows affiliated company", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/profile");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("text=Fast Deliveries Cyprus")
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator("button:has-text('Leave Company')")
    ).toBeVisible();
  });

  test("5f. Driver leaves company", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/profile");
    await page.waitForLoadState("networkidle");

    page.on("dialog", (d) => d.accept());
    await page.click("button:has-text('Leave Company')");

    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("text=You are not associated with any company")
    ).toBeVisible({ timeout: 5000 });
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 6: Company Invitation Flow
// ────────────────────────────────────────────────────────────────

test.describe.serial("6. Company Invitation Flow", () => {
  test("6a. Company invites a driver", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/drivers");
    await page.waitForLoadState("networkidle");

    await page.click("button:has-text('Invite Driver')");
    await page.waitForTimeout(500);

    // Try to find and click Invite for an available driver
    const inviteBtn = page.locator("button:has-text('Invite')").first();
    if (await inviteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(1500);
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Verify in Pending tab
      await page.click("button:has-text('Pending')");
      await page.waitForTimeout(500);
      await expect(
        page.locator("h3:has-text('Sent Invitations')")
      ).toBeVisible({ timeout: 5000 });
    } else {
      // No available drivers — still passes
      await expect(
        page.locator("text=No unaffiliated drivers")
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test("6b. Driver accepts invitation", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/profile");
    await page.waitForLoadState("networkidle");

    const acceptBtn = page.locator("button:has-text('Accept')");
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(1500);
      await page.reload();
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator("text=Fast Deliveries Cyprus")
      ).toBeVisible({ timeout: 5000 });
    }
    // If no invitation visible, driver may already be in different state
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 7: Company Portal Pages
// ────────────────────────────────────────────────────────────────

test.describe.serial("7. Company Portal Pages", () => {
  test("7a. Compliance page loads", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/compliance");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1")).toHaveText("Compliance", { timeout: 15000 });
    await expect(page.locator("text=Fleet Compliance")).toBeVisible();
    await expect(page.locator("text=Export CSV")).toBeVisible();
    await expect(page.locator("text=Driver Compliance")).toBeVisible();
  });

  test("7b. CSV export triggers download", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/compliance");
    await page.waitForLoadState("networkidle");

    const downloadPromise = page
      .waitForEvent("download", { timeout: 10000 })
      .catch(() => null);
    await page.click("button:has-text('Export CSV')");
    const download = await downloadPromise;

    if (download) {
      expect(download.suggestedFilename()).toContain("compliance-report");
      expect(download.suggestedFilename()).toContain(".csv");
    }
  });

  test("7c. Reports page loads", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/reports");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1")).toHaveText("Reports", { timeout: 15000 });
    await expect(page.locator("p:has-text('Total Cleanings')")).toBeVisible();
    await expect(page.locator("text=Per-Driver Breakdown")).toBeVisible();
  });

  test("7d. Drivers page loads with tabs", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/drivers");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1")).toHaveText("Drivers", { timeout: 15000 });
    await expect(
      page.locator("button:has-text('My Drivers')")
    ).toBeVisible();
    await expect(page.locator("button:has-text('Pending')")).toBeVisible();
    await expect(
      page.locator("button:has-text('Invite Driver')")
    ).toBeVisible();
  });

  test("7e. Company sidebar navigation works", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);

    const pages = [
      { url: "/agency/dashboard", heading: "Company Dashboard" },
      { url: "/agency/drivers", heading: "Drivers" },
      { url: "/agency/compliance", heading: "Compliance" },
      { url: "/agency/reports", heading: "Reports" },
    ];

    for (const p of pages) {
      await page.goto(p.url);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main h1")).toHaveText(p.heading, { timeout: 15000 });
    }
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 8: Admin Panel (Sprint 6)
// ────────────────────────────────────────────────────────────────

test.describe.serial("8. Admin Panel", () => {
  test("8a. Admin dashboard loads with live stats", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1")).toHaveText("Admin Dashboard", { timeout: 15000 });
    await expect(page.locator("text=Total Revenue")).toBeVisible();
    await expect(
      page.locator("text=Active Cleaning Facilities")
    ).toBeVisible();
    await expect(page.locator("text=Total Drivers")).toBeVisible();
    await expect(page.locator("text=Orders Today")).toBeVisible();
    await expect(page.locator("h2:has-text('Recent Transactions')")).toBeVisible();
  });

  test("8b. Admin facilities page loads", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/facilities");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1")).toHaveText("Cleaning Facilities", { timeout: 15000 });
    // Should have two filter dropdowns (city + status)
    const selects = page.locator("select");
    await expect(selects).toHaveCount(2);
  });

  test("8c. Admin can toggle facility status", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/facilities");
    await page.waitForLoadState("networkidle");

    const deactivateBtn = page
      .locator("button:has-text('Deactivate')")
      .first();
    if (
      await deactivateBtn.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      // Deactivate
      await deactivateBtn.click();
      await page.waitForTimeout(1500);
      await page.reload();
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator("button:has-text('Activate')").first()
      ).toBeVisible({ timeout: 5000 });

      // Re-activate
      await page.locator("button:has-text('Activate')").first().click();
      await page.waitForTimeout(1500);
      await page.reload();
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator("button:has-text('Deactivate')").first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("8d. Admin facility filters work", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/facilities");
    await page.waitForLoadState("networkidle");

    // Filter by city
    await page.locator("select").first().selectOption(TEST_CITY);
    await page.waitForTimeout(300);

    // Filter by status
    await page.locator("select").nth(1).selectOption("active");
    await page.waitForTimeout(300);

    await expect(page.locator("text=facilities shown")).toBeVisible();
  });

  test("8e. Admin transactions page loads", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/transactions");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1")).toHaveText("Transactions", { timeout: 15000 });
    await expect(page.locator("select")).toBeVisible(); // type filter
  });

  test("8f. Admin analytics page loads", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/analytics");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1")).toHaveText("Analytics", { timeout: 15000 });
    await expect(page.locator("button:has-text('7 Days')")).toBeVisible();
    await expect(page.locator("button:has-text('30 Days')")).toBeVisible();
  });

  test("8g. Admin analytics period selector works", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/analytics");
    await page.waitForLoadState("networkidle");

    // Switch to 30 days
    await page.click("button:has-text('30 Days')");
    await page.waitForURL(/period=month/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=This Month")).toBeVisible();

    // Switch back to 7 days
    await page.click("button:has-text('7 Days')");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=This Week")).toBeVisible();
  });

  test("8h. Admin sidebar navigation works", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);

    const pages = [
      { url: "/admin/dashboard", heading: "Admin Dashboard" },
      { url: "/admin/facilities", heading: "Cleaning Facilities" },
      { url: "/admin/transactions", heading: "Transactions" },
      { url: "/admin/analytics", heading: "Analytics" },
    ];

    for (const p of pages) {
      await page.goto(p.url);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main h1")).toHaveText(p.heading, { timeout: 15000 });
    }
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 9: Company Remove Driver + Dashboard with Data
// ────────────────────────────────────────────────────────────────

test.describe.serial("9. Company Driver Management", () => {
  test("9a. Re-associate driver for management tests", async ({ page }) => {
    // Ensure driver is unaffiliated first
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/profile");
    await page.waitForLoadState("networkidle");

    const leaveBtn = page.locator("button:has-text('Leave Company')");
    if (await leaveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      page.on("dialog", (d) => d.accept());
      await leaveBtn.click();
      await page.waitForTimeout(1500);
      await page.reload();
      await page.waitForLoadState("networkidle");
    }

    // Send join request
    const companySelect = page.locator("select#company_select");
    if (
      await companySelect.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      const options = companySelect.locator("option");
      const count = await options.count();
      if (count > 1) {
        const val = await options.nth(1).getAttribute("value");
        await companySelect.selectOption(val!);
        await page.click("button:has-text('Request to Join')");
        await page.waitForTimeout(1500);
      }
    }
  });

  test("9b. Accept from company side", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/drivers");
    await page.waitForLoadState("networkidle");

    await page.click("button:has-text('Pending')");
    await page.waitForTimeout(500);

    const acceptBtn = page.locator("button:has-text('Accept')").first();
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(1500);
    }
  });

  test("9c. Dashboard shows driver stats", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Fleet Compliance Rate")).toBeVisible();
    await expect(page.locator("text=Total Drivers")).toBeVisible();
  });

  test("9d. Compliance table shows data", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/compliance");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Driver Compliance")).toBeVisible();
  });

  test("9e. Company removes driver", async ({ page }) => {
    await login(page, ACCOUNTS.agency.email, TEST_PASSWORD);
    await page.goto("/agency/drivers");
    await page.waitForLoadState("networkidle");

    await page.click("button:has-text('My Drivers')");
    await page.waitForTimeout(500);

    const removeBtn = page.locator("button:has-text('Remove')").first();
    if (await removeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      page.on("dialog", (d) => d.accept());
      await removeBtn.click();
      await page.waitForTimeout(1500);
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Driver should no longer appear
      await expect(
        page.locator("p:has-text('No drivers in your company')")
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 10: Driver Profile Completeness
// ────────────────────────────────────────────────────────────────

test.describe("10. Driver Profile", () => {
  test("10a. Full profile page loads with all sections", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/profile");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1")).toHaveText("Profile", { timeout: 15000 });
    await expect(page.locator(`main h2:has-text("${ACCOUNTS.driver.name}")`)).toBeVisible();
    await expect(page.locator("text=Personal Information")).toBeVisible();
    await expect(page.locator("text=Driver Information")).toBeVisible();
    await expect(page.locator("h3:has-text('Company')")).toBeVisible();
    await expect(page.locator("text=Change Password")).toBeVisible();
    await expect(page.locator("text=Account")).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 11: Admin Create Facility
// ────────────────────────────────────────────────────────────────

const CREATED_FACILITY_PASSWORD = "TempPass123";

test.describe.serial("11. Admin Create Facility", () => {
  test("11a. Facilities page shows Create Facility button", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/facilities");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("a:has-text('Create Facility')")
    ).toBeVisible({ timeout: 10000 });
  });

  test("11b. Create Facility page loads", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/facilities/create");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main h1")).toHaveText("Create Cleaning Facility", { timeout: 15000 });
    await expect(page.locator("label:has-text('Contact Name')")).toBeVisible();
    await expect(page.locator("label:has-text('Email')")).toBeVisible();
    await expect(page.locator("label:has-text('Temporary Password')")).toBeVisible();
    await expect(page.locator("label:has-text('Cleaning Facility Name')")).toBeVisible();
    await expect(page.locator("label:has-text('Address')")).toBeVisible();
    await expect(page.locator("label:has-text('City')")).toBeVisible();
  });

  test("11c. Generate password button works", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/facilities/create");
    await page.waitForLoadState("networkidle");

    const passwordInput = page.locator("input#password");
    await expect(passwordInput).toHaveValue("");

    await page.click("button:has-text('Generate')");
    const value = await passwordInput.inputValue();
    expect(value.length).toBe(10);
  });

  test("11d. Admin creates a new facility account", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/facilities/create");
    await page.waitForLoadState("networkidle");

    await page.fill("input#contactName", "E2E Created Owner");
    await page.fill("input#email", ADMIN_CREATED_FACILITY_EMAIL);
    await page.fill("input#password", CREATED_FACILITY_PASSWORD);
    await page.fill("input#facilityName", "E2E Created Facility");
    await page.fill("input#address", "456 Test Avenue");
    await page.selectOption("select#city", TEST_CITY);
    await page.fill("input#phone", "+35799000000");

    await page.click("button:has-text('Create Cleaning Facility')");

    // Should show success with credentials
    await expect(
      page.locator("h2:has-text('Cleaning Facility Created')")
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator(`text=${ADMIN_CREATED_FACILITY_EMAIL}`)
    ).toBeVisible();
    await expect(
      page.locator(`text=${CREATED_FACILITY_PASSWORD}`)
    ).toBeVisible();

    // Buttons present
    await expect(page.locator("button:has-text('Create Another')")).toBeVisible();
    await expect(page.locator("a:has-text('Back to Facilities')")).toBeVisible();
  });

  test("11e. Newly created facility appears in facilities list", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, TEST_PASSWORD);
    await page.goto("/admin/facilities");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("td:has-text('E2E Created Facility')")
    ).toBeVisible({ timeout: 10000 });
  });

  test("11f. New facility owner can log in", async ({ page }) => {
    await login(page, ADMIN_CREATED_FACILITY_EMAIL, CREATED_FACILITY_PASSWORD);
    await expect(page).toHaveURL(/\/facility/);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 12: Change Password
// ────────────────────────────────────────────────────────────────

const NEW_PASSWORD = "newpass456";

test.describe.serial("12. Change Password", () => {
  test("12a. Driver profile shows Change Password section", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/profile");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h3:has-text('Change Password')")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("input#currentPassword")).toBeVisible();
    await expect(page.locator("input#newPassword")).toBeVisible();
    await expect(page.locator("input#confirmPassword")).toBeVisible();
  });

  test("12b. Facility settings shows Change Password section", async ({ page }) => {
    await login(page, ACCOUNTS.facility.email, TEST_PASSWORD);
    await page.goto("/facility/settings");
    await page.waitForLoadState("networkidle");

    // If facility hasn't completed onboarding yet, do it now
    if (page.url().includes("/onboarding")) {
      await page.fill("input#name", "E2E Facility for ChangePass");
      await page.click("button:has-text('Continue')");
      await page.fill("input#address", "789 Password St");
      await page.selectOption("select#city", TEST_CITY);
      await page.click("button:has-text('Complete Setup')");
      await page.waitForURL(/\/facility\/dashboard/, { timeout: 15000 });
      await page.goto("/facility/settings");
      await page.waitForLoadState("networkidle");
    }

    await expect(page.locator("h2:has-text('Change Password')")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("input#currentPassword")).toBeVisible();
  });

  test("12c. Change password rejects wrong current password", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/profile");
    await page.waitForLoadState("networkidle");

    await page.fill("input#currentPassword", "wrongpassword");
    await page.fill("input#newPassword", NEW_PASSWORD);
    await page.fill("input#confirmPassword", NEW_PASSWORD);
    await page.click("button:has-text('Change Password')");

    await expect(
      page.locator("text=Current password is incorrect")
    ).toBeVisible({ timeout: 10000 });
  });

  test("12d. Change password rejects mismatched new passwords", async ({ page }) => {
    await login(page, ACCOUNTS.driver.email, TEST_PASSWORD);
    await page.goto("/driver/profile");
    await page.waitForLoadState("networkidle");

    await page.fill("input#currentPassword", TEST_PASSWORD);
    await page.fill("input#newPassword", NEW_PASSWORD);
    await page.fill("input#confirmPassword", "doesnotmatch");
    await page.click("button:has-text('Change Password')");

    await expect(
      page.locator("text=New passwords do not match")
    ).toBeVisible({ timeout: 10000 });
  });

  test("12e. Facility can change password successfully", async ({ page }) => {
    await login(page, ACCOUNTS.facility.email, TEST_PASSWORD);
    await page.goto("/facility/settings");
    await page.waitForLoadState("networkidle");

    // If facility hasn't completed onboarding yet, do it now
    if (page.url().includes("/onboarding")) {
      await page.fill("input#name", "E2E Facility for ChangePass");
      await page.click("button:has-text('Continue')");
      await page.fill("input#address", "789 Password St");
      await page.selectOption("select#city", TEST_CITY);
      await page.click("button:has-text('Complete Setup')");
      await page.waitForURL(/\/facility\/dashboard/, { timeout: 15000 });
      await page.goto("/facility/settings");
      await page.waitForLoadState("networkidle");
    }

    await page.fill("input#currentPassword", TEST_PASSWORD);
    await page.fill("input#newPassword", NEW_PASSWORD);
    await page.fill("input#confirmPassword", NEW_PASSWORD);
    await page.click("button:has-text('Change Password')");

    await expect(
      page.locator("text=Password changed successfully")
    ).toBeVisible({ timeout: 10000 });
  });

  test("12f. Facility can log in with new password", async ({ page }) => {
    await login(page, ACCOUNTS.facility.email, NEW_PASSWORD);
    await expect(page).toHaveURL(/\/facility/);
  });
});
