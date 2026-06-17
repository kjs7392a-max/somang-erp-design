# 디자인 시스템 포팅 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Design System ZIP의 4개 프로토타입 컴포넌트(알림/근무표/휴가 프리필/PDF 미리보기)를 기존 Next.js 앱에 TypeScript로 포팅한다.

**Architecture:** 알림은 React Context로 글로벌 관리, 탭 간 프리필은 URL query params(`/draft?form=vacation&start=...&end=...`), 근무표는 CalendarView 내 토글, PDF는 ApprovalDetailView 내 로컬 state.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, Tailwind CSS v4, lucide-react

---

## 파일 맵

**신규 생성:**
```
src/lib/notifications.ts
src/context/NotificationsContext.tsx
src/components/layout/Providers.tsx
src/components/notifications/HeadsUpToast.tsx
src/components/notifications/NotifList.tsx
src/lib/shift-data.ts
src/components/shift/ShiftDayDetail.tsx
src/components/shift/ShiftTable.tsx
src/components/pdf/ApprovalStamp.tsx
src/components/pdf/PdfBody.tsx
src/components/pdf/PdfPreviewSheet.tsx
```

**수정:**
```
src/app/layout.tsx                           — Providers + Noto Serif KR 폰트
src/app/globals.css                          — notifSlideDown/Up 키프레임
src/components/layout/AppHeader.tsx          — 🔔 벨 + NotifList
src/components/views/CalendarView.tsx        — 토글 + 휴가 신청 버튼
src/components/calendar/DayBottomSheet.tsx   — onStartLeave prop
src/components/draft/DraftComposeView.tsx    — initialStartDate/EndDate props
src/components/views/DraftView.tsx           — prefill prop
src/app/(main)/draft/page.tsx                — useSearchParams
src/components/views/ApprovalDetailView.tsx  — PDF 버튼 + status prop
```

---

## Task 1: 알림 타입 + Context

**Files:**
- Create: `src/lib/notifications.ts`
- Create: `src/context/NotificationsContext.tsx`

- [ ] **Step 1: `src/lib/notifications.ts` 생성**

```typescript
export type NotifKind = "approval" | "rejected" | "approved" | "notice" | "withdraw" | "shift";

export type NotifDeeplink =
  | { type: "approval"; docId: string }
  | { type: "mydoc"; docId: string }
  | { type: "notice"; noticeId: string }
  | { type: "shift" }
  | { type: "none" };

export type Notif = {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  deeplink: NotifDeeplink;
};

export const NOTIF_KIND_META: Record<NotifKind, { icon: string; label: string; color: string }> = {
  approval: { icon: "📥", label: "결재 요청", color: "#2563eb" },
  rejected:  { icon: "❌", label: "결재 반려", color: "#dc2626" },
  approved:  { icon: "✅", label: "결재 완료", color: "#16a34a" },
  notice:    { icon: "📢", label: "공지",      color: "#f59e0b" },
  withdraw:  { icon: "↩️", label: "기안 회수", color: "#8b5cf6" },
  shift:     { icon: "🕐", label: "근무 변경", color: "#0891b2" },
};

export const NOTIF_KIND_BAR: Record<NotifKind, string> = {
  approved:  "#16a34a",
  rejected:  "#dc2626",
  approval:  "#2563eb",
  notice:    "#f59e0b",
  withdraw:  "#8b5cf6",
  shift:     "#0891b2",
};

export function notifTimeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)         return "방금";
  if (diff < 3600)       return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 7 * 86400)  return `${Math.floor(diff / 86400)}일 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function seedDate(msAgo: number) {
  return new Date(Date.now() - msAgo).toISOString();
}

export const NOTIF_SEED: Notif[] = [
  {
    id: "NT-101", kind: "approval",
    title: "이재훈 — 연차 신청서",
    body: "결재가 도착했어요. 4/22~4/24 (3일)",
    at: seedDate(35 * 60 * 1000),
    read: false,
    deeplink: { type: "approval", docId: "D-0421-01" },
  },
  {
    id: "NT-102", kind: "notice",
    title: "정기 건강검진 안내",
    body: "2026.04.20 ~ 05.03 · 1층 검진센터",
    at: seedDate(5 * 3600 * 1000),
    read: false,
    deeplink: { type: "notice", noticeId: "N001" },
  },
  {
    id: "NT-103", kind: "approved",
    title: "야간근무 수당 신청 승인",
    body: "최종 승인되었습니다 (총무과장)",
    at: seedDate(22 * 3600 * 1000),
    read: true,
    deeplink: { type: "mydoc", docId: "D-0418-02" },
  },
  {
    id: "NT-104", kind: "shift",
    title: "근무표 변경",
    body: "4/26 (일) D → O 로 변경되었어요",
    at: seedDate(26 * 3600 * 1000),
    read: true,
    deeplink: { type: "shift" },
  },
  {
    id: "NT-105", kind: "rejected",
    title: "교육비 품의 반려",
    body: "예산 항목 재검토 요청 — 정하늘 과장",
    at: seedDate(2 * 24 * 3600 * 1000),
    read: true,
    deeplink: { type: "mydoc", docId: "D-0415-09" },
  },
];
```

- [ ] **Step 2: `src/context/NotificationsContext.tsx` 생성**

```tsx
"use client";

import {
  createContext, useCallback, useContext, useReducer, useRef,
} from "react";
import type { Notif, NotifKind, NotifDeeplink } from "@/lib/notifications";
import { NOTIF_SEED } from "@/lib/notifications";

export type NotifInput = {
  kind: NotifKind;
  title: string;
  body: string;
  deeplink: NotifDeeplink;
};

type State = { notifications: Notif[]; headsUp: Notif | null };

type Action =
  | { type: "PUSH"; notif: Notif }
  | { type: "DISMISS_HEADS_UP" }
  | { type: "MARK_READ"; id: string }
  | { type: "MARK_ALL_READ" }
  | { type: "CLEAR_ALL" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PUSH":
      return { notifications: [action.notif, ...state.notifications], headsUp: action.notif };
    case "DISMISS_HEADS_UP":
      return { ...state, headsUp: null };
    case "MARK_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };
    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    case "CLEAR_ALL":
      return { notifications: [], headsUp: null };
  }
}

type NotificationsCtx = {
  notifications: Notif[];
  headsUp: Notif | null;
  unreadCount: number;
  push: (input: NotifInput) => void;
  dismissHeadsUp: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
};

