"use client";

import { useState, useEffect } from "react";
import { MyInfoView } from "@/components/views/MyInfoView";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/lib/role";
import {
  getRegisteredEmployeeId,
  registerBiometric,
  clearRegistered,
  isWebAuthnSupported,
} from "@/lib/webauthn-client";

export default function MypagePage() {
  const { profile, signOut } = useAuth();
  const { role } = useUserRole();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    setBiometricRegistered(!!getRegisteredEmployeeId());
  }, []);

  const handleRegisterBiometric = async () => {
    if (!profile?.employee_id || !isWebAuthnSupported()) return;
    setBioLoading(true);
    try {
      await registerBiometric(profile.employee_id);
      setBiometricRegistered(true);
      alert("지문 로그인이 등록됐습니다.");
    } catch {
      alert("지문 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setBioLoading(false);
    }
  };

  const handleUnregisterBiometric = () => {
    clearRegistered();
    setBiometricRegistered(false);
    alert("지문 로그인이 해제됐습니다.");
  };

  if (!profile) return null;

  return (
    <>
      <MyInfoView
        editName={profile.full_name}
        editPhone=""
        editEmail=""
        onEditNameChange={() => {}}
        onEditPhoneChange={() => {}}
        onEditEmailChange={() => {}}
        userPosition={profile.position}
        userDepartment={profile.department}
        onOpenChangePassword={() => setShowChangePassword(true)}
        onOpenNotifications={() => alert("알림 설정 (추후 구현)")}
        onOpenAppInfo={() => alert("소망의료재단 ERP v0.1.0")}
        onLogout={signOut}
        role={role}
        onRoleChange={() => {}}
        biometricRegistered={biometricRegistered}
        onRegisterBiometric={bioLoading ? undefined : handleRegisterBiometric}
        onUnregisterBiometric={handleUnregisterBiometric}
      />
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </>
  );
}
