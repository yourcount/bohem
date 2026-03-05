import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { findAdminUserById, forceLogoutUserSessions, logAuditEvent } from "@/lib/db/admin-auth-db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";
import { parseUserId } from "@/lib/super-admin/users";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { id: idRaw } = await params;
  const userId = parseUserId(idRaw);
  if (!userId) {
    return NextResponse.json({ error: "Ongeldige gebruiker.", code: "INVALID_USER_ID" }, { status: 400 });
  }

  const { ip, userAgent } = getRequestMeta(request);
  const limiter = await consumeRateLimit(`super-admin:force-logout:${ip}:${userId}`, 20, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer later opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }

  const target = await findAdminUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "Gebruiker niet gevonden.", code: "USER_NOT_FOUND" }, { status: 404 });
  }

  if (auth.session.role !== "SUPER_ADMIN" && target.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Alleen SUPER_ADMIN mag SUPER_ADMIN accounts beheren.", code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const ok = await forceLogoutUserSessions(userId);
    if (!ok) {
      return NextResponse.json({ error: "Gebruiker niet gevonden.", code: "USER_NOT_FOUND" }, { status: 404 });
    }

    await logAuditEvent({
      actorUserId: auth.session.uid,
      actorEmail: auth.session.email,
      action: "ADMIN_USER_FORCE_LOGOUT",
      targetType: "user",
      targetId: String(userId),
      metadata: { targetEmail: target.email },
      ipAddress: ip,
      userAgent
    });

    return NextResponse.json({ ok: true, message: "Alle actieve sessies van deze gebruiker zijn afgemeld." }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Force logout mislukt.", code: "FORCE_LOGOUT_FAILED" }, { status: 500 });
  }
}
