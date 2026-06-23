import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 구버전에서 쓰던 /ios/* 라우트는 제거됨. PWA/북마크에 옛 주소가
  // 남아 404 나는 것을 막기 위해 /login 으로 보낸다. (그 외는 통과)
  // 주의: "/ios/" 로 한정 — /ios-check.js 같은 정적 파일을 잡지 않도록.
  if (pathname.startsWith("/ios/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)",
  ],
};
