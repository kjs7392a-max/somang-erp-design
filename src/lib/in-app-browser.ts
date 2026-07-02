"use client";

/**
 * 인앱 브라우저(카카오톡 등) 감지.
 * 이런 WebView에서는 WebAuthn(지문/생체) 및 PWA 홈화면 설치가 제한된다.
 * → 지문 등록/로그인이 조용히 실패하므로 외부 브라우저로 유도해야 한다.
 */
export function detectInAppBrowser(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/KAKAOTALK/i.test(ua)) return "kakaotalk";
  if (/NAVER\(inapp|NAVER/i.test(ua)) return "naver";
  if (/Line\//i.test(ua)) return "line";
  if (/FBAN|FBAV|FB_IAB|Instagram/i.test(ua)) return "meta";
  if (/DaumApps/i.test(ua)) return "daum";
  return null;
}

export function isInAppBrowser(): boolean {
  return detectInAppBrowser() !== null;
}

/** 현재 URL을 외부 기본 브라우저(안드로이드=Chrome)로 다시 연다. */
export function openInExternalBrowser(): void {
  if (typeof window === "undefined") return;
  const url = window.location.href;
  const app = detectInAppBrowser();

  // 카카오톡: 전용 스킴으로 기본 브라우저 열기
  if (app === "kakaotalk") {
    window.location.href =
      "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
    return;
  }

  // 안드로이드 일반 WebView: Chrome intent로 열기
  if (/Android/i.test(navigator.userAgent)) {
    const noScheme = url.replace(/^https?:\/\//, "");
    window.location.href =
      `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`;
    return;
  }

  // 그 외: 새 탭 시도
  window.open(url, "_blank");
}
