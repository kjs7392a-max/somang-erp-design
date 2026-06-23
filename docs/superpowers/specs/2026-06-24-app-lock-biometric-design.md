# 앱 잠금 (실행 시 생체/비밀번호 선택 인증) — 설계

**작성일** 2026-06-24
**상태** 승인됨 (구현 대기)

## 1. 목적

앱을 열 때마다 **Face ID/지문 또는 비밀번호**로 잠금을 해제해야 콘텐츠가 보이도록 한다.
스왑으로 앱을 날리거나 완전히 닫은 뒤 다시 열면 재인증을 요구해, 영구 세션만으로
바로 들어가던 보안 공백을 막는다.

## 2. 동작 요구사항

- **잠금 시점:** 앱을 새로 열 때(cold start)마다 잠금 화면 표시.
  - 백그라운드 갔다 **바로 복귀**: 통과(재잠금 안 함).
  - **완전히 닫거나 스왑으로 종료** 후 다시 열면: 잠금.
- **인증 수단:** 잠금 화면에서 사용자가 매번 선택 — ① 생체인식(iOS=Face ID / Android=지문) ② 비밀번호.
- **대상 기종:** iOS · Android 둘 다. (PC 브라우저는 적용 대상 아님 — 생체 미보유 시 비번만)
- **등록:** 최초 비밀번호 로그인 시 생체인식을 자동 등록(둘 다 세팅). 이후 잠금 화면에서 둘 다 사용 가능.

## 3. 핵심 메커니즘 — sessionStorage 잠금해제 플래그

웹/PWA에는 "사용자가 스왑으로 강제종료했다"를 알려주는 신뢰할 수 있는 이벤트가 없다
(특히 iOS). 대신 **`sessionStorage`의 생명주기**를 이용한다:

- `sessionStorage`는 **탭/PWA를 완전히 닫거나 스왑하면 자동 삭제**되고,
  백그라운드↔복귀·앱 내 화면 이동에는 **유지**된다.
- 따라서 잠금해제 플래그(`app_unlocked`)를 `sessionStorage`에 두면:
  - 플래그 있음 → 같은 실행 세션(통과)
  - 플래그 없음 → 새 실행(cold start) → 잠금 화면
- 이 방식은 종료 이벤트에 의존하지 않아 iOS에서도 정확히 "열 때마다 잠금"이 된다.

## 4. 구성

### 4.1 `AppLock` (신규 클라이언트 컴포넌트)
- 위치: `src/app/(main)/layout.tsx`에서 `MainShell`/children을 감쌈
  (= 인증이 필요한 앱 본문 전체에 적용. `/login`·`/ward`·정적 자원은 영향 없음).
- 상태: `unlocked` — 마운트 시 `sessionStorage.getItem("app_unlocked") === "1"`로 초기화.
- `unlocked === true` → children 렌더.
- `unlocked === false` → 잠금 화면 렌더.

### 4.2 잠금 화면
- 기존 `BiometricLockScreen` 패턴 재사용(생체 버튼 + "비밀번호로" 전환) 또는 전용 화면.
- **생체 경로:** `authenticateBiometric()` → 반환 토큰으로 `supabase.auth.setSession()` →
  성공 시 플래그 set → 통과.
- **비밀번호 경로:** 현재 로그인된 사용자를 알고 있으므로(AuthContext의 profile.employee_id)
  비밀번호만 입력받아 `signInWithPassword(파생 email, 입력 비번)`로 검증 →
  성공 시 플래그 set → 통과.
- 생체 미등록/실패/미지원 → 비밀번호 경로로 폴백(항상 사용 가능).

### 4.3 플래그 생명주기
- 해제 성공 시 `sessionStorage.setItem("app_unlocked","1")`.
- 명시적 로그아웃 시 함께 제거.
- 그 외엔 건드리지 않음 — 브라우저가 종료/스왑 시 자동 삭제.

## 5. 필수 선결 작업

### 5.1 현대 도메인 WebAuthn 수정 (차단 요인)
현재 `src/lib/webauthn.ts`의 `getAppOrigin()`이 Vercel에서 `somang-erp.vercel.app`로
**하드코딩 폴백**한다. WebAuthn rpID는 접속 도메인과 일치해야 하므로 `hyundai-erp.vercel.app`
에서는 생체 등록·인증이 실패한다.

→ `getAppOrigin()`/`getRpId()`를 **요청의 Origin/Host 헤더 기반**으로 도출하되,
**허용 도메인 화이트리스트**(`somang-erp.vercel.app`, `hyundai-erp.vercel.app`, `localhost`)로
검증해 헤더 위조를 차단한다. register/authenticate 라우트가 요청을 넘겨주도록 수정.

### 5.2 iOS 생체 실제 검증
iOS Face ID 등록/인증이 이 앱에서 처음이므로, 구현 중/후 실기기(iOS 16.4+)에서
①최초 비번 로그인 시 Face ID 등록 ②잠금 화면에서 Face ID 해제 동작을 확인한다.

## 6. 엣지 케이스

- **생체 미등록:** 잠금 화면은 비밀번호만 노출(+선택적 생체 등록 유도).
- **생체 3회 실패/취소:** 비밀번호 경로로 폴백.
- **세션 만료 + 잠금 화면:** 생체·비번 어느 경로든 세션을 재수립하므로 정상 진입.
- **PC 브라우저:** 생체 미보유 → 비밀번호만. (대상 외지만 깨지지 않게)
- **다중 탭:** 탭별 sessionStorage 독립 → 각자 1회 인증.

## 7. 테스트

- iOS(Face ID)/Android(지문) 각각: 실행 시 잠금 표시 → 생체 해제 / 비번 해제 →
  백그라운드↔복귀 시 재잠금 없음 → 완전 종료(스왑) 후 재실행 시 재잠금.
- 양 도메인(somang/hyundai)에서 생체 등록·인증 성공.
- 로그아웃 후 재로그인 정상.

## 8. 범위 외 (YAGNI)

- 백그라운드 N분 타임아웃 (요구: "열 때마다"만).
- Supabase 세션 저장 방식 변경(sessionStorage화) — Android 세션유지와 충돌하므로 안 함.
- PC 브라우저 생체 잠금.
