# 생체/비밀번호 인증 통합 — 온보딩 + 앱잠금 설계

**작성일** 2026-06-24
**상태** 승인됨 (구현 대기)

## 1. 목적

- **최초 등록(온보딩):** 공용 비번으로 첫 로그인 시 개인 비번으로 변경하고, 생체(지문/Touch ID/Face ID)를 등록하게 한다.
- **앱 잠금:** 앱을 열 때마다 생체 또는 비밀번호로 잠금을 해제한다. 스왑/완전종료 후 재실행 시 재잠금.
- **항상 비번 fallback:** 모든 인증 화면은 생체를 메인으로 띄우되, 작게 "다른 방법으로 로그인" → 비밀번호로 전환 가능. 생체가 안 되는 상황(실패·미등록·구형 기기·PC)에서도 항상 비번으로 진입.

전제: 현재 `webauthn_credentials`가 **0건** — 생체 등록이 실제로 작동한 적 없음. 이를 먼저 작동시키는 것이 모든 기능의 선결 조건이다.

## 2. 인증 화면 (로그인 · 앱잠금 공통)

기존 `BiometricLockScreen`을 재사용한다. 이미 "생체 메인 + 하단 비밀번호 탈출구" 구조다.

- **메인:** 생체 인증. 라벨/아이콘을 **기기 적응**으로:
  - iPhone → "Face ID로 잠금 해제"
  - iPad → "Touch ID로 잠금 해제"
  - Android → "지문으로 잠금 해제"
  - 기타/불명 → "생체 인증"
- **하단:** 작게 "다른 방법으로 로그인" → 탭하면 비밀번호 입력 화면.
- 생체가 등록돼 있으면 생체가 메인(= 사용자의 선호 방식 유지). 미등록·구형·PC → 바로 비밀번호 화면.
- 생체 경로: `authenticateBiometric()` → 반환 토큰으로 `supabase.auth.setSession()`.
- 비번 경로: 로그인 화면은 `signInWithPassword`, 앱잠금은 현재 사용자(profile)의 email로 `signInWithPassword` 재검증.

## 3. 온보딩 (최초 로그인)

### 3.1 흐름
1. 사번 + **공용 비번(사번+1234)** 입력 → 로그인 성공.
2. **첫 로그인 감지:** `profiles.onboarded === false` 면 온보딩 화면으로.
3. **비밀번호 변경(강제):** 개인 비번 입력 → `supabase.auth.updateUser({ password })`.
4. **생체 등록 안내(선택):** "지금 등록" → `registerBiometric` / "건너뛰기" → 비번만.
5. 온보딩 완료 표시 → 앱 진입.

### 3.2 데이터 모델
- `profiles`에 `onboarded boolean NOT NULL DEFAULT false` 추가 (마이그레이션).
- 기존 213명: 기본 `false`로 두어 모두 1회 온보딩(비번 변경 + 생체 등록 권장)을 거치게 한다.
  (이미 개인 비번을 쓰는 관리자도 1회 거치지만 무해. 예외 두려면 해당 계정만 `true`로 별도 설정.)

### 3.3 완료 처리
- `onboarded=true`는 클라이언트가 직접 못 바꾸게 **API 라우트**(`/api/onboarding/complete`, 서버에서 인증 사용자 검증 후 service role로 업데이트)로 처리. 또는 self-update RLS 정책. (구현 시 안전한 쪽 선택 — 기본은 API 라우트)

## 4. 앱 잠금

- 새 클라이언트 컴포넌트 `AppLock`이 `src/app/(main)/layout.tsx`에서 본문을 감싼다.
- **메커니즘:** `sessionStorage`의 `app_unlocked` 플래그.
  - sessionStorage는 탭/PWA 완전종료·스왑 시 자동 삭제, 백그라운드↔복귀엔 유지.
  - 플래그 있음 → 본문 표시. 없음 → 인증 화면(§2).
  - 해제 성공 → `app_unlocked="1"` set.
- 종료 이벤트(`pagehide` 등)에 의존하지 않으므로 iOS에서도 정확히 "열 때마다 잠금".
- 명시적 로그아웃 시 플래그 제거.

## 5. 마이페이지

- 현재 `onOpenChangePassword`가 `alert("추후 구현")` → **비밀번호 변경 실제 구현**(온보딩 후에도 언제든).
- 생체 **등록/해제** 항목 추가(온보딩 때 건너뛴 사람용).

## 6. 선결 작업 (생체가 실제로 작동하게)

### 6.1 도메인 rpID 수정 (차단 요인)
`src/lib/webauthn.ts`의 `getAppOrigin()`이 Vercel에서 `somang-erp.vercel.app`로 하드코딩 폴백 → `hyundai-erp.vercel.app`에서 생체 등록·인증 실패.
→ 요청 `Origin`/`Host` 헤더 기반으로 도출하되 **허용목록**(`somang-erp.vercel.app`, `hyundai-erp.vercel.app`, `localhost:3000`)으로 검증. register/authenticate 라우트가 요청을 넘기도록 수정.

### 6.2 등록 신뢰성/가시성
`login/page.tsx`의 `registerBiometric`이 5초 타임아웃+`catch`로 실패를 조용히 삼킴. 온보딩에서는 **명시적 등록 단계**로 분리해 성공/실패를 사용자·로그로 확인 가능하게 한다.

### 6.3 실기기 검증
등록 시 `webauthn_credentials`에 행이 생기는지 확인. Android(지문)·iOS(Face ID)·iPad(Touch ID)·양 도메인에서.

## 7. 엣지 케이스

- 생체 미등록/3회 실패/취소/미지원/PC → 비밀번호로 진행(항상 가능).
- 세션 만료 + 잠금 화면 → 생체·비번 어느 쪽이든 세션 재수립.
- 구형 iOS(<16.4) → 앱 실행 자체가 안 됨(기존 `ios-check.js` 업데이트 안내). 잠금 이전 문제.
- 다중 탭 → 탭별 sessionStorage 독립.

## 8. 테스트

- 온보딩: 공용비번 로그인 → 비번 변경 강제 → 생체 등록/건너뛰기 → 완료, `onboarded=true`.
- 인증 화면: 생체 메인 + "다른 방법" → 비번 전환. 기기별 라벨.
- 앱잠금: 실행 시 잠금 → 해제 → 백그라운드 복귀 통과 → 스왑/종료 후 재실행 재잠금.
- 양 도메인 생체 등록·인증 성공. 마이페이지 비번 변경.

## 9. 범위 외 (YAGNI)

- 백그라운드 N분 타임아웃(요구: "열 때마다"만).
- Supabase 세션 저장 방식 변경.
- PC 생체 잠금.
