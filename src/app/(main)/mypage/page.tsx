"use client";

import { useRouter } from "next/navigation";
import { MyInfoView } from "@/components/views/MyInfoView";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/lib/role";

export default function MypagePage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { role } = useUserRole();

  if (!profile) return null;

  return (
    <MyInfoView
      editName={profile.name}
      editPhone=""
      editEmail=""
      onEditNameChange={() => {}}
      onEditPhoneChange={() => {}}
      onEditEmailChange={() => {}}
      userPosition={profile.position_name ?? ""}
      userDepartment={profile.department_name ?? ""}
      onOpenChangePassword={() => alert("비밀번호 변경 (추후 구현)")}
      onOpenNotifications={() => alert("알림 설정 (추후 구현)")}
      onOpenAppInfo={() => alert("소망의료재단 ERP v0.1.0")}
      onLogout={signOut}
      role={role}
      onRoleChange={() => {}}
    />
  );
}
