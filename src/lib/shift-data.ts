export type ShiftCode = "D" | "E" | "N" | "O" | "V" | "T";

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
  D: { label: "Day",     bg: "#fff7e6", fg: "#d97706", time: "07:00–15:00",    desc: "데이 (오전)" },
  E: { label: "Evening", bg: "#fef2f2", fg: "#dc2626", time: "15:00–23:00",    desc: "이브닝 (오후)" },
  N: { label: "Night",   bg: "#eef2ff", fg: "#4f46e5", time: "23:00–익일 07:00", desc: "나이트 (야간)" },
  O: { label: "Off",     bg: "#f1f5f7", fg: "#6b8c9a", time: "—",              desc: "오프 (휴무)" },
  V: { label: "Vac",     bg: "#cffafe", fg: "#0e7490", time: "—",              desc: "연차" },
  T: { label: "Train",   bg: "#fef3c7", fg: "#a16207", time: "—",              desc: "교육" },
};

const BASE_MEMBERS = [
  { id: "N001", name: "윤민주", role: "간호사",     isMe: true  },
  { id: "N002", name: "김미현", role: "수간호사"                },
  { id: "N003", name: "함수정", role: "수간호사"                },
  { id: "N004", name: "사은경", role: "주임간호사"              },
  { id: "N005", name: "최중선", role: "주임간호사"              },
  { id: "N006", name: "임보람", role: "주임간호사"              },
  { id: "N007", name: "신채영", role: "주임간호사"              },
];

const PATTERNS: ShiftCode[][] = [
  ["D","D","E","E","N","N","O","O"],
  ["D","D","D","D","D","O","O"],
  ["E","E","N","N","O","O","D","D"],
  ["N","N","O","O","D","D","E","E"],
  ["O","O","D","D","E","E","N","N"],
  ["E","N","O","D","E","N","O","D"],
  ["D","E","N","O","D","E","N","O"],
];

export const SHIFT_2026_04: ShiftMember[] = BASE_MEMBERS.map((m, i) => {
  const pat = PATTERNS[i] ?? (["D","E","N","O"] as ShiftCode[]);
  const row: ShiftCode[] = Array.from({ length: 30 }, (_, d) => pat[d % pat.length]);
  return { ...m, row };
});

// 개별 오버라이드
SHIFT_2026_04[0].row[16] = "V"; // 박지영 4/17
SHIFT_2026_04[0].row[24] = "V"; // 박지영 4/25
SHIFT_2026_04[0].row[21] = "T"; // 박지영 4/22
SHIFT_2026_04[2].row[19] = "V"; // 이연주 4/20
SHIFT_2026_04[3].row[22] = "V"; // 최유진 4/23
SHIFT_2026_04[5].row[27] = "T"; // 조민서 4/28
SHIFT_2026_04[6].row[10] = "V"; // 윤서아 4/11
