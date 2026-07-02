"use client";

import { useState, useEffect } from "react";
import { MyInfoView } from "@/components/views/MyInfoView";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { useAuth } from "@/context/AuthContext";
import {
  getRegisteredEmployeeId,
  registerBiometric,
  clearRegistered,
  isWebAuthnSupported,
} from "@/lib/webauthn-client";
import { isInAppBrowser } from "@/lib/in-app-browser";
import { InAppBrowserBanner } from "@/components/auth/InAppBrowserBanner";

export default function MypagePage() {
  const { profile, signOut } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    setBiometricRegistered(!!getRegisteredEmployeeId());
  }, []);

  const handleRegisterBiometric = async () => {
    if (!profile?.employee_id) return;
    if (isInAppBrowser()) {
      alert(
        "카카오톡 등 인앱 브라우저에서는 지문 등록이 안 됩니다.\n" +
          "우측 상단 메뉴에서 'Chrome(외부 브라우저)으로 열기' 후 다시 시도해주세요.",
      );
      return;
    }
    if (!isWebAuthnSupported()) {
      alert(
        "이 브라우저는 지문 로그인을 지원하지 않습니다.\n" +
          "Chrome 등 최신 브라우저로 열거나 홈 화면에 설치 후 이용해주세요.",
      );
      return;
    }
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
      <div className="px-4 pt-4">
        <InAppBrowserBanner />
      </div>
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
