import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check: any Supabase auth token cookie = authenticated.
  // Actual session validation is handled by AuthContext + Supabase RLS.
  const isLoggedIn = request.cookies
    .getAll()
    .some((c) => c.name.endsWith("-auth-token") && c.value.length > 0);

  // /ios/* 는 localStorage 기반 클라이언트 자체 인증(쿠키 없음)을 사용하므로
  // 쿠키 기반 proxy 게이트를 우회한다. (Android 경로는 영향 없음)
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/ios") ||
    pathname.startsWith("/api/auth/");

  if (!isLoggedIn && !isPublic) {
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
