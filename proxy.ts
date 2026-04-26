import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check: any Supabase auth token cookie = authenticated.
  // Actual session validation is handled by AuthContext + Supabase RLS.
  const isLoggedIn = request.cookies
    .getAll()
    .some((c) => c.name.endsWith("-auth-token") && c.value.length > 0);

  if (!isLoggedIn && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/home", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|logo\\.svg).*)"],
};
