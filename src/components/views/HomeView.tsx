"use client";

import type { AppPage } from "@/types/navigation";
import type { UserRole } from "@/types/role";
import { AnnouncementSection } from "@/components/home/AnnouncementSection";
import { ApprovalStatusCard, ApprovalStatusDonut } from "@/components/home/ApprovalStatusCard";
import { DraftStatusCard } from "@/components/home/DraftStatusCard";
import { LeaveCard } from "@/components/home/LeaveCard";
import { TodayTasksCard } from "@/components/home/TodayTasksCard";
import { MealMenuCard } from "@/components/home/MealMenuCard";
import { useT } from "@/context/LangContext";

export type HomeViewProps = {
  editName: string;
  position?: string;
  department?: string;
  role: UserRole;
  userId: string;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
};

export function HomeView({ editName, position, department, role = "staff", userId, onNavigate }: HomeViewProps) {
  const goApproval = () => onNavigate("approvalList");
  const goCalendar = () => onNavigate("schedule");
  const t = useT();

  return (
    <div className="px-5 py-5">
      {/* 인사 */}
      <div className="mb-4">
        <h1 className="text-[1.375rem] font-bold text-zinc-900">
          {t("home_greeting").replace("{name}", (() => {
            const displayPosition =
              department === "간호과" && position === "사원" ? "간호사" : position;
            return displayPosition ? `${editName} ${displayPosition}` : editName;
          })())}
        </h1>
      </div>

      {/* 공지 */}
      <AnnouncementSection scope="company" />
      {role !== "exec" && <AnnouncementSection scope="dept" />}
      {role !== "exec" && department === "간호과" && (
        <AnnouncementSection scope="ward" />
      )}

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