const NotificationsContext = createContext<NotificationsCtx | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { notifications: NOTIF_SEED, headsUp: null });
  const counter = useRef(200);

  const push = useCallback((input: NotifInput) => {
    const notif: Notif = {
      id: `NT-${++counter.current}`,
      ...input,
      at: new Date().toISOString(),
      read: false,
    };
    dispatch({ type: "PUSH", notif });
  }, []);

  const dismissHeadsUp = useCallback(() => dispatch({ type: "DISMISS_HEADS_UP" }), []);
  const markRead       = useCallback((id: string) => dispatch({ type: "MARK_READ", id }), []);
  const markAllRead    = useCallback(() => dispatch({ type: "MARK_ALL_READ" }), []);
  const clearAll       = useCallback(() => dispatch({ type: "CLEAR_ALL" }), []);

  return (
    <NotificationsContext.Provider
      value={{
        ...state,
        unreadCount: state.notifications.filter((n) => !n.read).length,
        push, dismissHeadsUp, markRead, markAllRead, clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}
```

- [ ] **Step 3: `npm run dev` 실행 후 TypeScript 에러 없음 확인**

```bash
npm run dev
```
브라우저에서 `localhost:3000` 접속, 기존 화면 그대로 동작하면 OK.

- [ ] **Step 4: commit**

```bash
git add src/lib/notifications.ts src/context/NotificationsContext.tsx
git commit -m "feat: add notifications types and context"
```

---

## Task 2: 헤드업 토스트 + 알림함 UI

**Files:**
- Create: `src/components/notifications/HeadsUpToast.tsx`
- Create: `src/components/notifications/NotifList.tsx`
- Create: `src/components/layout/Providers.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/layout/AppHeader.tsx`

- [ ] **Step 1: `globals.css`에 슬라이드 애니메이션 추가**

`src/app/globals.css` 끝에 추가:
```css
@keyframes notifSlideDown {
  from { opacity: 0; transform: translateY(-100%); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes notifSlideUp {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-100%); }
}
```

- [ ] **Step 2: `src/components/notifications/HeadsUpToast.tsx` 생성**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationsContext";
import { NOTIF_KIND_META, NOTIF_KIND_BAR } from "@/lib/notifications";
import { ROUTES } from "@/lib/routes";

export function HeadsUpToast() {
  const { headsUp, dismissHeadsUp, markRead } = useNotifications();
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      dismissHeadsUp();
      setClosing(false);
    }, 220);
  }, [dismissHeadsUp]);

  useEffect(() => {
    if (!headsUp) return;
    setClosing(false);
    timerRef.current = setTimeout(close, 4500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [headsUp?.id, close]);

  if (!headsUp) return null;

  const meta = NOTIF_KIND_META[headsUp.kind];
  const barColor = NOTIF_KIND_BAR[headsUp.kind] ?? "#64748b";

  const handleTap = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    markRead(headsUp.id);
    close();
    const dl = headsUp.deeplink;
    if (dl.type === "approval") router.push(ROUTES.approval);
    else if (dl.type === "mydoc") router.push(ROUTES.approval);
    else if (dl.type === "notice") router.push(ROUTES.home);
    else if (dl.type === "shift") router.push(ROUTES.calendar);
  };

  return (
    <div
      className="fixed left-3 right-3 z-[200]"
      style={{
        top: 12,
        animation: closing
          ? "notifSlideUp 0.22s ease-in forwards"
          : "notifSlideDown 0.3s ease-out forwards",
      }}
    >
      <button
        type="button"
        onClick={handleTap}
        className="flex w-full overflow-hidden rounded-2xl text-left"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          borderLeft: `4px solid ${barColor}`,
        }}
      >
        <div className="flex flex-1 items-center gap-3 px-4 py-3.5">
          <span className="text-xl">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[0.875rem] font-bold text-zinc-900">{headsUp.title}</p>
            <p className="mt-0.5 truncate text-[0.75rem] font-medium text-zinc-500">{headsUp.body}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); close(); }}
          className="flex items-center px-4 text-lg text-zinc-400 active:text-zinc-600"
          aria-label="닫기"
        >
          ✕
        </button>
      </button>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/notifications/NotifList.tsx` 생성**

```tsx
"use client";

import { X } from "lucide-react";
import { useNotifications } from "@/context/NotificationsContext";
import { NOTIF_KIND_META, notifTimeAgo } from "@/lib/notifications";

export function NotifList({ onClose }: { onClose: () => void }) {
  const { notifications, markRead, markAllRead, clearAll } = useNotifications();

  const now = Date.now();
  const SOT = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const SOY = SOT - 86400000;
  const SOW = SOT - 6 * 86400000;

  const groups = [
    { label: "오늘",    filter: (t: number) => t >= SOT },
    { label: "어제",    filter: (t: number) => t >= SOY && t < SOT },
    { label: "이번 주", filter: (t: number) => t >= SOW && t < SOY },
    { label: "이전",    filter: (t: number) => t < SOW },
  ]
    .map(({ label, filter }) => ({
      label,
      items: notifications.filter((n) => filter(new Date(n.at).getTime())),
    }))
    .filter((g) => g.items.length > 0);

  void now;

  return (
    <div className="fixed inset-0 z-[180] flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
        <h2 className="text-[1.0625rem] font-bold text-zinc-900">알림</h2>
        <button
          type="button"
          onClick={markAllRead}
          className="text-sm font-semibold text-[#2d5c6e]"
        >
          모두 읽음
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-zinc-400">
            <span className="mb-3 text-4xl">🔔</span>
            <p className="text-sm">알림이 없어요</p>
          </div>
        ) : (
          <>
            {groups.map(({ label, items }) => (
              <div key={label}>
                <div className="sticky top-0 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-500">
                  {label}
                </div>
                {items.map((notif) => {
                  const meta = NOTIF_KIND_META[notif.kind];
                  return (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => markRead(notif.id)}
                      className={`flex w-full items-start gap-3 border-b border-zinc-50 px-4 py-4 text-left active:bg-zinc-50 ${
                        !notif.read ? "bg-blue-50/60" : ""
                      }`}
                    >
                      <span className="mt-0.5 text-xl">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`truncate text-[0.9375rem] leading-snug ${
                            !notif.read ? "font-bold text-zinc-900" : "font-medium text-zinc-700"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">{notif.body}</p>
                        <p className="mt-1 text-[0.6875rem] text-zinc-400">{notifTimeAgo(notif.at)}</p>
                      </div>
                      {!notif.read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2d5c6e]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="p-4">
              <button
                type="button"
                onClick={clearAll}
                className="w-full rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-500"
              >
                모두 지우기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `src/components/layout/Providers.tsx` 생성**

```tsx
"use client";

import { NotificationsProvider } from "@/context/NotificationsContext";
import { HeadsUpToast } from "@/components/notifications/HeadsUpToast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <HeadsUpToast />
      {children}
    </NotificationsProvider>
  );
}
```

- [ ] **Step 5: `src/app/layout.tsx` 수정**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "소망의료재단 ERP",
  description: "소망의료재단 임직원 포털",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: `src/components/layout/AppHeader.tsx` 수정**

기존 `AppHeader` 함수 내부를 아래와 같이 변경:

```tsx
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Home, ChevronLeft, Bell } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useNotifications } from "@/context/NotificationsContext";
import { NotifList } from "@/components/notifications/NotifList";

type HeaderMode = "home" | "tab" | "detail";

export type AppHeaderProps = {
  title?: string;
  mode?: HeaderMode;
};

export default function AppHeader({ title, mode }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const resolvedMode: HeaderMode =
    mode ??
    (pathname === ROUTES.home
      ? "home"
      : [ROUTES.approval, ROUTES.calendar, ROUTES.mypage, ROUTES.draft].includes(
            pathname as (typeof ROUTES)[keyof typeof ROUTES],
          )
        ? "tab"
        : "detail");

  const handleLogout  = () => router.replace(ROUTES.login);
  const handleGoHome  = () => router.push(ROUTES.home);
  const handleBack    = () => router.back();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-3">
        {/* 왼쪽 */}
        <div className="flex min-w-[44px] items-center">
          {resolvedMode === "home" && (
            <button onClick={handleLogout} className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100" aria-label="로그아웃">
              <LogOut className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
          {resolvedMode === "tab" && (
            <button onClick={handleGoHome} className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-700 active:bg-zinc-100" aria-label="홈으로">
              <Home className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
          {resolvedMode === "detail" && (
            <button onClick={handleBack} className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-700 active:bg-zinc-100" aria-label="뒤로가기">
              <ChevronLeft className="h-6 w-6" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* 가운데 */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[0.9375rem] font-semibold text-zinc-900">
          {title ?? ""}
        </h1>

        {/* 오른쪽 — 벨 아이콘 */}
        <div className="relative min-w-[44px] flex justify-end">
          <button
            onClick={() => setNotifOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100"
            aria-label="알림"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[0.5625rem] font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {notifOpen && <NotifList onClose={() => setNotifOpen(false)} />}
    </>
  );
}
```

- [ ] **Step 7: 브라우저에서 확인**

`localhost:3000/home` 접속:
- 우상단 🔔 아이콘과 빨간 배지(2) 표시
- 벨 클릭 → 알림함 열림, 그룹별 목록 표시
- "모두 읽음" 클릭 → 배지 사라짐
- 앱 진입 시 헤드업 토스트는 아직 안 뜸(push 안 했으므로 정상)

- [ ] **Step 8: commit**

```bash
git add src/app/globals.css src/app/layout.tsx \
  src/components/layout/Providers.tsx src/components/layout/AppHeader.tsx \
  src/components/notifications/HeadsUpToast.tsx src/components/notifications/NotifList.tsx
git commit -m "feat: add heads-up toast and notification list"
```

---

## Task 3: 근무표 컴포넌트

**Files:**
- Create: `src/lib/shift-data.ts`
- Create: `src/components/shift/ShiftDayDetail.tsx`
- Create: `src/components/shift/ShiftTable.tsx`

- [ ] **Step 1: `src/lib/shift-data.ts` 생성**

```typescript
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
  { id: "E001", name: "박지영", role: "간호사",   isMe: true  },
  { id: "N002", name: "김수민", role: "수간호사"               },
  { id: "N003", name: "이연주", role: "간호사"                 },
  { id: "N004", name: "최유진", role: "간호사"                 },
  { id: "N005", name: "한가은", role: "간호사"                 },
  { id: "N006", name: "조민서", role: "간호사"                 },
  { id: "N007", name: "윤서아", role: "간호사"                 },
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
```

- [ ] **Step 2: `src/components/shift/ShiftDayDetail.tsx` 생성**

```tsx
"use client";

import { X } from "lucide-react";
import { SHIFT_2026_04, SHIFT_CODE_META, type ShiftCode } from "@/lib/shift-data";

export function ShiftDayDetail({ day, onClose }: { day: number; onClose: () => void }) {
  const idx = day - 1;
  const groups: Partial<Record<ShiftCode, string[]>> = {};
  for (const member of SHIFT_2026_04) {
    const code = member.row[idx];
    if (!groups[code]) groups[code] = [];
    groups[code]!.push(member.name);
  }

  const order: ShiftCode[] = ["D", "E", "N", "V", "T", "O"];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/40" aria-label="닫기" />
      <div className="relative w-full max-w-[430px] rounded-t-3xl bg-white pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <span className="text-[1.0625rem] font-bold text-zinc-900">4월 {day}일 근무</span>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          {order.map((code) => {
            const names = groups[code];
            if (!names?.length) return null;
            const meta = SHIFT_CODE_META[code];
            return (
              <div key={code}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: meta.bg, color: meta.fg }}>
                    {code} — {meta.desc}
                  </span>
                  <span className="text-xs text-zinc-400">{meta.time}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {names.map((name) => (
                    <span key={name} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/shift/ShiftTable.tsx` 생성**

```tsx
"use client";

import { useState } from "react";
import { SHIFT_2026_04, SHIFT_CODE_META, type ShiftCode } from "@/lib/shift-data";
import { ShiftDayDetail } from "./ShiftDayDetail";

// April 1, 2026 = Wednesday = weekday index 3
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
function getWeekday(day: number) {
  return WEEKDAY[(3 + day - 1) % 7];
}

const TODAY_DAY = new Date().getDate(); // 실제 오늘 날짜 사용

export function ShiftTable() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const me = SHIFT_2026_04.find((m) => m.isMe)!;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = TODAY_DAY + i;
    if (day > 30) return null;
    return { day, code: me.row[day - 1] as ShiftCode, weekday: getWeekday(day) };
  }).filter(Boolean) as { day: number; code: ShiftCode; weekday: string }[];

  const myCounts = me.row.reduce<Partial<Record<ShiftCode, number>>>((acc, c) => {
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="pb-8">
      {/* 부서 카드 */}
      <div className="mx-4 mb-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,92,110,0.08)]">
        <div className="flex items-center gap-2">
          <span className="text-base">🏥</span>
          <div>
            <p className="text-[0.9375rem] font-bold text-zinc-900">외과 2병동</p>
            <p className="text-xs text-zinc-500">7명 · 2026년 4월 · 최종 4/15</p>
          </div>
        </div>
      </div>

      {/* 내 이번 주 */}
      <div className="mx-4 mb-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,92,110,0.08)]">
        <p className="mb-3 text-sm font-bold text-zinc-700">내 이번 주 근무</p>
        <div className="flex gap-1.5">
          {weekDays.map(({ day, code, weekday }) => {
            const meta = SHIFT_CODE_META[code];
            const isToday = day === TODAY_DAY;
            return (
              <div
                key={day}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl p-1.5 ${
                  isToday ? "border-2 border-[#2d5c6e]" : "border border-zinc-100"
                }`}
              >
                <span className={`text-[0.625rem] font-semibold ${weekday === "일" ? "text-red-500" : weekday === "토" ? "text-blue-500" : "text-zinc-500"}`}>
                  {weekday}
                </span>
                <span className="text-xs font-bold text-zinc-700">{day}</span>
                <span className="rounded px-1 py-0.5 text-[0.5625rem] font-bold" style={{ background: meta.bg, color: meta.fg }}>
                  {code}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 전체 그리드 */}
      <div className="overflow-x-auto px-4">
        <div className="min-w-max">
          {/* 날짜 헤더 */}
          <div className="flex">
            <div className="w-14 shrink-0" />
            {Array.from({ length: 30 }, (_, i) => {
              const day = i + 1;
              const wd = getWeekday(day);
              const isToday = day === TODAY_DAY;
              return (
                <div
                  key={day}
                  className={`flex w-8 shrink-0 flex-col items-center pb-1 ${isToday ? "border-b-2 border-[#2d5c6e]" : ""}`}
                >
                  <span className={`text-[0.5rem] font-semibold ${wd === "일" ? "text-red-400" : wd === "토" ? "text-blue-400" : "text-zinc-400"}`}>
                    {wd}
                  </span>
                  <span className={`text-[0.625rem] font-bold ${isToday ? "text-[#2d5c6e]" : "text-zinc-600"}`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 멤버 행 */}
          {SHIFT_2026_04.map((member) => (
            <div key={member.id} className={`flex items-center ${member.isMe ? "bg-[rgba(45,92,110,0.04)]" : ""}`}>
              <div className="relative flex w-14 shrink-0 flex-col justify-center py-1 pr-1">
                {member.isMe && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[#2d5c6e]" />
                )}
                <span className={`pl-2 text-[0.6875rem] font-bold leading-tight ${member.isMe ? "text-[#2d5c6e]" : "text-zinc-700"}`}>
                  {member.name}
                </span>
                <span className="pl-2 text-[0.5625rem] leading-tight text-zinc-400">{member.role}</span>
              </div>
              {member.row.map((code, dayIdx) => {
                const meta = SHIFT_CODE_META[code];
                const isToday = dayIdx + 1 === TODAY_DAY;
                return (
                  <button
                    key={dayIdx}
                    type="button"
                    onClick={() => setSelectedDay(dayIdx + 1)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center text-[0.625rem] font-bold ${
                      isToday ? "border-b-2 border-[#2d5c6e]" : ""
                    }`}
                    style={{ background: meta.bg, color: meta.fg }}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div className="mx-4 mt-4 flex flex-wrap gap-2">
        {(Object.entries(SHIFT_CODE_META) as [ShiftCode, typeof SHIFT_CODE_META[ShiftCode]][]).map(
          ([code, meta]) => (
            <span
              key={code}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: meta.bg, color: meta.fg }}
            >
              {code} {meta.desc}
            </span>
          ),
        )}
      </div>

      {/* 내 4월 통계 */}
      <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,92,110,0.08)]">
        <p className="mb-3 text-sm font-bold text-zinc-700">내 4월 통계</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(myCounts) as [ShiftCode, number][]).map(([code, count]) => {
            const meta = SHIFT_CODE_META[code];
            return (
              <span key={code} className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: meta.bg, color: meta.fg }}>
                {code} = {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* 안내 */}
      <div className="mx-4 mt-4 rounded-xl bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-500">
        💡 근무 변경이 필요하면 수간호사(김수민)에게 직접 요청 후 시스템에 반영됩니다.
      </div>

      {selectedDay !== null && (
        <ShiftDayDetail day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: commit**

```bash
git add src/lib/shift-data.ts src/components/shift/ShiftDayDetail.tsx src/components/shift/ShiftTable.tsx
git commit -m "feat: add shift table components"
```

---

## Task 4: CalendarView — 토글 + 휴가 신청 버튼

**Files:**
- Modify: `src/components/views/CalendarView.tsx`

CalendarView를 아래와 같이 전면 교체:

- [ ] **Step 1: `src/components/views/CalendarView.tsx` 전체 교체**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CalendarEvent } from "@/types/calendar";
import { CATEGORY_META } from "@/types/calendar";
import { usePersonalEvents } from "@/lib/calendar-data";
import { DayBottomSheet } from "@/components/calendar/DayBottomSheet";
import { EventFormSheet } from "@/components/calendar/EventFormSheet";
import { ShiftTable } from "@/components/shift/ShiftTable";
import { ROUTES } from "@/lib/routes";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type CalView = "month" | "shift";

function loadView(): CalView {
  try {
    const v = localStorage.getItem("somang_cal_view");
    return v === "shift" ? "shift" : "month";
  } catch {
    return "month";
  }
}

export function CalendarView() {
  const router = useRouter();
  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  const [calView, setCalView] = useState<CalView>("month");

  useEffect(() => {
    setCalView(loadView());
  }, []);

  const saveView = (v: CalView) => {
    setCalView(v);
    try { localStorage.setItem("somang_cal_view", v); } catch {}
  };

  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvt, setEditingEvt] = useState<CalendarEvent | null>(null);

  const { all, upsert, remove } = usePersonalEvents();

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const arr: { iso: string; day: number; inMonth: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      arr.push({ iso: toISO(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: false });
    }
    for (let d = 1; d <= lastDate; d++) {
      arr.push({ iso: toISO(year, month, d), day: d, inMonth: true });
    }
    while (arr.length < 42) {
      const idx = arr.length - (firstDay + lastDate) + 1;
      const d = new Date(year, month + 1, idx);
      arr.push({ iso: toISO(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: false });
    }
    return arr;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of all) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [all]);

  const goPrevMonth = () => setCursor(new Date(year, month - 1, 1));
  const goNextMonth = () => setCursor(new Date(year, month + 1, 1));
  const goToday     = () => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(todayISO); };

  const handleStartLeave = (date: string) => {
    router.push(`${ROUTES.draft}?form=vacation&start=${date}&end=${date}`);
  };

  const dayEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="relative flex min-h-[calc(100dvh-3.5rem)] flex-col pb-24">
      {/* 뷰 토글 */}
      <div className="sticky top-14 z-20 flex items-center gap-2 border-b border-zinc-100 bg-white px-4 py-2">
        <div className="flex flex-1 gap-1 rounded-xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => saveView("month")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              calView === "month" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
            }`}
          >
            📅 월간뷰
          </button>
          <button
            type="button"
            onClick={() => saveView("shift")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              calView === "shift" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
            }`}
          >
            🕐 근무표
          </button>
        </div>
        {calView === "month" && (
          <button
            type="button"
            onClick={() => handleStartLeave(todayISO)}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #2d5c6e, #1e4554)" }}
          >
            🌴 휴가 신청
          </button>
        )}
      </div>

      {/* 근무표 */}
      {calView === "shift" && (
        <div className="mt-3">
          <ShiftTable />
        </div>
      )}

      {/* 월간 뷰 */}
      {calView === "month" && (
        <>
          {/* 월 네비 */}
          <div className="flex items-center justify-between bg-white px-4 py-3">
            <button type="button" onClick={goToday} className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600 active:bg-zinc-50">
              오늘
            </button>
            <div className="flex items-center gap-1">
              <button type="button" onClick={goPrevMonth} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100" aria-label="이전 달">
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <h1 className="min-w-[110px] text-center text-[1.0625rem] font-bold text-zinc-900">
                {year}년 {month + 1}월
              </h1>
              <button type="button" onClick={goNextMonth} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100" aria-label="다음 달">
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="w-[44px]" />
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-t border-zinc-100 bg-white text-center text-[0.6875rem] font-semibold">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`py-1.5 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-zinc-500"}`}>
                {w}
              </div>
            ))}
          </div>

          {/* 그리드 */}
          <div className="grid grid-cols-7 border-t border-zinc-100 bg-white">
            {cells.map(({ iso, day, inMonth }, i) => {
              const isToday = iso === todayISO;
              const isSelected = selectedDate && iso === selectedDate;
              const evts = eventsByDate.get(iso) ?? [];
              const dayOfWeek = i % 7;
              return (
                <button
                  key={iso + i}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  className={`flex min-h-[64px] flex-col items-center border-b border-r border-zinc-100 p-1 text-center ${
                    (i + 1) % 7 === 0 ? "border-r-0" : ""
                  } ${isSelected ? "bg-[#eef2ff]" : "active:bg-zinc-50"}`}
                >
                  <span className={`mb-0.5 mt-1 flex h-6 w-6 items-center justify-center text-[0.8125rem] font-semibold ${
                    isToday ? "rounded-full bg-[#3b5bdb] text-white"
                    : !inMonth ? "text-zinc-300"
                    : dayOfWeek === 0 ? "text-red-500"
                    : dayOfWeek === 6 ? "text-blue-500"
                    : "text-zinc-700"
                  }`}>
                    {day}
                  </span>
                  <div className="mt-auto flex flex-wrap items-center justify-center gap-0.5 pb-1">
                    {evts.slice(0, 5).map((e) => {
                      const meta = CATEGORY_META[e.category];
                      return <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />;
                    })}
                    {evts.length > 5 && <span className="text-[0.5625rem] font-semibold leading-none text-zinc-400">+{evts.length - 5}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 px-5 pb-3 text-[0.6875rem]">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <span key={key} className="flex items-center gap-1 text-zinc-600">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: meta.color }} />
                {meta.label}
              </span>
            ))}
          </div>

          {/* FAB */}
          <button
            type="button"
            onClick={() => { setEditingEvt(null); setSelectedDate(selectedDate ?? todayISO); setFormOpen(true); }}
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[110] flex h-14 w-14 items-center justify-center rounded-full bg-[#3b5bdb] text-white shadow-[0_6px_16px_rgba(59,91,219,0.4)] active:scale-95"
            style={{ right: "max(1rem, calc(50vw - 215px + 1rem))" }}
            aria-label="일정 추가"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>

          {/* 날짜 바텀시트 */}
          <DayBottomSheet
            open={!!selectedDate && !formOpen}
            onClose={() => setSelectedDate(null)}
            date={selectedDate ?? todayISO}
            events={dayEvents}
            onAdd={() => { setEditingEvt(null); setFormOpen(true); }}
            onEditPersonal={(evt) => { setEditingEvt(evt); setFormOpen(true); }}
            onStartLeave={handleStartLeave}
          />

          {/* 폼 시트 */}
          <EventFormSheet
            open={formOpen}
            onClose={() => setFormOpen(false)}
            defaultDate={selectedDate ?? todayISO}
            editing={editingEvt}
            onSave={(evt) => { upsert(evt); setFormOpen(false); }}
            onDelete={(id) => remove(id)}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `src/components/calendar/DayBottomSheet.tsx`에 `onStartLeave` prop 추가**

`DayBottomSheetProps` 타입과 컴포넌트 인자에 `onStartLeave?: (date: string) => void` 추가.
컴포넌트 내부 `<div className="max-h-[60vh]...">` 닫는 태그 바로 뒤에 아래 추가:

```tsx
{onStartLeave && (
  <div className="px-5 pt-0 pb-4">
    <button
      type="button"
      onClick={() => { onClose(); onStartLeave(date); }}
      className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white"
      style={{ background: "linear-gradient(135deg, #2d5c6e, #1e4554)" }}
    >
      🌴 이 날짜로 휴가 신청
    </button>
  </div>
)}
```

`DayBottomSheetProps` 타입 변경 (전체):
```tsx
export type DayBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  date: string;
  events: CalendarEvent[];
  onAdd: () => void;
  onEditPersonal: (evt: CalendarEvent) => void;
  onStartLeave?: (date: string) => void;
};
```

함수 인자도 `onStartLeave` 추가:
```tsx
export function DayBottomSheet({
  open, onClose, date, events, onAdd, onEditPersonal, onStartLeave,
}: DayBottomSheetProps) {
```

- [ ] **Step 3: 브라우저에서 확인**

`localhost:3000/calendar` 접속:
- 상단에 "📅 월간뷰 / 🕐 근무표" 토글 표시
- "🕐 근무표" 클릭 → 근무표 표시, localStorage 저장
- 새로고침 후 근무표 유지
- "🌴 휴가 신청" 버튼 → 아직 /draft 프리필 미구현이므로 기안 탭으로 이동만 됨(다음 Task에서 완성)
- 날짜 탭 → 바텀시트에 "🌴 이 날짜로 휴가 신청" 버튼 표시

- [ ] **Step 4: commit**

```bash
git add src/components/views/CalendarView.tsx src/components/calendar/DayBottomSheet.tsx
git commit -m "feat: add shift table toggle and vacation leave shortcut to calendar"
```

---

## Task 5: 기안 화면 프리필 (URL → 폼 자동 선택)

**Files:**
- Modify: `src/components/draft/DraftComposeView.tsx`
- Modify: `src/components/views/DraftView.tsx`
- Modify: `src/app/(main)/draft/page.tsx`

- [ ] **Step 1: `DraftComposeView` — initialStartDate/EndDate props 추가**

`Props` 타입 변경:
```tsx
type Props = {
  kind: FormKind;
  onBack: () => void;
  onSubmitted: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
};
```

함수 인자 변경:
```tsx
export function DraftComposeView({ kind, onBack, onSubmitted, initialStartDate, initialEndDate }: Props) {
```

`startDate`, `endDate` 초기값 변경:
```tsx
const [startDate, setStartDate] = useState(initialStartDate ?? "");
const [endDate,   setEndDate]   = useState(initialEndDate   ?? "");
```

- [ ] **Step 2: `DraftView` — prefill prop 추가**

`DraftViewProps` 타입 및 `DraftPrefill` 타입 내보내기:
```tsx
import { useEffect, useState } from "react";
// ... 기존 임포트 유지

export type DraftPrefill = {
  formKind: FormKind;
  startDate?: string;
  endDate?: string;
};

export type DraftViewProps = { onBack?: () => void; prefill?: DraftPrefill };
```

`DraftView` 함수 내부 변경:
```tsx
export function DraftView({ prefill }: DraftViewProps) {
  const [composeKind, setComposeKind] = useState<FormKind | null>(null);
  const [activePrefill, setActivePrefill] = useState<{ start?: string; end?: string } | null>(null);

  // mount 시 1회만 적용
  useEffect(() => {
    if (prefill) {
      setActivePrefill({ start: prefill.startDate, end: prefill.endDate });
      setComposeKind(prefill.formKind);
    }
  }, []);

  if (composeKind) {
    return (
      <DraftComposeView
        kind={composeKind}
        onBack={() => { setComposeKind(null); setActivePrefill(null); }}
        onSubmitted={() => { setComposeKind(null); setActivePrefill(null); }}
        initialStartDate={activePrefill?.start}
        initialEndDate={activePrefill?.end}
      />
    );
  }
  // ... 아래 picker UI 동일 (handlePick 포함)
```

`handlePick` 함수는 기존 코드 그대로 유지.

- [ ] **Step 3: `src/app/(main)/draft/page.tsx` — useSearchParams 추가**

```tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DraftView } from "@/components/views/DraftView";
import type { DraftPrefill } from "@/components/views/DraftView";
import { ROUTES } from "@/lib/routes";

function DraftPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const form = params.get("form");
  const start = params.get("start") ?? undefined;
  const end   = params.get("end")   ?? undefined;

  const prefill: DraftPrefill | undefined =
    form === "vacation" || form === "proposal" || form === "resignation"
      ? { formKind: form, startDate: start, endDate: end }
      : undefined;

  return <DraftView onBack={() => router.push(ROUTES.home)} prefill={prefill} />;
}

export default function DraftPage() {
  return (
    <Suspense>
      <DraftPageInner />
    </Suspense>
  );
}
```

- [ ] **Step 4: 브라우저에서 확인**

1. `localhost:3000/calendar` → 📅 월간뷰에서 "🌴 휴가 신청" 클릭
   → `/draft?form=vacation&start=YYYY-MM-DD&end=YYYY-MM-DD` 로 이동
   → 연차 신청서 폼이 바로 열리고 오늘 날짜 프리필됨

2. 캘린더에서 날짜 탭 → 바텀시트 → "🌴 이 날짜로 휴가 신청"
   → 해당 날짜 프리필된 연차 신청서 폼

3. 뒤로가기 → 기안 목록으로 돌아옴 (다시 프리필 안됨)

- [ ] **Step 5: commit**

```bash
git add src/components/draft/DraftComposeView.tsx src/components/views/DraftView.tsx src/app/\(main\)/draft/page.tsx
git commit -m "feat: vacation leave prefill via URL params"
```

---

## Task 6: PDF 미리보기 컴포넌트

**Files:**
- Create: `src/components/pdf/ApprovalStamp.tsx`
- Create: `src/components/pdf/PdfBody.tsx`
- Create: `src/components/pdf/PdfPreviewSheet.tsx`
- Modify: `src/components/views/ApprovalDetailView.tsx`

- [ ] **Step 1: `src/components/pdf/ApprovalStamp.tsx` 생성**

```tsx
type Props = {
  name: string;
  size?: number;
  rotate?: number;
  isRejected?: boolean;
};

export function ApprovalStamp({ name, size = 56, rotate = -7, isRejected = false }: Props) {
  if (isRejected) {
    return (
      <div
        style={{
          width: size, height: size * 0.6,
          border: `${Math.max(2, Math.floor(size * 0.04))}px solid #c1272d`,
          color: "#c1272d", display: "flex", alignItems: "center", justifyContent: "center",
          transform: `rotate(-7deg)`, opacity: 0.88,
          fontFamily: '"Noto Serif KR", serif', fontWeight: 800,
          fontSize: size * 0.28, letterSpacing: "0.05em",
        }}
      >
        반려
      </div>
    );
  }

  const chars = name.length >= 3 ? name.split("") : (name + "印").split("");
  const fontSize =
    chars.length === 2 ? size * 0.42 :
    chars.length === 3 ? size * 0.34 : size * 0.30;

  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        border: `${Math.max(2, Math.floor(size * 0.05))}px solid #c1272d`,
        color: "#c1272d",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: `rotate(${rotate}deg)`,
        opacity: 0.92,
        fontFamily: '"Noto Serif KR", serif',
        fontWeight: 800,
        letterSpacing: chars.length >= 3 ? "-0.05em" : "-0.02em",
        fontSize,
        lineHeight: 1,
        filter: "blur(0.2px)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {chars.map((c, i) => <span key={i}>{c}</span>)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `src/components/pdf/PdfBody.tsx` 생성**

```tsx
const TH: React.CSSProperties = {
  background: "#f3e9d2", padding: "7px 10px",
  fontWeight: 700, fontSize: 11, color: "#5a4a30",
  border: "1px solid #d8c8a8", width: "28%",
  textAlign: "left",
};
const TD: React.CSSProperties = {
  padding: "7px 10px", border: "1px solid #d8c8a8",
  fontSize: "11.5px", color: "#2a2418",
};

type Props = { kind: "vacation" | "proposal" | "resignation" };

export function PdfBody({ kind }: Props) {
  if (kind === "vacation") {
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <tbody>
          <tr>
            <th style={TH}>소속</th>
            <td style={TD}>외과 2병동</td>
            <th style={{ ...TH, width: "20%" }}>직책</th>
            <td style={TD}>간호사</td>
          </tr>
          <tr>
            <th style={TH}>성명</th>
            <td style={TD}>박지영</td>
            <th style={{ ...TH, width: "20%" }}>연락처</th>
            <td style={TD}>010-1234-5678</td>
          </tr>
          <tr>
            <th style={TH}>휴가종류</th>
            <td style={TD}>연차 (1일)</td>
            <th style={{ ...TH, width: "20%" }}>일수</th>
            <td style={TD}>1일</td>
          </tr>
          <tr>
            <th style={TH}>기간</th>
            <td style={{ ...TD }} colSpan={3}>2026년 4월 20일 ~ 2026년 4월 20일</td>
          </tr>
          <tr>
            <th style={TH}>사유</th>
            <td style={{ ...TD, height: 80, verticalAlign: "top" }} colSpan={3}>개인 사유</td>
          </tr>
        </tbody>
      </table>
    );
  }

  if (kind === "proposal") {
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <tbody>
          <tr>
            <th style={TH}>제목</th>
            <td style={TD} colSpan={3}>3월 감염관리 소모품 구매 품의</td>
          </tr>
          <tr>
            <th style={TH}>품목</th>
            <td style={TD}>마스크 KF94 500매 외</td>
            <th style={{ ...TH, width: "20%" }}>수량</th>
            <td style={TD}>3종</td>
          </tr>
          <tr>
            <th style={TH}>금액</th>
            <td style={TD} colSpan={3}>450,000 원</td>
          </tr>
          <tr>
            <th style={TH}>사유</th>
            <td style={{ ...TD, height: 80, verticalAlign: "top" }} colSpan={3}>3월 소모품 소진으로 인한 긴급 구매</td>
          </tr>
        </tbody>
      </table>
    );
  }

  // resignation
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
      <tbody>
        {[
          ["소속", "외과 2병동"],
          ["성명", "박지영"],
          ["사직 희망일", "2026년 6월 30일"],
          ["사유", "개인 사정으로 인한 사직"],
        ].map(([label, value]) => (
          <tr key={label}>
            <th style={TH}>{label}</th>
            <td style={TD}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: `src/components/pdf/PdfPreviewSheet.tsx` 생성**

```tsx
"use client";

import { useState } from "react";
import { X, Download, Share2 } from "lucide-react";
import { ApprovalStamp } from "./ApprovalStamp";
import { PdfBody } from "./PdfBody";

type Stage = { title: string; name: string; acted: boolean; action?: "approve" | "reject" };

type Props = {
  docId: string;
  kind: "vacation" | "proposal" | "resignation";
  status: "approved" | "rejected";
  stages: Stage[];
  onClose: () => void;
};

const ROTATE_BY_IDX = [-8, 6, -8, 6];

export function PdfPreviewSheet({ docId, kind, status, stages, onClose }: Props) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const kindLabel = kind === "vacation" ? "연차 신청서" : kind === "proposal" ? "품의서" : "사직원";

  return (
    <div
      className="fixed inset-0 z-[250] flex flex-col items-center overflow-y-auto py-6"
      style={{ background: "rgba(20, 28, 35, 0.92)" }}
    >
      {/* 헤더 */}
      <div className="fixed left-0 right-0 top-0 flex items-center justify-between px-4 pt-[calc(44px+env(safe-area-inset-top,0px))] pb-3 z-10">
        <button type="button" onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">PDF 미리보기</p>
          <p className="text-[0.625rem] text-white/50">{docId}.pdf</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleDownload}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: downloaded ? "#16a34a" : "#2d5c6e" }}
          >
            {downloaded ? <span className="text-sm text-white">✓</span> : <Download className="h-4 w-4 text-white" strokeWidth={2} />}
          </button>
          <button type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Share2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 다운로드 완료 토스트 */}
      {downloaded && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-white">
          {docId}.pdf 다운로드 완료
        </div>
      )}

      {/* 종이 */}
      <div
        className="relative mx-auto mt-24 mb-8 w-full max-w-[540px] px-4"
      >
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #fffdf6 0%, #fff8ea 100%)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.3)",
            padding: "28px 26px 36px",
            fontFamily: '"Noto Serif KR", serif',
            color: "#2a2418",
          }}
        >
          {/* 워터마크 */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ transform: "rotate(-30deg)", fontSize: 70, fontWeight: 800, color: "#c1272d", opacity: 0.04 }}
          >
            소망병원
          </div>

          {/* 종이 헤더 */}
          <div className="mb-5 flex items-start justify-between border-b-2 border-[#2a2418] pb-3">
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#7a6a4f" }}>의료법인 소망의료재단</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#2a2418" }}>소망요양병원</p>
            </div>

            {/* 결재 박스 */}
            <div style={{ border: "2px solid #d8c8a8", display: "flex" }}>
              {/* 기안자 */}
              <div style={{ borderRight: "1px solid #d8c8a8", display: "flex", flexDirection: "column" }}>
                <div style={{ background: "#faf3e3", padding: "5px 8px", fontSize: 9, fontWeight: 700, color: "#7a6a4f", borderBottom: "1px solid #d8c8a8", textAlign: "center" }}>기안</div>
                <div style={{ padding: "4px 8px", fontSize: 9, color: "#5a4a30", borderBottom: "1px solid #d8c8a8", textAlign: "center" }}>박지영</div>
                <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: "#fffaf0", borderBottom: "1px solid #d8c8a8", padding: "4px 8px" }}>
                  <ApprovalStamp name="박지영" size={40} rotate={-6} />
                </div>
                <div style={{ padding: "3px 8px", fontSize: 8, color: "#7a6a4f", background: "#faf3e3", textAlign: "center" }}>26.04.15</div>
              </div>

              {/* 결재선 */}
              {stages.map((stage, idx) => (
                <div key={idx} style={{ borderRight: idx < stages.length - 1 ? "1px solid #d8c8a8" : undefined, display: "flex", flexDirection: "column" }}>
                  <div style={{ background: "#faf3e3", padding: "5px 8px", fontSize: 9, fontWeight: 700, color: "#7a6a4f", borderBottom: "1px solid #d8c8a8", textAlign: "center", minWidth: 50 }}>
                    {stage.title}
                  </div>
                  <div style={{ padding: "4px 8px", fontSize: 9, color: "#5a4a30", borderBottom: "1px solid #d8c8a8", textAlign: "center" }}>
                    {stage.name}
                  </div>
                  <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: "#fffaf0", borderBottom: "1px solid #d8c8a8", padding: "4px 8px" }}>
                    {stage.acted && (
                      <ApprovalStamp
                        name={stage.name}
                        size={40}
                        rotate={ROTATE_BY_IDX[idx % 4]}
                        isRejected={stage.action === "reject"}
                      />
                    )}
                  </div>
                  <div style={{ padding: "3px 8px", fontSize: 8, color: "#7a6a4f", background: "#faf3e3", textAlign: "center" }}>
                    {stage.acted ? "26.04.21" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 문서 제목 */}
          <h2 style={{ textAlign: "center", fontSize: 18, fontWeight: 800, letterSpacing: "0.15em", marginBottom: 16 }}>
            {kindLabel}
          </h2>

          {/* 본문 */}
          <PdfBody kind={kind} />

          {/* 하단 */}
          <div style={{ marginTop: 24, borderTop: "1px dashed #d8c8a8", paddingTop: 12 }}>
            {status === "approved" ? (
              <p style={{ fontSize: 10, color: "#7a6a4f", letterSpacing: "0.1em", textAlign: "center" }}>
                ※ 본 문서는 전자결재로 승인 완료된 정식 문서입니다.
              </p>
            ) : (
              <p style={{ fontSize: 11, fontWeight: 700, color: "#c1272d", textAlign: "center" }}>
                ⚠ 본 문서는 결재가 반려된 문서입니다.
              </p>
            )}
          </div>
        </div>

        {/* 페이지 번호 */}
        <p className="mt-3 text-center text-[0.625rem] font-semibold text-white/40">1 / 1</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `src/components/views/ApprovalDetailView.tsx` 수정**

`ApprovalDetailViewProps`에 `docStatus?: "pending" | "approved" | "rejected"` prop 추가.
컴포넌트 내부에 `showPdf` state 추가, 결재 버튼 영역 위에 PDF 버튼 행 추가:

`ApprovalDetailViewProps` 타입에 추가:
```tsx
docStatus?: "pending" | "approved" | "rejected";
```

함수 인자에 `docStatus = "approved"` 기본값으로 추가:
```tsx
export function ApprovalDetailView({
  // ... 기존 props
  docStatus = "approved",
}: ApprovalDetailViewProps) {
```

컴포넌트 내부 첫 줄에 추가:
```tsx
const [showPdf, setShowPdf] = useState(false);
```

하단 버튼 영역(`fixed bottom-...` div) **바로 위에** 아래 삽입:
```tsx
{(docStatus === "approved" || docStatus === "rejected") && (
  <div className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-5">
    <div className="flex gap-2">
      <button type="button" className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700">
        📄 원본 양식
      </button>
      <button
        type="button"
        onClick={() => setShowPdf(true)}
        className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #c1272d, #8b1a1a)" }}
      >
        🔴 PDF (도장)
      </button>
    </div>
  </div>
)}
```

컴포넌트 반환 마지막 `</div>` 바로 전에 추가:
```tsx
{showPdf && (
  <PdfPreviewSheet
    docId="D-0421-01"
    kind="vacation"
    status={docStatus as "approved" | "rejected"}
    stages={[
      { title: "팀장",    name: "이미선", acted: true,  action: "approve" },
      { title: "총무과장", name: "최민호", acted: docStatus === "approved", action: "approve" },
      { title: "이사장",   name: "김소망", acted: docStatus === "approved", action: "approve" },
    ]}
    onClose={() => setShowPdf(false)}
  />
)}
```

상단에 임포트 추가:
```tsx
import { useState } from "react";
import { PdfPreviewSheet } from "@/components/pdf/PdfPreviewSheet";
```

- [ ] **Step 5: 브라우저에서 확인**

`localhost:3000/approval` → 결재 상세 진입:
- 하단에 "📄 원본 양식 / 🔴 PDF (도장)" 버튼 표시
- "🔴 PDF (도장)" 클릭 → 어두운 오버레이 + 베이지 종이 + 도장 표시
- ✕ 닫기, ⬇ 다운로드 클릭 시 "다운로드 완료" 토스트
- 워터마크 "소망병원" 옅게 표시

- [ ] **Step 6: commit**

```bash
git add src/components/pdf/ src/components/views/ApprovalDetailView.tsx
git commit -m "feat: add PDF preview with approval stamps"
```

---

## Task 7: 헤드업 토스트 데모 연결 (선택)

데모 목적으로 앱 진입 시 알림을 push해 토스트를 테스트할 수 있도록.

**Files:**
- Modify: `src/components/views/HomeView.tsx` (또는 임시 아무 페이지)

- [ ] **Step 1: HomeView 또는 테스트 버튼에서 push 호출 (선택적)**

예: `HomeView.tsx` 상단 임시 버튼:
```tsx
import { useNotifications } from "@/context/NotificationsContext";

// 컴포넌트 내부
const { push } = useNotifications();

// JSX 안 임시 버튼 (개발/데모용)
<button
  type="button"
  onClick={() => push({
    kind: "approval",
    title: "이재훈 — 연차 신청서",
    body: "결재가 도착했어요. 4/22~4/24 (3일)",
    deeplink: { type: "approval", docId: "D-0421-01" },
  })}
  className="mb-4 w-full rounded-xl bg-[#2d5c6e] py-2 text-sm font-semibold text-white"
>
  [테스트] 알림 토스트 발송
</button>
```

버튼 클릭 → 4.5초 토스트 표시 → 자동 닫힘 확인.

---

## Self-Review 체크

**Spec coverage:**
- ✅ 알림 토스트 (HeadsUpToast, NOTIF_KIND, 4.5초 자동 닫힘, kind별 색상 바)
- ✅ 알림함 (NotifList, 그룹화, 모두 읽음, 모두 지우기)
- ✅ AppHeader 🔔 벨 + 배지
- ✅ 캘린더 상단 `+ 휴가 신청` 버튼
- ✅ 날짜 셀 → DayBottomSheet → "이 날짜로 휴가 신청"
- ✅ 근무표 토글 (localStorage 유지)
- ✅ 근무표 그리드 + 내 이번주 + 통계 + 셀 탭 시트
- ✅ PDF 미리보기 (종이, 도장, 워터마크, 반려 표시)
- ✅ PDF 다운로드 토스트

**Type consistency:**
- `NotifKind`는 notifications.ts에서 정의, Context와 컴포넌트 모두 동일 사용
- `ShiftCode`, `ShiftMember`는 shift-data.ts에서 정의, ShiftTable/ShiftDayDetail 동일 사용
- `DraftPrefill` 타입은 DraftView에서 export, DraftPage에서 import
- `ApprovalDetailViewProps.docStatus` → PdfPreviewSheet의 `status` prop 타입 일치

**제외:**
- 실제 서버 연동 없음 (mock 데이터)
- Noto Serif KR Google Fonts CDN 사용 (오프라인 미지원)
