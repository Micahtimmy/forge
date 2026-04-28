import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // User is logged in - check if they need onboarding
    const { data: profile } = await supabase
      .from("users")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      redirect("/onboarding");
    }

    // User has completed setup - this shouldn't happen as (app) layout handles it
    // But just in case, redirect to the app dashboard
    redirect("/quality-gate");
  }

  // Not logged in - redirect to signup
  redirect("/signup");
}
