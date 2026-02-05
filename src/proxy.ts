import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Routes that require authentication
const protectedRoutes = ["/driver", "/facility", "/agency", "/admin"];

// Routes that are only accessible when NOT authenticated
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Check if accessing protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if accessing auth routes
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If not authenticated and trying to access protected route
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated and trying to access auth routes
  if (isAuthRoute && user) {
    // Get user's role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const rolePathMap: Record<string, string> = {
      driver: "/driver/dashboard",
      facility: "/facility/dashboard",
      agency: "/agency/dashboard",
      admin: "/admin/dashboard",
    };

    const redirectPath = profile?.role
      ? rolePathMap[profile.role]
      : "/driver/dashboard";

    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Role-based access control for protected routes
  if (isProtectedRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) {
      const rolePathMap: Record<string, string> = {
        driver: "/driver",
        facility: "/facility",
        agency: "/agency",
        admin: "/admin",
      };

      const allowedPath = rolePathMap[profile.role];

      // Admin can access any route
      if (profile.role === "admin") {
        return supabaseResponse;
      }

      // Check if user is accessing their allowed routes
      if (allowedPath && !pathname.startsWith(allowedPath)) {
        return NextResponse.redirect(
          new URL(`${allowedPath}/dashboard`, request.url)
        );
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
