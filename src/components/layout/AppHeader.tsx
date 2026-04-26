"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Home, ChevronLeft, Bell } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { NotifList } from "@/components/notifications/NotifList";

type HeaderMode = "home" | "tab" | "detail";

export type AppHeaderProps = {
  title?: string;
  mode?: HeaderMode;
};

export default function AppHeader({ title, mode }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const { signOut } = useAuth();
  const { unreadCount } = useNotifications();

  const resolvedMode: HeaderMode =
    mode ??
    (pathname === ROUTES.home
      ? "home"
      : ([ROUTES.approval, ROUTES.calendar, ROUTES.mypage, ROUTES.draft] as string[]).includes(
            pathname,
          )
        ? "tab"
        : "detail");

  const handleLogout = () => signOut();
  const handleGoHome = () => router.push(ROUTES.home);
  const handleBack   = () => router.back();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-3">
        {/* 왼쪽 */}
        <div className="flex min-w-[44px] items-center">
          {resolvedMode === "home" && (
            <button onClick={handleLogout} className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100" aria-label="로그아웃">
              <LogOut className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
          {resolvedMode === "tab" && (
            <button onClick={handleGoHome} className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-700 active:bg-zinc-100" aria-label="홈으로">
              <Home className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
          {resolvedMode === "detail" && (
            <button onClick={handleBack} className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-700 active:bg-zinc-100" aria-label="뒤로가기">
              <ChevronLeft className="h-6 w-6" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* 가운데 */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[0.9375rem] font-semibold text-zinc-900">
          {title ?? ""}
        </h1>

        {/* 오른쪽 — 벨 아이콘 */}
        <div className="min-w-[44px] flex justify-end">
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100"
            aria-label="알림"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[0.5625rem] font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {notifOpen && <NotifList onClose={() => setNotifOpen(false)} />}
    </>
  );
}
