import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

function isValidRedirectPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  if (path.includes("\\")) return false;
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Different auth flows use different parameters
  const code = searchParams.get("code"); // OAuth flow
  const token_hash = searchParams.get("token_hash"); // Email verification / magic link
  const type = searchParams.get("type"); // signup, recovery, magiclink, invite
  const rawNext = searchParams.get("next") ?? "/";
  const next = isValidRedirectPath(rawNext) ? rawNext : "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("errorDescription");

  // Handle error from Supabase
  if (error) {
    console.error("Auth callback error from Supabase:", error, errorDescription);
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(redirectUrl);
  }

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

  // Handle email verification / magic link / password recovery (token_hash flow)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "recovery" | "magiclink" | "invite" | "email",
    });

    if (verifyError) {
      console.error("OTP verification error:", verifyError.message);

      // For password recovery, redirect to reset page with error
      if (type === "recovery") {
        const redirectUrl = new URL("/reset-password", origin);
        redirectUrl.searchParams.set("error", "verification_failed");
        redirectUrl.searchParams.set("errorDescription", verifyError.message);
        return NextResponse.redirect(redirectUrl);
      }

      // For other types, redirect to login with error
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("error", "verification_failed");
      redirectUrl.searchParams.set("errorDescription", verifyError.message);
      return NextResponse.redirect(redirectUrl);
    }

    // Successfully verified
    if (type === "recovery") {
      // Password reset - redirect to reset password page
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    if (type === "signup" || type === "magiclink" || type === "invite") {
      // Email verified - check if user needs onboarding
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("id, workspace_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile || !profile.workspace_id) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        return NextResponse.redirect(`${origin}${next}`);
      }

      return NextResponse.redirect(`${origin}/onboarding`);
    }

    // Default redirect after verification
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Handle OAuth callback (code flow)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("OAuth code exchange error:", exchangeError.message);
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("error", "auth_callback_error");
      redirectUrl.searchParams.set("errorDescription", exchangeError.message);
      return NextResponse.redirect(redirectUrl);
    }

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
  }

  // No code or token_hash - return to login with error
  console.error("Auth callback called without code or token_hash");
  return NextResponse.redirect(`${origin}/login?error=missing_auth_params`);
}
