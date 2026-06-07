# WebAuthn 지문인식 로그인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스마트폰 지문(또는 Face ID)으로 사번+비밀번호 없이 로그인할 수 있게 한다.

**Architecture:** SimpleWebAuthn 라이브러리로 WebAuthn 등록/인증을 처리하고, challenge는 서명된 단기 쿠키로 저장한다(서버리스 환경에서 메모리 공유 불가). 인증 성공 후 Supabase admin API로 세션을 발급하고 클라이언트에서 `setSession()`으로 적용한다.

**Tech Stack:** `@simplewebauthn/browser ^13`, `@simplewebauthn/server ^13`, `@supabase/supabase-js ^2.104.1`, Next.js 16 App Router, Node.js `crypto`

> **참고 — 테스트:** 이 프로젝트에 테스트 프레임워크가 없으므로 TDD 대신 단계별 수동 검증으로 대체한다. 각 태스크 끝에 검증 단계가 있다.

---

## 파일 맵

| 경로 | 역할 |
|---|---|
| `src/lib/webauthn.ts` | 서버 전용 유틸 (challenge 서명, admin 클라이언트, deviceName 파싱) |
| `src/lib/webauthn-client.ts` | 브라우저 전용 유틸 (WebAuthn API 호출, localStorage 관리) |
| `src/app/api/auth/webauthn/register/route.ts` | 등록 API (options + verify) |
| `src/app/api/auth/webauthn/authenticate/route.ts` | 인증 API (options + verify) |
| `src/hooks/useWebAuthn.ts` | 등록/인증 React hook |
| `src/components/auth/WebAuthnPrompt.tsx` | 로그인 성공 후 등록 안내 팝업 |
| `src/components/auth/LoginView.tsx` | ← 지문 버튼 + props 추가 (수정) |
| `src/app/login/page.tsx` | ← 등록 흐름 + useWebAuthn 연결 (수정) |

---

## Task 1: 패키지 설치 + 환경변수 준비

**Files:**
- Modify: `package.json` (npm install로 자동)
- Modify: `.env.local`

- [ ] **Step 1: 패키지 설치**

```bash
cd "C:/dev/SOMANG ERP"
npm install @simplewebauthn/browser@^13 @simplewebauthn/server@^13
```

Expected: `node_modules/@simplewebauthn/` 폴더 생성, `package.json`에 두 패키지 추가

- [ ] **Step 2: `.env.local`에 환경변수 추가**

`.env.local` 파일을 열고 아래 두 줄을 추가한다.

```
SUPABASE_SERVICE_ROLE_KEY=여기에_서비스_롤_키_입력
WEBAUTHN_SECRET=여기에_32바이트_랜덤_문자열_입력
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

`WEBAUTHN_SECRET` 생성 방법 (터미널에서 실행):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`SUPABASE_SERVICE_ROLE_KEY`는 Supabase 대시보드 → Project Settings → API → `service_role` 항목에서 복사.

`NEXT_PUBLIC_APP_URL`은 로컬 개발 시 `http://localhost:3000`, 배포 시 실제 URL.

- [ ] **Step 3: Vercel 환경변수에도 추가**

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에 위 세 변수를 모두 추가.

- [ ] **Step 4: 검증**

```bash
cd "C:/dev/SOMANG ERP"
node -e "require('@simplewebauthn/server'); console.log('ok')"
```

Expected: `ok` 출력 (에러 없음)

