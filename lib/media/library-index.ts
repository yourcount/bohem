import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { get, put } from "@vercel/blob";

export type MediaIndexEntry = {
  src: string;
  tags: string[];
  createdAt: string;
  originalName?: string;
  blobPath?: string;
};

type MediaIndexData = {
  files: Record<string, MediaIndexEntry>;
};

const mediaIndexPath = join(process.cwd(), "data", "media-library.json");
const mediaIndexBlobPath = "cms/media-library-v1.json";

function shouldUseBlobMediaIndex() {
  return Boolean(process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN);
}

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

function normalizeIndexData(parsed: unknown): MediaIndexData {
  if (!parsed || typeof parsed !== "object") {
    return { files: {} };
  }
  const files = (parsed as Partial<MediaIndexData>).files;
  if (!files || typeof files !== "object") {
    return { files: {} };
  }
  return { files };
}

async function readBlobIndex(): Promise<MediaIndexData> {
  const blob = await get(mediaIndexBlobPath, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return { files: {} };
  }

  try {
    const parsed = await new Response(blob.stream).json();
    return normalizeIndexData(parsed);
  } catch {
    return { files: {} };
  }
}

async function writeBlobIndex(data: MediaIndexData) {
  await put(mediaIndexBlobPath, JSON.stringify(data, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8"
  });
}

function readLocalIndex(): MediaIndexData {
  if (!existsSync(mediaIndexPath)) {
    return { files: {} };
  }

  try {
    const raw = readFileSync(mediaIndexPath, "utf-8");
    return normalizeIndexData(JSON.parse(raw));
  } catch {
    return { files: {} };
  }
}

function writeLocalIndex(data: MediaIndexData) {
  mkdirSync(dirname(mediaIndexPath), { recursive: true });
  writeFileSync(mediaIndexPath, JSON.stringify(data, null, 2), "utf-8");
}

export async function readMediaIndex(): Promise<MediaIndexData> {
  if (shouldUseBlobMediaIndex()) {
    return readBlobIndex();
  }
  return readLocalIndex();
}

export async function writeMediaIndex(data: MediaIndexData) {
  if (shouldUseBlobMediaIndex()) {
    await writeBlobIndex(data);
    return;
  }
  writeLocalIndex(data);
}

export async function upsertMediaIndexEntry(src: string, input: { tags?: string[]; originalName?: string; blobPath?: string }) {
  const index = await readMediaIndex();
  const existing = index.files[src];
  const tags = uniqueTags(input.tags ?? existing?.tags ?? []);

  index.files[src] = {
    src,
    tags,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    originalName: input.originalName ?? existing?.originalName,
    blobPath: input.blobPath ?? existing?.blobPath
  };

  await writeMediaIndex(index);
  return index.files[src];
}

export async function removeMediaIndexEntry(src: string) {
  const index = await readMediaIndex();
  if (!index.files[src]) {
    return false;
  }
  delete index.files[src];
  await writeMediaIndex(index);
  return true;
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
