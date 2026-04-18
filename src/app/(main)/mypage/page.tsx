"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MyInfoView } from "@/components/views/MyInfoView";
import { ROUTES } from "@/lib/routes";
import type { MyInfoSection } from "@/types/navigation";

export default function MypagePage() {
  const router = useRouter();
  const [myInfoSection, setMyInfoSection] = useState<MyInfoSection>("main");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [userPosition, setUserPosition] = useState("간호사");
  const [userDepartment, setUserDepartment] = useState("내과 2병동");
  const [editName, setEditName] = useState("박지영");
  const [editPhone, setEditPhone] = useState("010-1234-5678");
  const [editEmail, setEditEmail] = useState("jypark@somang.or.kr");

  return (
    <MyInfoView
      myInfoSection={myInfoSection}
      onMyInfoSectionChange={setMyInfoSection}
      currentPw={currentPw}
      newPw={newPw}
      confirmPw={confirmPw}
      onCurrentPwChange={setCurrentPw}
      onNewPwChange={setNewPw}
      onConfirmPwChange={setConfirmPw}
      userPosition={userPosition}
      onUserPositionChange={setUserPosition}
      userDepartment={userDepartment}
      onUserDepartmentChange={setUserDepartment}
      editName={editName}
      editPhone={editPhone}
      editEmail={editEmail}
      onEditNameChange={setEditName}
      onEditPhoneChange={setEditPhone}
      onEditEmailChange={setEditEmail}
      onLogout={() => router.push(ROUTES.login)}
    />
  );
}