- [ ] **Step 5: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: install @simplewebauthn/browser and @simplewebauthn/server"
```

---

## Task 2: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/20260607_webauthn_credentials.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

`supabase/migrations/20260607_webauthn_credentials.sql` 파일을 생성하고 아래 내용을 입력:

```sql
CREATE TABLE IF NOT EXISTS webauthn_credentials (
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

-- 서비스 롤만 접근 가능 (RLS 정책 없음 = 일반 사용자 접근 불가)
-- user_id FK가 삭제될 때 자동으로 credential도 삭제됨

CREATE INDEX IF NOT EXISTS webauthn_credentials_user_id_idx
  ON webauthn_credentials (user_id);
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

Supabase 대시보드 → SQL Editor → 위 SQL 전체 복사 후 실행.

- [ ] **Step 3: 검증**

Supabase 대시보드 → Table Editor에서 `webauthn_credentials` 테이블이 보이는지 확인. 컬럼 7개 (id, user_id, credential_id, public_key, counter, device_name, created_at, last_used_at) 확인.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/20260607_webauthn_credentials.sql
git commit -m "feat: add webauthn_credentials migration"
```

---

## Task 3: src/lib/webauthn.ts (서버 유틸)

**Files:**
- Create: `src/lib/webauthn.ts`

- [ ] **Step 1: 파일 작성**

```typescript
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// challenge 쿠키 이름
export const REG_CHALLENGE_COOKIE = "wn_reg_challenge";
export const AUTH_CHALLENGE_COOKIE = "wn_auth_challenge";

export function getAppOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getRpId(): string {
  return new URL(getAppOrigin()).hostname;
}

export function generateChallenge(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * challenge를 HMAC-SHA256으로 서명해 {challenge}.{expiry}.{hmac} 형식 토큰 반환
 * expiry: unix timestamp (seconds)
 */
export function signChallengeToken(challenge: string, ttlSeconds = 300): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${challenge}.${exp}`;
  const secret = process.env.WEBAUTHN_SECRET;
  if (!secret) throw new Error("WEBAUTHN_SECRET is not set");
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${hmac}`;
}

/**
 * 토큰 검증 후 challenge 반환. 만료 또는 서명 불일치 시 throw.
 */
export function verifyChallengeToken(token: string): string {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid challenge token format");
  const [challenge, expStr, hmac] = parts;
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) {
    throw new Error("Challenge expired");
  }
  const secret = process.env.WEBAUTHN_SECRET;
  if (!secret) throw new Error("WEBAUTHN_SECRET is not set");
  const payload = `${challenge}.${expStr}`;
  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const hmacBuf = Buffer.from(hmac, "base64url");
  const expectedBuf = Buffer.from(expectedHmac, "base64url");
  if (
    hmacBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(hmacBuf, expectedBuf)
  ) {
    throw new Error("Invalid challenge signature");
  }
  return challenge;
}

/**
 * Supabase admin 클라이언트 (service role key 사용, RLS 우회)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * User-Agent 문자열에서 기기 이름 추출. 파싱 실패 시 null 반환.
 */
export function parseDeviceName(userAgent: string): string | null {
  if (/iPhone/.test(userAgent)) return "iPhone";
  if (/iPad/.test(userAgent)) return "iPad";
  if (/Android/.test(userAgent)) {
    const m = userAgent.match(/;\s*([^;)]+)\s*\)/);
    return m ? m[1].trim() : "Android";
  }
  if (/Windows/.test(userAgent)) return "Windows PC";
  if (/Macintosh|Mac OS X/.test(userAgent)) return "Mac";
  return null;
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
cd "C:/dev/SOMANG ERP"
npx tsc --noEmit
```

Expected: 에러 없음 (기존 에러 있다면 무시하고 새 에러만 확인)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/webauthn.ts
git commit -m "feat: add server-side WebAuthn utilities"
```

---

## Task 4: 등록 API Route

**Files:**
- Create: `src/app/api/auth/webauthn/register/route.ts`

- [ ] **Step 1: 파일 작성**

