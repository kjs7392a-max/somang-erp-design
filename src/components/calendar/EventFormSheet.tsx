"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Lock, Globe } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";

export type EventFormSheetProps = {
  open: boolean;
  onClose: () => void;
  /** 미리 채울 날짜 (YYYY-MM-DD) */
  defaultDate: string;
  /** 수정할 기존 이벤트 (개인 일정). 없으면 새로 추가. */
  editing?: CalendarEvent | null;
  onSave: (evt: CalendarEvent) => void;
  onDelete?: (id: string) => void;
};

export function EventFormSheet({
  open,
  onClose,
  defaultDate,
  editing,
  onSave,
  onDelete,
}: EventFormSheetProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [memo, setMemo] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setTitle(editing.title);
        setDate(editing.date);
        setStartTime(editing.startTime ?? "09:00");
        setEndTime(editing.endTime ?? "10:00");
        setLocation(editing.location ?? "");
        setMemo(editing.memo ?? "");
        setIsPrivate(!!editing.isPrivate);
      } else {
        setTitle("");
        setDate(defaultDate);
        setStartTime("09:00");
        setEndTime("10:00");
        setLocation("");
        setMemo("");
        setIsPrivate(false);
      }
    }
  }, [open, editing, defaultDate]);

  if (!open) return null;

  const canSave = title.trim().length > 0 && date.length === 10;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: editing?.id ?? `p-${Date.now()}`,
      title: title.trim(),
      date,
      startTime,
      endTime,
      category: "personal",
      isPrivate,
      location: location.trim() || undefined,
      memo: memo.trim() || undefined,
      mine: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      {/* 백드롭 */}
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute inset-0 bg-black/40"
      />
      {/* 시트 */}
      <div className="relative w-full max-w-[430px] rounded-t-3xl bg-white pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100"
            aria-label="닫기"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          <h2 className="text-[1.0625rem] font-bold text-zinc-900">
            {editing ? "개인 일정 수정" : "개인 일정 추가"}
          </h2>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              canSave
                ? "bg-[#3b5bdb] text-white active:opacity-80"
                : "bg-zinc-100 text-zinc-400"
            }`}
          >
            저장
          </button>
        </div>

        {/* 본문 */}
        <div className="max-h-[70vh] overflow-y-auto px-5 pt-4">
          <Label>제목</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 치과 예약"
            className="mb-4 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[0.9375rem] outline-none focus:border-[#3b5bdb]"
          />

          <Label>날짜</Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mb-4 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[0.9375rem] outline-none focus:border-[#3b5bdb]"
          />

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <Label>시작</Label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[0.9375rem] outline-none focus:border-[#3b5bdb]"
              />
            </div>
            <div>
              <Label>종료</Label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[0.9375rem] outline-none focus:border-[#3b5bdb]"
              />
            </div>
          </div>

          <Label>장소 (선택)</Label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예) 강남 치과"
            className="mb-4 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[0.9375rem] outline-none focus:border-[#3b5bdb]"
          />

          <Label>메모 (선택)</Label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="mb-4 w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-[0.9375rem] outline-none focus:border-[#3b5bdb]"
          />

          {/* 공개 여부 토글 */}
          <div className="mb-4 flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
            <div className="flex items-center gap-2">
              {isPrivate ? (
                <Lock className="h-4 w-4 text-zinc-600" strokeWidth={2} />
              ) : (
                <Globe className="h-4 w-4 text-zinc-600" strokeWidth={2} />
              )}
              <div>
                <p className="text-[0.9375rem] font-semibold text-zinc-900">
                  {isPrivate ? "비공개" : "공개"}
                </p>
                <p className="text-xs text-zinc-500">
                  {isPrivate ? "본인만 볼 수 있어요" : "같은 부서원이 볼 수 있어요"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                isPrivate ? "bg-zinc-700" : "bg-[#3b5bdb]"
              }`}
              aria-label="공개 여부 전환"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  isPrivate ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* 삭제 (수정 모드에서만) */}
          {editing && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(editing.id);
                onClose();
              }}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 active:bg-red-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              일정 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-xs font-semibold text-zinc-500">{children}</p>
  );
}