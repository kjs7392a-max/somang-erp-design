import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_PROJECT_REF = "bnlybtvdqyfxmbrcvcnv";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith(`sb-${SUPABASE_PROJECT_REF}-auth-token`)
  );

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)",
  ],
};
