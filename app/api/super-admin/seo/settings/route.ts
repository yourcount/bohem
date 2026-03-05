import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { invalidateSiteRuntimeCache } from "@/lib/cache/runtime-cache";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { ensureSeoSettingsSchema, readSeoSettings, updateSeoSettingsPatch } from "@/lib/db/seo-settings-db";
import {
  mapSeoRowToSettings,
  mapSettingsPatchToDbPatch,
  validateResolvedSeoSettings,
  validateSeoSettingsPatch
} from "@/lib/seo-settings";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";
import { shouldAutoInvalidateCacheOnUpdate } from "@/lib/system/technical-settings";

export async function GET() {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  try {
    ensureSeoSettingsSchema();
    const row = readSeoSettings();

    if (!row) {
      return NextResponse.json({ error: "SEO instellingen niet gevonden.", code: "SEO_SETTINGS_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        settings: mapSeoRowToSettings(row),
        updated_at: row.updated_at,
        updated_by: row.updated_by
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "SEO instellingen laden mislukt.", code: "SEO_SETTINGS_READ_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { ip, userAgent } = getRequestMeta(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body.", code: "INVALID_BODY" }, { status: 400 });
  }

  const validatedPatch = validateSeoSettingsPatch(body);
  if (validatedPatch.unknownFields.length > 0) {
    return NextResponse.json(
      {
        error: "Onbekende velden in request.",
        code: "UNKNOWN_FIELDS",
        fields: validatedPatch.unknownFields
      },
      { status: 400 }
    );
  }

  if (!validatedPatch.ok) {
    return NextResponse.json(
      {
        error: "Validatie mislukt.",
        code: "VALIDATION_ERROR",
        fieldErrors: validatedPatch.fieldErrors
      },
      { status: 422 }
    );
  }

  try {
    ensureSeoSettingsSchema();
    const existing = readSeoSettings();
    if (!existing) {
      return NextResponse.json({ error: "SEO instellingen niet gevonden.", code: "SEO_SETTINGS_NOT_FOUND" }, { status: 404 });
    }

    const merged = {
      ...mapSeoRowToSettings(existing),
      ...validatedPatch.sanitized
    };

    const resolvedValidation = validateResolvedSeoSettings(merged);
    if (!resolvedValidation.ok) {
      return NextResponse.json(
        {
          error: "Validatie op gecombineerde SEO instellingen mislukt.",
          code: "VALIDATION_ERROR",
          fieldErrors: resolvedValidation.fieldErrors
        },
        { status: 422 }
      );
    }

    const updated = updateSeoSettingsPatch(mapSettingsPatchToDbPatch(validatedPatch.sanitized), auth.session.email);
    if (!updated) {
      return NextResponse.json({ error: "SEO instellingen opslaan mislukt.", code: "SEO_SETTINGS_WRITE_FAILED" }, { status: 500 });
    }

    logAuditEvent({
      actorUserId: auth.session.uid,
      actorEmail: auth.session.email,
      action: "SEO_SETTINGS_UPDATED",
      targetType: "seo",
      targetId: "seo_settings_v1",
      metadata: { fields: Object.keys(validatedPatch.sanitized) },
      ipAddress: ip,
      userAgent
    });
    if (shouldAutoInvalidateCacheOnUpdate()) {
      invalidateSiteRuntimeCache();
      revalidatePath("/");
    }

    return NextResponse.json(
      {
        ok: true,
        settings: mapSeoRowToSettings(updated),
        updated_at: updated.updated_at,
        updated_by: updated.updated_by
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "SEO instellingen opslaan mislukt.", code: "SEO_SETTINGS_WRITE_FAILED" }, { status: 500 });
  }
}
