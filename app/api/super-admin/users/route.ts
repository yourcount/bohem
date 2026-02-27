import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { createAdminUser, listAdminUsers, logAuditEvent } from "@/lib/db/admin-auth-db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";
import { validateCreateUserBody } from "@/lib/super-admin/users";

function toApiUser(row: ReturnType<typeof listAdminUsers>[number]) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    forceLogoutAfter: row.force_logout_after,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    activeSessions: row.active_sessions
  };
}

export async function GET() {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  try {
    const users = listAdminUsers().map(toApiUser);
    return NextResponse.json({ ok: true, users }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gebruikers laden mislukt.", code: "USERS_READ_FAILED" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { ip, userAgent } = getRequestMeta(request);
  const limiter = consumeRateLimit(`super-admin:create-user:${ip}`, 12, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer later opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body.", code: "INVALID_BODY" }, { status: 400 });
  }

  const validated = validateCreateUserBody(body);
  if (!validated.ok) {
    return NextResponse.json(
      {
        error: "Validatie mislukt.",
        code: "VALIDATION_ERROR",
        fieldErrors: validated.fieldErrors
      },
      { status: 422 }
    );
  }

  try {
    const newUserId = createAdminUser({
      email: validated.value.email,
      passwordHash: hashPassword(validated.value.password),
      role: validated.value.role,
      status: validated.value.status
    });

    logAuditEvent({
      actorUserId: auth.session.uid,
      actorEmail: auth.session.email,
      action: "ADMIN_USER_CREATED",
      targetType: "user",
      targetId: String(newUserId),
      metadata: { email: validated.value.email, role: validated.value.role, status: validated.value.status },
      ipAddress: ip,
      userAgent
    });

    const users = listAdminUsers().map(toApiUser);
    return NextResponse.json({ ok: true, users }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint failed: admin_users.email/.test(error.message)) {
      return NextResponse.json(
        {
          error: "Er bestaat al een account met dit e-mailadres.",
          code: "EMAIL_EXISTS",
          fieldErrors: { email: ["E-mailadres is al in gebruik."] }
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Gebruiker aanmaken mislukt.", code: "USER_CREATE_FAILED" }, { status: 500 });
  }
}
