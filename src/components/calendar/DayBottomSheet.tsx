"use client";

import { X, Lock, Plus, MapPin, Pencil } from "lucide-react";
import type { CalendarEvent, EventCategory } from "@/types/calendar";
import { CATEGORY_META } from "@/types/calendar";
import { useT } from "@/context/LangContext";
import type { TKey } from "@/lib/i18n/translations";

const CAT_KEYS: Record<EventCategory, TKey> = {
  shift:    "cat_shift",
  meeting:  "cat_meeting",
  training: "cat_training",
  event:    "cat_event",
  deadline: "cat_deadline",
  personal: "cat_personal",
};

export type DayBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  date: string;
  events: CalendarEvent[];
  onAdd: () => void;
  onEditPersonal: (evt: CalendarEvent) => void;
  onStartLeave?: (date: string) => void;
};

export function DayBottomSheet({
  open,
  onClose,
  date,
  events,
  onAdd,
  onEditPersonal,
  onStartLeave,
}: DayBottomSheetProps) {
  const t = useT();

  if (!open) return null;

  const d = new Date(date + "T00:00:00");
  const weekdays = t("cal_weekdays").split(",");
  const weekday = weekdays[d.getDay()] ?? "";
  const title = t("cal_day_title")
    .replace("{month}", String(d.getMonth() + 1))
    .replace("{day}", String(d.getDate()))
    .replace("{weekday}", weekday);

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center">
      <button
        type="button"
        onClick={onClose}
        aria-label={t("action_close")}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-[430px] rounded-t-3xl bg-white pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100"
            aria-label={t("action_close")}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          <h2 className="text-[1.0625rem] font-bold text-zinc-900">{title}</h2>
          <button
            type="button"
            onClick={onAdd}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b5bdb] text-white active:opacity-80"
            aria-label={t("cal_add_personal_btn")}
          >
            <Plus className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-zinc-400">
              <p className="text-sm">{t("cal_no_events")}</p>
              <button
                type="button"
                onClick={onAdd}
                className="mt-2 rounded-full bg-[#3b5bdb] px-4 py-2 text-sm font-semibold text-white"
              >
                + {t("cal_add_personal_btn")}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.map((evt) => {
                const meta = CATEGORY_META[evt.category];
                const editable = evt.category === "personal" && evt.mine;
                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => editable && onEditPersonal(evt)}
                    className={`flex w-full items-start gap-3 rounded-xl border border-zinc-100 bg-white p-3 text-left ${
                      editable ? "active:bg-zinc-50" : "cursor-default"
                    }`}
                  >
                    <span
                      className="mt-1 h-10 w-1 shrink-0 rounded-full"
                      style={{ background: meta.color }}
                    />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[0.625rem] font-bold"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {t(CAT_KEYS[evt.category])}
                        </span>
                        {evt.isPrivate && (
                          <Lock className="h-3 w-3 text-zinc-400" strokeWidth={2.2} />
                        )}
                        {editable && (
                          <Pencil className="ml-auto h-3.5 w-3.5 text-zinc-400" strokeWidth={2} />
                        )}
                      </div>
                      <p className="text-[0.9375rem] font-semibold text-zinc-900">
                        {evt.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500">
                        {evt.startTime && (
                          <span>
                            {evt.startTime}
                            {evt.endTime ? ` - ${evt.endTime}` : ""}
                          </span>
                        )}
                        {evt.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" strokeWidth={2} />
                            {evt.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {onStartLeave && (
          <div className="px-5 pt-0 pb-4">
            <button
              type="button"
              onClick={() => { onClose(); onStartLeave(date); }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #2d5c6e, #1e4554)" }}
            >
              🌴 {t("cal_day_leave_btn")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
