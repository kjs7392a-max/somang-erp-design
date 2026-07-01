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
import { ROUTES } from "@/lib/routes";

export function useWebAuthn() {
  const router = useRouter();
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
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionError) {
        setError("지문 인증에 실패했습니다.");
        setLoading(false);
        return;
      }
      // 성공: 클라이언트 전환 (전체 리로드 없음 → 홈 즉시 진입)
      // loading은 false로 안 바꿈 → 배경 화면 유지하다 홈으로 이동
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
