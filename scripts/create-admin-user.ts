/**
 * Script to create an admin user directly in Supabase
 *
 * Usage:
 *   npx tsx scripts/create-admin-user.ts <email> <password>
 *
 * Example:
 *   npx tsx scripts/create-admin-user.ts admin@company.com MySecurePass123
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
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  process.exit(1);
}

// Service role client bypasses RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  const email = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || "Admin User";

  if (!email || !password) {
    console.error("\nUsage: npx tsx scripts/create-admin-user.ts <email> <password> [fullName]");
    console.error("\nExample:");
    console.error("  npx tsx scripts/create-admin-user.ts admin@company.com MySecurePass123");
    console.error("  npx tsx scripts/create-admin-user.ts admin@company.com MySecurePass123 \"John Doe\"");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  console.log(`\nCreating user: ${email}...`);

  // Create user with admin API (auto-confirmed)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm the email
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error) {
    console.error("\nError creating user:", error.message);

    if (error.message.includes("already been registered")) {
      console.log("\nTip: If you want to confirm an existing user, use:");
      console.log("  npx tsx scripts/confirm-user.ts <email>");
    }
    process.exit(1);
  }

  console.log("\n✓ User created successfully!");
  console.log("  User ID:", data.user.id);
  console.log("  Email:", data.user.email);
  console.log("  Confirmed:", data.user.email_confirmed_at ? "Yes" : "No");
  console.log("\n→ Login at http://localhost:3000/login");
}

createAdminUser().catch(console.error);
