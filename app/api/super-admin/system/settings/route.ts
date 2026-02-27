import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { readTechnicalSettings, updateTechnicalSettingsPatch } from "@/lib/db/system-controls-db";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";
import { buildSafeEnvironmentProfile, validateTechnicalSettingsPatch } from "@/lib/super-admin/system";

export async function GET() {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  try {
    const settings = readTechnicalSettings();
    if (!settings) {
      return NextResponse.json({ error: "Technische instellingen niet gevonden.", code: "SYSTEM_SETTINGS_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        settings: {
          jobs_enabled: settings.jobs_enabled === 1,
          jobs_poll_interval_seconds: settings.jobs_poll_interval_seconds,
          cache_auto_invalidate_on_update: settings.cache_auto_invalidate_on_update === 1,
          updated_at: settings.updated_at,
          updated_by: settings.updated_by
        },
        environment: buildSafeEnvironmentProfile()
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Technische instellingen laden mislukt.", code: "SYSTEM_SETTINGS_READ_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { ip, userAgent } = getRequestMeta(request);
  const limiter = consumeRateLimit(`super-admin:system-settings:${ip}`, 20, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer later opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body.", code: "INVALID_BODY" }, { status: 400 });
  }

  const validated = validateTechnicalSettingsPatch(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: "Validatie mislukt.", code: "VALIDATION_ERROR", fieldErrors: validated.fieldErrors },
      { status: 422 }
    );
  }

  try {
    const updated = updateTechnicalSettingsPatch(validated.patch, auth.session.email);
    if (!updated) {
      return NextResponse.json({ error: "Technische instellingen niet gevonden.", code: "SYSTEM_SETTINGS_NOT_FOUND" }, { status: 404 });
    }

    logAuditEvent({
      actorUserId: auth.session.uid,
      actorEmail: auth.session.email,
      action: "SYSTEM_TECHNICAL_SETTINGS_UPDATED",
      targetType: "system",
      targetId: "technical_settings_v1",
      metadata: { patch: validated.patch },
      ipAddress: ip,
      userAgent
    });

    return NextResponse.json(
      {
        ok: true,
        settings: {
          jobs_enabled: updated.jobs_enabled === 1,
          jobs_poll_interval_seconds: updated.jobs_poll_interval_seconds,
          cache_auto_invalidate_on_update: updated.cache_auto_invalidate_on_update === 1,
          updated_at: updated.updated_at,
          updated_by: updated.updated_by
        },
        environment: buildSafeEnvironmentProfile()
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Technische instellingen opslaan mislukt.", code: "SYSTEM_SETTINGS_WRITE_FAILED" }, { status: 500 });
  }
}
