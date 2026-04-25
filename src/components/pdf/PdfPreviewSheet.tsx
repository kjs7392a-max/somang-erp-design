"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, Share2 } from "lucide-react";
import { ApprovalStamp } from "./ApprovalStamp";
import { PdfBody } from "./PdfBody";

type Stage = { title: string; name: string; acted: boolean; action?: "approve" | "reject" };

type Props = {
  docId: string;
  kind: "vacation" | "proposal" | "resignation";
  status: "approved" | "rejected";
  stages: Stage[];
  onClose: () => void;
};

const ROTATE_BY_IDX = [-8, 6, -8, 6];

export function PdfPreviewSheet({ docId, kind, status, stages, onClose }: Props) {
  const [downloaded, setDownloaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDownload = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDownloaded(true);
    timerRef.current = setTimeout(() => setDownloaded(false), 2500);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const kindLabel = kind === "vacation" ? "연차 신청서" : kind === "proposal" ? "품의서" : "사직원";

  return (
    <div
      className="fixed inset-0 z-[250] flex flex-col items-center overflow-y-auto py-6"
      style={{ background: "rgba(20, 28, 35, 0.92)" }}
    >
      {/* 헤더 */}
      <div className="fixed left-0 right-0 top-0 flex items-center justify-between px-4 pt-[calc(44px+env(safe-area-inset-top,0px))] pb-3 z-10">
        <button type="button" onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">PDF 미리보기</p>
          <p className="text-[0.625rem] text-white/50">{docId}.pdf</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleDownload}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: downloaded ? "#16a34a" : "#2d5c6e" }}
          >
            {downloaded ? <span className="text-sm text-white">✓</span> : <Download className="h-4 w-4 text-white" strokeWidth={2} />}
          </button>
          <button type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Share2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 다운로드 완료 토스트 */}
      {downloaded && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-white">
          {docId}.pdf 다운로드 완료
        </div>
      )}

      {/* 종이 */}
      <div className="relative mx-auto mt-24 mb-8 w-full max-w-[540px] px-4">
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #fffdf6 0%, #fff8ea 100%)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.3)",
            padding: "28px 26px 36px",
            fontFamily: '"Noto Serif KR", serif',
            color: "#2a2418",
          }}
        >
          {/* 워터마크 */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ transform: "rotate(-30deg)", fontSize: 70, fontWeight: 800, color: "#c1272d", opacity: 0.04 }}
          >
            소망병원
          </div>

          {/* 종이 헤더 */}
          <div className="mb-5 flex items-start justify-between border-b-2 border-[#2a2418] pb-3">
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#7a6a4f" }}>음성소망의료재단</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#2a2418" }}>소망병원</p>
            </div>

            {/* 결재 박스 */}
            <div style={{ border: "2px solid #d8c8a8", display: "flex" }}>
              {/* 기안자 */}
              <div style={{ borderRight: "1px solid #d8c8a8", display: "flex", flexDirection: "column" }}>
                <div style={{ background: "#faf3e3", padding: "5px 8px", fontSize: 9, fontWeight: 700, color: "#7a6a4f", borderBottom: "1px solid #d8c8a8", textAlign: "center" }}>기안</div>
                <div style={{ padding: "4px 8px", fontSize: 9, color: "#5a4a30", borderBottom: "1px solid #d8c8a8", textAlign: "center" }}>윤민주</div>
                <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: "#fffaf0", borderBottom: "1px solid #d8c8a8", padding: "4px 8px" }}>
                  <ApprovalStamp name="윤민주" size={40} rotate={-6} />
                </div>
                <div style={{ padding: "3px 8px", fontSize: 8, color: "#7a6a4f", background: "#faf3e3", textAlign: "center" }}>26.04.15</div>
              </div>

              {/* 결재선 */}
              {stages.map((stage, idx) => (
                <div key={idx} style={{ borderRight: idx < stages.length - 1 ? "1px solid #d8c8a8" : undefined, display: "flex", flexDirection: "column" }}>
                  <div style={{ background: "#faf3e3", padding: "5px 8px", fontSize: 9, fontWeight: 700, color: "#7a6a4f", borderBottom: "1px solid #d8c8a8", textAlign: "center", minWidth: 50 }}>
                    {stage.title}
                  </div>
                  <div style={{ padding: "4px 8px", fontSize: 9, color: "#5a4a30", borderBottom: "1px solid #d8c8a8", textAlign: "center" }}>
                    {stage.name}
                  </div>
                  <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: "#fffaf0", borderBottom: "1px solid #d8c8a8", padding: "4px 8px" }}>
                    {stage.acted && (
                      <ApprovalStamp
                        name={stage.name}
                        size={40}
                        rotate={ROTATE_BY_IDX[idx % 4]}
                        isRejected={stage.action === "reject"}
                      />
                    )}
                  </div>
                  <div style={{ padding: "3px 8px", fontSize: 8, color: "#7a6a4f", background: "#faf3e3", textAlign: "center" }}>
                    {stage.acted ? "26.04.21" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 문서 제목 */}
          <h2 style={{ textAlign: "center", fontSize: 18, fontWeight: 800, letterSpacing: "0.15em", marginBottom: 16 }}>
            {kindLabel}
          </h2>

          {/* 본문 */}
          <PdfBody kind={kind} />

          {/* 하단 */}
          <div style={{ marginTop: 24, borderTop: "1px dashed #d8c8a8", paddingTop: 12 }}>
            {status === "approved" ? (
              <p style={{ fontSize: 10, color: "#7a6a4f", letterSpacing: "0.1em", textAlign: "center" }}>
                ※ 본 문서는 전자결재로 승인 완료된 정식 문서입니다.
              </p>
            ) : (
              <p style={{ fontSize: 11, fontWeight: 700, color: "#c1272d", textAlign: "center" }}>
                ⚠ 본 문서는 결재가 반려된 문서입니다.
              </p>
            )}
          </div>
        </div>

        {/* 페이지 번호 */}
        <p className="mt-3 text-center text-[0.625rem] font-semibold text-white/40">1 / 1</p>
      </div>
    </div>
  );
}