```typescript
import { NextRequest, NextResponse } from "next/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  REG_CHALLENGE_COOKIE,
  createAdminClient,
  generateChallenge,
  getAppOrigin,
  getRpId,
  parseDeviceName,
  signChallengeToken,
  verifyChallengeToken,
} from "@/lib/webauthn";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  // ── options ──────────────────────────────────────────────────────────
  if (body.action === "options") {
    // 현재 로그인된 사용자 확인
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cs) {
            cs.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 이미 등록된 credential (같은 기기 중복 등록 방지)
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", user.id);

    const challenge = generateChallenge();
    const options = await generateRegistrationOptions({
      rpName: "소망의료재단",
      rpID: getRpId(),
      userName: user.email ?? user.id,
      challenge,
      excludeCredentials: (existing ?? []).map((c) => ({
        id: c.credential_id,
        type: "public-key" as const,
      })),
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
    });

    const response = NextResponse.json(options);
    response.cookies.set(REG_CHALLENGE_COOKIE, signChallengeToken(challenge), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/api/auth/webauthn/register",
    });
    return response;
  }

  // ── verify ────────────────────────────────────────────────────────────
  if (body.action === "verify") {
    const token = request.cookies.get(REG_CHALLENGE_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Missing challenge" }, { status: 400 });
    }
    let challenge: string;
    try {
      challenge = verifyChallengeToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired challenge" },
        { status: 400 }
      );
    }

    // 로그인 사용자 확인
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cs) {
            cs.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body.credential,
        expectedChallenge: challenge,
        expectedOrigin: getAppOrigin(),
        expectedRPID: getRpId(),
        requireUserVerification: true,
      });
    } catch {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    const { credential } = verification.registrationInfo;
    const admin = createAdminClient();
    const { error: insertError } = await admin
      .from("webauthn_credentials")
      .insert({
        user_id: user.id,
        credential_id: credential.id,
        public_key: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        device_name: parseDeviceName(
          request.headers.get("user-agent") ?? ""
        ),
      });

    if (insertError) {
      // credential_id 중복(이미 등록된 기기)이면 성공으로 처리
      if (insertError.code === "23505") {
        const res = NextResponse.json({ success: true });
        res.cookies.delete(REG_CHALLENGE_COOKIE);
        return res;
      }
      return NextResponse.json(
        { error: "Failed to save credential" },
        { status: 500 }
      );
    }

    const res = NextResponse.json({ success: true });
    res.cookies.delete(REG_CHALLENGE_COOKIE);
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 새 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/app/api/auth/webauthn/register/route.ts
git commit -m "feat: add WebAuthn registration API route"
```

---

## Task 5: 인증 API Route

**Files:**
- Create: `src/app/api/auth/webauthn/authenticate/route.ts`

- [ ] **Step 1: 파일 작성**

```typescript
import { NextRequest, NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import {
  AUTH_CHALLENGE_COOKIE,
  createAdminClient,
  generateChallenge,
  getAppOrigin,
  getRpId,
  signChallengeToken,
  verifyChallengeToken,
} from "@/lib/webauthn";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  // ── options ──────────────────────────────────────────────────────────
  if (body.action === "options") {
    const employeeId = (body.employeeId as string | undefined)?.trim();
    if (!employeeId) {
      return NextResponse.json(
        { error: "Missing employeeId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // profiles 테이블에서 employee_id → user_id 조회
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("employee_id", employeeId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: creds } = await admin
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", profile.id);

    if (!creds || creds.length === 0) {
      return NextResponse.json(
        { error: "No credentials registered" },
        { status: 404 }
      );
    }

    const challenge = generateChallenge();
    const options = await generateAuthenticationOptions({
      rpID: getRpId(),
      challenge,
      allowCredentials: creds.map((c) => ({
        id: c.credential_id,
        type: "public-key" as const,
      })),
      userVerification: "required",
    });

    const response = NextResponse.json(options);
    response.cookies.set(
      AUTH_CHALLENGE_COOKIE,
      signChallengeToken(challenge),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300,
        path: "/api/auth/webauthn/authenticate",
      }
    );
    return response;
  }

  // ── verify ────────────────────────────────────────────────────────────
  if (body.action === "verify") {
    const token = request.cookies.get(AUTH_CHALLENGE_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Missing challenge" }, { status: 400 });
    }
    let challenge: string;
    try {
      challenge = verifyChallengeToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired challenge" },
        { status: 400 }
      );
    }

    const credentialId = (body.credential as { id?: string } | undefined)?.id;
    if (!credentialId) {
      return NextResponse.json(
        { error: "Missing credential id" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: credRow } = await admin
      .from("webauthn_credentials")
      .select("*")
      .eq("credential_id", credentialId)
      .single();

    if (!credRow) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body.credential,
        expectedChallenge: challenge,
        expectedOrigin: getAppOrigin(),
        expectedRPID: getRpId(),
        credential: {
          id: credRow.credential_id,
          publicKey: Buffer.from(credRow.public_key, "base64url"),
          counter: credRow.counter,
        },
        requireUserVerification: true,
      });
    } catch {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    // counter 업데이트 + last_used_at
    await admin
      .from("webauthn_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("credential_id", credentialId);

    // Supabase 세션 발급
    const { data: sessionData, error: sessionError } =
      await admin.auth.admin.createSession({ user_id: credRow.user_id });

    if (sessionError || !sessionData?.session) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const res = NextResponse.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    });
    res.cookies.delete(AUTH_CHALLENGE_COOKIE);
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 새 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/app/api/auth/webauthn/authenticate/route.ts
git commit -m "feat: add WebAuthn authentication API route"
```

