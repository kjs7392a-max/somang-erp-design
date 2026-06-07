"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  authenticateBiometric,
  clearRegistered,
  getRegisteredEmployeeId,
  isWebAuthnSupported,
  registerBiometric,
} from "@/lib/webauthn-client";
import { ROUTES } from "@/lib/routes";

export function useWebAuthn(employeeId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHasRegistered(!!getRegisteredEmployeeId());
    if (!isWebAuthnSupported()) return;
    // 기기에 실제 생체인식 인증기가 있는지 확인
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => setIsSupported(available))
      .catch(() => setIsSupported(true)); // 에러 시 지원으로 간주
  }, []);

  /**
   * 지문 등록. employeeId prop이 없으면 no-op.
   * 사용자 취소(NotAllowedError)는 에러 없이 무시.
   */
  async function register() {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      await registerBiometric(employeeId);
      setHasRegistered(true);
    } catch (e) {
      const isDomCancel =
        e instanceof DOMException && e.name === "NotAllowedError";
      if (!isDomCancel) {
        setError(e instanceof Error ? e.message : "등록 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  /**
   * 지문 인증 후 Supabase 세션 설정 → 홈 이동.
   * 사용자 취소는 에러 없이 무시. NO_CREDENTIAL이면 로컬 플래그 제거.
   */
  async function authenticate() {
    setLoading(true);
    setError(null);
    try {
      const { token_hash } = await authenticateBiometric();
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash,
        type: "magiclink",
      });
      if (otpError) {
        setError("지문 인증에 실패했습니다.");
        return;
      }
      window.location.href = ROUTES.home;
    } catch (e) {
      if (e instanceof Error && e.message === "NO_CREDENTIAL") {
        clearRegistered();
        setHasRegistered(false);
        return;
      }
      const isDomCancel =
        e instanceof DOMException && e.name === "NotAllowedError";
      if (!isDomCancel) {
        setError("지문 인증에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return { isSupported, hasRegistered, loading, error, register, authenticate };
}
