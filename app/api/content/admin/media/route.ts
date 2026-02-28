import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/admin-session";
import { logAuditEvent } from "@/lib/db/admin-auth-db";
import { getRequestMeta } from "@/lib/security/request";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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

function listMediaFiles() {
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

  return Array.from(deduped.values()).sort((a, b) => a.src.localeCompare(b.src));
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const files = listMediaFiles();
    return NextResponse.json({ ok: true, files }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Mediabibliotheek laden mislukt.", code: "MEDIA_READ_FAILED" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { ip, userAgent } = getRequestMeta(request);

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

  const extension = extname(file.name).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(extension)
    ? extension
    : file.type === "image/jpeg"
      ? ".jpg"
      : file.type === "image/png"
        ? ".png"
        : file.type === "image/webp"
          ? ".webp"
          : ".avif";

  const filename = `media-${Date.now()}-${randomBytes(6).toString("hex")}${safeExt}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "library");
  mkdirSync(uploadDir, { recursive: true });

  const absolutePath = join(uploadDir, filename);
  const publicUrl = `/uploads/library/${filename}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(absolutePath, buffer, { flag: "wx" });
  } catch {
    return NextResponse.json({ error: "Afbeelding opslaan mislukt.", code: "FILE_SAVE_FAILED" }, { status: 500 });
  }

  logAuditEvent({
    actorUserId: session.uid,
    actorEmail: session.email,
    action: "CONTENT_MEDIA_UPLOADED",
    targetType: "media",
    targetId: publicUrl,
    metadata: { mime: file.type, size: file.size },
    ipAddress: ip,
    userAgent
  });

  return NextResponse.json({ ok: true, file: { src: publicUrl, name: filename } }, { status: 201 });
}
