import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if this is a new user (needs onboarding)
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if user exists in users table (has completed onboarding)
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("id, workspace_id")
          .eq("id", user.id)
          .single();

        // If user doesn't exist in users table or has no workspace, they need onboarding
        if (profileError || !profile || !profile.workspace_id) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // User exists and has workspace, go to dashboard or requested page
        return NextResponse.redirect(`${origin}${next}`);
      }

      // No user but no error - go to onboarding
      return NextResponse.redirect(`${origin}/onboarding`);
    } else {
      console.error("Auth callback error:", error.message);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
