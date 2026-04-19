"use client";

import { useRouter } from "next/navigation";
import { HomeView } from "@/components/views/HomeView";
import { useUserRole } from "@/lib/role";
import { ROUTES } from "@/lib/routes";
import type { AppPage } from "@/types/navigation";

const NAV: Record<AppPage, string> = {
  home: ROUTES.home,
  approvalList: ROUTES.approval,
  approval: ROUTES.approval,
  schedule: ROUTES.calendar,
  myInfo: ROUTES.mypage,
  draft: ROUTES.draft,
};

export default function HomePage() {
  const router = useRouter();
  const { role } = useUserRole();

  return (
    <HomeView
      editName="박지영"
      role={role}
      onNavigate={(p) => router.push(NAV[p])}
      onLogout={() => router.push(ROUTES.login)}
    />
  );
}