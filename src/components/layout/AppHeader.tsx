"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut, Home, ChevronLeft } from "lucide-react";
import { ROUTES } from "@/lib/routes";

type HeaderMode = "home" | "tab" | "detail";

export type AppHeaderProps = {
  title?: string;
  /** home: 로그아웃/설정 | tab: 홈으로/타이틀 | detail: 뒤로/타이틀 */
  mode?: HeaderMode;
};

export default function AppHeader({ title, mode }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 자동 모드 감지 — 명시적으로 주어지지 않은 경우
  const resolvedMode: HeaderMode =
    mode ??
    (pathname === ROUTES.home
      ? "home"
      : [ROUTES.approval, ROUTES.calendar, ROUTES.mypage, ROUTES.draft].includes(
            pathname as (typeof ROUTES)[keyof typeof ROUTES],
          )
        ? "tab"
        : "detail");

  const handleLogout = () => {
    // TODO: 실제 세션 정리 로직 연결
    router.replace(ROUTES.login);
  };

  const handleGoHome = () => router.push(ROUTES.home);
  const handleBack = () => router.back();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-3">
      {/* 왼쪽 */}
      <div className="flex min-w-[44px] items-center">
        {resolvedMode === "home" && (
          <button
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100"
            aria-label="로그아웃"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        {resolvedMode === "tab" && (
          <button
            onClick={handleGoHome}
            className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-700 active:bg-zinc-100"
            aria-label="홈으로"
          >
            <Home className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        {resolvedMode === "detail" && (
          <button
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-700 active:bg-zinc-100"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* 가운데 */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-[0.9375rem] font-semibold text-zinc-900">
        {title ?? ""}
      </h1>

     {/* 오른쪽 — 비어있음 (우측 자리 맞추기용) */}
      <div className="min-w-[44px]" />
    </header>
  );
}