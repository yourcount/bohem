import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { revalidatePublicSiteCaches } from "@/lib/cache/revalidate-site";
import { sanitizeSiteContent } from "@/lib/content/sanitize-site-content";
import { validateAndSanitizeFullSiteContent } from "@/lib/content/full-content-contract";
import { FullContentStorageError, readFullSiteContent, updateFullSiteContent } from "@/lib/db/full-site-content-db";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";
import { shouldAutoInvalidateCacheOnUpdate } from "@/lib/system/technical-settings";
import type { SiteContent } from "@/lib/types";

function toStorageResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof FullContentStorageError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ error: fallbackMessage, code: "DB_WRITE_FAILED" }, { status: 500 });
}

export async function GET() {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  try {
    const record = await readFullSiteContent();
    if (!record) {
      return NextResponse.json({ error: "Geen content gevonden.", code: "CONTENT_NOT_FOUND" }, { status: 404 });
    }

    const hydrated = sanitizeSiteContent(record.content);

    return NextResponse.json(
      {
        ok: true,
        landingPages: hydrated.landingPages,
        updated_at: record.updated_at,
        updated_by: record.updated_by
      },
      { status: 200 }
    );
  } catch (error) {
    return toStorageResponse(error, "SEO landingspagina's laden mislukt.");
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

  const candidate =
    body && typeof body === "object" && "landingPages" in (body as Record<string, unknown>)
      ? (body as { landingPages: unknown }).landingPages
      : body && typeof body === "object" && "content" in (body as Record<string, unknown>)
        ? (body as { content: unknown }).content
        : body;

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return NextResponse.json({ error: "Gebruik een geldig landingPages object.", code: "INVALID_BODY" }, { status: 400 });
  }

  try {
    const current = await readFullSiteContent();
    if (!current) {
      return NextResponse.json({ error: "Geen content gevonden.", code: "CONTENT_NOT_FOUND" }, { status: 404 });
    }

    const merged: SiteContent = {
      ...current.content,
      landingPages: candidate as SiteContent["landingPages"]
    };

    const fullValidation = validateAndSanitizeFullSiteContent(merged);
    if (!fullValidation.ok) {
      return NextResponse.json(
        {
          error: "Opslaan is gestopt omdat één of meer velden nog niet kloppen.",
          code: "VALIDATION_ERROR",
          fieldErrors: fullValidation.fieldErrors
        },
        { status: 422 }
      );
    }

    const updated = await updateFullSiteContent(fullValidation.value, auth.session.email);
    if (!updated) {
      return NextResponse.json({ error: "Opslaan mislukt.", code: "DB_WRITE_FAILED" }, { status: 500 });
    }

    await logAuditEvent({
      actorUserId: auth.session.uid,
      actorEmail: auth.session.email,
      action: "LANDING_PAGES_UPDATED",
      targetType: "content",
      targetId: "site_content_landing_pages_v1",
      metadata: { path: "landing-pages" },
      ipAddress: ip,
      userAgent
    });

    if (shouldAutoInvalidateCacheOnUpdate()) {
      revalidatePublicSiteCaches("/");
      revalidatePublicSiteCaches("/muziekduo-boeken");
      revalidatePublicSiteCaches("/theaterconcert-boeken");
      revalidatePublicSiteCaches("/kampvuurklanken");
      revalidatePublicSiteCaches("/huiskamerconcert-boeken");
      revalidatePublicSiteCaches("/live-muziek-boeken");
      revalidatePublicSiteCaches("/muzikale-teamavond");
      revalidatePublicSiteCaches("/muziek-voor-cultureel-event");
      revalidatePublicSiteCaches("/luisterconcert-boeken");
      revalidatePublicSiteCaches("/pers");
    }

    return NextResponse.json(
      {
        ok: true,
        landingPages: sanitizeSiteContent(updated.content).landingPages,
        updated_at: updated.updated_at,
        updated_by: updated.updated_by
      },
      { status: 200 }
    );
  } catch (error) {
    return toStorageResponse(error, "SEO landingspagina's opslaan mislukt.");
  }
}
