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
 * 임시 진단 오버레이 (증거 수집 단계).
 * - 감지(isIOSDevice)에 의존하지 않고 모든 기기에서 동작 (감지 자체가 의심 대상).
 * - 좌하단의 작은 회색 stamp 를 탭하면 경로 추적 패널이 열림.
 * - 패널에 이 기기의 실제 UA / maxTouchPoints / 감지결과 / 경로 이력 표시.
 * 원인 확정 후 제거 예정.
 */
const BUILD = "diag5";

export function IOSDebugOverlay() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [crumbs, setCrumbs] = useState<IOSCrumb[]>([]);
  const [ua, setUa] = useState("");
  const [tp, setTp] = useState<number>(-1);
  const [detected, setDetected] = useState<boolean | null>(null);
  const [standalone, setStandalone] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setUa(navigator.userAgent);
      setTp(navigator.maxTouchPoints);
      setDetected(isIOSDevice());
      setStandalone(
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true || window.matchMedia("(display-mode: standalone)").matches
      );
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    recordCrumb(pathname);
    setCrumbs(readCrumbs());
  }, [pathname]);

  const flag = (b: boolean) => (b ? "✅" : "—");

  return (
    <>
      {/* 항상 보이는 작은 stamp (탭하면 패널 토글) */}
      <button
        onClick={() => {
          setCrumbs(readCrumbs());
          setOpen((s) => !s);
        }}
        style={{
          position: "fixed",
          bottom: 4,
          left: 6,
          zIndex: 2147483647,
          fontSize: 10,
          lineHeight: "13px",
          color: "rgba(0,0,0,.55)",
          background: "rgba(255,255,255,.6)",
          border: "1px solid rgba(0,0,0,.15)",
          borderRadius: 5,
          padding: "1px 5px",
        }}
      >
        v:{BUILD} iOS:{detected === null ? "?" : detected ? "Y" : "N"} tp:{tp} (탭)
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            left: 8,
            right: 8,
            bottom: 30,
            maxHeight: "70vh",
            overflowY: "auto",
            zIndex: 2147483647,
            background: "rgba(17,24,39,.98)",
            color: "#e5e7eb",
            fontSize: 11,
            lineHeight: 1.5,
            fontFamily: "monospace",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #374151",
          }}
        >
          <div style={{ color: "#fcd34d", marginBottom: 4 }}>
            build {BUILD} · iOS감지:{detected ? "Y" : "N"} · maxTouchPoints:{tp} ·{" "}
            {standalone ? "PWA" : "WEB"}
          </div>
          <div
            style={{
              color: "#93c5fd",
              marginBottom: 8,
              whiteSpace: "normal",
              wordBreak: "break-all",
            }}
          >
            UA: {ua}
          </div>
          <div style={{ marginBottom: 6, color: "#93c5fd" }}>
            경로 / 쿼리 / PWA / 쿠키 / localStorage / ssToken
          </div>
          {crumbs.length === 0 && <div>기록 없음</div>}
          {crumbs.map((c, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {c.t} {c.path}
              {c.q ? <span style={{ color: "#fca5a5" }}>{c.q}</span> : null}
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
