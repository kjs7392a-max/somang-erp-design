"use client";

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isGoogleConnected?: boolean;
}

export default function CalendarHeader({
  year,
  month,
  onPrev,
  onNext,
  onToday,
  isGoogleConnected = false,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-base font-bold text-gray-900 min-w-[90px] text-center">
          {year}년 {month + 1}월
        </h2>
        <button
          onClick={onNext}
          className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="text-xs font-medium text-[#2F80ED] border border-[#2F80ED] rounded-full px-3 py-1 hover:bg-blue-50 active:bg-blue-100"
        >
          오늘
        </button>
        <button
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full border transition-colors",
            isGoogleConnected
              ? "border-emerald-400 text-emerald-600 bg-emerald-50"
              : "border-gray-300 text-gray-400 hover:bg-gray-50"
          )}
        >
          <RefreshCw size={12} />
          <span>{isGoogleConnected ? "연동됨" : "Google"}</span>
        </button>
      </div>
    </div>
  );
}
