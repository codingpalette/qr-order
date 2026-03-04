import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/shared/api/supabase/middleware";

// Routes that require authentication
const protectedPrefixes = ["/admin"];

export async function proxy(request: NextRequest) {
  // Refresh session first
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Check if user is authenticated by looking for Supabase auth cookies
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // Unauthenticated user trying to access protected route
  if (isProtected && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
