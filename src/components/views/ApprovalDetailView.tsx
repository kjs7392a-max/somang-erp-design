"use client";

import type { ApprovalDetailTab } from "@/types/navigation";

export type ApprovalDetailViewProps = {
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
};

export function ApprovalDetailView({
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
  onBack,
}: ApprovalDetailViewProps) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-[#f5f5f5] pb-28">
      <div className="flex items-center justify-between border-b border-[#e0e0e0] bg-white px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer border-none bg-transparent p-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-[#1a1a1a]">결재 상세</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="px-5 py-4">
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <h2 className="mb-3 text-xl font-bold text-[#1a1a1a]">연차신청서</h2>
            <div className="flex items-center gap-2">
              <span className="text-[0.9375rem] font-semibold text-[#333]">
                박지영 간호사
              </span>
              <div className="h-3 w-px bg-[#ddd]" />
              <span className="text-sm text-[#666]">내과 2병동</span>
            </div>
            <div className="mt-1.5 text-[0.8125rem] text-[#999]">작성일: 2026-04-15</div>
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
              {[
                { label: "휴가 종류", value: "연차" },
                { label: "기간", value: "2026-04-20 ~ 2026-04-21" },
                { label: "사유", value: "개인 사유" },
                { label: "대체자", value: "김수진 간호사" },
                { label: "비상연락처", value: "010-1234-5678" },
              ].map(({ label, value }, i, arr) => (
                <div
                  key={label}
                  className={`flex py-2 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <span className="w-[90px] flex-shrink-0 text-sm text-[#666]">
                    {label}
                  </span>
                  <span className="text-[0.9375rem] font-semibold text-[#333]">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <h3 className="mb-4 text-[1.0625rem] font-bold text-[#1a1a1a]">결재선</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                      1
                    </div>
                    <div>
                      <div className="text-[0.9375rem] font-semibold text-[#333]">
                        이미선 수간호사
                      </div>
                      <div className="text-xs text-[#999]">담당</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-500">
                    승인완료
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-100 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                      2
                    </div>
                    <div>
                      <div className="text-[0.9375rem] font-semibold text-[#333]">
                        최민호 총무과장
                      </div>
                      <div className="text-xs text-[#999]">총무과</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-1 text-xs font-semibold text-amber-500">
                    대기중
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-white">
                      3
                    </div>
                    <div>
                      <div className="text-[0.9375rem] font-semibold text-[#333]">이사장</div>
                      <div className="text-xs text-[#999]">이사장실</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-400">
                    대기중
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "original" && (
          <div className="px-5">
            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <h3 className="mb-6 border-b-2 border-[#333] pb-4 text-center text-xl font-bold text-[#1a1a1a]">
                연 차 신 청 서
              </h3>
              <table className="mb-6 w-full border-collapse border border-[#ddd] text-[0.8125rem]">
                <tbody>
                  <tr>
                    {["담당", "총무과장", "이사장"].map((role) => (
                      <td
                        key={role}
                        className="w-20 border border-[#ddd] bg-[#f8f9fa] p-2 text-center font-semibold"
                      >
                        {role}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="h-[60px] border border-[#ddd] p-2 text-center align-middle">
                      <div className="font-semibold text-emerald-500">승인</div>
                    </td>
                    <td className="border border-[#ddd] p-2" />
                    <td className="border border-[#ddd] p-2" />
                  </tr>
                </tbody>
              </table>
              <table className="w-full border-collapse border border-[#ddd] text-sm">
                <tbody>
                  {[
                    { label: "소속", value: "내과 2병동" },
                    { label: "성명", value: "박지영" },
                    { label: "직책", value: "간호사" },
                    {
                      label: "기간",
                      value: "2026년 04월 20일 ~ 2026년 04월 21일 (2일)",
                    },
                    { label: "사유", value: "개인 사유" },
                    { label: "대체 근무자", value: "김수진 간호사" },
                    { label: "비상연락처", value: "010-1234-5678" },
                  ].map(({ label, value }) => (
                    <tr key={label}>
                      <td className="w-[100px] border border-[#ddd] bg-[#f8f9fa] p-2.5 font-semibold">
                        {label}
                      </td>
                      <td className="border border-[#ddd] p-2.5">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-8 text-center text-sm text-[#666]">
                <p>위와 같이 연차를 신청하오니 승인하여 주시기 바랍니다.</p>
                <p className="mt-8">2026년 04월 15일</p>
                <p className="mt-4 font-semibold">신청자: 박지영 (인)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.06] bg-white px-5 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex gap-2">
          <button
            type="button"
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
                className="flex-1 cursor-pointer rounded-xl border-none bg-amber-500 py-3 text-base font-bold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
