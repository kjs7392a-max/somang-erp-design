import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

const LS_KEY = "wn_registered";   // employeeId
const LS_CRED_KEY = "wn_cred_id"; // credential_id (빠른 인증 경로용)

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

/** localStorage에서 등록된 credentialId 반환. 미등록 시 null. */
export function getRegisteredCredentialId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_CRED_KEY);
}

export function setRegistered(employeeId: string): void {
  localStorage.setItem(LS_KEY, employeeId);
}

function setRegisteredCredentialId(credId: string): void {
  localStorage.setItem(LS_CRED_KEY, credId);
}

export function clearRegistered(): void {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_CRED_KEY);
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
    body: JSON.stringify({ action: "options", employeeId }),
    credentials: "include",
  });
  if (!optRes.ok) {
    const err = await optRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to get registration options");
  }
  const options = await optRes.json();

  // 서버에 이미 credential이 있음 → localStorage만 복원하고 완료
  if ((options as { alreadyRegistered?: boolean }).alreadyRegistered) {
    setRegistered(employeeId);
    const credId = (options as { credentialId?: string }).credentialId;
    if (credId) setRegisteredCredentialId(credId);
    return;
  }

  // 브라우저 지문인식 (사용자 취소 시 NotAllowedError throw)
  let credential;
  try {
    credential = await startRegistration({ optionsJSON: options });
  } catch (e) {
    // 기기에 동일 패스키 존재 (excludeCredentials) → localStorage만 복원
    if (e instanceof DOMException && e.name === "InvalidStateError") {
      setRegistered(employeeId);
      return;
    }
    throw e;
  }

  const verRes = await fetch("/api/auth/webauthn/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", credential, employeeId }),
    credentials: "include",
  });
  if (!verRes.ok) {
    const err = await verRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Registration verification failed");
  }

  // credential.id는 startRegistration 결과에서 바로 사용 (서버 응답 불필요)
  setRegistered(employeeId);
  setRegisteredCredentialId(credential.id);
}

/**
 * 지문 인증 전체 흐름:
 * 1) POST /api/auth/webauthn/authenticate { action: "options", credentialId } (빠른 경로)
 *    또는 { action: "options", employeeId } (구버전 fallback)
 * 2) startAuthentication (브라우저 지문인식)
 * 3) POST /api/auth/webauthn/authenticate { action: "verify", credential }
 * @returns Supabase magic link token_hash (클라이언트에서 verifyOtp로 세션 생성)
 * @throws "NO_CREDENTIAL" — 서버에 credential 없음 (재등록 필요)
 */
export async function authenticateBiometric(): Promise<{ token_hash: string }> {
  const credentialId = getRegisteredCredentialId();
  const employeeId = getRegisteredEmployeeId();
  if (!credentialId && !employeeId) throw new Error("No registered credential");

  // credentialId 있으면 빠른 경로, 없으면 구버전 employeeId 경로
  const optBody = credentialId
    ? { action: "options", credentialId }
    : { action: "options", employeeId };

  const optRes = await fetch("/api/auth/webauthn/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(optBody),
    credentials: "include",
  });
  if (!optRes.ok) {
    const err = await optRes.json().catch(() => ({}));
    const msg = (err as { error?: string }).error ?? "Failed to get authentication options";
    if (optRes.status === 404) throw new Error(`NO_CREDENTIAL: ${msg}`);
    throw new Error(msg);
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
