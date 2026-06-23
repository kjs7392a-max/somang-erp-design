"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  isIOSDevice,
  recordCrumb,
  readCrumbs,
  clearCrumbs,
  type IOSCrumb,
} from "@/lib/ios-debug";

/**
 * iOS 전용 임시 진단 오버레이 (증거 수집 단계).
 * - iOS 가 아니면 null 반환 → Android/PC 화면·동작에 전혀 영향 없음.
 * - 페이지 이동(전체 새로고침 포함)마다 경로/세션 상태를 기록.
 * - 우하단 "iOS디버그" 버튼 → 누적 경로 표시 → 스크린샷으로 공유.
 * 원인 확정 후 제거 예정.
 */
export function IOSDebugOverlay() {
  const pathname = usePathname();
  const [isIOS, setIsIOS] = useState(false);
  const [open, setOpen] = useState(false);
  const [crumbs, setCrumbs] = useState<IOSCrumb[]>([]);

  useEffect(() => {
    setIsIOS(isIOSDevice());
  }, []);

  useEffect(() => {
    if (!isIOSDevice()) return;
    recordCrumb(pathname);
    setCrumbs(readCrumbs());
  }, [pathname]);

  if (!isIOS) return null;

  const flag = (b: boolean) => (b ? "✅" : "—");

  return (
    <>
      <button
        onClick={() => {
          setCrumbs(readCrumbs());
          setOpen((s) => !s);
        }}
        style={{
          position: "fixed",
          bottom: 10,
          right: 10,
          zIndex: 2147483647,
          padding: "6px 10px",
          fontSize: 12,
          fontWeight: 700,
          color: "#fff",
          background: "#dc2626",
          border: "none",
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,.3)",
        }}
      >
        iOS디버그 {crumbs.length}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            left: 8,
            right: 8,
            bottom: 48,
            maxHeight: "60vh",
            overflowY: "auto",
            zIndex: 2147483647,
            background: "rgba(17,24,39,.97)",
            color: "#e5e7eb",
            fontSize: 11,
            lineHeight: 1.5,
            fontFamily: "monospace",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #374151",
          }}
        >
          <div style={{ marginBottom: 6, color: "#93c5fd" }}>
            경로 / standalone / cookie / localStorage / ssToken
          </div>
          {crumbs.length === 0 && <div>기록 없음</div>}
          {crumbs.map((c, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {c.t} {c.path}
              {"  "}PWA:{flag(c.standalone)} 쿠키:{flag(c.cookieSess)} LS:
              {flag(c.lsSess)} SS:{flag(c.ssToken)}
            </div>
          ))}
          <button
            onClick={() => {
              clearCrumbs();
              setCrumbs([]);
            }}
            style={{
              marginTop: 8,
              padding: "4px 8px",
              fontSize: 11,
              color: "#fff",
              background: "#374151",
              border: "none",
              borderRadius: 6,
            }}
          >
            기록 지우기
          </button>
        </div>
      )}
    </>
  );
}
