import { supabaseAdmin, ACCOUNTS, ADMIN_CREATED_FACILITY_EMAIL } from "./helpers";

export default async function globalTeardown() {
  console.log("\n=== Global Teardown: Cleaning up test accounts ===");
  const { data } = await supabaseAdmin.auth.admin.listUsers();

  // Delete standard test accounts
  for (const acct of Object.values(ACCOUNTS)) {
    const user = data?.users.find((u) => u.email === acct.email);
    if (user) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      console.log(`  Deleted ${acct.email}`);
    }
  }

  // Delete admin-created facility account (from E2E create facility test)
  const createdFacility = data?.users.find(
    (u) => u.email === ADMIN_CREATED_FACILITY_EMAIL
  );
  if (createdFacility) {
    await supabaseAdmin.auth.admin.deleteUser(createdFacility.id);
    console.log(`  Deleted ${ADMIN_CREATED_FACILITY_EMAIL}`);
  }

  console.log("=== Cleanup complete ===\n");
}
