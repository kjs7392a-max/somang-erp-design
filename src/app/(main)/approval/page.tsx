"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMyDrafts } from "@/hooks/useMyDrafts";
import { useApprovalInbox } from "@/hooks/useApprovalInbox";
import { getDefaultApprovalTab, shouldHideMyDraftsTab, type ApprovalTab } from "@/lib/approval-roles";
import { ROUTES } from "@/lib/routes";
import type { Profile } from "@/types/profile";

export default function ApprovalListPage() {
  const { profile } = useAuth();
  if (!profile) return null;
  return <ApprovalListPageContent profile={profile} />;
}

function ApprovalListPageContent({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ApprovalTab>(
    getDefaultApprovalTab(profile)
  );
  const hideMyDrafts = shouldHideMyDraftsTab(profile);

  const { drafts, loading: draftsLoading } = useMyDrafts();
  const { items: inboxItems, loading: inboxLoading } = useApprovalInbox();

  const STATUS_LABEL: Record<string, string> = {
    pending: "대기중",
    in_progress: "진행중",
    approved: "승인",
    held: "보류",
    rejected: "반려",
  };
  const STATUS_COLOR: Record<string, string> = {
    pending: "text-amber-600 bg-amber-50",
    in_progress: "text-blue-600 bg-blue-50",
    approved: "text-emerald-600 bg-emerald-50",
    held: "text-zinc-600 bg-zinc-100",
    rejected: "text-red-600 bg-red-50",
  };

  return (
    <div className="flex flex-col">
      {/* 외부 탭 바 */}
      <div className="sticky top-14 z-20 flex border-b border-zinc-200 bg-white">
        {!hideMyDrafts && (
          <button
            type="button"
            onClick={() => setActiveTab("my-drafts")}
            className="relative flex-1 py-3 text-center active:bg-zinc-50"
          >
            <span className={`text-[0.9375rem] font-semibold ${activeTab === "my-drafts" ? "text-[#3b5bdb]" : "text-zinc-500"}`}>
              내 기안함
            </span>
            {activeTab === "my-drafts" && (
              <span className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-full bg-[#3b5bdb]" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab("inbox")}
          className="relative flex-1 py-3 text-center active:bg-zinc-50"
        >
          <span className={`text-[0.9375rem] font-semibold ${activeTab === "inbox" ? "text-[#3b5bdb]" : "text-zinc-500"}`}>
            결재함
          </span>
          {activeTab === "inbox" && (
            <span className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-full bg-[#3b5bdb]" />
          )}
        </button>
      </div>

      {/* 내 기안함 */}
      {activeTab === "my-drafts" && (
        <div className="px-5 py-4">
          {draftsLoading ? (
            <p className="py-12 text-center text-sm text-zinc-400">불러오는 중...</p>
          ) : drafts.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">제출한 기안이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {drafts.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => router.push(`${ROUTES.approval}/${d.id}`)}
                  className="block w-full rounded-2xl bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-transform active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[1rem] font-bold text-zinc-900">{d.title}</h3>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[0.6875rem] font-bold ${STATUS_COLOR[d.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {STATUS_LABEL[d.status] ?? d.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{d.created_at.slice(0, 10)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 결재함 */}
      {activeTab === "inbox" && (
        <div className="px-5 py-4">
          {inboxLoading ? (
            <p className="py-12 text-center text-sm text-zinc-400">불러오는 중...</p>
          ) : inboxItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">결재할 문서가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {inboxItems.map((item) => (
                <button
                  key={item.stepId}
                  type="button"
                  onClick={() => router.push(`${ROUTES.approval}/${item.draftId}`)}
                  className="block w-full rounded-2xl bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-transform active:scale-[0.98]"
                >
                  <h3 className="text-[1rem] font-bold text-zinc-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{item.drafterName} · {item.drafterDept}</p>
                  <p className="mt-1 text-xs text-zinc-400">{item.createdAt.slice(0, 10)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
