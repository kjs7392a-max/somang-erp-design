"use client";

import { useState } from "react";
import type { ApprovalDetailTab } from "@/types/navigation";
import { PdfPreviewSheet } from "@/components/pdf/PdfPreviewSheet";
import type { DraftDetail } from "@/hooks/useDraftDetail";
import { VACATION_TYPES } from "@/lib/draft-forms";

export type ApprovalDetailViewProps = {
  draft: DraftDetail;
  activeTab: ApprovalDetailTab;
  onActiveTabChange: (tab: ApprovalDetailTab) => void;
  showRejectModal: boolean;
  showHoldModal: boolean;
  rejectReason: string;
  holdReason: string;
  onRejectReasonChange: (v: string) => void;
  onHoldReasonChange: (v: string) => void;
  onOpenRejectModal: () => void;
  onCloseRejectModal: () => void;
  onOpenHoldModal: () => void;
  onCloseHoldModal: () => void;
  onBack: () => void;
  docStatus?: "pending" | "approved" | "rejected";
  onApprove?: () => void;
  onConfirmReject?: () => void;
  onConfirmHold?: () => void;
};

const ACTION_STYLE: Record<string, { textCls: string; label: string; numBg: string }> = {
  pending:  { textCls: "text-amber-500", label: "대기중", numBg: "bg-amber-500" },
  approved: { textCls: "text-green-600", label: "승인",   numBg: "bg-green-500" },
  rejected: { textCls: "text-red-500",   label: "반려",   numBg: "bg-red-500"   },
  held:     { textCls: "text-gray-400",  label: "보류",   numBg: "bg-gray-300"  },
};

function toKoreanDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${y}년 ${m}월 ${day}일`;
}

function VacationBodySection({ body }: { body: Record<string, unknown> }) {
  const vacationLabel =
    VACATION_TYPES.find((t) => t.value === body.vacationType)?.label ??
    String(body.vacationType ?? "");
  const rows = [
    { label: "휴가 종류",   value: vacationLabel },
    { label: "기간",        value: `${body.startDate ?? ""} ~ ${body.endDate ?? ""}` },
    { label: "사유",        value: String(body.reason ?? "") },
    { label: "비상연락처",  value: String(body.contact ?? "") },
  ];
  return (
    <>
      {rows.map(({ label, value }, i, arr) => (
        <div key={label} className={`flex py-2 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
          <span className="w-[90px] flex-shrink-0 text-sm text-[#666]">{label}</span>
          <span className="text-[0.9375rem] font-semibold text-[#333]">{value}</span>
        </div>
      ))}
    </>
  );
}

