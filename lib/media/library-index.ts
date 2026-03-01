import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type MediaIndexEntry = {
  src: string;
  tags: string[];
  createdAt: string;
  originalName?: string;
};

type MediaIndexData = {
  files: Record<string, MediaIndexEntry>;
};

const mediaIndexPath = join(process.cwd(), "data", "media-library.json");

function normalizeTag(tag: string) {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 32);
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map(normalizeTag).filter(Boolean))).slice(0, 8);
}

export function readMediaIndex(): MediaIndexData {
  if (!existsSync(mediaIndexPath)) {
    return { files: {} };
  }

  try {
    const raw = readFileSync(mediaIndexPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<MediaIndexData>;
    if (!parsed || typeof parsed !== "object" || !parsed.files || typeof parsed.files !== "object") {
      return { files: {} };
    }
    return { files: parsed.files };
  } catch {
    return { files: {} };
  }
}

export function writeMediaIndex(data: MediaIndexData) {
  mkdirSync(dirname(mediaIndexPath), { recursive: true });
  writeFileSync(mediaIndexPath, JSON.stringify(data, null, 2), "utf-8");
}

export function upsertMediaIndexEntry(src: string, input: { tags?: string[]; originalName?: string }) {
  const index = readMediaIndex();
  const existing = index.files[src];
  const tags = uniqueTags(input.tags ?? existing?.tags ?? []);

  index.files[src] = {
    src,
    tags,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    originalName: input.originalName ?? existing?.originalName
  };

  writeMediaIndex(index);
  return index.files[src];
}

export function parseTagInput(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return uniqueTags(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

