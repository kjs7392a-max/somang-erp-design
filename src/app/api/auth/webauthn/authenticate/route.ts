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

    // 이메일로 auth 유저 조회 (profiles 테이블 의존 없음)
    const email = `${employeeId.toLowerCase()}@somang.internal`;
    const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const authUser = usersPage?.users?.find((u) => u.email === email);
    if (!authUser) {
      return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });
    }

    const { data: creds } = await admin
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", authUser.id);

    if (!creds || creds.length === 0) {
      return NextResponse.json(
        { error: "No registered fingerprint. Please log in with password first." },
        { status: 404 }
      );
    }

    const challenge = generateChallenge();
    const options = await generateAuthenticationOptions({
      rpID: getRpId(),
      challenge: Buffer.from(challenge, "base64url"),
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

    const res = NextResponse.json({
      token_hash: linkData.properties.hashed_token,
    });
    res.cookies.delete(AUTH_CHALLENGE_COOKIE);
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
