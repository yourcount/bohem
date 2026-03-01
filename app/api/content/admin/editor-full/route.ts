import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/admin-session";
import { invalidateSiteRuntimeCache } from "@/lib/cache/runtime-cache";
import {
  mergeEditorContent,
  pickEditorContent,
  validateAndSanitizeEditorContent
} from "@/lib/content/editor-content-contract";
import { validateAndSanitizeFullSiteContent } from "@/lib/content/full-content-contract";
import { readFullSiteContent, updateFullSiteContent } from "@/lib/db/full-site-content-db";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { getRequestMeta } from "@/lib/security/request";
import { shouldAutoInvalidateCacheOnUpdate } from "@/lib/system/technical-settings";

function buildValidationSummary(fieldErrors: Record<string, string[]>, limit = 6) {
  return Object.entries(fieldErrors)
    .slice(0, limit)
    .map(([path, messages]) => ({
      path,
      message: messages.join(" ")
    }));
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const record = readFullSiteContent();
    if (!record) {
      return NextResponse.json({ error: "Geen content gevonden.", code: "CONTENT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(
      {
        content: pickEditorContent(record.content),
        updated_at: record.updated_at,
        updated_by: record.updated_by
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Content lezen mislukt.", code: "DB_READ_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { ip, userAgent } = getRequestMeta(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body.", code: "INVALID_BODY" }, { status: 400 });
  }

  const candidate = body && typeof body === "object" && "content" in (body as Record<string, unknown>)
    ? (body as { content: unknown }).content
    : body;

  const parsedEditor = validateAndSanitizeEditorContent(candidate);
  if (!parsedEditor.ok) {
    return NextResponse.json(
      {
        error: "Validatie mislukt.",
        code: "VALIDATION_ERROR",
        fieldErrors: parsedEditor.fieldErrors,
        validationSummary: buildValidationSummary(parsedEditor.fieldErrors)
      },
      { status: 422 }
    );
  }

  try {
    const current = readFullSiteContent();
    if (!current) {
      return NextResponse.json({ error: "Geen content gevonden.", code: "CONTENT_NOT_FOUND" }, { status: 404 });
    }

    const merged = mergeEditorContent(current.content, parsedEditor.value);
    const fullValidation = validateAndSanitizeFullSiteContent(merged);

    if (!fullValidation.ok) {
      return NextResponse.json(
        {
          error: "Validatie op gecombineerde content mislukt.",
          code: "VALIDATION_ERROR",
          fieldErrors: fullValidation.fieldErrors,
          validationSummary: buildValidationSummary(fullValidation.fieldErrors)
        },
        { status: 422 }
      );
    }

    const updated = updateFullSiteContent(fullValidation.value, session.email);
    if (!updated) {
      return NextResponse.json({ error: "Opslaan mislukt.", code: "DB_WRITE_FAILED" }, { status: 500 });
    }

    logAuditEvent({
      actorUserId: session.uid,
      actorEmail: session.email,
      action: "CONTENT_EDITOR_UPDATED",
      targetType: "content",
      targetId: "site_content_full_v1_editor",
      metadata: { path: "editor-full" },
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
        content: pickEditorContent(updated.content),
        updated_at: updated.updated_at,
        updated_by: updated.updated_by
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Opslaan mislukt.", code: "DB_WRITE_FAILED" }, { status: 500 });
  }
}
