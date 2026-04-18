"use client";

import { useState } from "react";
import { CalendarView } from "@/components/views/CalendarView";

export default function CalendarPage() {
  const [scheduleCurrentDate, setScheduleCurrentDate] = useState(
    () => new Date(2026, 3, 1),
  );
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(18);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(true);

  return (
    <CalendarView
      scheduleCurrentDate={scheduleCurrentDate}
      onScheduleCurrentDateChange={setScheduleCurrentDate}
      selectedCalendarDay={selectedCalendarDay}
      onSelectedCalendarDayChange={setSelectedCalendarDay}
      googleCalendarConnected={googleCalendarConnected}
      onGoogleCalendarConnectedChange={setGoogleCalendarConnected}
    />
  );
}
