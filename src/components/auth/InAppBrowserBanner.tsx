"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  detectInAppBrowser,
  getMobileOS,
  openInExternalBrowser,
} from "@/lib/in-app-browser";

const NAMES: Record<string, string> = {
  kakaotalk: "카카오톡",
  naver: "네이버",
  line: "라인",
  meta: "인앱",
  daum: "다음",
};

/**
 * 인앱 브라우저(카카오톡 등)에서 열렸을 때 표시하는 안내 배너.
 * 지문 로그인·홈화면 설치가 안 되므로 외부 브라우저로 열도록 유도한다.
 * iOS는 PWA 설치가 Safari에서만 되므로 안내를 기기별로 분기한다.
 */
export function InAppBrowserBanner() {
  const [app, setApp] = useState<string | null>(null);
  const [os, setOS] = useState<"ios" | "android" | "other">("other");
  useEffect(() => {
    setApp(detectInAppBrowser());
    setOS(getMobileOS());
  }, []);

  if (!app) return null;

  // iOS: 홈 화면 설치·Face ID는 Safari 전용 / 안드로이드: Chrome
  const targetBrowser = os === "ios" ? "Safari" : "Chrome";
  const bioLabel = os === "ios" ? "Face ID·지문" : "지문";

  return (
    <div className="mx-auto mb-3 w-full max-w-[430px] rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
      <p className="text-[0.8125rem] font-semibold text-amber-900">
        {NAMES[app] ?? "인앱"} 브라우저에서는 {bioLabel} 로그인·홈 화면 설치가 제한됩니다.
      </p>
      <p className="mt-0.5 text-xs text-amber-700">
        {targetBrowser}(으)로 열어 이용해주세요.
      </p>
      <button
        type="button"
        onClick={openInExternalBrowser}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white active:opacity-80"
      >
        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.4} />
        {targetBrowser}(으)로 열기
      </button>
    </div>
  );
}
