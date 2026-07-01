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
        expectedOrigin: getAppOrigin(request),
        expectedRPID: getRpId(request),
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

    await admin
      .from("webauthn_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("credential_id", credentialId);

    // getUserById로 이메일 조회 후 magiclink 발급
    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(credRow.user_id);
    if (userError || !userData?.user?.email) {
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 500 }
      );
    }

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: userData.user.email,
      });
    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json(
        { error: "Failed to generate session token" },
        { status: 500 }
      );
    }

    // 서버에서 직접 verifyOtp → 세션 토큰 반환 (클라이언트 왕복 1회 제거)
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
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const res = NextResponse.json({
      access_token: otpData.session.access_token,
      refresh_token: otpData.session.refresh_token,
      expires_at: otpData.session.expires_at,
    });
    res.cookies.delete(AUTH_CHALLENGE_COOKIE);
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
