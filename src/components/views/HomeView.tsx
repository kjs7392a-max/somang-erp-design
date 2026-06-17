"use client";

import type { AppPage } from "@/types/navigation";
import type { UserRole } from "@/types/role";
import { ROLE_META } from "@/types/role";
import { AnnouncementSection } from "@/components/home/AnnouncementSection";
import { ApprovalStatusCard, ApprovalStatusDonut } from "@/components/home/ApprovalStatusCard";
import { DraftStatusCard } from "@/components/home/DraftStatusCard";
import { LeaveCard } from "@/components/home/LeaveCard";
import { TodayTasksCard } from "@/components/home/TodayTasksCard";
import { useNotifications } from "@/context/NotificationsContext";
import { MealMenuCard } from "@/components/home/MealMenuCard";
import { useT } from "@/context/LangContext";

export type HomeViewProps = {
  editName: string;
  role: UserRole;
  userId: string;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
};

export function HomeView({ editName, role = "staff", userId, onNavigate }: HomeViewProps) {
  const goApproval = () => onNavigate("approvalList");
  const goCalendar = () => onNavigate("schedule");
  const { push } = useNotifications();
  const t = useT();

  return (
    <div className="px-5 py-5">
      {/* 인사 */}
      <div className="mb-4 flex items-baseline gap-2">
        <h1 className="text-[1.375rem] font-bold text-zinc-900">
          {t("home_greeting").replace("{name}", editName)}
        </h1>
        <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[0.6875rem] font-bold text-[#3b5bdb]">
          {ROLE_META[role]?.short ?? "직원"}
        </span>
      </div>

      {/* 알림 토스트 데모 */}
      <button
        type="button"
        onClick={() => push({
          kind: "approval",
          title: "이재훈 — 연차 신청서",
          body: "결재가 도착했어요. 4/22~4/24 (3일)",
          deeplink: { type: "approval", docId: "D-0421-01" },
        })}
        className="mb-4 w-full rounded-xl bg-[#2d5c6e] py-2 text-sm font-semibold text-white"
      >
        [테스트] 알림 토스트 발송
      </button>

      {/* 공지 */}
      <AnnouncementSection scope="company" />
      {role !== "exec" && <AnnouncementSection scope="dept" />}

      {/* 식사 예약 */}
      <MealMenuCard userId={userId} />

      {/* 역할별 분기 */}
      {role === "staff" && (
        <>
          <DraftStatusCard />
          <LeaveCard />
          <TodayTasksCard onGoCalendar={goCalendar} />
        </>
      )}

      {role === "manager" && (
        <>
          <ApprovalStatusCard onGoList={goApproval} />
          <DraftStatusCard />
          <LeaveCard />
          <TodayTasksCard onGoCalendar={goCalendar} />
        </>
      )}

      {role === "exec" && (
        <>
          <ApprovalStatusDonut onGoList={goApproval} />
          <TodayTasksCard onGoCalendar={goCalendar} />
        </>
      )}
    </div>
  );
}