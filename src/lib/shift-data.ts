export type ShiftCode = "A" | "S" | "V" | "H" | "OFF" | "D" | "E" | "N" | "DB";

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
  A:   { label: "A",   bg: "#e8f4ff", fg: "#1d6fa5", time: "09:00–18:00", desc: "근무"  },
  S:   { label: "S",   bg: "#fff4e6", fg: "#d97706", time: "—",           desc: "출장"  },
  V:   { label: "V",   bg: "#cffafe", fg: "#0e7490", time: "—",           desc: "연차"  },
  H:   { label: "H",   bg: "#f3f0ff", fg: "#7048e8", time: "—",           desc: "반차"  },
  OFF: { label: "OFF", bg: "#f1f5f7", fg: "#6b8c9a", time: "—",           desc: "휴무"  },
  D:   { label: "D",   bg: "#dbeafe", fg: "#1e40af", time: "07:00–15:30", desc: "낮번"  },
  E:   { label: "E",   bg: "#fef3c7", fg: "#92400e", time: "15:00–23:30", desc: "이브닝"},
  N:   { label: "N",   bg: "#ede9fe", fg: "#5b21b6", time: "23:00–07:30", desc: "나이트"},
  DB:  { label: "DB",  bg: "#fee2e2", fg: "#b91c1c", time: "07:00–23:30", desc: "더블"  },
};

// ── 행정직 근무표 2026년 4월 (April 1 = 수요일) ──
const WEEKDAY_PATTERN: ShiftCode[] = ["A", "A", "A", "OFF", "OFF", "A", "A"];

const ADMIN_BASE: Omit<ShiftMember, "row">[] = [
  { id: "G001", name: "이재훈", role: "주임", isMe: true },
  { id: "G002", name: "박지수", role: "대리" },
  { id: "G003", name: "최하늘", role: "사원" },
  { id: "G004", name: "김성호", role: "사원" },
  { id: "G005", name: "이미래", role: "대리" },
  { id: "G006", name: "정수현", role: "주임" },
  { id: "G007", name: "안준혁", role: "사원" },
];

export const SHIFT_2026_04: ShiftMember[] = ADMIN_BASE.map((m) => ({
  ...m,
  row: Array.from({ length: 30 }, (_, d) => WEEKDAY_PATTERN[d % 7]),
}));

SHIFT_2026_04[0].row[8]  = "V"; // 이재훈 4/9 연차
SHIFT_2026_04[1].row[12] = "S"; // 박지수 4/13 출장
SHIFT_2026_04[1].row[13] = "S"; // 박지수 4/14 출장
SHIFT_2026_04[2].row[16] = "V"; // 최하늘 4/17 연차
SHIFT_2026_04[3].row[20] = "H"; // 김성호 4/21 반차
SHIFT_2026_04[4].row[21] = "S"; // 이미래 4/22 출장
SHIFT_2026_04[5].row[24] = "V"; // 정수현 4/25 연차
SHIFT_2026_04[6].row[15] = "H"; // 안준혁 4/16 반차

// ── 간호사 근무표 2026년 6월 (June 1 = 월요일) ──
// 8일 주기: D D E E N N OFF OFF — 팀원마다 1일씩 어긋남
const NURSE_CYCLE: ShiftCode[] = ["D", "D", "E", "E", "N", "N", "OFF", "OFF"];

// 소망의료재단 간호부 — 병동 근무조 10명
const NURSE_BASE: Omit<ShiftMember, "row">[] = [
  { id: "SM-0024", name: "김미현", role: "수간호사" },
  { id: "SM-0025", name: "사은경", role: "주임"     },
  { id: "SM-0026", name: "최중선", role: "주임"     },
  { id: "SM-0027", name: "임보람", role: "주임"     },
  { id: "SM-0028", name: "신채영", role: "주임"     },
  { id: "SM-0029", name: "윤민주", role: "간호사", isMe: true },
  { id: "SM-0030", name: "이량길", role: "주임"     },
  { id: "SM-0033", name: "전혜주", role: "간호사"   },
  { id: "SM-0034", name: "박미나", role: "간호사"   },
  { id: "SM-0035", name: "배소영", role: "간호사"   },
];

export const SHIFT_2026_06_NURSE: ShiftMember[] = NURSE_BASE.map((m, idx) => ({
  ...m,
  row: Array.from({ length: 30 }, (_, d) => NURSE_CYCLE[(d + idx) % 8]),
}));

// 개별 오버라이드
SHIFT_2026_06_NURSE[0].row[7]  = "DB"; // 김미현  6/8  더블
SHIFT_2026_06_NURSE[2].row[14] = "DB"; // 최중선  6/15 더블
SHIFT_2026_06_NURSE[5].row[11] = "DB"; // 윤민주  6/12 더블
SHIFT_2026_06_NURSE[7].row[20] = "DB"; // 전혜주  6/21 더블
SHIFT_2026_06_NURSE[9].row[25] = "DB"; // 배소영  6/26 더블
SHIFT_2026_06_NURSE[3].row[17] = "V";  // 임보람  6/18 연차
SHIFT_2026_06_NURSE[6].row[9]  = "H";  // 이량길  6/10 반차
SHIFT_2026_06_NURSE[8].row[3]  = "V";  // 박미나  6/4  연차

// ── 데이터셋 메타 ──
export type ShiftDataset = {
  members: ShiftMember[];
  year: number;
  month: number;
  days: number;
  firstWeekdayIdx: number; // "일월화수목금토" 기준 (0=일)
};

export const ADMIN_DATASET: ShiftDataset = {
  members: SHIFT_2026_04,
  year: 2026, month: 4, days: 30,
  firstWeekdayIdx: 3, // 4월 1일 = 수요일
};

export const NURSE_DATASET: ShiftDataset = {
  members: SHIFT_2026_06_NURSE,
  year: 2026, month: 6, days: 30,
  firstWeekdayIdx: 1, // 6월 1일 = 월요일
};
