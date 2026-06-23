# 소망병원 ERP — 버그 추적

> 버그 발생 및 수정 이력. 원인 분석 참고용.

---

## BUG-001 · 로그인 무한 리다이렉트 ✅ 수정완료

**발생일** 2026-04-27  
**수정일** 2026-04-27  
**커밋** `72b8fe5`

### 증상
로그인 성공 후 홈 화면으로 이동했다가 즉시 `/login`으로 돌아오는 루프.

### 원인 (복합)

**① 루트 `proxy.ts`가 구버전 쿠키를 체크 (주원인)**
- Next.js 16은 루트 `proxy.ts`를 `src/proxy.ts`보다 우선 실행
- 루트 파일은 Supabase 도입 이전 코드: `somang_auth=1` 쿠키 유무로 인증 판단
- Supabase 로그인은 `sb-{project_ref}-auth-token` 쿠키를 설정 → `somang_auth` 없음 → 항상 차단

**② 브라우저 autofill이 React state를 우회**
- 브라우저 자동완성은 DOM 값을 채우지만 React `onChange` 미발생
- state가 빈 값이어서 `signInWithPassword` 미호출

**③ 로그아웃 버튼들이 `signOut()` 미호출**
- `router.replace('/login')`만 호출 → 쿠키 유지 → proxy가 홈으로 재리다이렉트

### 수정 내용
| 파일 | 변경 |
|---|---|
| `proxy.ts` (루트) | `somang_auth` → `*-auth-token` 쿠키 체크로 교체 |
| `src/app/login/page.tsx` | `FormData`로 autofill 처리, debug 코드 제거 |
| `src/components/auth/LoginView.tsx` | input에 `name` 속성 추가 |
| `src/components/layout/AppHeader.tsx` | 로그아웃 → `signOut()` 연결 |
| `src/app/(main)/home/page.tsx` | `onLogout` → `signOut` 연결 |

### 교훈
- 루트와 `src/` 양쪽에 `proxy.ts`가 있을 경우 루트가 우선. 서버 로그 `proxy.ts: Xms`만으로는 어느 파일이 실행됐는지 알 수 없음.
- `@supabase/ssr` `createServerClient` + `getSession()`은 Next.js 16 proxy(Node.js 런타임)에서 세션 null 반환. 원인 불명확 (PKCE/런타임 호환성 추정).
- `document.cookie`에서 보이는 쿠키라도 서버 요청에 포함 안 될 수 있음 (path, secure 플래그 확인 필요).

---

## BUG-002 · iOS 로그인 무한루프 ✅ 수정완료

**발생일** 2026-06-23  
**수정일** 2026-06-23

### 증상
iOS에서 `/ios/login` 로그인 성공 후 `/ios/home`으로 가지 못하고 `/login`↔`/ios/login`을 오가는 무한루프. 또한 이를 고치려 proxy를 건드릴 때마다 Android 인증이 같이 깨짐.

### 원인 (구조적 커플링)
- **iOS 클라이언트**(`src/lib/supabase-ios.ts`)는 `supabase-js` + `window.localStorage` 저장 → **쿠키를 설정하지 않음**.
- **Android 클라이언트**(`src/lib/supabase.ts`)는 `@supabase/ssr` `createBrowserClient` → **쿠키**(`sb-...-auth-token`) 저장.
- 루트 `proxy.ts`는 matcher가 `/ios/*` 포함, **쿠키 유무로만** 인증 판단.
- 결과: iOS 로그인은 localStorage에만 세션 저장 → 쿠키 없음 → `/ios/home` 풀 네비게이션 시 proxy가 `isLoggedIn=false`로 보고 `/login`으로 리다이렉트 → `/login`이 iOS UA 감지해 `/ios/login`으로 되돌림 → **루프**.
- 단일 공유 `proxy.ts`가 Android·iOS 양쪽 게이트여서 iOS 수정이 Android에 전이됨.

### 수정 내용
| 파일 | 변경 |
|---|---|
| `proxy.ts` (루트) | `isPublic`에 `pathname.startsWith("/ios")` 추가 → `/ios/*`는 쿠키 게이트 우회, 클라이언트 자체 인증 사용 |

### 교훈
- 저장 방식이 다른 두 인증(쿠키 vs localStorage)을 **하나의 쿠키 기반 proxy**로 게이트하면 충돌. 경로별로 게이트를 분리해야 함.
- **미해결 후속:** `/ios/home`의 3개 기능 버튼은 여전히 Android 공유 라우트(`/approval`, `/calendar`, `/draft`)로 이동 → 이들도 쿠키 proxy가 막으므로 버튼 클릭 시 동일 루프 발생. 별도 작업 필요.

---
