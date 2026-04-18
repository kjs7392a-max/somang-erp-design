"use client";

import { useEffect } from "react";
import {
  X,
  Clock,
  MapPin,
  Users,
  Video,
  RefreshCw,
  AlignLeft,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CATEGORY_CONFIG, type CalendarEvent } from "@/types/calendar";

interface CalendarBottomSheetProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export default function CalendarBottomSheet({ event, onClose }: CalendarBottomSheetProps) {
  const isOpen = event !== null;

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const cfg = event ? CATEGORY_CONFIG[event.category] : null;

  return (
    <>
      {/* 백드롭 */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* 시트 */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl transition-transform duration-300 ease-out",
          "max-h-[80vh] overflow-y-auto",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {event && cfg && (
          <div className="px-5 pb-8 pt-2">
            {/* 제목 + 닫기 */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className={cn("w-3 h-3 rounded-full shrink-0 mt-1", cfg.dot)} />
                <h2 className="text-lg font-bold text-gray-900 leading-snug">{event.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* 카테고리 뱃지 */}
            <span className={cn("inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full mb-4", cfg.bg, cfg.color)}>
              {cfg.label} 일정
            </span>

            {/* 상세 정보 목록 */}
            <div className="space-y-3">
              {/* 날짜 / 시간 */}
              <InfoRow icon={<Clock size={16} />}>
                {event.date}
                {event.isAllDay
                  ? " · 하루 종일"
                  : event.startTime
                  ? ` · ${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}`
                  : ""}
              </InfoRow>

              {/* 반복 */}
              {event.isRecurring && (
                <InfoRow icon={<RefreshCw size={16} />}>
                  {event.recurringLabel ?? "반복 일정"}
                </InfoRow>
              )}

              {/* 위치 */}
              {event.location && (
                <InfoRow icon={<MapPin size={16} />}>{event.location}</InfoRow>
              )}

              {/* 설명 */}
              {event.description && (
                <InfoRow icon={<AlignLeft size={16} />}>
                  <span className="whitespace-pre-line">{event.description}</span>
                </InfoRow>
              )}

              {/* 참석자 */}
              {event.attendees && event.attendees.length > 0 && (
                <InfoRow icon={<Users size={16} />}>
                  {event.attendees.join(", ")}
                </InfoRow>
              )}

              {/* Google Meet */}
              {event.meetLink && (
                <InfoRow icon={<Video size={16} className="text-[#2F80ED]" />}>
                  <a
                    href={event.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2F80ED] underline underline-offset-2"
                  >
                    Google Meet 참여
                  </a>
                </InfoRow>
              )}

              {/* Google 동기화 여부 */}
              {event.googleEventId && (
                <InfoRow icon={<Calendar size={16} />}>
                  <span className="text-gray-400">Google Calendar 연동 일정</span>
                </InfoRow>
              )}
            </div>

            {/* 참석 여부 버튼 */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-gray-400 mb-2">참석 여부</p>
                <div className="flex gap-2">
                  {["참석", "미정", "불참"].map((label) => (
                    <button
                      key={label}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                        label === "참석"
                          ? "border-[#2F80ED] text-[#2F80ED] hover:bg-blue-50"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm text-gray-700">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
