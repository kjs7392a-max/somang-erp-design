"use client";

import { useEffect } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import type { ApprovalLine } from "@/lib/draft-forms";
import { useT } from "@/context/LangContext";

type Props = {
  open: boolean;
  formLabel: string;
  title: string;
  approvalLine: ApprovalLine;
  attachmentCount: number;
  onClose: () => void;
  onConfirm: () => void;
};

export function SubmitConfirmModal({
  open,
  formLabel,
  title,
  approvalLine,
  attachmentCount,
  onClose,
  onConfirm,
}: Props) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-[fadeIn_0.2s_ease-out]" />
      <div
        className="relative w-full max-w-[430px] rounded-t-2xl bg-white shadow-2xl animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-300" />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-zinc-900">{t("confirm_submit_title")}</h2>
            <p className="mt-1 text-xs text-zinc-500">{t("confirm_submit_sign")}</p>
          </div>
          <button
            type="button"
            aria-label={t("action_close")}
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 active:scale-95"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="px-5 pb-4 space-y-2.5">
          <Row label={t("confirm_form")} value={formLabel} />
          <Row label={t("compose_title_label")} value={title || t("confirm_no_title")} />
          <Row
            label={t("detail_approval_line")}
            value={approvalLine.map((s) => s.position).join(" → ")}
          />
          <Row
            label={t("confirm_attachment")}
            value={t("confirm_attachment_n").replace("{n}", String(attachmentCount))}
          />
        </div>

        <div className="mx-5 mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" strokeWidth={2.2} />
          <p className="text-xs leading-relaxed text-amber-800">
            {t("confirm_warning")}
          </p>
        </div>

        <div className="px-5 pb-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700 active:bg-zinc-50"
          >
            {t("action_cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#3b5bdb] py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            <Send className="h-4 w-4" strokeWidth={2.2} />
            {t("compose_submit")}
          </button>
        </div>

        <style jsx>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}</style>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-14 shrink-0 text-xs font-semibold text-zinc-500">{label}</span>
      <span className="flex-1 text-sm text-zinc-900 break-all">{value}</span>
    </div>
  );
}
