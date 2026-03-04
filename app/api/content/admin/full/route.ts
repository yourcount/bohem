import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/admin-session";
import { invalidateSiteRuntimeCache } from "@/lib/cache/runtime-cache";
import { validateAndSanitizeFullSiteContent } from "@/lib/content/full-content-contract";
import { FullContentStorageError, readFullSiteContent, updateFullSiteContent } from "@/lib/db/full-site-content-db";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { getRequestMeta } from "@/lib/security/request";
import { shouldAutoInvalidateCacheOnUpdate } from "@/lib/system/technical-settings";

function toStorageResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof FullContentStorageError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ error: fallbackMessage, code: "DB_WRITE_FAILED" }, { status: 500 });
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const record = await readFullSiteContent();
    if (!record) {
      return NextResponse.json({ error: "Geen content gevonden.", code: "CONTENT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(
      {
        content: record.content,
        updated_at: record.updated_at,
        updated_by: record.updated_by
      },
      { status: 200 }
    );
  } catch (error) {
    return toStorageResponse(error, "Content lezen mislukt.");
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

  const parsed = validateAndSanitizeFullSiteContent(candidate);
  if (!parsed.ok) {
    return NextResponse.json(
      {
        error: "Validatie mislukt.",
        code: "VALIDATION_ERROR",
        fieldErrors: parsed.fieldErrors
      },
      { status: 422 }
    );
  }

  try {
    const updated = await updateFullSiteContent(parsed.value, session.email);
    if (!updated) {
      return NextResponse.json({ error: "Geen content gevonden.", code: "CONTENT_NOT_FOUND" }, { status: 404 });
    }

    logAuditEvent({
      actorUserId: session.uid,
      actorEmail: session.email,
      action: "CONTENT_FULL_UPDATED",
      targetType: "content",
      targetId: "site_content_full_v1",
      metadata: { path: "full" },
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
        content: updated.content,
        updated_at: updated.updated_at,
        updated_by: updated.updated_by
      },
      { status: 200 }
    );
  } catch (error) {
    return toStorageResponse(error, "Opslaan mislukt.");
  }
}
