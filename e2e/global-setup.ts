import { createTestUser, ACCOUNTS } from "./helpers";

export default async function globalSetup() {
  console.log("\n=== Global Setup: Creating test accounts ===");
  for (const [key, acct] of Object.entries(ACCOUNTS)) {
    const userId = await createTestUser(acct.email, acct.name, acct.role);
    console.log(`  Created ${key}: ${acct.email} (${userId})`);
  }
  console.log("=== Test accounts ready ===\n");
}
