"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ApprovalTabIcon } from "@/components/icons/ApprovalTabIcon";
import { HomeTabIcon } from "@/components/icons/HomeTabIcon";
import { ROUTES } from "@/lib/routes";

export type AppBottomNavProps = {
  pendingApprovalCount?: number;
};

export function AppBottomNav({ pendingApprovalCount = 7 }: AppBottomNavProps) {
  const pathname = usePathname();

  const homeActive = pathname === ROUTES.home;
  const approvalActive =
    pathname === ROUTES.approval || pathname.startsWith(`${ROUTES.approval}/`);
  const calendarActive = pathname === ROUTES.calendar || pathname.startsWith(`${ROUTES.calendar}/`);
  const mypageActive = pathname === ROUTES.mypage || pathname.startsWith(`${ROUTES.mypage}/`);

  const homeStroke = homeActive ? "#3b5bdb" : "#999";
  const approvalStroke = approvalActive ? "#3b5bdb" : "#999";
  const scheduleStroke = calendarActive ? "#3b5bdb" : "#999";
  const myStroke = mypageActive ? "#3b5bdb" : "#999";

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-[100] w-full max-w-[430px] -translate-x-1/2 border-t border-black/[0.06] bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)] px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
      aria-label="하단 탭"
    >
      <div className="flex items-center justify-around">
        <Link
          href={ROUTES.home}
          className="flex flex-col items-center gap-1 rounded-lg bg-transparent p-2 active:opacity-70"
          prefetch
        >
          <span className="inline-flex shrink-0 items-center justify-center">
            <HomeTabIcon stroke={homeStroke} />
          </span>
          <span
            className={`text-[0.6875rem] ${homeActive ? "font-bold text-[#3b5bdb]" : "font-semibold text-[#999]"}`}
          >
            홈
          </span>
        </Link>

        <Link
          href={ROUTES.approval}
          className="flex flex-col items-center gap-1 rounded-lg bg-transparent p-2 active:opacity-70"
          prefetch
        >
          <div className="relative">
            <ApprovalTabIcon stroke={approvalStroke} />
            <div className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[0.625rem] font-bold text-white">
              {pendingApprovalCount}
            </div>
          </div>
          <span
            className={`text-[0.6875rem] ${approvalActive ? "font-bold text-[#3b5bdb]" : "font-semibold text-[#999]"}`}
          >
            결재
          </span>
        </Link>

        <Link
          href={ROUTES.calendar}
          className="flex flex-col items-center gap-1 rounded-lg bg-transparent p-2 active:opacity-70"
          prefetch
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={scheduleStroke}
            strokeWidth={calendarActive ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3V7" />
            <path d="M8 3V7" />
            <path d="M3 11H21" />
            <circle cx="8" cy="15" r="1" fill={calendarActive ? "#3b5bdb" : "#999"} />
            <circle cx="12" cy="15" r="1" fill={calendarActive ? "#3b5bdb" : "#999"} />
            <circle cx="16" cy="15" r="1" fill={calendarActive ? "#3b5bdb" : "#999"} />
          </svg>
          <span
            className={`text-[0.6875rem] ${calendarActive ? "font-bold text-[#3b5bdb]" : "font-semibold text-[#999]"}`}
          >
            일정
          </span>
        </Link>

        <Link
          href={ROUTES.mypage}
          className="flex flex-col items-center gap-1 rounded-lg bg-transparent p-2 active:opacity-70"
          prefetch
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={myStroke}
            strokeWidth={mypageActive ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <span
            className={`text-[0.6875rem] ${mypageActive ? "font-bold text-[#3b5bdb]" : "font-semibold text-[#999]"}`}
          >
            내 정보
          </span>
        </Link>
      </div>
    </nav>
  );
}
