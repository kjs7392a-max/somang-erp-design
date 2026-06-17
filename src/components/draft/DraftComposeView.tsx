"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  FORMS,
  VACATION_TYPES,
  isAttachmentRequired,
  type FormKind,
  type VacationType,
} from "@/lib/draft-forms";
import { AttachmentPicker, type AttachmentItem } from "./AttachmentPicker";
import { ApprovalLineView } from "./ApprovalLineView";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import type { DraftSubmitData } from "@/hooks/useDraftSubmit";
import { useT } from "@/context/LangContext";

type Props = {
  kind: FormKind;
  onBack: () => void;
  onSubmitted: () => void;
  onSubmit?: (data: DraftSubmitData) => Promise<{ error?: string }>;
  initialStartDate?: string;
  initialEndDate?: string;
};

export function DraftComposeView({ kind, onBack, onSubmitted, onSubmit, initialStartDate, initialEndDate }: Props) {
  const t = useT();
  const meta = FORMS[kind];

  // 공통
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 연차
  const [vacType, setVacType] = useState<VacationType>("annual");
  const [startDate, setStartDate] = useState(initialStartDate ?? "");
  const [endDate,   setEndDate]   = useState(initialEndDate   ?? "");
  const [contact, setContact] = useState("");

  // 품의
  const [amount, setAmount] = useState("");
  const [coopDept, setCoopDept] = useState("");

  // 사직
  const [resignDate, setResignDate] = useState("");

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    if (isNaN(s) || isNaN(e) || e < s) return 0;
    return Math.floor((e - s) / 86400000) + 1;
  }, [startDate, endDate]);

  const attachmentRequired = isAttachmentRequired(
    kind,
    kind === "vacation" ? vacType : undefined,
  );

  const validate = (): string | null => {
    if (!title.trim()) return t("validate_title");
    if (kind === "vacation") {
      if (!startDate || !endDate) return t("validate_period");
      if (days <= 0) return t("validate_invalid_period");
      if (!body.trim()) return t("validate_reason");
      if (!contact.trim()) return t("validate_contact");
    }
    if (kind === "proposal") {
      if (!body.trim()) return t("validate_proposal_body");
    }
    if (kind === "resignation") {
      if (!resignDate) return t("validate_resign_date");
    }
    if (attachmentRequired && attachments.length === 0) {
      return t("validate_attachment");
    }
    return null;
  };

  const handleOpenConfirm = () => {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }
    setShowConfirm(true);
  };

  const buildPayload = (): DraftSubmitData => {
    const bodyJson: Record<string, unknown> = { formKind: kind };
    if (kind === "vacation") {
      Object.assign(bodyJson, { vacationType: vacType, startDate, endDate, reason: body, contact });
    } else if (kind === "proposal") {
      Object.assign(bodyJson, { coopDept, amount, description: body });
    } else {
      Object.assign(bodyJson, { resignDate, note: body });
    }
    return { title, docType: kind, body: bodyJson };
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    if (onSubmit) {
      const result = await onSubmit(buildPayload());
      if (result?.error) {
        alert(result.error);
        return;
      }
    }
    setSubmitted(true);
    setTimeout(() => {
      onSubmitted();
    }, 1400);
  };

  const handleSaveDraft = () => {
    alert(t("compose_saved_msg"));
  };

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 bg-white px-5 py-3 border-b border-zinc-100">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <h1 className="text-[1.0625rem] font-bold text-zinc-900">{meta.label}</h1>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* 제목 */}
        <Field label={t("compose_title_label")} required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("compose_title_placeholder")}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#3b5bdb] focus:outline-none"
          />
        </Field>

        {/* 연차 전용 */}
        {kind === "vacation" && (
          <>
            <Field label={t("compose_vacation_type")} required>
              <div className="grid grid-cols-3 gap-2">
                {VACATION_TYPES.map((vt) => (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => setVacType(vt.value)}
                    className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                      vacType === vt.value
                        ? "border-[#3b5bdb] bg-[#eef2ff] text-[#3b5bdb]"
                        : "border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    {vt.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t("compose_period")} required>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-900 focus:border-[#3b5bdb] focus:outline-none"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-900 focus:border-[#3b5bdb] focus:outline-none"
                />
              </div>
              {days > 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                  {t("compose_total_days").replace("{n}", String(days))}
                </p>
              )}
            </Field>

            <Field label={t("compose_reason")} required>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder={t("compose_reason_placeholder")}
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#3b5bdb] focus:outline-none"
              />
            </Field>

            <Field label={t("compose_emergency_contact")} required>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#3b5bdb] focus:outline-none"
              />
            </Field>
          </>
        )}

        {/* 품의 전용 */}
        {kind === "proposal" && (
          <>
            <Field label={t("compose_coop_dept")}>
              <input
                type="text"
                value={coopDept}
                onChange={(e) => setCoopDept(e.target.value)}
                placeholder="예: 시설관리팀"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#3b5bdb] focus:outline-none"
              />
            </Field>

            <Field label={t("compose_amount")}>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 1,500,000원"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#3b5bdb] focus:outline-none"
              />
            </Field>

            <Field label={t("compose_purchase_detail")} required>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                placeholder="구매 목적, 세부 내역, 수량 등을 입력하세요"
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#3b5bdb] focus:outline-none"
              />
            </Field>
          </>
        )}

        {/* 사직 전용 */}
        {kind === "resignation" && (
          <>
            <Field label={t("compose_resign_date")} required>
              <input
                type="date"
                value={resignDate}
                onChange={(e) => setResignDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 focus:border-[#3b5bdb] focus:outline-none"
              />
            </Field>

            <Field label={t("compose_other_reason")}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="사직 사유를 입력하세요 (선택)"
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#3b5bdb] focus:outline-none"
              />
            </Field>
          </>
        )}

        {/* 첨부파일 */}
        {meta.attachmentPolicy !== "none" && (
          <AttachmentPicker
            items={attachments}
            onChange={setAttachments}
            required={attachmentRequired}
            hint={
              attachmentRequired
                ? "병가(무급)은 진단서·입원확인서 등 증빙서류가 필수입니다."
                : meta.attachmentHint
            }
          />
        )}

        {/* 결재선 */}
        <ApprovalLineView line={meta.approvalLine} />
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-3 pt-2 bg-gradient-to-t from-white via-white to-white/80">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex-1 rounded-xl border border-zinc-200 bg-white py-3.5 text-sm font-semibold text-zinc-700 active:bg-zinc-50"
          >
            {t("compose_save_draft")}
          </button>
          <button
            type="button"
            onClick={handleOpenConfirm}
            className="flex-[2] rounded-xl bg-[#3b5bdb] py-3.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(59,91,219,0.28)] active:scale-[0.98]"
          >
            {t("compose_submit")}
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      <SubmitConfirmModal
        open={showConfirm}
        formLabel={meta.label}
        title={title}
        approvalLine={meta.approvalLine}
        attachmentCount={attachments.length}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => { void handleSubmit(); }}
      />

      {/* Submitted toast */}
      {submitted && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-2xl animate-[pop_0.25s_ease-out]">
            <CheckCircle2 className="h-12 w-12 text-[#0ca678]" strokeWidth={2} />
            <p className="text-base font-bold text-zinc-900">{t("compose_submitted_title")}</p>
            <p className="text-xs text-zinc-500">{t("compose_submitted_sub")}</p>
          </div>
          <style jsx>{`
            @keyframes pop {
              from { transform: scale(0.85); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1 text-sm font-semibold text-zinc-900">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}