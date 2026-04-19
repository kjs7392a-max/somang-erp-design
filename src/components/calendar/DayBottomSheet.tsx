"use client";

import { X, Lock, Plus, MapPin, Pencil } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";
import { CATEGORY_META } from "@/types/calendar";

export type DayBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  date: string;
  events: CalendarEvent[];
  onAdd: () => void;
  onEditPersonal: (evt: CalendarEvent) => void;
};

export function DayBottomSheet({
  open,
  onClose,
  date,
  events,
  onAdd,
  onEditPersonal,
}: DayBottomSheetProps) {
  if (!open) return null;

  const d = new Date(date + "T00:00:00");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const title = `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-[430px] rounded-t-3xl bg-white pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100"
            aria-label="닫기"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          <h2 className="text-[1.0625rem] font-bold text-zinc-900">{title}</h2>
          <button
            type="button"
            onClick={onAdd}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b5bdb] text-white active:opacity-80"
            aria-label="일정 추가"
          >
            <Plus className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-zinc-400">
              <p className="text-sm">일정이 없어요</p>
              <button
                type="button"
                onClick={onAdd}
                className="mt-2 rounded-full bg-[#3b5bdb] px-4 py-2 text-sm font-semibold text-white"
              >
                + 개인 일정 추가
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
                          {meta.label}
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
      </div>
    </div>
  );
}