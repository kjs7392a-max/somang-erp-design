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

> ⚠️ **2026-06-23 정정:** 이 수정은 실제로는 동작하지 않았음. 아래 BUG-003 참조. 루트 `proxy.ts`를 고쳤으나 Next.js는 루트가 아니라 `src/proxy.ts`를 실행하므로 이 변경은 한 번도 실행되지 않았다.

---

## BUG-003 · iOS 무한루프 — 진짜 원인은 구형 Safari JS 미실행 ✅ 수정완료

**발생일** 2026-06-23  
**수정일** 2026-06-23  
**커밋** `fe5224c`(섬 제거) · `2e9d8f2`(/ios 리다이렉트) · Q2-B/정리 커밋

### 핵심 발견: BUG-001/002의 전제가 틀렸다
BUG-001 교훈에 "루트와 `src/` 양쪽에 `proxy.ts`가 있으면 **루트가 우선**"이라고 적혀 있으나 **정반대다.**

Next.js 16 소스(`node_modules/next/dist/build/index.js:616`):
```
const rootDir = path.join(pagesDir || appDir, '..');   // appDir = src/app → rootDir = src
const rootPaths = getFilesInDir(rootDir) ...           // src 안만 스캔
```
`src/` 디렉터리를 쓰면 proxy 탐색 기준이 `src`가 되어 **`src/proxy.ts`만 발견·실행**하고 루트 `proxy.ts`는 스캔 범위 밖이라 **완전히 무시**된다.

→ BUG-002의 수정(`598a1da` 등 루트 `proxy.ts`에 `/ios` 우회 추가)을 포함한 최근 iOS 커밋 4건은 전부 **죽은 파일**을 고쳤다. 한 줄도 실행된 적이 없어 루프가 그대로 남았다.

실제 활성 proxy인 `src/proxy.ts`는 현재 `// DIAGNOSTIC: pass everything through` — **인증 검사를 아예 하지 않는 통과 파일**이다.

### 원인 정리
- **RC1** 활성 proxy = `src/proxy.ts`(통과). 루트 `proxy.ts`(게이트+`/ios`우회)는 죽은 코드.
- **RC2** iOS(`/ios/*`)는 `supabase-js`+localStorage, 앱 본체(Android 포함)는 `@supabase/ssr`+쿠키 → 세션 저장소 분리, 상호 공유 안 됨.
- **RC3** PWA `start_url`=`/home`(쿠키 게이트, `(main)/home/page.tsx:26` 클라이언트 가드). iOS는 쿠키 세션이 없어 진입 즉시 `/login`→`/ios/login`으로 튕김. `/ios/home`까지 가도 외딴 섬이라 기능 페이지·재실행 시 다시 튕김 → 체감 무한루프.

### 진짜 원인 (기기 진단으로 확정)
화면 진단 오버레이(`stamp`에 `iOS:?  tp:-1` 표시)로 확인한 결과, **해당 iPhone(iOS 16.1.1)에서 JS 번들이 아예 실행되지 않았음**. `useEffect`가 안 도니 stamp 값이 서버 초기값 그대로였다.

- **RC0 (주원인):** iOS Safari **16.4 미만**은 Next.js 16 + React 19 번들 실행에 실패(특정 기능 미지원). JS가 죽으니:
  - 로그인 폼이 `preventDefault` 없이 **네이티브 전송**(전체 새로고침) → 비번 오입력해도 로그인 화면 복귀
  - 세션·리다이렉트 처리 전부 안 됨 → 무한루프
  - Android는 JS 정상 실행 → 무관
- **RC1:** iOS를 우회하려 만든 `/ios` localStorage 섬은 잘못된 진단의 산물(원래 루프는 JS 문제였음). JS가 돌면(16.4+/18) iOS도 쿠키 흐름으로 정상 동작.
- **RC2:** 최근 iOS 커밋들이 **죽은 루트 `proxy.ts`**를 고쳐 효과 없었음(아래 교훈).

### 수정 내용
| 파일 | 변경 |
|---|---|
| `src/app/login/page.tsx` | iOS→`/ios/login` 리다이렉트 제거 (iOS도 동일 쿠키 로그인) |
| `src/app/ios/*`, `src/lib/supabase-ios.ts` | 삭제 (localStorage 섬 제거) |
| `proxy.ts` (루트) | 삭제 (죽은 코드) |
| `src/proxy.ts` | `/ios/*` → `/login` 리다이렉트 추가 (PWA 옛 주소 404 복구) |
| `src/app/layout.tsx` | `<head>`에 ES5 인라인 스크립트: 실제 iOS UA & 16.4 미만이면 **업데이트 안내 화면** 표시 |

### 검증
- iOS 18로 업그레이드한 기기에서 로그인·네비바·홈아이콘·캘린더·메뉴 전부 정상 확인.
- `/ios/login` → 307 `/login` 리다이렉트 확인(somang/hyundai 양 프로젝트).

### 교훈
- **무한루프 = 인증 버그라고 단정하지 말 것.** 실제 원인은 **구형 Safari에서 JS 번들 자체가 미실행**이었고, 모든 증상이 거기서 파생됐다. 화면 stamp(`iOS:?  tp:-1`)가 JS 미실행을 한 번에 드러냄.
- **구형 iOS 대응:** Safari 16.4가 기준선. iPhone 8/X도 iOS 16.7(Safari 16.6)까지 업데이트 가능 → 사실상 업데이트로 해결. iPhone 7 이하(iOS 15)만 불가 → 업데이트 안내로 처리.
- **`src/` 디렉터리 사용 시 proxy/middleware는 `src/proxy.ts`가 활성. 루트 파일은 무시됨.** (BUG-001 교훈의 "루트 우선"은 오류) 두 파일이 공존하면 즉시 하나를 지워야 한다.
- iPad는 데스크탑 UA(`Mac OS X 10_15`)를 써서 OS 버전 파싱이 안 됨 → UA 버전 게이트는 실제 iOS UA(`iPhone|iPad|iPod`)만 검사해 오탐 방지.

---
