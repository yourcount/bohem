import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { countActiveSuperAdmins, findAdminUserById, logAuditEvent, softDeleteAdminUser, updateAdminUser } from "@/lib/db/admin-auth-db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";
import { parseUserId, validateUpdateUserBody } from "@/lib/super-admin/users";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const limiter = await consumeRateLimit(`super-admin:update-user:${ip}:${userId}`, 20, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer later opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body.", code: "INVALID_BODY" }, { status: 400 });
  }

  const validated = validateUpdateUserBody(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: "Validatie mislukt.", code: "VALIDATION_ERROR", fieldErrors: validated.fieldErrors },
      { status: 422 }
    );
  }

  const target = await findAdminUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "Gebruiker niet gevonden.", code: "USER_NOT_FOUND" }, { status: 404 });
  }

  if (auth.session.role !== "SUPER_ADMIN" && target.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Alleen SUPER_ADMIN mag SUPER_ADMIN accounts wijzigen.", code: "FORBIDDEN" }, { status: 403 });
  }

  if (target.role === "SUPER_ADMIN" && validated.value.role && validated.value.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "SUPER_ADMIN rol kan niet via deze route worden gewijzigd.", code: "SUPER_ADMIN_ROLE_LOCKED" },
      { status: 403 }
    );
  }

  if (target.id === auth.session.uid && validated.value.status === "suspended") {
    return NextResponse.json(
      { error: "Je kunt je eigen account niet op geschorst zetten.", code: "SELF_SUSPEND_BLOCKED" },
      { status: 403 }
    );
  }

  try {
    const updated = await updateAdminUser({ userId, role: validated.value.role, status: validated.value.status });
    if (!updated) {
      return NextResponse.json({ error: "Gebruiker niet gevonden.", code: "USER_NOT_FOUND" }, { status: 404 });
    }

    await logAuditEvent({
      actorUserId: auth.session.uid,
      actorEmail: auth.session.email,
      action: "ADMIN_USER_UPDATED",
      targetType: "user",
      targetId: String(userId),
      metadata: { role: validated.value.role, status: validated.value.status },
      ipAddress: ip,
      userAgent
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
          status: updated.status,
          forceLogoutAfter: updated.force_logout_after,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
          lastLoginAt: updated.last_login_at
        }
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Gebruiker bijwerken mislukt.", code: "USER_UPDATE_FAILED" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  if (userId === auth.session.uid) {
    return NextResponse.json({ error: "Je kunt je eigen account niet verwijderen.", code: "SELF_DELETE_BLOCKED" }, { status: 403 });
  }

  const target = await findAdminUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "Gebruiker niet gevonden.", code: "USER_NOT_FOUND" }, { status: 404 });
  }

  if (auth.session.role !== "SUPER_ADMIN" && target.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Alleen SUPER_ADMIN mag SUPER_ADMIN accounts verwijderen.", code: "FORBIDDEN" }, { status: 403 });
  }

  if (target.role === "SUPER_ADMIN") {
    const superAdminCount = await countActiveSuperAdmins();
    if (superAdminCount <= 1) {
      return NextResponse.json({ error: "Laatste SUPER_ADMIN account kan niet verwijderd worden.", code: "LAST_SUPER_ADMIN_BLOCKED" }, { status: 403 });
    }
  }

  const { ip, userAgent } = getRequestMeta(request);
  const limiter = await consumeRateLimit(`super-admin:delete-user:${ip}:${userId}`, 10, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer later opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }

  try {
    const deleted = await softDeleteAdminUser(userId);
    if (!deleted) {
      return NextResponse.json({ error: "Gebruiker niet gevonden.", code: "USER_NOT_FOUND" }, { status: 404 });
    }

    await logAuditEvent({
      actorUserId: auth.session.uid,
      actorEmail: auth.session.email,
      action: "ADMIN_USER_DELETED",
      targetType: "user",
      targetId: String(userId),
      metadata: { email: target.email, role: target.role },
      ipAddress: ip,
      userAgent
    });

    return NextResponse.json({ ok: true, message: "Gebruiker verwijderd." }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gebruiker verwijderen mislukt.", code: "USER_DELETE_FAILED" }, { status: 500 });
  }
}
