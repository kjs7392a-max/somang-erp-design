import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

const LS_KEY = "wn_registered";   // employeeId
const LS_CRED_KEY = "wn_cred_id"; // credential_id (빠른 인증 경로용)

let _prefetchedOptions: Promise<Response> | null = null;

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
 * force=true: 기존 credential 삭제 후 재등록 (클라우드 패스키 → 기기 로컬 마이그레이션)
 */
export async function registerBiometric(employeeId: string, force = false): Promise<void> {
  const optRes = await fetch("/api/auth/webauthn/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "options", employeeId, force }),
    credentials: "include",
  });
  if (!optRes.ok) {
    const err = await optRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to get registration options");
  }
  const options = await optRes.json();

  if ((options as { alreadyRegistered?: boolean }).alreadyRegistered) {
    setRegistered(employeeId);
    const credId = (options as { credentialId?: string }).credentialId;
    if (credId) setRegisteredCredentialId(credId);
    return;
  }

  let credential;
  try {
    credential = await startRegistration({ optionsJSON: options });
  } catch (e) {
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

  setRegistered(employeeId);
  setRegisteredCredentialId(credential.id);
}

/**
 * 지문 인증:
 * 1) pre-fetch된 options 사용 (없으면 즉시 fetch)
 * 2) startAuthentication → 브라우저 지문인식
 * 3) verify → token_hash 반환
 */
export const PROFILE_CACHE_KEY = "wn_profile_cache";

export async function authenticateBiometric(): Promise<{ access_token: string; refresh_token: string; expires_at: number; profile?: unknown }> {
  const credentialId = getRegisteredCredentialId();
  const employeeId = getRegisteredEmployeeId();
  if (!credentialId && !employeeId) throw new Error("No registered credential");

  // pre-fetch 결과 소비 (없으면 지금 fetch)
  const prefetched = _prefetchedOptions;
  _prefetchedOptions = null;

  let optRes: Response;
  if (prefetched) {
    optRes = await prefetched;
    // pre-fetch가 실패한 경우 재시도
    if (!optRes.ok && optRes.status !== 404) {
      optRes = await fetchAuthOptions(credentialId, employeeId);
    }
  } else {
    optRes = await fetchAuthOptions(credentialId, employeeId);
  }

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
  const result = await verRes.json();
  // profile을 sessionStorage에 캐시 → AuthContext가 홈 진입 시 Supabase 재조회 생략
  if (result.profile && typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(result.profile));
  }
  return result;
}

function fetchAuthOptions(credentialId: string | null, employeeId: string | null): Promise<Response> {
  return fetch("/api/auth/webauthn/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      credentialId
        ? { action: "options", credentialId }
        : { action: "options", employeeId }
    ),
    credentials: "include",
  });
}
