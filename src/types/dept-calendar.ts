// 공유 스키마(Supabase)와 1:1 대응 타입. 대시보드·모바일 공통.

export type WardShift = {
  id: string;
  corporationId: string;
  department: string;
  ward: string | null;
  staffId: string | null;
  staffName: string | null;
  workDate: string;   // "YYYY-MM-DD"
  shiftCode: string;  // D/E/N/OFF/V/H/DB …
};

export type Leave = {
  id: string;
  corporationId: string;
  department: string;
  staffId: string | null;
  staffName: string | null;
  leaveType: string;  // annual/sick/… (표시 매핑은 draft-forms VACATION_TYPES)
  startDate: string;  // "YYYY-MM-DD"
  endDate: string;    // "YYYY-MM-DD"
  status: string;     // 신청/승인/반려
  sourceDraftId: string | null;
  memo: string | null;
};

export type DeptEvent = {
  id: string;
  corporationId: string;
  department: string;
  title: string;
  category: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  memo: string | null;
};

export type DateRange = { start: string; end: string }; // "YYYY-MM-DD"
