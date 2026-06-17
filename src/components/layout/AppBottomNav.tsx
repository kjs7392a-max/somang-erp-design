"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileEdit, Calendar, User, UtensilsCrossed } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useUserRole } from "@/lib/role";
import { useMyDraftsBadge } from "@/hooks/useMyDraftsBadge";
import { useT } from "@/context/LangContext";

export type AppBottomNavProps = {
  pendingApprovalCount?: number;
};

export function AppBottomNav({ pendingApprovalCount = 7 }: AppBottomNavProps) {
  const pathname = usePathname();
  const { role } = useUserRole();
  const draftBadgeCount = useMyDraftsBadge();
  const t = useT();

  const BASE_TABS = [
    { href: ROUTES.draft,    label: t("nav_draft"),    Icon: FileEdit,        matchPrefix: ROUTES.draft,     extraMatch: "" },
    { href: ROUTES.meal,     label: t("nav_meal"),     Icon: UtensilsCrossed, matchPrefix: ROUTES.meal,      extraMatch: "" },
    { href: ROUTES.calendar, label: t("nav_calendar"), Icon: Calendar,        matchPrefix: ROUTES.calendar,  extraMatch: "" },
    { href: ROUTES.mypage,   label: t("nav_mypage"),   Icon: User,            matchPrefix: ROUTES.mypage,    extraMatch: "" },
  ];

  // staff: 기안 탭 → 내 기안함(진행 현황)
  // manager/exec: 기안 탭 → "기안·결재", /approval에서도 활성
  const TABS = BASE_TABS.map((tab) => {
    if (tab.href !== ROUTES.draft) return tab;
    if (role === "staff")
      return { ...tab, href: ROUTES.approval, matchPrefix: ROUTES.approval, extraMatch: "" };
    if (role === "manager")
      return { ...tab, label: t("nav_draft_approval"), extraMatch: ROUTES.approval };
    if (role === "exec")
      return { ...tab, href: ROUTES.approval, label: t("nav_approval"), matchPrefix: ROUTES.approval, extraMatch: "" };
    return tab;
  });

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-[100] w-full max-w-[430px] -translate-x-1/2 border-t border-black/[0.06] bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      aria-label="하단 탭"
    >
      <div className="flex items-start justify-around">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.matchPrefix ? pathname.startsWith(`${tab.matchPrefix}/`) : false) ||
            (tab.extraMatch ? pathname === tab.extraMatch || pathname.startsWith(`${tab.extraMatch}/`) : false);

          const isDraftTab = tab.href === ROUTES.draft || tab.href === ROUTES.approval;
          const showBadge = isDraftTab && draftBadgeCount > 0 && role === "staff";
          const color = active ? "#3b5bdb" : "#9ca3af";

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch
              className="relative flex min-w-[56px] flex-col items-center gap-1 rounded-lg p-1.5 active:opacity-70"
            >
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
                    {draftBadgeCount}
                  </span>
                )}
              </span>

              <span className="text-[0.75rem] font-semibold" style={{ color }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
