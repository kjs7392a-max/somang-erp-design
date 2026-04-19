"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileEdit, ClipboardCheck, Calendar, User } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export type AppBottomNavProps = {
  pendingApprovalCount?: number;
};

type Tab = {
  href: string;
  label: string;
  Icon: typeof FileEdit;
  matchPrefix?: string;
};

const TABS: Tab[] = [
  { href: ROUTES.draft, label: "기안", Icon: FileEdit, matchPrefix: ROUTES.draft },
  { href: ROUTES.approval, label: "결재", Icon: ClipboardCheck, matchPrefix: ROUTES.approval },
  { href: ROUTES.calendar, label: "일정", Icon: Calendar, matchPrefix: ROUTES.calendar },
  { href: ROUTES.mypage, label: "내 정보", Icon: User, matchPrefix: ROUTES.mypage },
];

export function AppBottomNav({ pendingApprovalCount = 7 }: AppBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-[100] w-full max-w-[430px] -translate-x-1/2 border-t border-black/[0.06] bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      aria-label="하단 탭"
    >
      <div className="flex items-start justify-around">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.matchPrefix ? pathname.startsWith(`${tab.matchPrefix}/`) : false);

          const showBadge = tab.href === ROUTES.approval && pendingApprovalCount > 0;
          const color = active ? "#3b5bdb" : "#9ca3af";

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch
              className="relative flex min-w-[56px] flex-col items-center gap-1 rounded-lg p-1.5 active:opacity-70"
            >
              {/* 활성 인디케이터 바 */}
              {active && (
                <span className="absolute top-0 h-[3px] w-8 rounded-full bg-[#3b5bdb]" />
              )}

              <span className="relative mt-1.5 inline-flex items-center justify-center">
                <tab.Icon
                  className="h-6 w-6"
                  strokeWidth={active ? 2.4 : 1.8}
                  color={color}
                />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[0.625rem] font-bold text-white">
                    {pendingApprovalCount}
                  </span>
                )}
              </span>

              <span
                className="text-[0.75rem] font-semibold"
                style={{ color }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}