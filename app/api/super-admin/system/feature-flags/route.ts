import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { invalidateSiteRuntimeCache } from "@/lib/cache/runtime-cache";
import { listFeatureFlags, updateFeatureFlagsPatch } from "@/lib/db/system-controls-db";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";
import { validateFeatureFlagsPatch } from "@/lib/super-admin/system";

function toApiFlags() {
  return listFeatureFlags().map((row) => ({
    key: row.key,
    enabled: row.enabled === 1,
    description: row.description,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  }));
}

export async function GET() {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  try {
    return NextResponse.json({ ok: true, flags: toApiFlags() }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Feature flags laden mislukt.", code: "FLAGS_READ_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { ip, userAgent } = getRequestMeta(request);
  const limiter = await consumeRateLimit(`super-admin:feature-flags:${ip}`, 20, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer later opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body.", code: "INVALID_BODY" }, { status: 400 });
  }

  const validated = validateFeatureFlagsPatch(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: "Validatie mislukt.", code: "VALIDATION_ERROR", fieldErrors: validated.fieldErrors },
      { status: 422 }
    );
  }

  try {
    updateFeatureFlagsPatch(validated.patch, auth.session.email);

    await logAuditEvent({
      actorUserId: auth.session.uid,
      actorEmail: auth.session.email,
      action: "SYSTEM_FEATURE_FLAGS_UPDATED",
      targetType: "system",
      targetId: "feature_flags_v1",
      metadata: { patch: validated.patch },
      ipAddress: ip,
      userAgent
    });

    invalidateSiteRuntimeCache();
    revalidatePath("/");

    return NextResponse.json({ ok: true, flags: toApiFlags() }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Feature flags opslaan mislukt.", code: "FLAGS_WRITE_FAILED" }, { status: 500 });
  }
}
