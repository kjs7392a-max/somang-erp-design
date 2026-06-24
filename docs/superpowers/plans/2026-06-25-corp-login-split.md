# 법인별 로그인 페이지 분리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `NEXT_PUBLIC_CORP` 환경변수로 소망(SM)/현대(HD) 각 Vercel 배포가 자기 법인 텍스트만 로그인 화면에 표시하도록 한다.

**Architecture:** 법인 설정을 `src/lib/corp.ts` 단일 파일로 중앙화하고, `LoginView.tsx`가 이를 읽어 병원명·copyright를 렌더링한다. 환경변수 미설정 시 SM(소망) 기본값.

**Tech Stack:** Next.js App Router, TypeScript, `NEXT_PUBLIC_*` 환경변수

## Global Constraints

- `NEXT_PUBLIC_CORP` 미설정 → SM 기본값 (somang-erp 로컬 개발 영향 없음)
- 로그인 로직(`login/page.tsx`) 무변경
- 로고 이미지·색상·애니메이션 무변경

---

## 파일 구조

| 파일 | 역할 |
|---|---|
| `src/lib/corp.ts` (신규) | 환경변수 읽어 법인 텍스트 export |
| `src/components/auth/LoginView.tsx` (수정) | 하드코딩 텍스트 → corp 값으로 교체 |

---

### Task 1: `src/lib/corp.ts` 생성 + `LoginView.tsx` 수정

**Files:**
- Create: `src/lib/corp.ts`
- Modify: `src/components/auth/LoginView.tsx`

**Interfaces:**
- Produces: `corp.name: string`, `corp.copyright: string`

- [ ] **Step 1: `src/lib/corp.ts` 생성**

```ts
type CorpConfig = { name: string; copyright: string };

const CORP_MAP: Record<string, CorpConfig> = {
  SM: {
    name: "소망의료재단",
    copyright: "© 2026 소망의료재단. All rights reserved.",
  },
  HD: {
    name: "현대병원",
    copyright: "© 2026 현대병원. All rights reserved.",
  },
};

export const corp: CorpConfig =
  CORP_MAP[process.env.NEXT_PUBLIC_CORP ?? "SM"] ?? CORP_MAP["SM"];
```

- [ ] **Step 2: `LoginView.tsx` 상단에 import 추가**

파일 상단(기존 import 블록 아래)에 추가:

```ts
import { corp } from "@/lib/corp";
```

- [ ] **Step 3: 병원명 두 줄 → 한 줄로 교체**

현재 코드 (72~76번째 줄 근처):
```tsx
<h1 className="font-display mb-1 text-center text-[1.8rem] font-bold tracking-[0.088em] text-[#1e293b]">
  소망의료재단
</h1>
<p className="font-display text-center text-[1.8rem] font-bold tracking-[0.088em] text-[#1e293b]">
  현대병원
</p>
```

교체 후:
```tsx
<h1 className="font-display mb-1 text-center text-[1.8rem] font-bold tracking-[0.088em] text-[#1e293b]">
  {corp.name}
</h1>
```

- [ ] **Step 4: 푸터 copyright 교체**

현재 코드 (173번째 줄 근처):
```tsx
<p className="text-[0.6875rem] font-normal text-white/85">
  © 2026 소망의료재단 · 현대병원. All rights reserved.
</p>
```

교체 후:
```tsx
<p className="text-[0.6875rem] font-normal text-white/85">
  {corp.copyright}
</p>
```

- [ ] **Step 5: 로컬에서 동작 확인**

터미널에서:
```bash
NEXT_PUBLIC_CORP=SM npm run dev
# → 로그인 화면에 "소망의료재단" 표시 확인

NEXT_PUBLIC_CORP=HD npm run dev
# → 로그인 화면에 "현대병원" 표시 확인
```

Windows PowerShell의 경우:
```powershell
$env:NEXT_PUBLIC_CORP="HD"; npm run dev
```

- [ ] **Step 6: 커밋**

```bash
git add src/lib/corp.ts src/components/auth/LoginView.tsx
git commit -m "feat: 법인별 로그인 텍스트 분리 — NEXT_PUBLIC_CORP 환경변수 기반 (SM/HD)"
```

---

### Task 2: Vercel 환경변수 설정 (수동)

**Files:** 없음 (Vercel 대시보드 작업)

- [ ] **Step 1: somang-erp 프로젝트 환경변수 추가**

Vercel 대시보드 → `somang-erp` 프로젝트 → Settings → Environment Variables
```
Key:   NEXT_PUBLIC_CORP
Value: SM
Environment: Production, Preview, Development 모두 체크
```

- [ ] **Step 2: hyundai-erp 프로젝트 환경변수 추가**

Vercel 대시보드 → `hyundai-erp` 프로젝트 → Settings → Environment Variables
```
Key:   NEXT_PUBLIC_CORP
Value: HD
Environment: Production, Preview, Development 모두 체크
```

- [ ] **Step 3: main 푸시 → 자동배포 확인**

```bash
git push origin main
```

배포 완료 후:
- `somang-erp.vercel.app/login` → "소망의료재단" 표시 확인
- `hyundai-erp.vercel.app/login` → "현대병원" 표시 확인
