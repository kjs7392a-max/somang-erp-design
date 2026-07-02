import { createClient } from "@/lib/supabase";
import type { WardShift, Leave, DateRange } from "@/types/dept-calendar";

/** 근무표(간호 전병동). month = "YYYY-MM" */
export async function getWardShifts(
  corporationId: string,
  department: string,
  month: string,
): Promise<WardShift[]> {
  const supabase = createClient();
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
  const { data, error } = await supabase
    .from("dept_shifts")
    .select("id, corporation_id, department, ward, staff_id, staff_name, work_date, shift_code")
    .eq("corporation_id", corporationId)
    .eq("department", department)
    .gte("work_date", start)
    .lte("work_date", end)
    .order("work_date", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    corporationId: r.corporation_id,
    department: r.department,
    ward: r.ward,
    staffId: r.staff_id,
    staffName: r.staff_name,
    workDate: r.work_date,
    shiftCode: r.shift_code,
  }));
}

/** 부서원 휴가 목록 */
export async function getDeptLeaves(
  corporationId: string,
  department: string,
  range: DateRange,
): Promise<Leave[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leaves")
    .select("id, corporation_id, department, staff_id, staff_name, leave_type, start_date, end_date, status, source_draft_id, memo")
    .eq("corporation_id", corporationId)
    .eq("department", department)
    .gte("start_date", range.start)
    .lte("start_date", range.end)
    .order("start_date", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    corporationId: r.corporation_id,
    department: r.department,
    staffId: r.staff_id,
    staffName: r.staff_name,
    leaveType: r.leave_type,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    sourceDraftId: r.source_draft_id,
    memo: r.memo,
  }));
}
