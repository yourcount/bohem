import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import { siteContent } from "@/lib/content";
import { getDbPath } from "@/lib/db/content-db";

export type SeoSettingsRow = {
  id: number;
  global_title_template: string;
  global_meta_template: string;
  home_title: string;
  home_description: string;
  home_og_title: string;
  home_og_description: string;
  home_canonical: string;
  home_robots_index: number;
  home_robots_follow: number;
  home_json_ld_mode: "auto" | "custom";
  home_json_ld_custom: string | null;
  updated_at: string;
  updated_by: string;
};

export type SeoSettingsPatchDb = Partial<
  Pick<
    SeoSettingsRow,
    | "global_title_template"
    | "global_meta_template"
    | "home_title"
    | "home_description"
    | "home_og_title"
    | "home_og_description"
    | "home_canonical"
    | "home_robots_index"
    | "home_robots_follow"
    | "home_json_ld_mode"
    | "home_json_ld_custom"
  >
>;

function openDb() {
  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  return new Database(dbPath);
}

export function ensureSeoSettingsSchema() {
  const db = openDb();

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS seo_settings_v1 (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        global_title_template TEXT NOT NULL,
        global_meta_template TEXT NOT NULL,
        home_title TEXT NOT NULL,
        home_description TEXT NOT NULL,
        home_og_title TEXT NOT NULL,
        home_og_description TEXT NOT NULL,
        home_canonical TEXT NOT NULL,
        home_robots_index INTEGER NOT NULL DEFAULT 1,
        home_robots_follow INTEGER NOT NULL DEFAULT 1,
        home_json_ld_mode TEXT NOT NULL DEFAULT 'auto' CHECK (home_json_ld_mode IN ('auto','custom')),
        home_json_ld_custom TEXT,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT NOT NULL
      );
    `);

    const existing = db.prepare("SELECT id FROM seo_settings_v1 WHERE id = 1").get() as { id: number } | undefined;
    if (existing) return;

    db.prepare(
      `INSERT INTO seo_settings_v1 (
        id,
        global_title_template,
        global_meta_template,
        home_title,
        home_description,
        home_og_title,
        home_og_description,
        home_canonical,
        home_robots_index,
        home_robots_follow,
        home_json_ld_mode,
        home_json_ld_custom,
        updated_at,
        updated_by
      ) VALUES (
        1,
        @global_title_template,
        @global_meta_template,
        @home_title,
        @home_description,
        @home_og_title,
        @home_og_description,
        @home_canonical,
        @home_robots_index,
        @home_robots_follow,
        @home_json_ld_mode,
        @home_json_ld_custom,
        CURRENT_TIMESTAMP,
        @updated_by
      )`
    ).run({
      global_title_template: "%s",
      global_meta_template: "%s",
      home_title: siteContent.meta.title,
      home_description: siteContent.meta.description,
      home_og_title: siteContent.meta.ogTitle,
      home_og_description: siteContent.meta.ogDescription,
      home_canonical: siteContent.meta.canonical || "/",
      home_robots_index: 1,
      home_robots_follow: 1,
      home_json_ld_mode: "auto",
      home_json_ld_custom: null,
      updated_by: "system@local"
    });
  } finally {
    db.close();
  }
}

export function readSeoSettings(): SeoSettingsRow | null {
  ensureSeoSettingsSchema();
  const db = openDb();

  try {
    const row = db
      .prepare("SELECT * FROM seo_settings_v1 WHERE id = 1")
      .get() as SeoSettingsRow | undefined;

    return row ?? null;
  } finally {
    db.close();
  }
}

export function updateSeoSettingsPatch(patch: SeoSettingsPatchDb, updatedBy: string): SeoSettingsRow | null {
  ensureSeoSettingsSchema();
  const keys = Object.keys(patch);
  if (keys.length === 0) {
    return readSeoSettings();
  }

  const db = openDb();

  try {
    const setters = keys.map((key) => `${key} = @${key}`).join(", ");
    const statement = db.prepare(
      `UPDATE seo_settings_v1
       SET ${setters}, updated_at = CURRENT_TIMESTAMP, updated_by = @updated_by
       WHERE id = 1`
    );

    const payload = { ...patch, updated_by: updatedBy };
    statement.run(payload);

    const row = db
      .prepare("SELECT * FROM seo_settings_v1 WHERE id = 1")
      .get() as SeoSettingsRow | undefined;

    return row ?? null;
  } finally {
    db.close();
  }
}
