# 실시간 공지 번역 설계 (Real-time Announcement Translation)

- 작성일: 2026-06-25
- 브랜치: feature/general-affairs-dashboard
- 상태: 설계 승인 대기

## 1. 목표

외국인 직원이 로그인하면 **메뉴/UI**(기존 정적 사전)와 **게시판 공지 본문**까지 본인 언어로 표시되게 한다.

1차 적용 대상(소망병원 영양과 조리원):
- **SM-0126 빅토르 → 러시아어 (`ru`)**
- **SM-0124 스베트라나 → 우즈베크어 (`uz`)**

> 메뉴/네비게이션/버튼 등 UI 문구는 이미 `src/lib/i18n/translations.ts` 정적 5개국어 사전으로 완비되어 있어, 해당 직원의 `profiles.lang`만 바꾸면 자동 번역된다. 따라서 신규 작업은 **(a) 언어 지정**과 **(b) 공지 본문 실시간 번역**에 집중한다.

## 2. 현재 구조 (확인된 사실)

- 언어 저장: `profiles.lang` (Supabase) → `AuthContext`가 로드 → `LangContext`(`useT`, `useLang`)가 앱 전역 주입.
- 게시판 = 별도 목록 페이지 없음. **홈 공지 섹션** `src/components/home/AnnouncementSection.tsx`(부서/회사별 최대 2건) + **상세 모달** `src/components/home/AnnouncementDetailModal.tsx` 두 곳뿐.
- 공지 데이터: 목업 `src/lib/home-data.ts`의 `ANNOUNCEMENTS` (Supabase 아님). 일부 공지에 `titleI18n`/`bodyI18n` 수동 번역 보유. 언어별 텍스트는 `getAnnouncementText(item, lang)`로 추출.
- 번역 API/AI SDK: **현재 없음** (신규 추가).
- 두 직원: `staff_directory`에 존재하며, profile 계정 있음(사용자 확인 완료) → `profiles.lang` 업데이트로 적용 가능.

## 3. 번역 제공자

- **Claude Haiku (`claude-haiku-4-5`)** via Anthropic API.
- 선정 이유: 기존 Dr4rest Anthropic 인프라와 통일 / 러시아어·우즈베크어 모두 일관 품질(DeepL은 우즈베크어 미지원).
- **API 키는 서버 전용** `ANTHROPIC_API_KEY` — 클라이언트 번들에 절대 노출 금지.

## 4. 구성요소

### 4.1 언어 지정 (마이그레이션)
- 신규 Supabase 마이그레이션 `supabase/migrations/20260625_set_chef_langs.sql`.
- `SM-0126` profile.lang = `ru`, `SM-0124` profile.lang = `uz` 로 UPDATE.
- `employee_id` 기준 멱등 UPDATE (재실행 안전).

### 4.2 서버 번역 엔드포인트
- `POST /api/translate` (Next.js Route Handler, 서버 런타임).
- 입력: `{ texts: string[], target: Lang }` (`target`은 `ko` 제외 ru|zh|uz|uk).
- 처리: 캐시 조회(4.3) → 미스 텍스트만 Claude 호출 → 캐시 저장 → 원래 순서대로 `{ translations: string[] }` 반환.
- Claude 프롬프트 원칙: "주어진 한국어 텍스트를 {대상언어}로 번역. 의미·줄바꿈·서식 보존. 번역문 외 어떤 설명도 출력 금지. 입력 배열과 동일 길이의 JSON 배열로만 응답."
- 입력 검증: `target` 화이트리스트, `texts` 길이/개수 상한(예: 최대 20개, 각 4000자). 빈 문자열은 그대로 통과.
- 실패 시: 5xx + 클라이언트는 원문 폴백(아래 4.4).

### 4.3 번역 캐시 (Supabase)
- 테이블 `translation_cache`:
  - `source_hash text` — 원문 텍스트의 sha-256
  - `target_lang text`
  - `translated_text text`
  - `created_at timestamptz default now()`
  - PRIMARY KEY (`source_hash`, `target_lang`)
