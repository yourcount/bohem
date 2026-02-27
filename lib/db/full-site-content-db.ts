import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import { siteContent } from "@/lib/content";
import { getDbPath } from "@/lib/db/content-db";
import type { SiteContent } from "@/lib/types";

export type FullSiteContentRecord = {
  content: SiteContent;
  updated_at: string;
  updated_by: string;
};

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

export function readFullSiteContent(): FullSiteContentRecord | null {
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

export function updateFullSiteContent(content: SiteContent, updatedBy: string): FullSiteContentRecord | null {
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
