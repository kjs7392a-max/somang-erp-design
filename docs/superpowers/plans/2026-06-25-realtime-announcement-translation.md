# Real-time Announcement Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Foreign staff (SM-0126 빅토르 → Russian, SM-0124 스베트라나 → Uzbek) see the whole app — navigation/UI and the announcements board — in their own language, with announcement bodies translated in real time via Claude.

**Architecture:** Navigation/UI is already covered by the static dictionary (`src/lib/i18n/translations.ts`) once `profiles.lang` is set. New work: (1) a SQL migration setting the two staff languages, (2) a server `POST /api/translate` route that translates Korean → target language via Claude Haiku with a Supabase cache, (3) a client hook that resolves announcement text (Korean original / manual i18n / live API translation) and wires it into the home announcement section + detail modal, (4) a Korean-only 영양과 sample announcement so the live path is actually exercised for these two users.

**Tech Stack:** Next.js 16.2.4 (App Router, Route Handlers), React 19, Supabase (`@supabase/ssr` browser client, `@supabase/supabase-js` service-role admin client), `@anthropic-ai/sdk` (new), vitest (new, dev-only, for pure-logic tests).

## Global Constraints

- This is **NOT** the Next.js you know — App Router Route Handlers only. `POST` handlers are **not** cached by default; do not add `export const dynamic`. Reference: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.
- Translation provider is **Claude Haiku**, model id **exactly `claude-haiku-4-5`** (no date suffix).
- Haiku 4.5 does **not** support `thinking` or `output_config.effort` — calling with either returns 400. Use a plain `client.messages.create({ model, max_tokens, system, messages })`.
- Use the **official `@anthropic-ai/sdk`** for all Claude calls (TypeScript project) — never raw `fetch` to the API.
- `ANTHROPIC_API_KEY` is **server-only** — never imported into a client component or referenced via `NEXT_PUBLIC_`.
- Supabase service-role access uses `process.env.SUPABASE_SERVICE_ROLE_KEY` + `process.env.NEXT_PUBLIC_SUPABASE_URL` via `createClient` from `@supabase/supabase-js` (same pattern as `src/app/api/push/send/route.ts`).
- Path alias `@/` maps to `src/`.
- Languages: `Lang = "ko" | "ru" | "zh" | "uz" | "uk"` (`src/types/profile.ts`). Translatable (non-Korean) subset only is sent to the API.
- Migrations live in `supabase/migrations/` named `YYYYMMDD_<slug>.sql`; staff IDs are **uppercase** (`SM-0124`, `SM-0126`).

---

### Task 1: Pure translation core + test harness

**Files:**
- Create: `src/lib/translate/core.ts`
- Create: `src/lib/translate/core.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script + vitest devDependency)

**Interfaces:**
- Consumes: `Lang` from `@/types/profile` (only the string union — re-declared locally as `TranslatableLang` to avoid pulling client code into tests).
- Produces:
  - `TRANSLATABLE_LANGS: readonly ["ru","zh","uz","uk"]`
  - `type TranslatableLang = "ru" | "zh" | "uz" | "uk"`
  - `isTranslatableLang(v: unknown): v is TranslatableLang`
  - `LANG_LABEL: Record<TranslatableLang, string>`
  - `MAX_TEXTS = 50`, `MAX_TEXT_LEN = 4000`
  - `type TranslateInput = { texts: string[]; target: TranslatableLang }`
  - `parseTranslateInput(body: unknown): TranslateInput` (throws `Error` on invalid)
  - `systemPrompt(target: TranslatableLang): string`
  - `buildUserPrompt(texts: string[]): string`
  - `parseTranslations(raw: string, expectedLen: number): string[]` (throws `Error` on bad shape)

- [ ] **Step 1: Install vitest and add test script**

Run:
```bash
cd "C:/dev/SOMANG ERP" && npm install -D vitest
```
Then edit `package.json` to add a `test` script under `"scripts"` (keep existing scripts):
```json
    "start": "next start",
    "test": "vitest run"
