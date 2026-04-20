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
    // If user is logged in and tries to access auth pages, redirect to dashboard
    if (user && isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Redirect to login if not authenticated
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Allow onboarding route for authenticated users
  if (isOnboardingRoute) {
    return supabaseResponse;
  }

  // Check if user needs onboarding (skip for API routes)
  if (!pathname.startsWith("/api")) {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, workspace_id")
      .eq("id", user.id)
      .single();

    // Redirect to onboarding if user doesn't exist in users table or has no workspace
    if (profileError || !profile || !profile.workspace_id) {
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
