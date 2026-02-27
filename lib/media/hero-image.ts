import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";

const HERO_UPLOAD_DIR = join(process.cwd(), "public", "uploads", "hero");
const HERO_UPLOAD_WEB_PREFIX = "/uploads/hero/";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export const HERO_MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

export function ensureHeroUploadDir() {
  mkdirSync(HERO_UPLOAD_DIR, { recursive: true });
}

export function getHeroExtensionByMime(mimeType: string): string | null {
  return MIME_TO_EXT[mimeType] ?? null;
}

export function createHeroImageFilename(extension: string): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = randomBytes(6).toString("hex");
  return `hero-${stamp}-${random}.${extension}`;
}

export function buildHeroImagePaths(filename: string) {
  const absolutePath = join(HERO_UPLOAD_DIR, filename);
  const publicUrl = `${HERO_UPLOAD_WEB_PREFIX}${filename}`;
  return { absolutePath, publicUrl };
}

export function isManagedHeroImageUrl(url: string) {
  return url.startsWith(HERO_UPLOAD_WEB_PREFIX);
}

export function safeDeleteManagedHeroImageByUrl(url: string) {
  if (!isManagedHeroImageUrl(url)) return;
  const relativeFile = url.slice(HERO_UPLOAD_WEB_PREFIX.length);
  if (!relativeFile || relativeFile.includes("/") || relativeFile.includes("\\")) return;

  const target = resolve(HERO_UPLOAD_DIR, relativeFile);
  const root = resolve(HERO_UPLOAD_DIR);
  if (!target.startsWith(`${root}/`) && target !== root) return;
  if (!existsSync(target)) return;
  unlinkSync(target);
}
