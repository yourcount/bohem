import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/admin-session";
import { invalidateSiteRuntimeCache } from "@/lib/cache/runtime-cache";
import { CONTENT_FIELD_KEYS, type ContentFields } from "@/lib/content/content-contract";
import { validatePatchPayload, validateFullContent } from "@/lib/content/content-contract";
import { contentDbExists, getDbPath, readPublicContent, updatePublicContentPatch } from "@/lib/db/content-db";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { getRequestMeta } from "@/lib/security/request";
import { shouldAutoInvalidateCacheOnUpdate } from "@/lib/system/technical-settings";

function toContentFields(input: Record<string, unknown>): ContentFields {
  const output = {} as ContentFields;
  for (const key of CONTENT_FIELD_KEYS) {
    const value = input[key];
    output[key] = typeof value === "string" ? value : "";
  }
  return output;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!contentDbExists()) {
    return NextResponse.json({ error: "Database niet gevonden.", code: "DB_UNAVAILABLE", dbPath: getDbPath() }, { status: 500 });
  }

  try {
    const row = readPublicContent();
    if (!row) {
      return NextResponse.json({ error: "Geen content gevonden.", code: "CONTENT_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(row, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Content lezen mislukt.", code: "DB_READ_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!contentDbExists()) {
    return NextResponse.json({ error: "Database niet gevonden.", code: "DB_UNAVAILABLE", dbPath: getDbPath() }, { status: 500 });
  }

  const { ip, userAgent } = getRequestMeta(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body.", code: "INVALID_BODY" }, { status: 400 });
  }

  const parsedPatch = validatePatchPayload(body);
  if (parsedPatch.unknownFields.length > 0) {
    return NextResponse.json(
      {
        error: "Onbekende velden in request.",
        code: "UNKNOWN_FIELDS",
        fields: parsedPatch.unknownFields
      },
      { status: 400 }
    );
  }

  if (parsedPatch.code === "NO_FIELDS") {
    return NextResponse.json({ error: "Geen velden aangeleverd om te wijzigen.", code: "NO_FIELDS" }, { status: 400 });
  }

  if (!parsedPatch.ok) {
    return NextResponse.json(
      {
        error: "Validatie mislukt.",
        code: "VALIDATION_ERROR",
        fieldErrors: parsedPatch.errors
      },
      { status: 422 }
    );
  }

  const existing = readPublicContent();
  if (!existing) {
    return NextResponse.json({ error: "Geen content gevonden.", code: "CONTENT_NOT_FOUND" }, { status: 404 });
  }

  const merged = {
    hero_title: parsedPatch.sanitized.hero_title ?? existing.hero_title,
    hero_subtitle: parsedPatch.sanitized.hero_subtitle ?? existing.hero_subtitle,
    about_text: parsedPatch.sanitized.about_text ?? existing.about_text,
    arthur_bio: parsedPatch.sanitized.arthur_bio ?? existing.arthur_bio,
    bettina_bio: parsedPatch.sanitized.bettina_bio ?? existing.bettina_bio,
    booking_cta_label: parsedPatch.sanitized.booking_cta_label ?? existing.booking_cta_label,
    booking_cta_url: parsedPatch.sanitized.booking_cta_url ?? existing.booking_cta_url,
    contact_email: parsedPatch.sanitized.contact_email ?? existing.contact_email,
    hero_image_url: parsedPatch.sanitized.hero_image_url ?? existing.hero_image_url
  };

  const fullValidation = validateFullContent(merged);
  if (!fullValidation.ok) {
    return NextResponse.json(
      {
        error: "Validatie op gecombineerde content mislukt.",
        code: "VALIDATION_ERROR",
        fieldErrors: fullValidation.errors
      },
      { status: 422 }
    );
  }

  try {
    const updated = updatePublicContentPatch(parsedPatch.sanitized, session.email);
    if (!updated) {
      return NextResponse.json({ error: "Geen content gevonden.", code: "CONTENT_NOT_FOUND" }, { status: 404 });
    }
    logAuditEvent({
      actorUserId: session.uid,
      actorEmail: session.email,
      action: "CONTENT_PATCH_UPDATED",
      targetType: "content",
      targetId: "public_content_v1",
      metadata: { fields: Object.keys(parsedPatch.sanitized) },
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
        updated_at: updated.updated_at,
        updated_by: updated.updated_by,
        content: toContentFields(updated as unknown as Record<string, unknown>)
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Opslaan in database mislukt.", code: "DB_WRITE_FAILED" }, { status: 500 });
  }
}
