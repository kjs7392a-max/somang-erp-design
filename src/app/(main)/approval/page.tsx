"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMyDrafts, type ApprovalStep } from "@/hooks/useMyDrafts";
import { useApprovalInbox } from "@/hooks/useApprovalInbox";
import { getDefaultApprovalTab, shouldHideMyDraftsTab, shouldHideInboxTab, type ApprovalTab } from "@/lib/approval-roles";
import { ROUTES } from "@/lib/routes";
import { useT } from "@/context/LangContext";
import type { TKey } from "@/lib/i18n/translations";
import type { Profile } from "@/types/profile";

function ApprovalLine({ steps, t }: { steps: ApprovalStep[]; t: (k: TKey) => string }) {
  const list = steps;
  return (
    <div className="mt-3 flex items-center gap-1 flex-wrap">
      {list.map((step, idx) => {
        const total = list.length;
        const roleLabel = idx === total - 1
          ? t("approval_full_auth")
          : t("approval_auth_n").replace("{n}", String(idx + 1));
        const actionColor =
          step.action === "approved" ? "text-emerald-600"
          : step.action === "pending"  ? "text-blue-500"
          : step.action === "rejected" ? "text-red-500"
          : "text-zinc-400";
        const bgClass =
          step.action === "approved" ? "bg-emerald-50 border-emerald-200"
          : step.action === "pending"  ? "bg-blue-50 border-blue-200"
          : step.action === "rejected" ? "bg-red-50 border-red-200"
          : "bg-zinc-50 border-zinc-200";
        const stepLabel =
          step.action === "approved" ? t("step_approved")
          : step.action === "pending"  ? t("step_in_progress")
          : step.action === "rejected" ? t("step_rejected")
          : t("step_waiting");
        return (
          <div key={step.order_index} className="flex items-center gap-1">
            {idx > 0 && <span className="text-zinc-300 text-xs">→</span>}
            <div className={`flex flex-col items-center rounded-lg px-2.5 py-1.5 text-center border ${bgClass}`}>
              <span className="text-[0.5625rem] text-zinc-400 leading-tight mb-0.5">{roleLabel}</span>
              <span className="text-[0.75rem] font-bold text-zinc-800 leading-tight">{step.approver_name}</span>
              <span className="text-[0.5625rem] text-zinc-400 leading-tight">{step.approver_position}</span>
              <span className={`text-[0.5625rem] font-bold leading-tight mt-0.5 ${actionColor}`}>
                {stepLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ApprovalListPage() {
  const { profile } = useAuth();
  if (!profile) return null;
  return <ApprovalListPageContent profile={profile} />;
}

function ApprovalListPageContent({ profile }: { profile: Profile }) {
  const router = useRouter();
  const t = useT();
  const [activeTab, setActiveTab] = useState<ApprovalTab>(getDefaultApprovalTab(profile));
  const hideMyDrafts = shouldHideMyDraftsTab(profile);
  const hideInbox = shouldHideInboxTab(profile);
  const showTabBar = !hideMyDrafts && !hideInbox;
  const { drafts, loading: draftsLoading } = useMyDrafts();
  const { items: inboxItems, loading: inboxLoading } = useApprovalInbox();

  const STATUS_LABEL: Record<string, string> = {
    pending:     t("status_pending"),
    in_progress: t("status_in_progress"),
    approved:    t("status_approved"),
    held:        t("status_held"),
    rejected:    t("status_rejected"),
  };
  const STATUS_COLOR: Record<string, string> = {
    pending:     "text-amber-600 bg-amber-50",
    in_progress: "text-blue-600 bg-blue-50",
    approved:    "text-emerald-600 bg-emerald-50",
    held:        "text-zinc-600 bg-zinc-100",
    rejected:    "text-red-600 bg-red-50",
  };

  return (
    <div className="flex flex-col">
      {showTabBar && (
        <div className="sticky top-14 z-20 flex border-b border-zinc-200 bg-white">
          {!hideMyDrafts && (
            <button type="button" onClick={() => setActiveTab("my-drafts")}
              className="relative flex-1 py-3 text-center active:bg-zinc-50">
              <span className={`text-[0.9375rem] font-semibold ${activeTab === "my-drafts" ? "text-[#3b5bdb]" : "text-zinc-500"}`}>
                {t("tab_my_drafts")}
              </span>
              {activeTab === "my-drafts" && (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-full bg-[#3b5bdb]" />
              )}
            </button>
          )}
          {!hideInbox && (
            <button type="button" onClick={() => setActiveTab("inbox")}
              className="relative flex-1 py-3 text-center active:bg-zinc-50">
              <span className={`text-[0.9375rem] font-semibold ${activeTab === "inbox" ? "text-[#3b5bdb]" : "text-zinc-500"}`}>
                {t("tab_inbox")}
              </span>
              {activeTab === "inbox" && (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-full bg-[#3b5bdb]" />
              )}
            </button>
          )}
        </div>
      )}

      {activeTab === "my-drafts" && (
        <div className="px-5 py-4">
          {!hideInbox ? null : (
            <button
              type="button"
              onClick={() => router.push(ROUTES.draft)}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3b5bdb] py-3.5 text-[0.9375rem] font-bold text-white shadow-[0_4px_12px_rgba(59,91,219,0.28)] active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
              {t("draft_new_btn")}
            </button>
          )}
          {draftsLoading ? (
            <p className="py-12 text-center text-sm text-zinc-400">{t("loading")}</p>
          ) : drafts.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">{t("draft_list_empty")}</p>
          ) : (
            <div className="space-y-3">
              {drafts.map((d) => (
                <button key={d.id} type="button"
                  onClick={() => router.push(`${ROUTES.approval}/${d.id}`)}
                  className="block w-full rounded-2xl bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-transform active:scale-[0.98]">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[1rem] font-bold text-zinc-900">{d.title}</h3>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[0.6875rem] font-bold ${STATUS_COLOR[d.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {STATUS_LABEL[d.status] ?? d.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{d.created_at.slice(0, 10)}</p>
                  {(d.status === "in_progress" || d.status === "pending") && (
                    <ApprovalLine steps={d.steps} t={t} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "inbox" && (
        <div className="px-5 py-4">
          {inboxLoading ? (
            <p className="py-12 text-center text-sm text-zinc-400">{t("loading")}</p>
          ) : inboxItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">{t("inbox_empty")}</p>
          ) : (
            <div className="space-y-3">
              {inboxItems.map((item) => (
                <button key={item.stepId} type="button"
                  onClick={() => router.push(`${ROUTES.approval}/${item.draftId}`)}
                  className="block w-full rounded-2xl bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-transform active:scale-[0.98]">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[1rem] font-bold text-zinc-900">{item.title}</h3>
                    <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-600">
                      {t("status_pending")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{item.drafterName} · {item.drafterDept}</p>
                  <p className="mt-1 text-xs text-zinc-400">{item.createdAt.slice(0, 10)}</p>
                  {item.steps && item.steps.length > 0 && (
                    <ApprovalLine steps={item.steps} t={t} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
