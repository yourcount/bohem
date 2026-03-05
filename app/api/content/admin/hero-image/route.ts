import { writeFileSync } from "node:fs";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/admin-session";
import { invalidateSiteRuntimeCache } from "@/lib/cache/runtime-cache";
import { contentDbExists, getDbPath, readPublicContent, updatePublicContentPatch } from "@/lib/db/content-db";
import { FullContentStorageError, readFullSiteContent, updateFullSiteContent } from "@/lib/db/full-site-content-db";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";
import { shouldAutoInvalidateCacheOnUpdate } from "@/lib/system/technical-settings";
import {
  HERO_MAX_UPLOAD_BYTES,
  buildHeroImagePaths,
  createHeroImageFilename,
  ensureHeroUploadDir,
  getHeroExtensionByMime,
  isManagedHeroImageUrl,
  safeDeleteManagedHeroImageByUrl
} from "@/lib/media/hero-image";

function toStorageResponse(error: unknown) {
  if (error instanceof FullContentStorageError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ error: "Database-update mislukt.", code: "DB_WRITE_FAILED" }, { status: 500 });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { ip, userAgent } = getRequestMeta(request);

  if (!contentDbExists()) {
    return NextResponse.json({ error: "Database niet gevonden.", code: "DB_UNAVAILABLE", dbPath: getDbPath() }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload kon niet verwerkt worden.", code: "INVALID_MULTIPART" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Geen afbeelding ontvangen.", code: "FILE_REQUIRED" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Leeg bestand is niet toegestaan.", code: "EMPTY_FILE" }, { status: 400 });
  }

  if (file.size > HERO_MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: "Bestand is te groot. Maximaal 8 MB toegestaan.",
        code: "FILE_TOO_LARGE",
        maxBytes: HERO_MAX_UPLOAD_BYTES
      },
      { status: 413 }
    );
  }

  const extension = getHeroExtensionByMime(file.type);
  if (!extension) {
    return NextResponse.json(
      {
        error: "Bestandstype niet toegestaan. Gebruik JPG, PNG of WEBP.",
        code: "UNSUPPORTED_FILE_TYPE"
      },
      { status: 415 }
    );
  }

  const current = readPublicContent();

  ensureHeroUploadDir();
  const filename = createHeroImageFilename(extension);
  const { absolutePath, publicUrl } = buildHeroImagePaths(filename);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(absolutePath, buffer, { flag: "wx" });
  } catch {
    return NextResponse.json({ error: "Afbeelding opslaan mislukt.", code: "FILE_SAVE_FAILED" }, { status: 500 });
  }

  try {
    const updatedLegacy = updatePublicContentPatch({ hero_image_url: publicUrl }, session.email);

    const fullRecord = await readFullSiteContent();
    let updatedAt = updatedLegacy?.updated_at ?? "";
    let updatedBy = updatedLegacy?.updated_by ?? session.email;

    if (fullRecord) {
      const nextContent = structuredClone(fullRecord.content);
      nextContent.hero.image.src = publicUrl;
      const updatedFull = await updateFullSiteContent(nextContent, session.email);
      if (!updatedFull) {
        safeDeleteManagedHeroImageByUrl(publicUrl);
        return NextResponse.json({ error: "Database-update mislukt.", code: "DB_WRITE_FAILED" }, { status: 500 });
      }
      updatedAt = updatedFull.updated_at;
      updatedBy = updatedFull.updated_by;
    }

    if (current?.hero_image_url && current.hero_image_url !== publicUrl && isManagedHeroImageUrl(current.hero_image_url)) {
      try {
        safeDeleteManagedHeroImageByUrl(current.hero_image_url);
      } catch {
        // Non-blocking clean-up; new image is already active.
      }
    }

    await logAuditEvent({
      actorUserId: session.uid,
      actorEmail: session.email,
      action: "CONTENT_HERO_IMAGE_UPDATED",
      targetType: "content",
      targetId: "hero.image.src",
      metadata: { heroImageUrl: publicUrl },
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
        hero_image_url: publicUrl,
        updated_at: updatedAt,
        updated_by: updatedBy
      },
      { status: 200 }
    );
  } catch (error) {
    safeDeleteManagedHeroImageByUrl(publicUrl);
    return toStorageResponse(error);
  }
}
