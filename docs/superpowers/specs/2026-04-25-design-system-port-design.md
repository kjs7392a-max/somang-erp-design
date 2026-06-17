# 디자인 시스템 포팅: 알림 / 캘린더+휴가신청 / 근무표 / PDF 미리보기

**날짜**: 2026-04-25  
**소스**: `Design System (1).zip` (design_handoff_calendar_shift_pdf_notif)  
**대상 앱**: `localhost:3000` (Next.js App Router)

---

## 범위

4개 신규 기능을 기존 앱에 통합한다.

1. **헤드업 알림 토스트 + 알림함**
2. **휴가 캘린더 → 휴가 신청 진입 (기안 프리필)**
3. **근무표 뷰 (일정 탭 토글)**
4. **결재 완료 문서 PDF 미리보기 (도장)**

---

## 아키텍처 결정

### 알림 — React Context (글로벌)
`NotificationsContext`를 `src/app/layout.tsx`에서 wrap. `useNotifications()` 훅으로 어디서나 접근.  
`AppHeader`에 🔔 벨 아이콘 + 미읽음 배지. `HeadsUpToast`는 layout 레벨에서 항상 렌더.

### 캘린더 → 기안 프리필 — URL query params
```
/draft?form=vacation&start=2026-04-25&end=2026-04-25
```
CalendarView와 DayBottomSheet에서 `router.push()`.  
DraftView에서 `useSearchParams()`로 읽어 폼 자동 선택 + 필드 초기값 설정.  
`onConsumePrefill` 없이 searchParams 소비 후 `router.replace('/draft')`.

### 근무표 토글 — localStorage
`localStorage["somang_cal_view"]` 값: `"month"` | `"shift"`.  
CalendarView 상단 토글로 전환. ShiftTable은 별도 컴포넌트로 분리.

### PDF 미리보기 — 로컬 state
`ApprovalDetailView`에 `showPdf: boolean` 상태 추가.  
`status === "approved" || status === "rejected"` 조건으로 PDF 버튼 표시.  
`PdfPreviewSheet`는 `fixed inset-0` 풀스크린 오버레이.

---

## 신규 파일

```
src/lib/notifications.ts             — 타입, NOTIF_SEED, NOTIF_KIND
src/context/NotificationsContext.tsx — Context + useNotifications 훅
src/components/notifications/HeadsUpToast.tsx
src/components/notifications/NotifList.tsx
src/lib/shift-data.ts                — SHIFT_MEMBERS, SHIFT_CODES, SHIFT_2026_04
src/components/shift/ShiftTable.tsx
src/components/shift/ShiftDayDetail.tsx
src/components/pdf/ApprovalStamp.tsx
src/components/pdf/PdfPreviewSheet.tsx
src/components/pdf/PdfBody.tsx
```

## 수정 파일

```
src/app/layout.tsx                           — NotificationsProvider + HeadsUpToast
src/components/layout/AppHeader.tsx          — 🔔 벨 아이콘 + NotifList
src/components/views/CalendarView.tsx        — 토글 + + 휴가 신청 버튼 + DayBottomSheet onStartLeave
src/components/calendar/DayBottomSheet.tsx   — 이 날짜로 휴가 신청 버튼
src/components/views/DraftView.tsx           — useSearchParams 프리필 수신
src/components/views/ApprovalDetailView.tsx  — PDF 버튼 + showPdf 상태
```

---

## 디자인 토큰 (README 기준)

```ts
primary: "#2d5c6e"   // 소망 청록 (CalendarView는 현재 #3b5bdb 사용 중 → PDF/알림/근무표에만 적용)
danger:  "#dc2626"
success: "#16a34a"
stamp:   "#c1272d"   // PDF 도장 전용
```

CalendarView 기존 색상(#3b5bdb)은 건드리지 않는다. 신규 UI(휴가 신청 버튼, 근무표 토글)만 소망 청록 사용.

---

## 제외 범위

- 서버 연동 (알림 SSE/WebSocket, 근무표 API, PDF 실제 생성) — mock 데이터 유지
- Noto Serif KR 웹폰트 로드 — `<link>` 태그를 layout에 추가하는 수준으로 처리
- 다크 모드
- 데스크톱 반응형 (모바일 max-width 430px 유지)
