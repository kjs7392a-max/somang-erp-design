import { NextRequest, NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
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
  // 예열 요청 — cold start 방지용, DB 호출 없음
  if (body.action === "ping") {
    return NextResponse.json({ ok: true });
  }

  if (body.action === "options") {
    const credentialId = (body.credentialId as string | undefined)?.trim();
    const employeeId = (body.employeeId as string | undefined)?.trim();

    if (!credentialId && !employeeId) {
      return NextResponse.json(
        { error: "Missing credentialId or employeeId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    let allowCredentials: { id: string; type: "public-key" }[];

    if (credentialId) {
      // 빠른 경로: credentialId 직접 조회 (DB 1회, listUsers 불필요)
      const { data: cred } = await admin
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("credential_id", credentialId)
        .single();

      if (!cred) {
        return NextResponse.json({ error: "No registered fingerprint" }, { status: 404 });
      }
      allowCredentials = [{ id: credentialId, type: "public-key" }];
    } else {
      // 구버전 fallback: employeeId → userId → credentials
      const email = `${employeeId!.toLowerCase()}@somang.internal`;
      let userId: string | null = null;

      const { data: rpcResult, error: rpcError } = await admin.rpc(
        "get_user_id_by_email",
        { p_email: email }
      );
      if (!rpcError && rpcResult) {
        userId = rpcResult as string;
      } else {
        const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 1000 });
        const authUser = usersPage?.users?.find((u) => u.email === email);
        if (authUser) userId = authUser.id;
      }

      if (!userId) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const { data: creds } = await admin
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("user_id", userId);

      if (!creds || creds.length === 0) {
        return NextResponse.json({ error: "No registered fingerprint" }, { status: 404 });
      }
      allowCredentials = creds.map((c) => ({ id: c.credential_id, type: "public-key" as const }));
    }

    const challenge = generateChallenge();
    const options = await generateAuthenticationOptions({
      rpID: getRpId(request),
      challenge: Buffer.from(challenge, "base64url"),
      allowCredentials,
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
    // [DIAG] 간헐 실패 원인 추적용 로그. 원인 확정 후 제거.
    const credentialId0 = (body.credential as { id?: string } | undefined)?.id;
    const hasCookie = !!request.cookies.get(AUTH_CHALLENGE_COOKIE)?.value;
    console.log(`[wa-verify] start cred=${credentialId0?.slice(0, 12) ?? "none"} cookie=${hasCookie} origin=${getAppOrigin(request)} rpId=${getRpId(request)}`);

    const token = request.cookies.get(AUTH_CHALLENGE_COOKIE)?.value;
    if (!token) {
      console.warn("[wa-verify] FAIL: missing challenge cookie");
      return NextResponse.json({ error: "Missing challenge" }, { status: 400 });
    }
    let challenge: string;
    try {
      challenge = verifyChallengeToken(token);
    } catch (e) {
      console.warn(`[wa-verify] FAIL: invalid/expired challenge — ${(e as Error).message}`);
      return NextResponse.json(
        { error: "Invalid or expired challenge" },
        { status: 400 }
      );
    }

    const credentialId = (body.credential as { id?: string } | undefined)?.id;
    if (!credentialId) {
      console.warn("[wa-verify] FAIL: missing credential id in body");
      return NextResponse.json(
        { error: "Missing credential id" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: credRow, error: credErr } = await admin
      .from("webauthn_credentials")
      .select("*")
      .eq("credential_id", credentialId)
      .single();

    if (!credRow) {
      console.warn(`[wa-verify] FAIL: credential not found — dbErr=${credErr?.message ?? "none"}`);
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
        expectedOrigin: getAppOrigin(request),
        expectedRPID: getRpId(request),
        credential: {
          id: credRow.credential_id,
          publicKey: Buffer.from(credRow.public_key, "base64url"),
          counter: credRow.counter,
        },
        requireUserVerification: true,
      });
    } catch (e) {
      console.warn(`[wa-verify] FAIL: verifyAuthenticationResponse threw — ${(e as Error).message} (storedCounter=${credRow.counter})`);
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    if (!verification.verified || !verification.authenticationInfo) {
      console.warn(`[wa-verify] FAIL: not verified (verified=${verification.verified})`);
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }
    console.log(`[wa-verify] OK cred=${credentialId.slice(0, 12)} newCounter=${verification.authenticationInfo.newCounter}`);

    // counter update + getUserById + profile + global_viewers 모두 병렬
    const userId = credRow.user_id;
    const [, { data: userData, error: userError }, { data: profileData }, { data: gvData }] =
      await Promise.all([
        admin
          .from("webauthn_credentials")
          .update({
            counter: verification.authenticationInfo.newCounter,
            last_used_at: new Date().toISOString(),
          })
          .eq("credential_id", credentialId),
        admin.auth.admin.getUserById(userId),
        admin.from("profiles").select("*").eq("id", userId).single(),
        admin.from("global_viewers").select("id").eq("profile_id", userId).maybeSingle(),
      ]);

    if (userError || !userData?.user?.email) {
      console.warn(`[wa-verify] FAIL: getUser — ${userError?.message ?? "no email"}`);
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: userData.user.email,
      });
    if (linkError || !linkData?.properties?.hashed_token) {
      console.warn(`[wa-verify] FAIL: generateLink — ${linkError?.message ?? "no hashed_token"}`);
      return NextResponse.json(
        { error: "Failed to generate session token" },
        { status: 500 }
      );
    }

    const anonClient = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data: otpData, error: otpError } = await anonClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });
    if (otpError || !otpData.session) {
      console.warn(`[wa-verify] FAIL: verifyOtp — ${otpError?.message ?? "no session"}`);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const profile = profileData
      ? { ...profileData, is_global_viewer: !!gvData }
      : null;

    const res = NextResponse.json({
      access_token: otpData.session.access_token,
      refresh_token: otpData.session.refresh_token,
      expires_at: otpData.session.expires_at,
      profile, // 홈 진입 시 재조회 불필요하도록 포함
    });
    res.cookies.delete(AUTH_CHALLENGE_COOKIE);
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
