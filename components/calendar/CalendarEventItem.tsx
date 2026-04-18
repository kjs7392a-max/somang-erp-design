import { cn } from "@/lib/utils/cn";
import { CATEGORY_CONFIG, type CalendarEvent } from "@/types/calendar";

interface CalendarEventItemProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

export default function CalendarEventItem({ event, compact, onClick }: CalendarEventItemProps) {
  const cfg = CATEGORY_CONFIG[event.category];

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn("w-full text-left rounded px-1 py-0.5 truncate text-[10px] font-medium", cfg.bg, cfg.color)}
      >
        {event.title}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 bg-white rounded-xl px-4 py-3 shadow-sm active:bg-gray-50 text-left"
    >
      <div className={cn("w-1 self-stretch rounded-full shrink-0 mt-0.5", cfg.dot)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {event.isAllDay
            ? "하루 종일"
            : event.startTime
            ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}`
            : ""}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </div>
      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0", cfg.bg, cfg.color)}>
        {cfg.label}
      </span>
    </button>
  );
}
