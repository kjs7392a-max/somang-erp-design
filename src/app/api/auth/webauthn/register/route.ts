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

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", user.id);

    // 이미 등록된 credential이 있으면 클라이언트에 알려 localStorage만 복원
    if (existing && existing.length > 0) {
      return NextResponse.json({ alreadyRegistered: true });
    }

    const challenge = generateChallenge();
    const options = await generateRegistrationOptions({
      rpName: "소망의료재단",
      rpID: getRpId(),
      userName: user.email ?? user.id,
      challenge: Buffer.from(challenge, "base64url"),
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

    const origin = getAppOrigin();
    const rpId = getRpId();
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body.credential,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
        requireUserVerification: true,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[webauthn/register] verifyRegistrationResponse failed:", msg, "| origin:", origin, "| rpId:", rpId);
      return NextResponse.json(
        { error: `Verification failed: ${msg}` },
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
