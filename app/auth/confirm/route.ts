import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

// Validate redirect path to prevent open redirect vulnerability
function isValidRedirectPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  if (path.includes("\\")) return false;
  return true;
}

// This route handles email confirmation links from Supabase
// These links include a token_hash and type parameter
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "recovery"
    | "invite"
    | "magiclink"
    | "email"
    | null;
  const rawNext = searchParams.get("next") ?? "/";
  const next = isValidRedirectPath(rawNext) ? rawNext : "/";

  if (!token_hash || !type) {
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", "missing_token");
    redirectUrl.searchParams.set("error_description", "Invalid confirmation link");
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

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type,
  });

  if (error) {
    console.error("Email confirmation error:", error.message);

    if (type === "recovery") {
      const redirectUrl = new URL("/reset-password", origin);
      redirectUrl.searchParams.set("error", "invalid_token");
      redirectUrl.searchParams.set("error_description", error.message);
      return NextResponse.redirect(redirectUrl);
    }

    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", "confirmation_failed");
    redirectUrl.searchParams.set("error_description", error.message);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle based on confirmation type
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // For signup, invite, magiclink - check if user needs onboarding
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
