/**
 * Script to manually confirm an existing user's email
 *
 * Usage:
 *   npx tsx scripts/confirm-user.ts <email>
 *
 * Example:
 *   npx tsx scripts/confirm-user.ts user@company.com
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function confirmUser() {
  const email = process.argv[2];

  if (!email) {
    console.error("\nUsage: npx tsx scripts/confirm-user.ts <email>");
    console.error("\nExample:");
    console.error("  npx tsx scripts/confirm-user.ts user@company.com");
    process.exit(1);
  }

  console.log(`\nLooking up user: ${email}...`);

  // List users to find by email
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  const user = listData.users.find((u) => u.email === email);

  if (!user) {
    console.error(`\nUser not found: ${email}`);
    console.log("\nRegistered users:");
    listData.users.forEach((u) => {
      console.log(`  - ${u.email} (confirmed: ${u.email_confirmed_at ? "Yes" : "No"})`);
    });
    process.exit(1);
  }

  if (user.email_confirmed_at) {
    console.log(`\n✓ User ${email} is already confirmed!`);
    console.log("  Confirmed at:", user.email_confirmed_at);
    console.log("\n→ They can login at http://localhost:3000/login");
    return;
  }

  console.log(`Confirming user: ${email}...`);

  // Update user to confirm email
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });

  if (error) {
    console.error("\nError confirming user:", error.message);
    process.exit(1);
  }

  console.log("\n✓ User confirmed successfully!");
  console.log("  User ID:", data.user.id);
  console.log("  Email:", data.user.email);
  console.log("\n→ They can now login at http://localhost:3000/login");
}

confirmUser().catch(console.error);