---

## Task 6: src/lib/webauthn-client.ts (브라우저 유틸)

> **주의:** 이 파일은 브라우저 전용이다. `"use client"` 컴포넌트나 클라이언트 훅에서만 임포트할 것.

**Files:**
- Create: `src/lib/webauthn-client.ts`

- [ ] **Step 1: 파일 작성**

```typescript
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

const LS_KEY = "wn_registered";

/** WebAuthn Platform Authenticator 지원 여부 확인 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

/** localStorage에서 등록된 employeeId 반환. 미등록 시 null. */
export function getRegisteredEmployeeId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_KEY);
}

export function setRegistered(employeeId: string): void {
  localStorage.setItem(LS_KEY, employeeId);
}

export function clearRegistered(): void {
  localStorage.removeItem(LS_KEY);
}

/**
 * 지문 등록 전체 흐름:
 * 1) POST /api/auth/webauthn/register { action: "options" } → registrationOptions
 * 2) startRegistration (브라우저 지문인식)
 * 3) POST /api/auth/webauthn/register { action: "verify", credential }
 */
export async function registerBiometric(employeeId: string): Promise<void> {
  const optRes = await fetch("/api/auth/webauthn/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "options" }),
    credentials: "include",
  });
  if (!optRes.ok) {
    const err = await optRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to get registration options");
  }
  const options = await optRes.json();

  // 브라우저 지문인식 (사용자가 취소하면 NotAllowedError throw)
  const credential = await startRegistration({ optionsJSON: options });

  const verRes = await fetch("/api/auth/webauthn/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", credential }),
    credentials: "include",
  });
  if (!verRes.ok) {
    const err = await verRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Registration verification failed");
  }

  setRegistered(employeeId);
}

/**
 * 지문 인증 전체 흐름:
 * 1) POST /api/auth/webauthn/authenticate { action: "options", employeeId }
 * 2) startAuthentication (브라우저 지문인식)
 * 3) POST /api/auth/webauthn/authenticate { action: "verify", credential }
 * @returns Supabase access_token + refresh_token
 * @throws "NO_CREDENTIAL" — 서버에 credential 없음 (재등록 필요)
 */
export async function authenticateBiometric(): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const employeeId = getRegisteredEmployeeId();
  if (!employeeId) throw new Error("No registered credential");

  const optRes = await fetch("/api/auth/webauthn/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "options", employeeId }),
    credentials: "include",
  });
  if (!optRes.ok) {
    if (optRes.status === 404) throw new Error("NO_CREDENTIAL");
    const err = await optRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to get authentication options");
  }
  const options = await optRes.json();

  const credential = await startAuthentication({ optionsJSON: options });

  const verRes = await fetch("/api/auth/webauthn/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", credential }),
    credentials: "include",
  });
  if (!verRes.ok) {
    const err = await verRes.json().catch(() => ({}));
    throw new Error(err.error ?? "Authentication verification failed");
  }
  return verRes.json();
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 새 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/webauthn-client.ts
git commit -m "feat: add browser-side WebAuthn utilities"
```

---

## Task 7: useWebAuthn Hook

**Files:**
- Create: `src/hooks/useWebAuthn.ts`

- [ ] **Step 1: 파일 작성**

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  authenticateBiometric,
  clearRegistered,
  getRegisteredEmployeeId,
  isWebAuthnSupported,
  registerBiometric,
} from "@/lib/webauthn-client";
import { ROUTES } from "@/lib/routes";

