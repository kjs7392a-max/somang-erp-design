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

  async function authenticate() {
    setLoading(true);
    setError(null);
    try {
      const { access_token, refresh_token } = await authenticateBiometric();
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionError) {
        setError("지문 인증에 실패했습니다.");
        setLoading(false);
        return;
      }
      // 성공 → 홈으로 이동. loading을 유지해 "인증하기" 버튼 순간 노출(깜빡임) 방지.
      // (실패·취소 경로에서만 setLoading(false) — 재시도 버튼이 다시 나오도록)
      window.location.href = ROUTES.home;
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("NO_CREDENTIAL")) {
        clearRegistered();
        setHasRegistered(false);
        setError("지문 인증 정보가 없습니다. 비밀번호로 로그인 후 다시 등록해주세요.");
        setLoading(false);
        return;
      }
      const isDomCancel =
        e instanceof DOMException && e.name === "NotAllowedError";
      if (!isDomCancel) {
        setError("지문 인증에 실패했습니다.");
      }
      setLoading(false);
    }
  }

  return { isSupported, hasRegistered, loading, error, authenticate };
}
