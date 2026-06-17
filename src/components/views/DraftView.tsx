"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plane, Clock, Receipt, ShoppingCart, HeartPulse, FileText, Plus, ChevronRight, ClipboardList,
} from "lucide-react";
import type { FormKind } from "@/lib/draft-forms";
import { DraftComposeView } from "@/components/draft/DraftComposeView";
import type { DraftSubmitData } from "@/hooks/useDraftSubmit";
import { useT } from "@/context/LangContext";
import { useUserRole } from "@/lib/role";
import { ROUTES } from "@/lib/routes";

export type DraftPrefill = { formKind: FormKind; startDate?: string; endDate?: string };
export type DraftViewProps = {
  onBack?: () => void;
  prefill?: DraftPrefill;
  onSubmit?: (data: DraftSubmitData) => Promise<{ error?: string }>;
  onAfterSubmit?: () => void;
};

export function DraftView({ prefill, onSubmit, onAfterSubmit }: DraftViewProps) {
  const t = useT();
  const { role } = useUserRole();
  const [composeKind, setComposeKind] = useState<FormKind | null>(prefill?.formKind ?? null);
  const [activePrefill, setActivePrefill] = useState<{ start?: string; end?: string } | null>(
    prefill ? { start: prefill.startDate, end: prefill.endDate } : null
  );

  const QUICK_DRAFTS = [
    { key: "vacation", formKind: "vacation"    as FormKind, label: t("draft_form_vacation"), Icon: Plane,        bg: "#e8f4ff", tint: "#3b5bdb" },
    { key: "proposal", formKind: "proposal"    as FormKind, label: t("draft_form_proposal"), Icon: FileText,     bg: "#f1f3f5", tint: "#495057" },
    { key: "resign",   formKind: "resignation" as FormKind, label: t("draft_form_resign"),   Icon: FileText,     bg: "#fff5f5", tint: "#c92a2a" },
    { key: "overtime", formKind: null,                       label: t("draft_form_overtime"), Icon: Clock,        bg: "#fff4e6", tint: "#f08c00" },
    { key: "expense",  formKind: null,                       label: t("draft_form_expense"),  Icon: Receipt,      bg: "#e6fcf5", tint: "#0ca678" },
    { key: "purchase", formKind: null,                       label: t("draft_form_purchase"), Icon: ShoppingCart, bg: "#fff0f6", tint: "#d6336c" },
    { key: "medical",  formKind: null,                       label: t("draft_form_medical"),  Icon: HeartPulse,   bg: "#f3f0ff", tint: "#7048e8" },
  ];

  if (composeKind) {
    return (
      <DraftComposeView
        kind={composeKind}
        onBack={() => { setComposeKind(null); setActivePrefill(null); }}
        onSubmitted={() => { setComposeKind(null); setActivePrefill(null); onAfterSubmit?.(); }}
        onSubmit={onSubmit}
        initialStartDate={activePrefill?.start}
        initialEndDate={activePrefill?.end}
      />
    );
  }

  const handlePick = (formKind: FormKind | null) => {
    if (!formKind) { alert(t("draft_form_wip")); return; }
    setComposeKind(formKind);
  };

  return (
    <div className="px-5 py-5">
      {role === "manager" && (
        <Link
          href={ROUTES.approval}
          className="mb-4 flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-3 active:opacity-70"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" strokeWidth={2} />
            <span className="text-[0.9375rem] font-semibold text-indigo-700">{t("nav_approval")}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-indigo-400" />
        </Link>
      )}

      <button
        type="button"
        onClick={() => setComposeKind("proposal")}
        className="mb-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#3b5bdb] p-5 shadow-[0_4px_12px_rgba(59,91,219,0.28)] transition-transform active:scale-[0.98]"
      >
        <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
        <span className="text-[1.0625rem] font-bold text-white">{t("draft_new_btn")}</span>
      </button>

      <section className="mb-6">
        <h2 className="mb-3 text-[1.0625rem] font-bold text-zinc-900">{t("draft_quick_title")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_DRAFTS.map(({ key, formKind, label, Icon, bg, tint }) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePick(formKind)}
              className="flex flex-col items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] active:scale-[0.98]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: bg }}>
                <Icon className="h-5 w-5" strokeWidth={2} style={{ color: tint }} />
              </span>
              <span className="text-[0.9375rem] font-semibold text-zinc-900">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[1.0625rem] font-bold text-zinc-900">{t("draft_temp_title")}</h2>
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-400">
          {t("draft_temp_empty")}
        </p>
      </section>
    </div>
  );
}
