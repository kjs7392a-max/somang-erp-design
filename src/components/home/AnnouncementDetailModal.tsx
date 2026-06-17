"use client";

import { useEffect } from "react";
import { X, Pin, User, Building2, Calendar } from "lucide-react";
import type { Announcement } from "@/lib/home-data";
import { getAnnouncementText } from "@/lib/home-data";
import { useT, useLang } from "@/context/LangContext";

type Props = {
  item: Announcement | null;
  onClose: () => void;
};

export function AnnouncementDetailModal({ item, onClose }: Props) {
  const t = useT();
  const lang = useLang();

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [item, onClose]);

  if (!item) return null;

  const { title, body } = getAnnouncementText(item, lang);
  const content = (lang !== "ko" && item.bodyI18n?.[lang]) || item.content || item.body;
  const scopeLabel = item.scope === "company" ? t("notice_company") : t("notice_dept");

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 animate-[fadeIn_0.2s_ease-out]" />

      <div
        className="relative w-full max-w-[430px] max-h-[85vh] flex flex-col rounded-t-2xl bg-white shadow-2xl animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-300" />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-3">
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-md bg-[#eef1ff] px-1.5 py-0.5 text-[0.6875rem] font-semibold text-[#3b5bdb]">
                {scopeLabel}
              </span>
              {item.pinned && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-red-600">
                  <Pin className="h-2.5 w-2.5" strokeWidth={2.5} />
                  {t("notice_pinned")}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold leading-snug text-zinc-900">
              {title}
            </h2>
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

        <div className="px-5 pb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 border-b border-zinc-100">
          {item.author && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" strokeWidth={2.2} />
              {item.author}
            </span>
          )}
          {item.department && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" strokeWidth={2.2} />
              {item.department}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" strokeWidth={2.2} />
            {item.date}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {content}
          </p>
        </div>

        <div className="px-5 py-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            {t("action_confirm")}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
