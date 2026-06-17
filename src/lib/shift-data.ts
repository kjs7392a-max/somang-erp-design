export type ShiftCode = "A" | "S" | "V" | "H" | "OFF";

export type ShiftMember = {
  id: string;
  name: string;
  role: string;
  isMe?: boolean;
  row: ShiftCode[];
};

export const SHIFT_CODE_META: Record<
  ShiftCode,
  { label: string; bg: string; fg: string; time: string; desc: string }
> = {
  A:   { label: "A",   bg: "#e8f4ff", fg: "#1d6fa5", time: "09:00–18:00", desc: "근무" },
  S:   { label: "S",   bg: "#fff4e6", fg: "#d97706", time: "—",           desc: "출장" },
  V:   { label: "V",   bg: "#cffafe", fg: "#0e7490", time: "—",           desc: "연차" },
  H:   { label: "H",   bg: "#f3f0ff", fg: "#7048e8", time: "—",           desc: "반차" },
  OFF: { label: "OFF", bg: "#f1f5f7", fg: "#6b8c9a", time: "—",           desc: "휴무" },
};

// April 1, 2026 = Wednesday → 7일 주기: 수목금토일월화
const WEEKDAY_PATTERN: ShiftCode[] = ["A", "A", "A", "OFF", "OFF", "A", "A"];

const BASE_MEMBERS: Omit<ShiftMember, "row">[] = [
  { id: "G001", name: "이재훈", role: "주임",   isMe: true },
  { id: "G002", name: "박지수", role: "대리"              },
  { id: "G003", name: "최하늘", role: "사원"              },
  { id: "G004", name: "김성호", role: "사원"              },
  { id: "G005", name: "이미래", role: "대리"              },
  { id: "G006", name: "정수현", role: "주임"              },
  { id: "G007", name: "안준혁", role: "사원"              },
];

export const SHIFT_2026_04: ShiftMember[] = BASE_MEMBERS.map((m) => {
  const row: ShiftCode[] = Array.from(
    { length: 30 },
    (_, d) => WEEKDAY_PATTERN[d % 7],
  );
  return { ...m, row };
});

// 개별 오버라이드 (주말 제외 평일 기준)
SHIFT_2026_04[0].row[8]  = "V";   // 이재훈 4/9 (목) 연차
SHIFT_2026_04[1].row[12] = "S";   // 박지수 4/13 (월) 출장
SHIFT_2026_04[1].row[13] = "S";   // 박지수 4/14 (화) 출장
SHIFT_2026_04[2].row[16] = "V";   // 최하늘 4/17 (금) 연차
SHIFT_2026_04[3].row[20] = "H";   // 김성호 4/21 (화) 반차
SHIFT_2026_04[4].row[21] = "S";   // 이미래 4/22 (수) 출장
SHIFT_2026_04[5].row[24] = "V";   // 정수현 4/25 (토→실제 금 25일) 연차
SHIFT_2026_04[6].row[15] = "H";   // 안준혁 4/16 (목) 반차
