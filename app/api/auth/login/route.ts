import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/auth/constants";
import { createSessionToken } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import {
  createAdminSessionRecord,
  ensureAdminAuthSchema,
  findAdminUserByEmail,
  logAuditEvent,
  markUserLoginSuccess
} from "@/lib/db/admin-auth-db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { ip, userAgent } = getRequestMeta(request);
  await ensureAdminAuthSchema();

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();
  if (!email || !password) {
    return NextResponse.json({ error: "E-mailadres en wachtwoord zijn verplicht." }, { status: 400 });
  }

  const limiter = await consumeRateLimit(`login:${ip}:${email}`, 6, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(
      {
        error: "Te veel inlogpogingen. Probeer later opnieuw.",
        code: "RATE_LIMITED"
      },
      { status: 429 }
    );
  }

  const user = await findAdminUserByEmail(email);
  const passwordMatches = user ? verifyPassword(password, user.password_hash) : false;

  if (!user || !passwordMatches) {
    await logAuditEvent({
      actorUserId: user?.id ?? null,
      actorEmail: email,
      action: "AUTH_LOGIN_FAILED",
      targetType: "auth",
      targetId: email,
      metadata: { reason: "invalid_credentials" },
      ipAddress: ip,
      userAgent
    });
    return NextResponse.json({ error: "E-mailadres of wachtwoord klopt niet." }, { status: 401 });
  }

  if (user.status !== "active") {
    await logAuditEvent({
      actorUserId: user.id,
      actorEmail: user.email,
      action: "AUTH_LOGIN_BLOCKED",
      targetType: "user",
      targetId: String(user.id),
      metadata: { reason: "status_not_active", status: user.status },
      ipAddress: ip,
      userAgent
    });

    return NextResponse.json({ error: "Account is gedeactiveerd. Neem contact op met beheer." }, { status: 403 });
  }

  const session = createSessionToken({ userId: user.id, email: user.email, role: user.role });
  await createAdminSessionRecord({
    sessionId: session.payload.sid,
    userId: user.id,
    email: user.email,
    role: user.role,
    mfaVerified: false,
    issuedAt: session.payload.iat,
    expiresAt: session.payload.exp,
    ipAddress: ip,
    userAgent
  });
  await markUserLoginSuccess(user.id);

  const nextPath = user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "/admin/backend" : "/admin";
  const response = NextResponse.json({ ok: true, nextPath });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: session.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
  await logAuditEvent({
    actorUserId: user.id,
    actorEmail: user.email,
    action: "AUTH_LOGIN_SUCCESS",
    targetType: "auth",
    targetId: String(user.id),
    metadata: { role: user.role },
    ipAddress: ip,
    userAgent
  });

  return response;
}
