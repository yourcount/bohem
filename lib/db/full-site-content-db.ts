import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { get, put } from "@vercel/blob";
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

export class FullContentStorageError extends Error {
  code: "STORAGE_NOT_CONFIGURED" | "STORAGE_READ_FAILED" | "STORAGE_WRITE_FAILED";

  constructor(code: FullContentStorageError["code"], message: string) {
    super(message);
    this.name = "FullContentStorageError";
    this.code = code;
  }
}

function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

function shouldUseBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function assertVercelBlobConfigured() {
  if (!isVercelRuntime()) return;
  if (shouldUseBlobStorage()) return;

  throw new FullContentStorageError(
    "STORAGE_NOT_CONFIGURED",
    "Content-opslag is niet geconfigureerd. Voeg BLOB_READ_WRITE_TOKEN toe in Vercel."
  );
}

function isAccessModeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return normalized.includes("cannot use public access on a private store") || normalized.includes("cannot use private access on a public store");
}

async function readBlobPayload(): Promise<BlobPayload | null> {
  let blob: Awaited<ReturnType<typeof get>> | null = null;
  try {
    blob = await get(FULL_CONTENT_BLOB_PATH, { access: "private", useCache: false });
  } catch (error) {
    if (!isAccessModeError(error)) throw error;
  }

  if (!blob) {
    try {
      blob = await get(FULL_CONTENT_BLOB_PATH, { access: "public", useCache: false });
    } catch (error) {
      if (!isAccessModeError(error)) throw error;
      blob = null;
    }
  }
  if (!blob || blob.statusCode !== 200 || !blob.stream) return null;

  let parsed: Partial<BlobPayload>;
  try {
    parsed = (await new Response(blob.stream).json()) as Partial<BlobPayload>;
  } catch {
    return null;
  }

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

  const body = JSON.stringify(payload);
  try {
    await put(FULL_CONTENT_BLOB_PATH, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json; charset=utf-8"
    });
  } catch (error) {
    if (!isAccessModeError(error)) throw error;
    await put(FULL_CONTENT_BLOB_PATH, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json; charset=utf-8"
    });
  }

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

function upsertDefaultRow(db: Database.Database, updatedBy: string) {
  db.prepare(
    `
      INSERT INTO site_content_full_v1 (id, content_json, updated_by, updated_at)
      VALUES (1, @content_json, @updated_by, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        content_json = excluded.content_json,
        updated_by = excluded.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `
  ).run({
    content_json: JSON.stringify(siteContent),
    updated_by: updatedBy
  });
}

export async function readFullSiteContent(): Promise<FullSiteContentRecord | null> {
  if (isVercelRuntime()) {
    assertVercelBlobConfigured();
    try {
      const existing = await readBlobPayload();
      if (existing) return existing;
      return await writeBlobPayload(siteContent, "system@vercel");
    } catch (error) {
      console.error("readFullSiteContent blob failed:", error);
      const detail = error instanceof Error ? error.message : String(error);
      throw new FullContentStorageError(
        "STORAGE_READ_FAILED",
        `Kon de content-opslag op Vercel Blob niet lezen. Detail: ${detail}`
      );
    }
  }

  const db = openDb();

  try {
    ensureFullContentTable(db);
    ensureSeedRow(db);

    const row = db
      .prepare("SELECT content_json, updated_at, updated_by FROM site_content_full_v1 WHERE id = 1")
      .get() as { content_json: string; updated_at: string; updated_by: string } | undefined;

    if (!row) {
      upsertDefaultRow(db, "system@local");
      return {
        content: structuredClone(siteContent),
        updated_at: new Date().toISOString(),
        updated_by: "system@local"
      };
    }
    const content = parseContent(row.content_json);
    if (!content) {
      upsertDefaultRow(db, "system@local");
      return {
        content: structuredClone(siteContent),
        updated_at: new Date().toISOString(),
        updated_by: "system@local"
      };
    }

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
  if (isVercelRuntime()) {
    assertVercelBlobConfigured();
    try {
      return await writeBlobPayload(content, updatedBy);
    } catch (error) {
      console.error("updateFullSiteContent blob write failed:", error);
      throw new FullContentStorageError(
        "STORAGE_WRITE_FAILED",
        "Kon wijzigingen niet opslaan naar Vercel Blob."
      );
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
