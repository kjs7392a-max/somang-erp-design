"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  authenticateBiometric,
  clearRegistered,
  getRegisteredEmployeeId,
  isWebAuthnSupported,
} from "@/lib/webauthn-client";
import { ROUTES } from "@/lib/routes";

export function useWebAuthn() {
  const [isSupported, setIsSupported] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHasRegistered(!!getRegisteredEmployeeId());
    if (!isWebAuthnSupported()) return;
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => setIsSupported(available))
      .catch(() => setIsSupported(true));
  }, []);

  /**
   * 지문 인증 후 Supabase 세션 설정 → 홈 이동.
   * 사용자 취소(NotAllowedError)는 에러 없이 무시.
   */
  async function authenticate() {
    setLoading(true);
    setError(null);
    try {
      const { access_token, refresh_token } = await authenticateBiometric();
      const supabase = createClient();
      // setSession은 유효한 토큰이면 로컬 처리만 함 (네트워크 왕복 없음)
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionError) {
        setError("지문 인증에 실패했습니다.");
        return;
      }
      window.location.href = ROUTES.home;
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("NO_CREDENTIAL")) {
        clearRegistered();
        setHasRegistered(false);
        setError("지문 인증 정보가 없습니다. 비밀번호로 로그인 후 다시 등록해주세요.");
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

  return { isSupported, hasRegistered, loading, error, authenticate };
}
