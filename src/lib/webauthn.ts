import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

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
