export type EventCategory = "personal" | "department" | "company";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
  category: EventCategory;
  location?: string;
  description?: string;
  attendees?: string[];
  meetLink?: string;
  isRecurring?: boolean;
  recurringLabel?: string;
  isAllDay?: boolean;
  googleEventId?: string;
}

export const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; bg: string; dot: string }> = {
  personal:   { label: "개인",   color: "text-[#2F80ED]", bg: "bg-blue-50",   dot: "bg-[#2F80ED]" },
  department: { label: "부서",   color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  company:    { label: "전사",   color: "text-purple-600", bg: "bg-purple-50",  dot: "bg-purple-500" },
};
