"use client";

import type { AppPage } from "@/types/navigation";
import type { UserRole } from "@/types/role";
import { ROLE_META } from "@/types/role";
import { AnnouncementSection } from "@/components/home/AnnouncementSection";
import { ApprovalStatusCard, ApprovalStatusDonut } from "@/components/home/ApprovalStatusCard";
import { DraftStatusCard } from "@/components/home/DraftStatusCard";
import { LeaveCard } from "@/components/home/LeaveCard";
import { TodayTasksCard } from "@/components/home/TodayTasksCard";

export type HomeViewProps = {
  editName: string;
  role: UserRole;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
};

export function HomeView({ editName, role = "staff", onNavigate }: HomeViewProps) {
  const goApproval = () => onNavigate("approvalList");
  const goCalendar = () => onNavigate("schedule");

  return (
    <div className="px-5 py-5">
      {/* 인사 */}
      <div className="mb-4 flex items-baseline gap-2">
        <h1 className="text-[1.375rem] font-bold text-zinc-900">
          반갑습니다, {editName}님
        </h1>
        <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[0.6875rem] font-bold text-[#3b5bdb]">
          {ROLE_META[role]?.short ?? "직원"}
        </span>
      </div>

      {/* 공지 */}
      <AnnouncementSection scope="company" />
      <AnnouncementSection scope="dept" />

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