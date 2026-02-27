import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { invalidateRuntimeCacheByRoute, invalidateSiteRuntimeCache, readRuntimeCacheStatus } from "@/lib/cache/runtime-cache";
import { createCacheInvalidationLog, listRecentCacheInvalidations } from "@/lib/db/cache-management-db";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";
import { validateCacheInvalidateBody } from "@/lib/super-admin/cache";

export async function POST(request: Request) {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { ip, userAgent } = getRequestMeta(request);
  const limiter = consumeRateLimit(`super-admin:cache-invalidate:${ip}`, 25, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer later opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body.", code: "INVALID_BODY" }, { status: 400 });
  }

  const validated = validateCacheInvalidateBody(body);
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
    const result =
      validated.value.scope === "sitewide"
        ? invalidateSiteRuntimeCache()
        : invalidateRuntimeCacheByRoute(validated.value.routePath || "/");

    revalidatePath(validated.value.scope === "sitewide" ? "/" : validated.value.routePath || "/");

    createCacheInvalidationLog({
      scope: validated.value.scope,
      routePath: validated.value.routePath,
      reason: validated.value.reason,
      triggeredBy: auth.session.email
    });

    logAuditEvent({
      actorUserId: auth.session.uid,
      actorEmail: auth.session.email,
      action: "CACHE_INVALIDATED",
      targetType: "cache",
      targetId: validated.value.scope === "sitewide" ? "sitewide" : validated.value.routePath || "/",
      metadata: {
        scope: validated.value.scope,
        routePath: validated.value.routePath,
        reason: validated.value.reason,
        runtimeInvalidatedEntries: result.invalidatedEntries,
        runtimeInvalidatedKeys: result.invalidatedKeys
      },
      ipAddress: ip,
      userAgent
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Cache invalidatie uitgevoerd.",
        result,
        runtime: readRuntimeCacheStatus(),
        recentInvalidations: listRecentCacheInvalidations(20)
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Cache invalidatie mislukt.", code: "CACHE_INVALIDATION_FAILED" }, { status: 500 });
  }
}
