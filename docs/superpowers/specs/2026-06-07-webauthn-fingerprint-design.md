# WebAuthn 지문인식 로그인 설계

**날짜:** 2026-06-07  
**범위:** 소망병원 ERP 로그인 화면 + 등록 흐름  
**접근법:** Full WebAuthn (Approach A) — SimpleWebAuthn + Supabase Admin

---

## 1. 목표

- 스마트폰 사용자가 사번+비밀번호 없이 지문(Android) 또는 Face ID/Touch ID(iOS)로 로그인 가능
- 기존 비밀번호 로그인은 그대로 유지 (지문은 추가 옵션)
- 서버에서 공개키 검증 — 보안 표준 준수, 기기 분실 시 서버에서 취소 가능

---

## 2. 지원 환경

| 환경 | 인증 수단 |
|---|---|
| Android Chrome | 지문 센서 |
| iOS Safari | Face ID / Touch ID |
| Windows Chrome/Edge | Windows Hello |
| Mac Chrome/Safari | Touch ID |

WebAuthn 미지원 브라우저: 지문 버튼 자체를 숨김 (`PublicKeyCredential` 존재 여부로 판단)

---

## 3. 아키텍처

### 새로 생기는 파일

```
src/
├── app/api/auth/webauthn/
│   ├── register/route.ts          # 등록 options + verify
│   └── authenticate/route.ts     # 인증 options + verify
├── lib/
│   ├── webauthn.ts                # 서버 검증 헬퍼 (SimpleWebAuthn)
│   └── webauthn-client.ts        # 브라우저 WebAuthn 호출 헬퍼
├── hooks/
│   └── useWebAuthn.ts            # 등록/인증 React hook
└── components/auth/
    └── WebAuthnPrompt.tsx        # 첫 로그인 후 등록 안내 팝업
```

### 수정되는 파일

| 파일 | 변경 내용 |
|---|---|
| `src/components/auth/LoginView.tsx` | 지문 버튼 + props 추가 |
| `src/app/login/page.tsx` | 등록 흐름 연결, useWebAuthn 사용 |
| `src/lib/supabase.ts` | 서버용 admin 클라이언트 추가 |

### 추가 환경변수

```
SUPABASE_SERVICE_ROLE_KEY   # Supabase 어드민 세션 발급용
WEBAUTHN_SECRET             # challenge 서명용 32바이트 랜덤값
```

---

## 4. DB 스키마

테이블 1개 추가. challenge는 서명된 단기 JWT 쿠키로 처리 (DB 테이블 불필요).

```sql
CREATE TABLE webauthn_credentials (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id   text        NOT NULL UNIQUE,
  public_key      text        NOT NULL,
  counter         bigint      NOT NULL DEFAULT 0,
  device_name     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_used_at    timestamptz
);

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
```

- `credential_id`: 기기 발급 고유 ID
- `public_key`: 서버 검증용 공개키 (base64url)
- `counter`: 재사용 공격 방지 카운터, 인증마다 증가
- `device_name`: 기기 관리 UI용. 등록 시 User-Agent를 파싱해 자동 입력 (예: "iPhone 15"). 파싱 실패 시 null.
- 1인당 여러 기기 등록 가능 (같은 `user_id`로 복수 row 허용)

---

## 5. UI 설계

**선택된 패턴: B — 구분선 + 보조 버튼**

```
[ 아이디 입력          ]
[ 비밀번호 입력        ]
[ □ 로그인 유지        ]

[ 로그인               ]   ← 기존 버튼

  ─────── 또는 ───────

[ 👆 지문으로 로그인   ]   ← localStorage "wn_registered" 플래그 있을 때만 표시
```

- 지문 미등록 사용자: 지문 버튼 없음 (기존 화면과 동일)
- WebAuthn 미지원 기기: 지문 버튼 없음

**등록 팝업 (WebAuthnPrompt)**

```
┌─────────────────────────────┐
│  빠른 로그인 설정           │
│                             │
│  지문(또는 Face ID)으로     │
│  다음부터 바로 로그인할 수  │
│  있습니다.                  │
│                             │
│  [지금 등록하기]  [다음에]  │
└─────────────────────────────┘
```

비밀번호 로그인 성공 직후, 미등록 상태일 때 1회 표시.

---

## 6. 인증 흐름

### 등록 (최초 1회)

```
비번 로그인 성공
  → WebAuthnPrompt 표시
  → "지금 등록하기" 탭
  → POST /api/auth/webauthn/register { action: "options" }
      서버: Supabase 세션으로 사용자 확인 → challenge 생성
            → JWT 쿠키(5분 만료)에 challenge 저장 → registrationOptions 반환
  → 브라우저: navigator.credentials.create() → 지문인식
  → POST /api/auth/webauthn/register { action: "verify", credential }
      서버: JWT 쿠키에서 challenge 추출 → SimpleWebAuthn.verifyRegistrationResponse()
            → webauthn_credentials 테이블에 공개키 저장
  → 클라이언트: localStorage에 "wn_registered:{employeeId}" 저장
               (사번과 함께 저장해야 로그인 시 어느 사용자 credential을 조회할지 알 수 있음)
```

### 로그인 (등록 후)

```
로그인 화면 진입
  → localStorage "wn_registered" 확인 → 지문 버튼 표시
  → 사번 입력 + "지문으로 로그인" 탭
  → POST /api/auth/webauthn/authenticate { action: "options", employeeId }
      서버: employeeId로 credentials 조회 → challenge 생성
            → JWT 쿠키(5분 만료)에 저장 → authenticationOptions 반환
  → 브라우저: navigator.credentials.get() → 지문인식
  → POST /api/auth/webauthn/authenticate { action: "verify", credential }
      서버: 서명 검증 + counter 업데이트
            → Supabase 세션 발급 (두 가지 방법 중 하나):
              - 방법1: supabase.auth.admin.createSession({ user_id }) — v2.x 이상
              - 방법2: supabase.auth.admin.generateLink({ type:'magiclink', email })
                       → 토큰 추출 → 클라이언트에서 supabase.auth.verifyOtp()
            → access_token / refresh_token 반환
  → 클라이언트: supabase.auth.setSession() → 홈 이동
```

---

## 7. 에러 처리

| 상황 | 처리 |
|---|---|
| 지문 인식 실패 / 사용자 취소 | 조용히 폼으로 복귀 (에러 메시지 없음) |
| counter 불일치 | 해당 credential 무효화 + 재등록 안내 |
| WebAuthn 미지원 기기 | 버튼 숨김 (분기 처리) |
| 등록된 credential 없음 | "지문 미등록" 안내 + 비밀번호 로그인 유도 |

---

## 8. 의존성

```json
{
  "@simplewebauthn/browser": "^13.x",
  "@simplewebauthn/server": "^13.x"
}
```

---

## 9. 구현 순서 (참고)

1. DB 마이그레이션 (`webauthn_credentials` 테이블)
2. 환경변수 추가 (`SUPABASE_SERVICE_ROLE_KEY`, `WEBAUTHN_SECRET`)
3. `src/lib/webauthn.ts` — 서버 헬퍼
4. `src/app/api/auth/webauthn/register/route.ts`
5. `src/app/api/auth/webauthn/authenticate/route.ts`
6. `src/lib/webauthn-client.ts` — 브라우저 헬퍼
7. `src/hooks/useWebAuthn.ts`
8. `src/components/auth/WebAuthnPrompt.tsx`
9. `LoginView` + `LoginPage` 수정
