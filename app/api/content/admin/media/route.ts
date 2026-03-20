import { mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { randomBytes } from "node:crypto";

import { BlobAccessError, BlobError, BlobFileTooLargeError, BlobServiceNotAvailable, BlobServiceRateLimited, BlobStoreNotFoundError, BlobStoreSuspendedError, del, list, put } from "@vercel/blob";
import sharp from "sharp";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/admin-session";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { getMediaBlobToken, isVercelWithoutMediaBlobStorage, shouldUseBlobMediaStorage } from "@/lib/media/blob-storage";
import { parseTagInput, readMediaIndex, removeMediaIndexEntry, upsertMediaIndexEntry } from "@/lib/media/library-index";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MANAGED_UPLOAD_PREFIX = "/uploads/library/";
const BLOB_UPLOAD_PREFIX = "uploads/library";
const MEDIA_STORAGE_ENV_LABEL = "MEDIA_BLOB_READ_WRITE_TOKEN (of fallback: BLOB_READ_WRITE_TOKEN)";

type ListedMediaFile = {
  src: string;
  name: string;
  tags: string[];
  kind: "photo" | "asset";
};

function inferTagsFromPath(src: string) {
  const tags = new Set<string>();
  const lower = src.toLowerCase();

  if (lower.includes("hero")) tags.add("hero");
  if (lower.includes("bio") || lower.includes("about")) tags.add("bio");
  if (lower.includes("disc") || lower.includes("release") || lower.includes("spotify")) tags.add("discografie");
  if (lower.includes("kampvuur") || lower.includes("fire")) tags.add("kampvuur");
  if (lower.includes("book") || lower.includes("show") || lower.includes("live")) tags.add("boekingen");
  if (lower.includes("brand") || lower.includes("logo")) tags.add("brand");
  if (lower.includes("uploads")) tags.add("uploads");

  return Array.from(tags);
}

function walkPublicImages(baseDir: string, baseUrl: string, depth = 0): Array<{ src: string; name: string }> {
  if (depth > 3) return [];

  const entries = readdirSync(baseDir, { withFileTypes: true });
  const files: Array<{ src: string; name: string }> = [];

  for (const entry of entries) {
    const abs = join(baseDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkPublicImages(abs, `${baseUrl}/${entry.name}`, depth + 1));
      continue;
    }

    const ext = extname(entry.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) continue;

    files.push({
      src: `${baseUrl}/${entry.name}`,
      name: entry.name
    });
  }

  return files;
}

function classifyMediaKind(src: string): "photo" | "asset" {
  if (src.startsWith("/images/")) return "photo";
  if (src.startsWith("/uploads/library/")) return "photo";
  if (src.startsWith("http://") || src.startsWith("https://")) return "photo";
  return "asset";
}

