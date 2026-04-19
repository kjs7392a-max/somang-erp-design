"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MyInfoView } from "@/components/views/MyInfoView";
import { useUserRole } from "@/lib/role";
import { ROUTES } from "@/lib/routes";

export default function MypagePage() {
  const router = useRouter();
  const { role, setRole } = useUserRole();

  // 관리자 배정 (읽기 전용)
  const [userPosition] = useState("간호사");
  const [userDepartment] = useState("외과 2병동");

  // 본인 수정 가능
  const [editName, setEditName] = useState("박지영");
  const [editPhone, setEditPhone] = useState("010-1234-5678");
  const [editEmail, setEditEmail] = useState("jypark@somang.or.kr");

  return (
    <MyInfoView
      editName={editName}
      editPhone={editPhone}
      editEmail={editEmail}
      onEditNameChange={setEditName}
      onEditPhoneChange={setEditPhone}
      onEditEmailChange={setEditEmail}
      userPosition={userPosition}
      userDepartment={userDepartment}
      onOpenChangePassword={() => alert("비밀번호 변경 (추후 구현)")}
      onOpenNotifications={() => alert("알림 설정 (추후 구현)")}
      onOpenAppInfo={() => alert("소망의료재단 ERP v0.1.0")}
      onLogout={() => router.push(ROUTES.login)}
      role={role}
      onRoleChange={setRole}
    />
  );
}