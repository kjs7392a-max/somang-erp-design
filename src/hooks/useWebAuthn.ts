"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  authenticateBiometric,
  clearRegistered,
  getRegisteredEmployeeId,
  isWebAuthnSupported,
} from "@/lib/webauthn-client";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/lib/routes";
import type { Profile } from "@/types/profile";

export function useWebAuthn() {
  const router = useRouter();
  const { injectProfile } = useAuth();
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
      const { access_token, refresh_token, profile } = await authenticateBiometric();
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionError) {
        setError("지문 인증에 실패했습니다.");
        setLoading(false);
        return;
      }
      // navigate 전에 profile을 AuthContext에 직접 주입 → 홈 첫 렌더링 즉시 표시
      if (profile) {
        injectProfile(profile as Profile);
      }
      router.push(ROUTES.home);
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