```

- [ ] **Step 2: Create the vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Write the failing test**

Create `src/lib/translate/core.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  isTranslatableLang,
  parseTranslateInput,
  parseTranslations,
  systemPrompt,
  buildUserPrompt,
  MAX_TEXTS,
  MAX_TEXT_LEN,
} from "./core";

describe("isTranslatableLang", () => {
  it("accepts ru/zh/uz/uk", () => {
    expect(isTranslatableLang("ru")).toBe(true);
    expect(isTranslatableLang("uz")).toBe(true);
  });
  it("rejects ko and junk", () => {
    expect(isTranslatableLang("ko")).toBe(false);
    expect(isTranslatableLang("en")).toBe(false);
    expect(isTranslatableLang(null)).toBe(false);
  });
});

describe("parseTranslateInput", () => {
  it("returns texts+target for valid body", () => {
    expect(parseTranslateInput({ texts: ["안녕"], target: "ru" })).toEqual({
      texts: ["안녕"],
      target: "ru",
    });
  });
  it("throws on ko target", () => {
    expect(() => parseTranslateInput({ texts: ["x"], target: "ko" })).toThrow();
  });
  it("throws on empty texts", () => {
    expect(() => parseTranslateInput({ texts: [], target: "ru" })).toThrow();
  });
  it("throws when over MAX_TEXTS", () => {
    const texts = Array.from({ length: MAX_TEXTS + 1 }, () => "x");
    expect(() => parseTranslateInput({ texts, target: "ru" })).toThrow();
  });
  it("throws when a text is too long", () => {
    expect(() =>
      parseTranslateInput({ texts: ["x".repeat(MAX_TEXT_LEN + 1)], target: "ru" }),
    ).toThrow();
  });
  it("throws on non-object body", () => {
    expect(() => parseTranslateInput(null)).toThrow();
  });
});

describe("parseTranslations", () => {
  it("parses a clean JSON array", () => {
    expect(parseTranslations('["a","b"]', 2)).toEqual(["a", "b"]);
  });
  it("strips markdown fences", () => {
    expect(parseTranslations('```json\n["a"]\n```', 1)).toEqual(["a"]);
  });
  it("throws on length mismatch", () => {
    expect(() => parseTranslations('["a"]', 2)).toThrow();
  });
  it("throws on non-array", () => {
    expect(() => parseTranslations('{"a":1}', 1)).toThrow();
  });
  it("throws on non-string element", () => {
    expect(() => parseTranslations('["a",1]', 2)).toThrow();
  });
});

