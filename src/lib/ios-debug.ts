"use client";

/**
 * iOS 전용 임시 진단 도구 (증거 수집 단계).
 * Android/PC 에서는 isIOSDevice() 가 false → 아무 것도 기록/표시하지 않음.
 * 무한루프 원인 확정 후 이 파일과 IOSDebugOverlay 는 제거 예정.
 */

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ 는 데스크탑 Mac UA 를 쓰므로 maxTouchPoints 로 보완
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && navigator.maxTouchPoints > 1)
  );
}

export type IOSCrumb = {
  t: string; // HH:MM:SS.mmm
  path: string;
  q: string; // 쿼리스트링(값 마스킹). 네이티브 폼 전송 시 ?userId=…&password=… 노출됨
  standalone: boolean; // 홈화면 PWA 로 실행 중인지
  cookieSess: boolean; // 쿠키에 supabase 세션(-auth-token)이 있는지
  lsSess: boolean; // localStorage 에 supabase 세션이 있는지
  ssToken: boolean; // /ios 핸드오프용 sessionStorage 토큰이 있는지
};

const KEY = "__ios_debug_v1";
const MAX = 40;

export function readCrumbs(): IOSCrumb[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as IOSCrumb[];
  } catch {
    return [];
  }
}

function hasCookieSession(): boolean {
  try {
    return document.cookie.includes("-auth-token");
  } catch {
    return false;
  }
}

function hasLocalStorageSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) return true;
    }
  } catch {
    /* noop */
  }
  return false;
}

function maskedQuery(): string {
  try {
    // 값은 …로 가려 비밀번호 등 노출 방지. 키 구조만 남김.
    return window.location.search.replace(/=[^&]*/g, "=…");
  } catch {
    return "";
  }
}

function isStandalone(): boolean {
  try {
    return (
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true || window.matchMedia("(display-mode: standalone)").matches
    );
  } catch {
    return false;
  }
}

export function recordCrumb(path: string): void {
  if (!isIOSDevice()) return;
  try {
    const crumb: IOSCrumb = {
      t: new Date().toISOString().slice(11, 23),
      path,
      q: maskedQuery(),
      standalone: isStandalone(),
      cookieSess: hasCookieSession(),
      lsSess: hasLocalStorageSession(),
      ssToken: !!sessionStorage.getItem("ios_at"),
    };
    const arr = readCrumbs();
    // 같은 경로가 즉시 중복 기록되는 것은 합치되, 루프 확인을 위해 연속 다른 경로는 모두 남김
    arr.push(crumb);
    while (arr.length > MAX) arr.shift();
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    /* noop */
  }
}

export function clearCrumbs(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
