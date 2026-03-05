import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { readRuntimeCacheStatus } from "@/lib/cache/runtime-cache";
import { listRecentCacheInvalidations, readCacheSettings, updateCacheSettingsPatch } from "@/lib/db/cache-management-db";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";
import { validateCacheSettingsPatch } from "@/lib/super-admin/cache";

export async function GET() {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  try {
    const settings = readCacheSettings();
    if (!settings) {
      return NextResponse.json({ error: "Cache instellingen niet gevonden.", code: "CACHE_SETTINGS_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        settings,
        runtime: readRuntimeCacheStatus(),
        recentInvalidations: listRecentCacheInvalidations(20)
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Cache instellingen laden mislukt.", code: "CACHE_SETTINGS_READ_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { ip, userAgent } = getRequestMeta(request);
  const limiter = await consumeRateLimit(`super-admin:cache-settings:${ip}`, 20, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer later opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body.", code: "INVALID_BODY" }, { status: 400 });
  }

  const validated = validateCacheSettingsPatch(body);
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
    const settings = updateCacheSettingsPatch(validated.patch, auth.session.email);
    if (!settings) {
      return NextResponse.json({ error: "Cache instellingen niet gevonden.", code: "CACHE_SETTINGS_NOT_FOUND" }, { status: 404 });
    }

    logAuditEvent({
      actorUserId: auth.session.uid,
      actorEmail: auth.session.email,
      action: "CACHE_SETTINGS_UPDATED",
      targetType: "cache",
      targetId: "cache_settings_v1",
      metadata: { fields: Object.keys(validated.patch) },
      ipAddress: ip,
      userAgent
    });

    return NextResponse.json(
      {
        ok: true,
        settings,
        runtime: readRuntimeCacheStatus(),
        recentInvalidations: listRecentCacheInvalidations(20)
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Cache instellingen opslaan mislukt.", code: "CACHE_SETTINGS_WRITE_FAILED" }, { status: 500 });
  }
}