- 마이그레이션 `supabase/migrations/20260625_translation_cache.sql`.
- RLS: 인증 사용자 읽기 허용. 쓰기는 서버(서비스 롤)만. (엔드포인트가 서비스 롤로 upsert)
- 목적: 동일 공지 재번역 방지(비용·지연 절감). 원문이 바뀌면 hash가 달라져 자연히 재번역.

### 4.4 클라이언트 연결
- 공지 텍스트 해석 우선순위:
  1. `lang === "ko"` → 원문(`title`/`body`).
  2. 수동 번역본(`titleI18n[lang]`/`bodyI18n[lang]`) 존재 → 그대로 사용(즉시·무료, API 미호출).
  3. 그 외 → `/api/translate` 호출. 응답 도착 전에는 **원문 표시**(레이아웃 안정), 도착 후 번역문으로 교체.
- 구현: 공지 목록/상세에서 미번역 항목만 모아 한 번에 `/api/translate` 호출하는 클라이언트 훅(예: `useAnnouncementTranslation`). `AnnouncementSection`과 `AnnouncementDetailModal`에 적용.
- `getAnnouncementText`는 동기(원문/수동본) 경로 유지, 비동기 API 경로는 훅이 담당.

### 4.5 메뉴/UI
- 추가 작업 없음. `profiles.lang` 설정 시 기존 정적 사전으로 자동.

### 4.6 시연용 샘플 공지 (권장 — 스펙 검토 시 제외 가능)
- 현재 회사 공지 2건은 이미 ru/uz 수동 번역본 보유 → API가 안 탄다. 영양과 대상 부서 공지는 0건.
- 따라서 두 직원이 **실시간 번역을 실제로 보게** 하려면, **한국어로만 작성된 영양과(`targetDept: "영양과"`) 공지 1건**을 `ANNOUNCEMENTS`에 추가(번역본 없이). 이 공지가 라이브 번역 경로(4.4-3)를 타게 된다.

## 5. 범위 밖 (YAGNI)
- 기안(결재) 본문 번역 — 별도 미구현 항목 `project-draft-translation`.
- 사용자 셀프 언어 변경 UI.
- 캘린더 이벤트 등 그 외 동적 콘텐츠 번역.
- 공지의 Supabase 이관(현재 목업 유지). 추후 이관 시 작성 시점 번역 캐싱으로 확장 가능.

## 6. 데이터 흐름 요약

```
로그인 → AuthContext(profiles.lang) → LangContext
  UI 문구: useT() → 정적 사전(즉시)
  공지: AnnouncementSection/Modal
    ├ ko → 원문
    ├ 수동 i18n 有 → 수동본(즉시)
    └ 그 외 → useAnnouncementTranslation
              → POST /api/translate {texts,target}
                 → translation_cache 조회 (hit→반환)
                 → miss → Claude Haiku 번역 → 캐시 upsert → 반환
```

## 7. 오류 처리 / 비용
- 번역 API 실패·타임아웃 → 원문 표시(기능 저하 없이 폴백).
- 캐시로 반복 비용 차단. Haiku 저비용 모델 사용.
- 환경변수 `ANTHROPIC_API_KEY` 미설정 시 엔드포인트는 명확한 5xx, 클라이언트 원문 폴백.

## 8. 테스트 전략
- 엔드포인트: target 화이트리스트/길이 검증, 캐시 hit/miss, 빈 문자열 통과, 키 미설정 폴백.
- 캐시: 동일 입력 2회 호출 시 2회차 Claude 미호출(캐시 hit) 확인.
- 클라이언트: `ko`/수동본/실시간 3경로 렌더링, API 실패 시 원문 폴백.
- 통합: 빅토르(ru)/스베트라나(uz) 로그인 시 메뉴 + 영양과 샘플 공지가 각 언어로 표시.
