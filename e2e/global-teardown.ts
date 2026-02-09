import { supabaseAdmin, ACCOUNTS } from "./helpers";

export default async function globalTeardown() {
  console.log("\n=== Global Teardown: Cleaning up test accounts ===");
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  for (const acct of Object.values(ACCOUNTS)) {
    const user = data?.users.find((u) => u.email === acct.email);
    if (user) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      console.log(`  Deleted ${acct.email}`);
    }
  }
  console.log("=== Cleanup complete ===\n");
}
