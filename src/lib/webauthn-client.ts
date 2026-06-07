import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

const LS_KEY = "wn_registered";

/** WebAuthn Platform Authenticator 지원 여부 확인 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

/** localStorage에서 등록된 employeeId 반환. 미등록 시 null. */
export function getRegisteredEmployeeId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_KEY);
}

export function setRegistered(employeeId: string): void {
  localStorage.setItem(LS_KEY, employeeId);
}

export function clearRegistered(): void {
  localStorage.removeItem(LS_KEY);
}

/**
 * 지문 등록 전체 흐름:
 * 1) POST /api/auth/webauthn/register { action: "options" }
 * 2) startRegistration (브라우저 지문인식)
 * 3) POST /api/auth/webauthn/register { action: "verify", credential }
 */
export async function registerBiometric(employeeId: string): Promise<void> {
  const optRes = await fetch("/api/auth/webauthn/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "options" }),
    credentials: "include",
  });
  if (!optRes.ok) {
    const err = await optRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to get registration options");
  }
  const options = await optRes.json();

  // 브라우저 지문인식 (사용자 취소 시 NotAllowedError throw)
  let credential;
  try {
    credential = await startRegistration({ optionsJSON: options });
  } catch (e) {
    // 이미 같은 패스키가 기기에 있음 → localStorage만 복원하고 완료 처리
    if (e instanceof DOMException && e.name === "InvalidStateError") {
      setRegistered(employeeId);
      return;
    }
    throw e;
  }

  const verRes = await fetch("/api/auth/webauthn/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", credential }),
    credentials: "include",
  });
  if (!verRes.ok) {
    const err = await verRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Registration verification failed");
  }

  setRegistered(employeeId);
}

/**
 * 지문 인증 전체 흐름:
 * 1) POST /api/auth/webauthn/authenticate { action: "options", employeeId }
 * 2) startAuthentication (브라우저 지문인식)
 * 3) POST /api/auth/webauthn/authenticate { action: "verify", credential }
 * @returns Supabase magic link token_hash (클라이언트에서 verifyOtp로 세션 생성)
 * @throws "NO_CREDENTIAL" — 서버에 credential 없음 (재등록 필요)
 */
export async function authenticateBiometric(): Promise<{ token_hash: string }> {
  const employeeId = getRegisteredEmployeeId();
  if (!employeeId) throw new Error("No registered credential");

  const optRes = await fetch("/api/auth/webauthn/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "options", employeeId }),
    credentials: "include",
  });
  if (!optRes.ok) {
    if (optRes.status === 404) throw new Error("NO_CREDENTIAL");
    const err = await optRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to get authentication options");
  }
  const options = await optRes.json();

  const credential = await startAuthentication({ optionsJSON: options });

  const verRes = await fetch("/api/auth/webauthn/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", credential }),
    credentials: "include",
  });
  if (!verRes.ok) {
    const err = await verRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Authentication verification failed");
  }
  return verRes.json();
}
