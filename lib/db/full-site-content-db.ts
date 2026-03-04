import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { list, put } from "@vercel/blob";
import Database from "better-sqlite3";

import { siteContent } from "@/lib/content";
import { getDbPath } from "@/lib/db/content-db";
import type { SiteContent } from "@/lib/types";

export type FullSiteContentRecord = {
  content: SiteContent;
  updated_at: string;
  updated_by: string;
};

type BlobPayload = FullSiteContentRecord;

const FULL_CONTENT_BLOB_PATH = "cms/site-content-full-v1.json";

function shouldUseBlobStorage() {
  return Boolean(process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN);
}

async function readBlobPayload(): Promise<BlobPayload | null> {
  const { blobs } = await list({
    prefix: FULL_CONTENT_BLOB_PATH,
    limit: 20
  });

  const exact = blobs.find((blob) => blob.pathname === FULL_CONTENT_BLOB_PATH) ?? blobs[0];
  if (!exact) return null;

  const response = await fetch(exact.url, { cache: "no-store" });
  if (!response.ok) return null;

  const parsed = (await response.json()) as Partial<BlobPayload>;
  if (!parsed || typeof parsed !== "object" || !parsed.content || !parsed.updated_at || !parsed.updated_by) {
    return null;
  }

  return {
    content: parsed.content as SiteContent,
    updated_at: String(parsed.updated_at),
    updated_by: String(parsed.updated_by)
  };
}

async function writeBlobPayload(content: SiteContent, updatedBy: string): Promise<BlobPayload> {
  const payload: BlobPayload = {
    content,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy
  };

  await put(FULL_CONTENT_BLOB_PATH, JSON.stringify(payload), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8"
  });

  return payload;
}

function openDb() {
  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  return new Database(dbPath);
}

function ensureFullContentTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_content_full_v1 (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      content_json TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function parseContent(contentJson: string): SiteContent | null {
  try {
    return JSON.parse(contentJson) as SiteContent;
  } catch {
    return null;
  }
}

function ensureSeedRow(db: Database.Database) {
  const existing = db
    .prepare("SELECT content_json FROM site_content_full_v1 WHERE id = 1")
    .get() as { content_json: string } | undefined;

  if (existing) return;

  db.prepare(
    "INSERT INTO site_content_full_v1 (id, content_json, updated_by, updated_at) VALUES (1, @content_json, @updated_by, CURRENT_TIMESTAMP)"
  ).run({
    content_json: JSON.stringify(siteContent),
    updated_by: "system@local"
  });
}

export async function readFullSiteContent(): Promise<FullSiteContentRecord | null> {
  if (shouldUseBlobStorage()) {
    try {
      const existing = await readBlobPayload();
      if (existing) return existing;
      return await writeBlobPayload(siteContent, "system@vercel");
    } catch {
      // fall back to sqlite behavior if Blob is temporarily unavailable
    }
  }

  const db = openDb();

  try {
    ensureFullContentTable(db);
    ensureSeedRow(db);

    const row = db
      .prepare("SELECT content_json, updated_at, updated_by FROM site_content_full_v1 WHERE id = 1")
      .get() as { content_json: string; updated_at: string; updated_by: string } | undefined;

    if (!row) return null;
    const content = parseContent(row.content_json);
    if (!content) return null;

    return {
      content,
      updated_at: row.updated_at,
      updated_by: row.updated_by
    };
  } finally {
    db.close();
  }
}

export async function updateFullSiteContent(content: SiteContent, updatedBy: string): Promise<FullSiteContentRecord | null> {
  if (shouldUseBlobStorage()) {
    try {
      return await writeBlobPayload(content, updatedBy);
    } catch {
      return null;
    }
  }

  const db = openDb();

  try {
    ensureFullContentTable(db);
    ensureSeedRow(db);

    const result = db
      .prepare(
        "UPDATE site_content_full_v1 SET content_json = @content_json, updated_by = @updated_by, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
      )
      .run({
        content_json: JSON.stringify(content),
        updated_by: updatedBy
      });

    if (result.changes === 0) return null;

    const row = db
      .prepare("SELECT content_json, updated_at, updated_by FROM site_content_full_v1 WHERE id = 1")
      .get() as { content_json: string; updated_at: string; updated_by: string } | undefined;

    if (!row) return null;
    const parsed = parseContent(row.content_json);
    if (!parsed) return null;

    return {
      content: parsed,
      updated_at: row.updated_at,
      updated_by: row.updated_by
    };
  } finally {
    db.close();
  }
}
