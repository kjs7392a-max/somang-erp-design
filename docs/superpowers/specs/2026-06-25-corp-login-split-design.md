# 법인별 로그인 페이지 분리 설계

**날짜:** 2026-06-25  
**범위:** 소망의료재단(SM) / 현대병원(HD) 각 Vercel 배포에서 자기 법인 텍스트만 표시

---

## 문제

현재 `LoginView.tsx`에 "소망의료재단"과 "현대병원"이 둘 다 하드코딩되어 있음.  
같은 레포가 `somang-erp`와 `hyundai-erp` 두 Vercel 프로젝트로 배포되는데,  
각 배포가 자기 법인 이름만 보여야 한다.

## 결정: 환경변수 기반 분기 (Option B)

`NEXT_PUBLIC_CORP` 환경변수 하나로 제어.  
코드 복제 없이 하나의 컴포넌트가 두 법인 모두 커버.

## 변경 내용

### 1. `src/lib/corp.ts` (신규)

```ts
type CorpConfig = { name: string; copyright: string };

const CORP_MAP: Record<string, CorpConfig> = {
  SM: { name: "소망의료재단", copyright: "© 2026 소망의료재단. All rights reserved." },
  HD: { name: "현대병원",    copyright: "© 2026 현대병원. All rights reserved." },
};

export const corp: CorpConfig =
  CORP_MAP[process.env.NEXT_PUBLIC_CORP ?? "SM"] ?? CORP_MAP["SM"];
```

### 2. `src/components/auth/LoginView.tsx`

- `h1` + `p` 두 줄(소망의료재단 / 현대병원) → `corp.name` 한 줄로 교체
- 푸터 copyright → `corp.copyright`로 교체

### 3. Vercel 환경변수

| 프로젝트 | 변수 | 값 |
|---|---|---|
| somang-erp | `NEXT_PUBLIC_CORP` | `SM` |
| hyundai-erp | `NEXT_PUBLIC_CORP` | `HD` |

`NEXT_PUBLIC_CORP` 미설정 시 SM(소망) 기본값.

## 비변경 사항

- `login/page.tsx` 로그인 로직 무변경 (SM-/HD- 사번 prefix 자동 분기 유지)
- 로고 이미지, 색상, 애니메이션 무변경
- 생체인증 로직 무변경
