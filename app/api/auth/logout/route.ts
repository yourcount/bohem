import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";
import { logAuditEvent, revokeSessionById } from "@/lib/db/admin-auth-db";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { ip, userAgent } = getRequestMeta(request);

  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);

  const session = verifySessionToken(token);
  if (session) {
    revokeSessionById(session.sid);
    logAuditEvent({
      actorUserId: session.uid,
      actorEmail: session.email,
      action: "AUTH_LOGOUT",
      targetType: "session",
      targetId: session.sid,
      metadata: { role: session.role },
      ipAddress: ip,
      userAgent
    });
  }

  const response = NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
