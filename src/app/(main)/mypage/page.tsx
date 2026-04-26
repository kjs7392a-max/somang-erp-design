"use client";

import { MyInfoView } from "@/components/views/MyInfoView";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/lib/role";

export default function MypagePage() {
  const { profile, signOut } = useAuth();
  const { role } = useUserRole();

  if (!profile) return null;

  return (
    <MyInfoView
      editName={profile.full_name}
      editPhone=""
      editEmail=""
      onEditNameChange={() => {}}
      onEditPhoneChange={() => {}}
      onEditEmailChange={() => {}}
      userPosition={profile.position}
      userDepartment={profile.department}
      onOpenChangePassword={() => alert("비밀번호 변경 (추후 구현)")}
      onOpenNotifications={() => alert("알림 설정 (추후 구현)")}
      onOpenAppInfo={() => alert("소망의료재단 ERP v0.1.0")}
      onLogout={signOut}
      role={role}
      onRoleChange={() => {}}
    />
  );
}
