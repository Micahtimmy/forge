/**
 * Script to list all users in Supabase Auth
 *
 * Usage:
 *   npx tsx scripts/list-users.ts
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

async function listUsers() {
  console.log("\nFetching users from Supabase...\n");

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Error listing users:", error.message);
    process.exit(1);
  }

  if (data.users.length === 0) {
    console.log("No users found.");
    return;
  }

  console.log(`Found ${data.users.length} user(s):\n`);
  console.log("─".repeat(80));

  data.users.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.email}`);
    console.log(`   ID:        ${user.id}`);
    console.log(`   Confirmed: ${user.email_confirmed_at ? "✓ Yes" : "✗ No"}`);
    console.log(`   Created:   ${user.created_at}`);
    console.log(`   Provider:  ${user.app_metadata?.provider || "email"}`);
    if (user.user_metadata?.full_name) {
      console.log(`   Name:      ${user.user_metadata.full_name}`);
    }
  });

  console.log("\n" + "─".repeat(80));

  const unconfirmed = data.users.filter((u) => !u.email_confirmed_at);
  if (unconfirmed.length > 0) {
    console.log(`\n⚠ ${unconfirmed.length} user(s) awaiting email confirmation:`);
    unconfirmed.forEach((u) => console.log(`   - ${u.email}`));
    console.log("\nTo confirm a user, run:");
    console.log("  npx tsx scripts/confirm-user.ts <email>");
  }
}

listUsers().catch(console.error);