function VacationOriginalSection({ draft }: { draft: DraftDetail }) {
  const { body, steps } = draft;
  const start = String(body.startDate ?? "");
  const end   = String(body.endDate   ?? "");
  const dayCount = start && end
    ? `(${Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1}일)`
    : "";
  const periodStr = start && end
    ? `${toKoreanDate(start)} ~ ${toKoreanDate(end)} ${dayCount}`
    : "";
  const detailRows = [
    { label: "소속",       value: draft.drafterDept },
    { label: "성명",       value: draft.drafterName },
    { label: "직책",       value: draft.drafterPosition },
    { label: "기간",       value: periodStr },
    { label: "사유",       value: String(body.reason ?? "") },
    { label: "비상연락처", value: String(body.contact ?? "") },
  ];
  return (
    <>
      <h3 className="mb-6 border-b-2 border-[#333] pb-4 text-center text-xl font-bold text-[#1a1a1a]">
        연 차 신 청 서
      </h3>
      <table className="mb-6 w-full border-collapse border border-[#ddd] text-[0.8125rem]">
        <tbody>
          <tr>
            {steps.map((s) => (
              <td key={s.id} className="w-20 border border-[#ddd] bg-[#f8f9fa] p-2 text-center font-semibold">
                {s.approverPosition || s.approverDept}
              </td>
            ))}
          </tr>
          <tr>
            {steps.map((s) => (
              <td key={s.id} className="h-[60px] border border-[#ddd] p-2" />
            ))}
          </tr>
        </tbody>
      </table>
      <table className="w-full border-collapse border border-[#ddd] text-sm">
        <tbody>
          {detailRows.map(({ label, value }) => (
            <tr key={label}>
              <td className="w-[100px] border border-[#ddd] bg-[#f8f9fa] p-2.5 font-semibold">{label}</td>
              <td className="border border-[#ddd] p-2.5">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 text-center text-sm text-[#666]">
        <p>위와 같이 연차를 신청하오니 승인하여 주시기 바랍니다.</p>
        <p className="mt-8">{toKoreanDate(draft.created_at.slice(0, 10))}</p>
        <p className="mt-4 font-semibold">신청자: {draft.drafterName} (인)</p>
      </div>
    </>
  );
}

export function ApprovalDetailView({
  draft,
  activeTab,
  onActiveTabChange,
  showRejectModal,
  showHoldModal,
  rejectReason,
  holdReason,
  onRejectReasonChange,
  onHoldReasonChange,
  onOpenRejectModal,
  onCloseRejectModal,
  onOpenHoldModal,
  onCloseHoldModal,
  onBack: _onBack,
  docStatus = "approved",
  onApprove,
  onConfirmReject,
  onConfirmHold,
}: ApprovalDetailViewProps) {
  const [showPdf, setShowPdf] = useState(false);

  const pdfStages = draft.steps.map((s) => ({
    title: s.approverPosition || s.approverDept,
    name:  s.approverName,
    acted: s.action !== "pending",
    action: (s.action === "approved" ? "approve"
           : s.action === "rejected" ? "reject"
           : undefined) as "approve" | "reject" | undefined,
  }));

  return (
    <div className="relative flex w-full flex-col bg-[#f5f5f5] pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex-1 pb-6">
        <div className="px-5 py-4">
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <h2 className="mb-3 text-xl font-bold text-[#1a1a1a]">{draft.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[0.9375rem] font-semibold text-[#333]">
                {draft.drafterName} {draft.drafterPosition}
              </span>
              <div className="h-3 w-px bg-[#ddd]" />
              <span className="text-sm text-[#666]">{draft.drafterDept}</span>
            </div>
            <div className="mt-1.5 text-[0.8125rem] text-[#999]">
              작성일: {draft.created_at.slice(0, 10)}
            </div>
          </div>
        </div>

        <div className="mb-4 px-5">
          <div className="flex gap-2 rounded-xl bg-white p-1">
            {(["summary", "original"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onActiveTabChange(tab)}
                className={`flex-1 cursor-pointer rounded-lg border-none py-2.5 text-[0.9375rem] font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-[#3b5bdb] text-white"
                    : "bg-transparent text-[#666]"
                }`}
              >
                {tab === "summary" ? "요약" : "원문 보기"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "summary" && (
          <div className="space-y-4 px-5">
            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <h3 className="mb-4 text-[1.0625rem] font-bold text-[#1a1a1a]">
                문서 내용
              </h3>
              {draft.doc_type === "vacation" ? (
                <VacationBodySection body={draft.body} />
              ) : (
                <p className="text-sm text-[#999]">이 양식의 미리보기는 준비 중입니다.</p>
              )}
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <h3 className="mb-4 text-[1.0625rem] font-bold text-[#1a1a1a]">결재선</h3>
              <div className="space-y-3">
                {(() => {
                  const firstPendingIdx = draft.steps.findIndex((s) => s.action === "pending");
                  return draft.steps.map((step, i) => {
                    const isActivePending = step.action === "pending" && i === firstPendingIdx;
                    const style = ACTION_STYLE[step.action] ?? ACTION_STYLE.pending;
                    return (
                      <div
                        key={step.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                          isActivePending ? "bg-amber-100" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${style.numBg}`}>
                            {i + 1}
                          </div>
                          <div>
                            <div className="text-[0.9375rem] font-semibold text-[#333]">
                              {step.approverName} {step.approverPosition}
                            </div>
                            <div className="text-xs text-[#999]">{step.approverDept}</div>
                          </div>
                        </div>
                        <div className={`rounded-xl px-3 py-1 text-xs font-semibold ${
                          isActivePending
                            ? "bg-white text-amber-500"
                            : `bg-gray-100 ${style.textCls}`
                        }`}>
                          {style.label}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === "original" && (
          <div className="px-5">
            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              {draft.doc_type === "vacation" ? (
                <VacationOriginalSection draft={draft} />
              ) : (
                <p className="py-8 text-center text-sm text-[#999]">
                  원문 보기는 준비 중입니다.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {(docStatus === "approved" || docStatus === "rejected") && (
        <div className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-5">
          <div className="flex gap-2">
            <button type="button" className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700">
              📄 원본 양식
            </button>
            <button
              type="button"
              onClick={() => setShowPdf(true)}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #c1272d, #8b1a1a)" }}
            >
              🔴 PDF (도장)
            </button>
          </div>
        </div>
      )}

      {(docStatus === "pending" || docStatus === undefined) && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-5 pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onApprove}
              className="flex-1 cursor-pointer rounded-xl border-none bg-emerald-500 py-3.5 text-base font-bold text-white transition-transform active:scale-95"
            >
              승인
            </button>
            <button
              type="button"
              onClick={onOpenRejectModal}
              className="flex-1 cursor-pointer rounded-xl border-none bg-red-500 py-3.5 text-base font-bold text-white transition-transform active:scale-95"
            >
              반려
            </button>
            <button
              type="button"
              onClick={onOpenHoldModal}
              className="flex-1 cursor-pointer rounded-xl border-none bg-amber-500 py-3.5 text-base font-bold text-white transition-transform active:scale-95"
            >
              보류
            </button>
          </div>
        </div>
      )}

      {showRejectModal ? (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center">
          <div className="animate-somang-slide-up-modal w-full rounded-t-3xl bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-[#1a1a1a]">반려 사유 입력</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              placeholder="반려 사유를 입력해주세요"
              className="mb-4 min-h-[120px] w-full resize-none rounded-xl border border-[#e0e0e0] p-4 font-sans text-[0.9375rem] outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCloseRejectModal}
                className="flex-1 cursor-pointer rounded-xl border-none bg-gray-100 py-3 text-base font-semibold text-[#666]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onConfirmReject}
                className="flex-1 cursor-pointer rounded-xl border-none bg-red-500 py-3 text-base font-bold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showHoldModal ? (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center">
          <div className="animate-somang-slide-up-modal w-full rounded-t-3xl bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-[#1a1a1a]">보류 사유 입력</h3>
            <textarea
              value={holdReason}
              onChange={(e) => onHoldReasonChange(e.target.value)}
              placeholder="보류 사유를 입력해주세요"
              className="mb-4 min-h-[120px] w-full resize-none rounded-xl border border-[#e0e0e0] p-4 font-sans text-[0.9375rem] outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCloseHoldModal}
                className="flex-1 cursor-pointer rounded-xl border-none bg-gray-100 py-3 text-base font-semibold text-[#666]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onConfirmHold}
                className="flex-1 cursor-pointer rounded-xl border-none bg-amber-500 py-3 text-base font-bold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPdf && (
        <PdfPreviewSheet
          docId={draft.id}
          kind={draft.doc_type as "vacation" | "proposal" | "resignation"}
          status={docStatus as "approved" | "rejected"}
          stages={pdfStages}
          onClose={() => setShowPdf(false)}
        />
      )}
    </div>
  );
}