describe("prompt builders", () => {
  it("systemPrompt names the target language", () => {
    expect(systemPrompt("ru")).toContain("Russian");
  });
  it("buildUserPrompt is JSON of texts", () => {
    expect(buildUserPrompt(["a", "b"])).toBe('["a","b"]');
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd "C:/dev/SOMANG ERP" && npx vitest run src/lib/translate/core.test.ts`
Expected: FAIL — `Cannot find module './core'`.

- [ ] **Step 5: Implement the core module**

Create `src/lib/translate/core.ts`:
```ts
// Pure, dependency-free translation helpers. Safe to unit-test and to import
// from either server or (validation only) client code. No node/Supabase/SDK imports here.

export const TRANSLATABLE_LANGS = ["ru", "zh", "uz", "uk"] as const;
export type TranslatableLang = (typeof TRANSLATABLE_LANGS)[number];

export const LANG_LABEL: Record<TranslatableLang, string> = {
  ru: "Russian",
  zh: "Chinese (Simplified)",
  uz: "Uzbek",
  uk: "Ukrainian",
};

export const MAX_TEXTS = 50;
export const MAX_TEXT_LEN = 4000;

export function isTranslatableLang(v: unknown): v is TranslatableLang {
  return typeof v === "string" && (TRANSLATABLE_LANGS as readonly string[]).includes(v);
}

export type TranslateInput = { texts: string[]; target: TranslatableLang };

/** Validate an untrusted request body. Throws Error on any violation. */
export function parseTranslateInput(body: unknown): TranslateInput {
  if (!body || typeof body !== "object") throw new Error("invalid body");
  const { texts, target } = body as Record<string, unknown>;
  if (!isTranslatableLang(target)) throw new Error("invalid target");
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > MAX_TEXTS) {
    throw new Error("invalid texts");
  }
  if (!texts.every((t) => typeof t === "string" && t.length <= MAX_TEXT_LEN)) {
    throw new Error("invalid texts");
  }
  return { texts: texts as string[], target };
}

export function systemPrompt(target: TranslatableLang): string {
  return [
    "You are a professional translator for a hospital staff app.",
    `Translate each given Korean text into ${LANG_LABEL[target]} (${target}).`,
    "Preserve meaning, tone, line breaks, numbers, dates, and proper names.",
    "Do not add explanations, notes, or quotation marks around items.",
    "Return ONLY a JSON array of strings — same length and same order as the input — with no markdown code fences.",
  ].join(" ");
}

export function buildUserPrompt(texts: string[]): string {
  return JSON.stringify(texts);
}

/** Parse Claude's reply into exactly `expectedLen` strings. Throws on mismatch. */
export function parseTranslations(raw: string, expectedLen: number): string[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  let arr: unknown;
  try {
    arr = JSON.parse(cleaned);
  } catch {
    throw new Error("translation: invalid JSON");
  }
  if (
    !Array.isArray(arr) ||
    arr.length !== expectedLen ||
    !arr.every((x) => typeof x === "string")
  ) {
    throw new Error("translation: shape mismatch");
  }
  return arr as string[];
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd "C:/dev/SOMANG ERP" && npx vitest run src/lib/translate/core.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 7: Commit**

```bash
cd "C:/dev/SOMANG ERP"
git add vitest.config.ts package.json package-lock.json src/lib/translate/core.ts src/lib/translate/core.test.ts
git commit -m "feat: 번역 코어 로직 + vitest 테스트 하니스"
```

---

### Task 2: Supabase migrations (cache table + staff languages)

**Files:**
- Create: `supabase/migrations/20260625_translation_cache.sql`
- Create: `supabase/migrations/20260625_set_chef_langs.sql`

**Interfaces:**
- Produces: table `translation_cache(source_hash text, target_lang text, translated_text text, created_at timestamptz)` with PK `(source_hash, target_lang)`, RLS enabled with **no policies** (only the service role, which bypasses RLS, can read/write). And `profiles.lang` set to `ru` for `SM-0126`, `uz` for `SM-0124`.

- [ ] **Step 1: Create the cache table migration**

Create `supabase/migrations/20260625_translation_cache.sql`:
```sql
-- 실시간 공지 번역 캐시: 동일 원문 재번역 방지(비용·지연 절감)
create table if not exists translation_cache (
  source_hash   text not null,
  target_lang   text not null,
  translated_text text not null,
  created_at    timestamptz not null default now(),
  primary key (source_hash, target_lang)
);

-- 클라이언트 직접 접근 차단. /api/translate 서버(서비스 롤)만 사용 → 서비스 롤은 RLS 우회.
alter table translation_cache enable row level security;
```

- [ ] **Step 2: Create the staff-language migration**

Create `supabase/migrations/20260625_set_chef_langs.sql`:
```sql
-- 소망병원 영양과 조리원 언어 지정 (재실행 안전)
update profiles set lang = 'ru', updated_at = now() where employee_id = 'SM-0126'; -- 빅토르
update profiles set lang = 'uz', updated_at = now() where employee_id = 'SM-0124'; -- 스베트라나
```

- [ ] **Step 3: Apply the migrations to Supabase**

Apply via your normal migration path (Supabase SQL editor, `supabase db push`, or CI). Then verify:
```sql
select employee_id, full_name, department, lang from profiles where employee_id in ('SM-0124','SM-0126');
```
Expected: `SM-0126 빅토르 … ru` and `SM-0124 스베트라나 … uz`.

> **Record the `department` value returned here** — Task 6's sample announcement `targetDept` must equal it for the dept announcement to show for these users. If it is not literally `영양과`, use the returned value in Task 6 Step 1.

- [ ] **Step 4: Commit**

```bash
cd "C:/dev/SOMANG ERP"
git add supabase/migrations/20260625_translation_cache.sql supabase/migrations/20260625_set_chef_langs.sql
git commit -m "feat: 번역 캐시 테이블 + 조리원 언어 지정(빅토르 ru/스베트라나 uz) 마이그레이션"
```

---

### Task 3: Translation cache module (Supabase service-role)

**Files:**
- Create: `src/lib/translate/cache.ts`

**Interfaces:**
- Consumes: `TranslatableLang` from `./core`; `createClient` from `@supabase/supabase-js`; `createHash` from `node:crypto`.
- Produces:
  - `sourceHash(text: string): string` — sha-256 hex
  - `getCached(hashes: string[], target: TranslatableLang): Promise<Map<string, string>>` — hash → translated_text for the rows that exist
  - `putCached(rows: { source_hash: string; target_lang: TranslatableLang; translated_text: string }[]): Promise<void>` — upsert (no-op on empty)

> This module is imported **only** by the route handler (Task 5). It uses node + service-role secrets; never import it from a client component.

- [ ] **Step 1: Implement the cache module**

Create `src/lib/translate/cache.ts`:
```ts
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { TranslatableLang } from "./core";

export function sourceHash(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function getCached(
  hashes: string[],
  target: TranslatableLang,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (hashes.length === 0) return map;
  const { data } = await admin()
    .from("translation_cache")
    .select("source_hash, translated_text")
    .eq("target_lang", target)
    .in("source_hash", hashes);
  for (const row of data ?? []) {
    map.set(row.source_hash as string, row.translated_text as string);
  }
  return map;
}

export async function putCached(
  rows: { source_hash: string; target_lang: TranslatableLang; translated_text: string }[],
): Promise<void> {
  if (rows.length === 0) return;
  await admin().from("translation_cache").upsert(rows, { onConflict: "source_hash,target_lang" });
}
```

- [ ] **Step 2: Typecheck**

Run: `cd "C:/dev/SOMANG ERP" && npx tsc --noEmit`
Expected: no new errors referencing `src/lib/translate/cache.ts`.

- [ ] **Step 3: Commit**

```bash
cd "C:/dev/SOMANG ERP"
git add src/lib/translate/cache.ts
git commit -m "feat: 번역 캐시 모듈(sha-256 키 + Supabase 서비스 롤)"
```

---

### Task 4: Claude Haiku translation call

**Files:**
- Create: `src/lib/translate/anthropic.ts`
- Modify: `package.json` (add `@anthropic-ai/sdk` dependency)

**Interfaces:**
- Consumes: `systemPrompt`, `buildUserPrompt`, `parseTranslations`, `TranslatableLang` from `./core`; `Anthropic` from `@anthropic-ai/sdk`.
- Produces: `translateBatch(texts: string[], target: TranslatableLang): Promise<string[]>` — returns translations in the same order; throws on API error or bad shape.

> Imported **only** by the route handler. Reads `ANTHROPIC_API_KEY` from the environment (the SDK picks it up automatically).

- [ ] **Step 1: Install the Anthropic SDK**

Run: `cd "C:/dev/SOMANG ERP" && npm install @anthropic-ai/sdk`

- [ ] **Step 2: Implement the translation call**

Create `src/lib/translate/anthropic.ts`:
```ts
import Anthropic from "@anthropic-ai/sdk";
import {
  systemPrompt,
  buildUserPrompt,
  parseTranslations,
  type TranslatableLang,
} from "./core";

// Claude Haiku 4.5 — plain messages.create. NO thinking / effort params (they 400 on Haiku).
export async function translateBatch(
  texts: string[],
  target: TranslatableLang,
): Promise<string[]> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system: systemPrompt(target),
    messages: [{ role: "user", content: buildUserPrompt(texts) }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return parseTranslations(text, texts.length);
}
```

- [ ] **Step 3: Typecheck**

Run: `cd "C:/dev/SOMANG ERP" && npx tsc --noEmit`
Expected: no new errors referencing `src/lib/translate/anthropic.ts`.

- [ ] **Step 4: Commit**

```bash
cd "C:/dev/SOMANG ERP"
git add package.json package-lock.json src/lib/translate/anthropic.ts
git commit -m "feat: Claude Haiku 번역 호출(translateBatch)"
```

---

### Task 5: `/api/translate` route handler

**Files:**
- Create: `src/app/api/translate/route.ts`

**Interfaces:**
- Consumes: `parseTranslateInput` from `@/lib/translate/core`; `sourceHash`, `getCached`, `putCached` from `@/lib/translate/cache`; `translateBatch` from `@/lib/translate/anthropic`; `NextRequest`/`NextResponse` from `next/server`.
- Produces: `POST` handler. Request `{ texts: string[], target: TranslatableLang }` → `200 { translations: string[] }` (same order). Errors: `400` invalid body, `503` missing `ANTHROPIC_API_KEY`, `500` translation failure.

- [ ] **Step 1: Implement the route**

Create `src/app/api/translate/route.ts` (follows the `src/app/api/push/send/route.ts` pattern):
```ts
import { NextRequest, NextResponse } from "next/server";
import { parseTranslateInput } from "@/lib/translate/core";
import { sourceHash, getCached, putCached } from "@/lib/translate/cache";
import { translateBatch } from "@/lib/translate/anthropic";

export async function POST(request: NextRequest) {
  let input;
  try {
    input = parseTranslateInput(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "translation not configured" }, { status: 503 });
  }

  const { texts, target } = input;
  const hashes = texts.map(sourceHash);
  const cached = await getCached(hashes, target);

  // Translate only the cache misses, preserving original positions.
  const missingIdx: number[] = [];
  const missingTexts: string[] = [];
  texts.forEach((t, i) => {
    if (!cached.has(hashes[i])) {
      missingIdx.push(i);
      missingTexts.push(t);
    }
  });

  const freshByIdx = new Map<number, string>();
  if (missingTexts.length > 0) {
    let fresh: string[];
    try {
      fresh = await translateBatch(missingTexts, target);
    } catch {
      return NextResponse.json({ error: "translation failed" }, { status: 500 });
    }
    missingIdx.forEach((idx, j) => freshByIdx.set(idx, fresh[j]));
    await putCached(
      missingIdx.map((idx, j) => ({
        source_hash: hashes[idx],
        target_lang: target,
        translated_text: fresh[j],
      })),
    );
  }

  const translations = texts.map(
    (_t, i) => cached.get(hashes[i]) ?? freshByIdx.get(i) ?? "",
  );
  return NextResponse.json({ translations });
}
```

- [ ] **Step 2: Set the API key for local dev**

Add `ANTHROPIC_API_KEY=sk-ant-...` to `.env.local` (do not commit it). Confirm `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already present (used by the push route).

- [ ] **Step 3: Manual verification — translate + cache hit**

Run the dev server: `cd "C:/dev/SOMANG ERP" && npm run dev` (in a background terminal).
Then in another terminal, call the route twice with the same input:
```bash
curl -s -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"texts":["영양과 위생 점검 안내"],"target":"ru"}'
```
Expected: first call returns `{"translations":["<russian text>"]}` (non-empty Russian). Run the same curl again — same output, and it should return faster (served from `translation_cache`). Verify a row exists:
```sql
select target_lang, left(translated_text, 40) from translation_cache;
```

- [ ] **Step 4: Manual verification — validation + config errors**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" -d '{"texts":["x"],"target":"ko"}'
```
Expected: `400`. (If `ANTHROPIC_API_KEY` is unset, a valid request returns `503`.)

- [ ] **Step 5: Commit**

```bash
cd "C:/dev/SOMANG ERP"
git add src/app/api/translate/route.ts
git commit -m "feat: /api/translate 라우트(캐시 우선 + Haiku 폴백)"
```

---

### Task 6: Client hook + wire announcements + sample 영양과 공지

**Files:**
- Create: `src/hooks/useAnnouncementText.ts`
- Modify: `src/lib/home-data.ts` (add Korean-only 영양과 announcement)
- Modify: `src/components/home/AnnouncementSection.tsx`
- Modify: `src/components/home/AnnouncementDetailModal.tsx`

**Interfaces:**
- Consumes: `Announcement` from `@/lib/home-data`; `Lang` from `@/types/profile`; `isTranslatableLang` from `@/lib/translate/core`.
- Produces: `useAnnouncementText(items: Announcement[], lang: Lang): (item: Announcement) => { title: string; body: string }` — resolves text with priority: `ko` → original; manual `titleI18n`/`bodyI18n` → manual; otherwise live API translation (original shown until the translation arrives).

- [ ] **Step 1: Add the Korean-only 영양과 sample announcement**

In `src/lib/home-data.ts`, add this entry to the `ANNOUNCEMENTS` array (after `a-d-4`, before the closing `];`). It has **no** `titleI18n`/`bodyI18n`, so it exercises the live translation path. Set `targetDept` to the `department` value confirmed in Task 2 Step 3 (use `"영양과"` unless that query returned something different):
```ts
  {
    id: "a-d-5",
    scope: "dept",
    targetDept: "영양과",
    title: "영양과 위생 점검 안내",
    body: "4월 30일(목) 오전 10시 영양과 조리실 정기 위생 점검이 있습니다. 조리 도구 정리 및 개인 위생 상태를 미리 점검해 주세요.",
    author: "한기석 총무과장",
    department: "영양과",
    date: "2026-04-17",
    pinned: true,
  },
```

- [ ] **Step 2: Implement the hook**

Create `src/hooks/useAnnouncementText.ts`:
```ts
"use client";

import { useEffect, useState } from "react";
import type { Announcement } from "@/lib/home-data";
import type { Lang } from "@/types/profile";
import { isTranslatableLang } from "@/lib/translate/core";

type Resolved = { title: string; body: string };

/**
 * Resolve announcement title/body for the active language.
 * Priority: ko → original; manual i18n → manual; else live /api/translate
 * (original text shown until the translation resolves).
 */
export function useAnnouncementText(
  items: Announcement[],
  lang: Lang,
): (item: Announcement) => Resolved {
  // apiText[id] = { title?, body? } for fields fetched from the API
  const [apiText, setApiText] = useState<Record<string, Partial<Resolved>>>({});

  useEffect(() => {
    if (!isTranslatableLang(lang)) return;

    // Collect the Korean fields that have no manual translation.
    const jobs: { id: string; field: "title" | "body"; text: string }[] = [];
    for (const a of items) {
      if (!a.titleI18n?.[lang] && a.title) jobs.push({ id: a.id, field: "title", text: a.title });
      if (!a.bodyI18n?.[lang] && a.body) jobs.push({ id: a.id, field: "body", text: a.body });
    }
    if (jobs.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: jobs.map((j) => j.text), target: lang }),
        });
        if (!res.ok) return; // fall back to original text
        const { translations } = (await res.json()) as { translations: string[] };
        if (cancelled || !Array.isArray(translations)) return;
        setApiText((prev) => {
          const next = { ...prev };
          jobs.forEach((j, i) => {
            next[j.id] = { ...next[j.id], [j.field]: translations[i] };
          });
          return next;
        });
      } catch {
        // network error → keep showing original text
      }
    })();

    return () => {
      cancelled = true;
    };
    // re-run when the set of ids or the language changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, items.map((a) => a.id).join(",")]);

  return (item: Announcement) => {
    if (lang === "ko" || !isTranslatableLang(lang)) {
      return { title: item.title, body: item.body };
    }
    const title = item.titleI18n?.[lang] ?? apiText[item.id]?.title ?? item.title;
    const body = item.bodyI18n?.[lang] ?? apiText[item.id]?.body ?? item.body;
    return { title, body };
  };
}
```

- [ ] **Step 3: Wire the hook into `AnnouncementSection.tsx`**

In `src/components/home/AnnouncementSection.tsx`, replace the static `getAnnouncementText` usage with the hook.

Change the import line (remove `getAnnouncementText`, keep the rest):
```ts
import { ANNOUNCEMENTS, type Announcement } from "@/lib/home-data";
```
Add the hook import near the other imports:
```ts
import { useAnnouncementText } from "@/hooks/useAnnouncementText";
```
After `const items = ANNOUNCEMENTS.filter(...).slice(0, 2);` add:
```ts
  const resolveText = useAnnouncementText(items, lang);
```
Replace `const latestText = latest ? getAnnouncementText(latest, lang) : null;` with:
```ts
  const latestText = latest ? resolveText(latest) : null;
```
Replace `const text = getAnnouncementText(a, lang);` (inside `items.map`) with:
```ts
            const text = resolveText(a);
```
(`lang` is already in scope from `const lang = useLang();`.)

- [ ] **Step 4: Wire the hook into `AnnouncementDetailModal.tsx`**

In `src/components/home/AnnouncementDetailModal.tsx`:

Remove the `getAnnouncementText` import (keep the `Announcement` type import):
```ts
import type { Announcement } from "@/lib/home-data";
```
Add the hook import:
```ts
import { useAnnouncementText } from "@/hooks/useAnnouncementText";
```
Replace this block:
```ts
  if (!item) return null;

  const { title, body } = getAnnouncementText(item, lang);
  const content = (lang !== "ko" && item.bodyI18n?.[lang]) || item.content || item.body;
```
with (note: the hook must be called unconditionally, before the early return):
```ts
  const resolveText = useAnnouncementText(item ? [item] : [], lang);

  if (!item) return null;

  const { title, body } = resolveText(item);
  const content = item.content && lang === "ko" ? item.content : body;
```
(`body` is rendered in the body area via `content`; `title` is used in the header. The `useEffect` hooks already present remain above this — keep React's rules-of-hooks order: move the `useAnnouncementText` call up with the other hooks, before any `return null`.)

- [ ] **Step 5: Typecheck**

Run: `cd "C:/dev/SOMANG ERP" && npx tsc --noEmit`
Expected: no new errors in the three modified files or the new hook.

- [ ] **Step 6: Manual verification — full flow**

With `npm run dev` running and the migrations applied:
1. Log in as **SM-0126 빅토르** (or temporarily set your test profile's `lang` to `ru`). Confirm the navigation menu/buttons render in Russian (static dictionary) and the **영양과 위생 점검 안내** announcement appears with a Russian title/body after a moment (live translation). Open its detail modal — body is Russian.
2. Repeat for **SM-0124 스베트라나** with `lang = uz` — same announcement shows in Uzbek.
3. Confirm the pre-translated company announcements (a-c-1, a-c-2) still render from their manual `ru`/`uz` translations (instant, no flash), and that no extra `translation_cache` rows are created for them.

- [ ] **Step 7: Commit**

```bash
cd "C:/dev/SOMANG ERP"
git add src/hooks/useAnnouncementText.ts src/lib/home-data.ts src/components/home/AnnouncementSection.tsx src/components/home/AnnouncementDetailModal.tsx
git commit -m "feat: 공지 실시간 번역 연결 + 영양과 샘플 공지(빅토르 ru/스베트라나 uz)"
```

---

## Self-Review

**Spec coverage:**
- §3 provider Claude Haiku → Task 4 (`claude-haiku-4-5`, plain call). ✓
- §4.1 language assignment → Task 2 (`20260625_set_chef_langs.sql`). ✓
- §4.2 server endpoint → Task 5 (`/api/translate`). ✓
- §4.3 cache → Task 2 (table) + Task 3 (module). ✓
- §4.4 client wiring → Task 6 (hook + both components). ✓
- §4.5 menu/UI → no work needed (covered by `profiles.lang` from Task 2); noted. ✓
- §4.6 sample 영양과 announcement → Task 6 Step 1. ✓
- §7 error handling / fallback → route 400/503/500 + hook falls back to original on `!res.ok`/network error. ✓
- §8 tests → Task 1 unit tests for core; route/cache/hook covered by manual verification (no test infra for network/DB/React in this project — deliberate scope choice). ✓

**Placeholder scan:** No TBD/TODO; every code step has full code. The one runtime-dependent value (`targetDept`/`department`) is resolved by an explicit verification step (Task 2 Step 3) feeding Task 6 Step 1.

**Type consistency:** `TranslatableLang` defined in `core.ts` and imported by `cache.ts`/`anthropic.ts`. `translateBatch(texts, target)`, `getCached(hashes, target)`, `putCached(rows)`, `parseTranslateInput`, `parseTranslations`, `useAnnouncementText(items, lang)` names are used identically across tasks. Route response `{ translations: string[] }` matches the hook's expected shape.
