import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/signup", "/forgot-password", "/reset-password", "/invite", "/demo"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Root path "/" should redirect to login if not authenticated (handled below)

  // Auth callback routes - these handle OAuth and email verification
  const isAuthCallbackRoute = pathname.startsWith("/auth/callback") || pathname.startsWith("/auth/confirm");

  // API routes that don't require authentication
  const publicApiRoutes = ["/api/auth", "/api/webhooks"];
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

  // Onboarding route (requires auth but no onboarding check)
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  // Allow auth callback routes (they handle their own logic)
  if (isAuthCallbackRoute) {
    return supabaseResponse;
  }

  // Allow public routes and API routes
  if (isPublicRoute || isPublicApiRoute) {
    // If user is logged in and tries to access auth pages (not demo), redirect to dashboard
    const isAuthPage = ["/login", "/signup", "/forgot-password", "/reset-password"].some(
      (route) => pathname.startsWith(route)
    );
    if (user && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Redirect to signup/login if not authenticated
  if (!user) {
    const url = request.nextUrl.clone();
    // Root path and onboarding go to signup (new users need to auth first)
    if (pathname === "/" || pathname.startsWith("/onboarding")) {
      url.pathname = "/signup";
    } else {
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  // Allow onboarding route for authenticated users
  if (isOnboardingRoute) {
    // User is authenticated, let them proceed to onboarding
    return supabaseResponse;
  }

  // Check if user needs onboarding (skip for API routes)
  if (!pathname.startsWith("/api")) {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, workspace_id")
      .eq("id", user.id)
      .single();

    // If we got an RLS error (not a "not found" error), allow access
    // This prevents redirect loops when RLS policies aren't fully propagated
    const isRLSError = profileError && profileError.code !== "PGRST116";

    // Redirect to onboarding if user doesn't exist in users table or has no workspace
    // But only if it's a genuine "not found" case, not an RLS permission error
    if (!isRLSError && (profileError || !profile || !profile.workspace_id)) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