async function listMediaFiles(filter: { query?: string; tag?: string; kind?: "all" | "photo" }): Promise<ListedMediaFile[]> {
  const publicRoot = join(process.cwd(), "public");
  const candidates = [
    { dir: join(publicRoot, "images"), url: "/images" },
    { dir: join(publicRoot, "uploads"), url: "/uploads" },
    { dir: join(publicRoot, "brand"), url: "/brand" }
  ];

  const files: Array<{ src: string; name: string }> = [];

  for (const candidate of candidates) {
    try {
      const stats = statSync(candidate.dir);
      if (!stats.isDirectory()) continue;
      files.push(...walkPublicImages(candidate.dir, candidate.url));
    } catch {
      // ignore missing folders
    }
  }

  const deduped = new Map<string, { src: string; name: string }>();
  for (const file of files) {
    deduped.set(file.src, file);
  }

  let index = { files: {} as Record<string, { src: string; tags: string[]; originalName?: string }> };
  try {
    index = await readMediaIndex();
  } catch {
    // Fall back to file/blob discovery if the media index is unavailable.
  }

  if (shouldUseBlobMediaStorage()) {
    try {
      let cursor: string | undefined;
      do {
        const page = await list({ token: getMediaBlobToken(), prefix: `${BLOB_UPLOAD_PREFIX}/`, limit: 1000, cursor });
        for (const blob of page.blobs) {
          if (!deduped.has(blob.url)) {
            deduped.set(blob.url, {
              src: blob.url,
              name: blob.pathname.split("/").pop() ?? blob.pathname
            });
          }
        }
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
    } catch {
      // Keep serving local/indexed files even when blob listing is unavailable.
    }
  }

  const query = (filter.query ?? "").trim().toLowerCase();
  const tag = (filter.tag ?? "").trim().toLowerCase();
  const kind = filter.kind ?? "all";

  for (const entry of Object.values(index.files)) {
    if (!deduped.has(entry.src)) {
      deduped.set(entry.src, {
        src: entry.src,
        name: entry.originalName ?? entry.src.split("/").pop() ?? entry.src
      });
    }
  }

  const mediaList = Array.from(deduped.values()).map((file) => {
    const indexed = index.files[file.src];
    const inferred = inferTagsFromPath(file.src);
    const tags = Array.from(new Set([...(indexed?.tags ?? []), ...inferred]));
    const mediaKind = classifyMediaKind(file.src);

    return {
      src: file.src,
      name: file.name,
      tags,
      kind: mediaKind
    };
  });

  return mediaList
    .filter((file) => {
      if (kind === "photo" && file.kind !== "photo") {
        return false;
      }
      if (query && !(`${file.name} ${file.src} ${file.tags.join(" ")}`.toLowerCase().includes(query))) {
        return false;
      }
      if (tag && !file.tags.map((item) => item.toLowerCase()).includes(tag)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.src.localeCompare(b.src));
}

async function convertToOptimizedWebp(file: File) {
  const input = Buffer.from(await file.arrayBuffer());
  const instance = sharp(input, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS });
  const metadata = await instance.metadata();
  const format = metadata.format?.toLowerCase() ?? "";

  if (!["jpeg", "jpg", "png", "webp", "avif"].includes(format)) {
    throw new Error("UNSUPPORTED_IMAGE_FORMAT");
  }

  if (!metadata.width || !metadata.height || metadata.width < 120 || metadata.height < 120) {
    throw new Error("IMAGE_DIMENSIONS_INVALID");
  }

  const output = await instance
    .rotate()
    .resize({ width: 2200, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();

  return { buffer: output, metadata };
}

function getMediaUploadFailure(error: unknown) {
  const details = error instanceof Error ? error.message : "Unknown upload error";

  if (details === "UNSUPPORTED_IMAGE_FORMAT") {
    return {
      status: 415,
      body: { error: "Afbeeldingsformaat niet toegestaan.", code: "UNSUPPORTED_FILE_TYPE", details }
    };
  }

  if (details === "IMAGE_DIMENSIONS_INVALID") {
    return {
      status: 422,
      body: {
        error: "Afbeelding is te klein of beschadigd. Minimaal 120x120 pixels.",
        code: "INVALID_IMAGE_DIMENSIONS",
        details
      }
    };
  }

  if (error instanceof BlobStoreNotFoundError) {
    return {
      status: 503,
      body: { error: "Blob-opslag kon niet gevonden worden.", code: "BLOB_STORE_NOT_FOUND", details }
    };
  }

  if (error instanceof BlobStoreSuspendedError) {
    return {
      status: 503,
      body: { error: "Blob-opslag is tijdelijk niet beschikbaar.", code: "BLOB_STORE_SUSPENDED", details }
    };
  }

  if (error instanceof BlobServiceNotAvailable) {
    return {
      status: 503,
      body: { error: "Blob-service is tijdelijk niet bereikbaar.", code: "BLOB_SERVICE_UNAVAILABLE", details }
    };
  }

  if (error instanceof BlobServiceRateLimited) {
    return {
      status: 429,
      body: { error: "Blob-service rate-limiteert deze upload. Probeer het later opnieuw.", code: "BLOB_RATE_LIMITED", details }
    };
  }

  if (error instanceof BlobFileTooLargeError) {
    return {
      status: 413,
      body: { error: "Blob-service weigert dit bestand vanwege de grootte.", code: "BLOB_FILE_TOO_LARGE", details }
    };
  }

  if (error instanceof BlobAccessError) {
    return {
      status: 500,
      body: { error: "Blob-opslag weigert de upload.", code: "BLOB_ACCESS_ERROR", details }
    };
  }

  if (error instanceof BlobError) {
    return {
      status: 500,
      body: { error: "Blob-upload mislukt.", code: "BLOB_UPLOAD_FAILED", details }
    };
  }

  return {
    status: 500,
    body: { error: "Afbeelding opslaan mislukt.", code: "FILE_SAVE_FAILED", details }
  };
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const files = await listMediaFiles({
      query: searchParams.get("q") ?? "",
      tag: searchParams.get("tag") ?? "",
      kind: searchParams.get("kind") === "photo" ? "photo" : "all"
    });

    const tags = Array.from(new Set(files.flatMap((file) => file.tags))).sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ ok: true, files, tags }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Mediabibliotheek laden mislukt.", code: "MEDIA_READ_FAILED" }, { status: 500 });
  }
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
  const limiter = await consumeRateLimit(`admin-media-upload:${ip}:${session.uid}`, 25, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel uploads. Probeer later opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }
  if (isVercelWithoutMediaBlobStorage()) {
    return NextResponse.json(
      { error: `Media-opslag is niet geconfigureerd. Voeg ${MEDIA_STORAGE_ENV_LABEL} toe in Vercel.`, code: "MEDIA_STORAGE_NOT_CONFIGURED" },
      { status: 503 }
    );
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

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Bestand is te groot (max 10 MB).", code: "FILE_TOO_LARGE" }, { status: 413 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Bestandstype niet toegestaan.", code: "UNSUPPORTED_FILE_TYPE" }, { status: 415 });
  }

  const filename = `media-${Date.now()}-${randomBytes(6).toString("hex")}.webp`;
  const uploadDir = join(process.cwd(), "public", "uploads", "library");
  const absolutePath = join(uploadDir, filename);
  let publicUrl = `/uploads/library/${filename}`;
  let blobPath: string | undefined;
  const requestedTags = parseTagInput(formData.get("tags"));
  const ext = extname(file.name).toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Bestandsextensie niet toegestaan.", code: "UNSUPPORTED_EXTENSION" }, { status: 415 });
  }

  try {
    const { buffer, metadata } = await convertToOptimizedWebp(file);
    if (shouldUseBlobMediaStorage()) {
      const uploaded = await put(`${BLOB_UPLOAD_PREFIX}/${filename}`, buffer, {
        token: getMediaBlobToken(),
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "image/webp"
      });
      publicUrl = uploaded.url;
      blobPath = uploaded.pathname;
    } else {
      mkdirSync(uploadDir, { recursive: true });
      writeFileSync(absolutePath, buffer, { flag: "wx" });
    }

    let savedTags = requestedTags;

    try {
      const indexEntry = await upsertMediaIndexEntry(publicUrl, {
        tags: requestedTags,
        originalName: file.name,
        blobPath
      });
      savedTags = indexEntry.tags;
    } catch (indexError) {
      console.error("Media index update failed", indexError);
    }

    try {
      await logAuditEvent({
        actorUserId: session.uid,
        actorEmail: session.email,
        action: "CONTENT_MEDIA_UPLOADED",
        targetType: "media",
        targetId: publicUrl,
        metadata: {
          mime: file.type,
          size: file.size,
          tags: savedTags,
          optimizedTo: "webp",
          sourceFormat: metadata.format ?? "unknown",
          sourceWidth: metadata.width ?? null,
          sourceHeight: metadata.height ?? null
        },
        ipAddress: ip,
        userAgent
      });
    } catch (auditError) {
      console.error("Media upload audit log failed", auditError);
    }

    return NextResponse.json({ ok: true, file: { src: publicUrl, name: filename, tags: savedTags } }, { status: 201 });
  } catch (error) {
    console.error("Media upload failed", error);
    const failure = getMediaUploadFailure(error);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige herkomst van aanvraag.", code: "CSRF_BLOCKED" }, { status: 403 });
  }

  const { ip, userAgent } = getRequestMeta(request);
  const limiter = await consumeRateLimit(`admin-media-delete:${ip}:${session.uid}`, 30, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel verwijderacties. Probeer later opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }
  if (isVercelWithoutMediaBlobStorage()) {
    return NextResponse.json(
      { error: `Media-opslag is niet geconfigureerd. Voeg ${MEDIA_STORAGE_ENV_LABEL} toe in Vercel.`, code: "MEDIA_STORAGE_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  let payload: { src?: string };
  try {
    payload = (await request.json()) as { src?: string };
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag.", code: "INVALID_JSON" }, { status: 400 });
  }

  const src = typeof payload.src === "string" ? payload.src.trim() : "";
  if (!src) {
    return NextResponse.json({ error: "Geen afbeeldingpad opgegeven.", code: "SRC_REQUIRED" }, { status: 400 });
  }

  const index = await readMediaIndex();
  const indexed = index.files[src];

  if (shouldUseBlobMediaStorage()) {
    let pathname = indexed?.blobPath;
    if (!pathname) {
      try {
        const parsed = new URL(src);
        pathname = parsed.pathname.replace(/^\/+/, "");
      } catch {
        pathname = undefined;
      }
    }
    if (!pathname) {
      return NextResponse.json({ error: "Ongeldig afbeeldingpad.", code: "INVALID_SRC" }, { status: 400 });
    }
    try {
      await del(pathname, { token: getMediaBlobToken() });
    } catch {
      return NextResponse.json({ error: "Afbeelding kon niet verwijderd worden.", code: "FILE_DELETE_FAILED" }, { status: 404 });
    }
  } else {
    if (!src.startsWith(MANAGED_UPLOAD_PREFIX)) {
      return NextResponse.json(
        { error: "Alleen afbeeldingen uit de fotobibliotheek kunnen verwijderd worden.", code: "FORBIDDEN_TARGET" },
        { status: 403 }
      );
    }

    const filename = src.slice(MANAGED_UPLOAD_PREFIX.length);
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Ongeldig afbeeldingpad.", code: "INVALID_SRC" }, { status: 400 });
    }

    const absolutePath = join(process.cwd(), "public", "uploads", "library", filename);
    try {
      unlinkSync(absolutePath);
    } catch {
      return NextResponse.json({ error: "Afbeelding kon niet verwijderd worden.", code: "FILE_DELETE_FAILED" }, { status: 404 });
    }
  }

  try {
    await removeMediaIndexEntry(src);
  } catch (indexError) {
    console.error("Media index delete failed", indexError);
  }

  try {
    await logAuditEvent({
      actorUserId: session.uid,
      actorEmail: session.email,
      action: "CONTENT_MEDIA_DELETED",
      targetType: "media",
      targetId: src,
      metadata: { src },
      ipAddress: ip,
      userAgent
    });
  } catch (auditError) {
    console.error("Media delete audit log failed", auditError);
  }

  return NextResponse.json({ ok: true, removed: src }, { status: 200 });
}
