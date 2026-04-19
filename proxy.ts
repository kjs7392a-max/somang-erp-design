import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = request.cookies.get("somang_auth")?.value === "1";

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