export function useWebAuthn(employeeId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(isWebAuthnSupported());
    setHasRegistered(!!getRegisteredEmployeeId());
  }, []);

  /**
   * 지문 등록. employeeId prop이 없으면 no-op.
   * 사용자 취소(NotAllowedError)는 에러 없이 무시.
   */
  async function register() {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      await registerBiometric(employeeId);
      setHasRegistered(true);
    } catch (e) {
      const isDomCancel =
        e instanceof DOMException && e.name === "NotAllowedError";
      if (!isDomCancel) {
        setError("등록 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  /**
   * 지문 인증 후 Supabase 세션 설정 → 홈 이동.
   * 사용자 취소는 에러 없이 무시. NO_CREDENTIAL이면 로컬 플래그 제거.
   */
  async function authenticate() {
    setLoading(true);
    setError(null);
    try {
      const { access_token, refresh_token } = await authenticateBiometric();
      const supabase = createClient();
      await supabase.auth.setSession({ access_token, refresh_token });
      window.location.href = ROUTES.home;
    } catch (e) {
      if (e instanceof Error && e.message === "NO_CREDENTIAL") {
        clearRegistered();
        setHasRegistered(false);
        return;
      }
      const isDomCancel =
        e instanceof DOMException && e.name === "NotAllowedError";
      if (!isDomCancel) {
        setError("지문 인증에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return { isSupported, hasRegistered, loading, error, register, authenticate };
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 새 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useWebAuthn.ts
git commit -m "feat: add useWebAuthn hook"
```

---

## Task 8: WebAuthnPrompt 컴포넌트

**Files:**
- Create: `src/components/auth/WebAuthnPrompt.tsx`

- [ ] **Step 1: 파일 작성**

```typescript
"use client";

export type WebAuthnPromptProps = {
  onRegister: () => void;
  onSkip: () => void;
  loading?: boolean;
};

export function WebAuthnPrompt({
  onRegister,
  onSkip,
  loading = false,
}: WebAuthnPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f0fd] text-2xl">
          👆
        </div>
        <h2 className="mb-2 text-lg font-bold text-[#1e293b]">
          빠른 로그인 설정
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-[#4b5d8a]">
          지문(또는 Face ID)으로 다음부터 비밀번호 없이 바로 로그인할 수
          있습니다.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-2xl border border-[#cddcfa] bg-white py-3.5 text-sm font-semibold text-[#4b5d8a] active:opacity-70"
          >
            다음에
          </button>
          <button
            type="button"
            onClick={onRegister}
            disabled={loading}
            className="flex-1 rounded-2xl bg-[#3b82f6] py-3.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)] disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? "등록 중..." : "지금 등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/auth/WebAuthnPrompt.tsx
git commit -m "feat: add WebAuthnPrompt registration modal"
```

---

## Task 9: LoginView + LoginPage 수정

**Files:**
- Modify: `src/components/auth/LoginView.tsx`
- Modify: `src/app/login/page.tsx`

### 9a — LoginView에 지문 버튼 추가

- [ ] **Step 1: LoginViewProps에 세 개 props 추가**

`src/components/auth/LoginView.tsx`의 `LoginViewProps` 타입을 아래와 같이 수정 (기존 props 유지):

```typescript
export type LoginViewProps = {
  userId: string;
  password: string;
  onUserIdChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error?: string | null;
  loading?: boolean;
  // 지문 관련 (선택)
  showBiometric?: boolean;
  biometricLoading?: boolean;
  onBiometricLogin?: () => void;
};
```

- [ ] **Step 2: 함수 시그니처에 새 props 추가**

`LoginView` 함수 인자 구조분해에 세 props 추가:

```typescript
export function LoginView({
  userId,
  password,
  onUserIdChange,
  onPasswordChange,
  onSubmit,
  error = null,
  loading = false,
  showBiometric = false,
  biometricLoading = false,
  onBiometricLogin,
}: LoginViewProps) {
```

- [ ] **Step 3: "로그인" 버튼 아래에 지문 버튼 영역 추가**

`LoginView.tsx`에서 로그인 버튼(`<button type="submit" ...>`) 다음에 아래 코드를 삽입한다. 아이디 찾기/비밀번호 찾기 링크 블록 바로 위:

```tsx
{showBiometric && (
  <>
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[#c5d2ec]" />
      <span className="text-xs font-medium text-[#9bafd5]">또는</span>
      <div className="h-px flex-1 bg-[#c5d2ec]" />
    </div>
    <button
      type="button"
      onClick={onBiometricLogin}
      disabled={biometricLoading}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#3b82f6] bg-white py-4 text-[1.0625rem] font-semibold text-[#3b82f6] transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
    >
      <span className="text-xl leading-none">👆</span>
      {biometricLoading ? "인증 중..." : "지문으로 로그인"}
    </button>
  </>
)}
```

### 9b — LoginPage에 등록 흐름 연결

- [ ] **Step 4: LoginPage 전체 교체**

`src/app/login/page.tsx`를 아래 내용으로 교체한다:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginView } from "@/components/auth/LoginView";
import { WebAuthnPrompt } from "@/components/auth/WebAuthnPrompt";
import { createClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";
import { useWebAuthn } from "@/hooks/useWebAuthn";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    isSupported,
    hasRegistered,
    loading: bioLoading,
    register,
    authenticate,
  } = useWebAuthn(userId);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const actualUserId = (fd.get("userId") as string | null) || userId;
    const actualPassword = (fd.get("password") as string | null) || password;
    if (!actualUserId.trim() || !actualPassword) {
      setError("사번과 비밀번호를 입력하세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `${actualUserId.trim().toLowerCase()}@somang.internal`,
        password: actualPassword,
      });
      setLoading(false);
      if (authError) {
        setError("사번 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      // 지문 지원 + 미등록 → 등록 팝업 표시
      if (isSupported && !hasRegistered) {
        setShowPrompt(true);
      } else {
        window.location.href = ROUTES.home;
      }
    } catch {
      setLoading(false);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleRegister = async () => {
    await register();
    setShowPrompt(false);
    window.location.href = ROUTES.home;
  };

  const handleSkip = () => {
    setShowPrompt(false);
    window.location.href = ROUTES.home;
  };

  return (
    <>
      <LoginView
        userId={userId}
        password={password}
        onUserIdChange={setUserId}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
        error={error}
        loading={loading}
        showBiometric={isSupported && hasRegistered}
        biometricLoading={bioLoading}
        onBiometricLogin={authenticate}
      />
      {showPrompt && (
        <WebAuthnPrompt
          onRegister={handleRegister}
          onSkip={handleSkip}
          loading={bioLoading}
        />
      )}
    </>
  );
}
```

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 새 에러 없음

- [ ] **Step 6: 개발 서버 기동 + 수동 검증**

```bash
npm run dev
```

아래 시나리오를 순서대로 확인:

1. **지문 미등록 상태** — `http://localhost:3000/login` 접속 → 지문 버튼이 없음 ✓
2. **비밀번호 로그인** — 정상 사번/비밀번호 입력 후 로그인 → `WebAuthnPrompt` 팝업 노출 ✓
3. **등록 "지금 등록하기"** → 브라우저 지문/생체인식 프롬프트 등장 ✓ (지원 기기 필요)
4. **등록 후 홈 이동** ✓
5. **다시 로그인 화면** → "지문으로 로그인" 버튼 노출 ✓
6. **지문 버튼 탭** → 지문인식 → 홈 이동 ✓
7. **"다음에" 탭** → 팝업 닫힘, 홈 이동 ✓

- [ ] **Step 7: 커밋**

```bash
git add src/components/auth/LoginView.tsx src/app/login/page.tsx
git commit -m "feat: wire WebAuthn fingerprint login into login screen"
```

---

## 알려진 제한사항

- **counter 불일치 에러:** `verifyAuthenticationResponse`가 counter 불일치로 throw할 경우 현재 400 응답만 반환. 필요 시 추후 해당 credential 자동 무효화 + 재등록 유도 메시지 추가 가능.
- **`admin.auth.admin.createSession()` 미지원 시:** 매우 드문 경우로 500 에러 반환. 발생 시 `generateLink({ type: 'magiclink' })` → 클라이언트 `verifyOtp()` 방식으로 대체.

---

## 완료 체크리스트

- [ ] `webauthn_credentials` 테이블이 Supabase에 존재하고 RLS 활성화됨
- [ ] `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY`, `WEBAUTHN_SECRET`, `NEXT_PUBLIC_APP_URL` 설정됨
- [ ] Vercel 환경변수에도 동일하게 설정됨
- [ ] 모바일 Chrome/Safari에서 지문 등록 및 로그인 정상 작동
- [ ] `npx tsc --noEmit` 에러 없음
