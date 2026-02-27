import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import { getDbPath } from "@/lib/db/content-db";

export type FeatureFlagKey =
  | "enable_kampvuur_section"
  | "enable_sticky_listen_bar"
  | "enable_mobile_sticky_cta"
  | "enable_discography_section";

export type FeatureFlagRow = {
  key: FeatureFlagKey;
  enabled: number;
  description: string;
  updated_at: string;
  updated_by: string;
};

export type TechnicalSettingsRow = {
  id: number;
  jobs_enabled: number;
  jobs_poll_interval_seconds: number;
  cache_auto_invalidate_on_update: number;
  updated_at: string;
  updated_by: string;
};

const FEATURE_FLAG_SEEDS: Array<{ key: FeatureFlagKey; description: string; enabled: number }> = [
  { key: "enable_kampvuur_section", description: "Toon of verberg de sectie Kampvuurklanken op de site.", enabled: 1 },
  { key: "enable_sticky_listen_bar", description: "Toon de sticky listen bar op desktop.", enabled: 1 },
  { key: "enable_mobile_sticky_cta", description: "Toon de mobiele sticky boekingsknop.", enabled: 1 },
  { key: "enable_discography_section", description: "Toon of verberg de discografie-sectie.", enabled: 1 }
];

function openDb() {
  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  return new Database(dbPath);
}

export function ensureSystemControlsSchema() {
  const db = openDb();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS feature_flags_v1 (
        key TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL DEFAULT 1,
        description TEXT NOT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS technical_settings_v1 (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        jobs_enabled INTEGER NOT NULL DEFAULT 1,
        jobs_poll_interval_seconds INTEGER NOT NULL DEFAULT 60,
        cache_auto_invalidate_on_update INTEGER NOT NULL DEFAULT 1,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT NOT NULL
      );
    `);

    const insertFlag = db.prepare(
      `INSERT INTO feature_flags_v1 (key, enabled, description, updated_at, updated_by)
       VALUES (@key, @enabled, @description, CURRENT_TIMESTAMP, @updated_by)
       ON CONFLICT(key) DO NOTHING`
    );

    for (const flag of FEATURE_FLAG_SEEDS) {
      insertFlag.run({ ...flag, updated_by: "system@local" });
    }

    const settings = db.prepare("SELECT id FROM technical_settings_v1 WHERE id = 1").get() as { id: number } | undefined;
    if (!settings) {
      db.prepare(
        `INSERT INTO technical_settings_v1 (
          id, jobs_enabled, jobs_poll_interval_seconds, cache_auto_invalidate_on_update, updated_at, updated_by
        ) VALUES (1, 1, 60, 1, CURRENT_TIMESTAMP, @updated_by)`
      ).run({ updated_by: "system@local" });
    }
  } finally {
    db.close();
  }
}

export function listFeatureFlags() {
  ensureSystemControlsSchema();
  const db = openDb();
  try {
    return db
      .prepare("SELECT key, enabled, description, updated_at, updated_by FROM feature_flags_v1 ORDER BY key ASC")
      .all() as FeatureFlagRow[];
  } finally {
    db.close();
  }
}

export function updateFeatureFlagsPatch(patch: Partial<Record<FeatureFlagKey, boolean>>, updatedBy: string) {
  ensureSystemControlsSchema();
  const db = openDb();
  try {
    const update = db.prepare(
      `UPDATE feature_flags_v1
       SET enabled = @enabled, updated_at = CURRENT_TIMESTAMP, updated_by = @updated_by
       WHERE key = @key`
    );

    const tx = db.transaction((items: Array<{ key: FeatureFlagKey; enabled: boolean }>) => {
      for (const item of items) {
        update.run({ key: item.key, enabled: item.enabled ? 1 : 0, updated_by: updatedBy });
      }
    });

    tx(
      Object.entries(patch)
        .filter(([, value]) => typeof value === "boolean")
        .map(([key, value]) => ({ key: key as FeatureFlagKey, enabled: Boolean(value) }))
    );

    return db
      .prepare("SELECT key, enabled, description, updated_at, updated_by FROM feature_flags_v1 ORDER BY key ASC")
      .all() as FeatureFlagRow[];
  } finally {
    db.close();
  }
}

export function readTechnicalSettings() {
  ensureSystemControlsSchema();
  const db = openDb();
  try {
    const row = db
      .prepare("SELECT * FROM technical_settings_v1 WHERE id = 1")
      .get() as TechnicalSettingsRow | undefined;
    return row ?? null;
  } finally {
    db.close();
  }
}

export function updateTechnicalSettingsPatch(
  patch: Partial<Pick<TechnicalSettingsRow, "jobs_enabled" | "jobs_poll_interval_seconds" | "cache_auto_invalidate_on_update">>,
  updatedBy: string
) {
  ensureSystemControlsSchema();
  const db = openDb();
  try {
    const keys = Object.keys(patch);
    if (keys.length > 0) {
      const setters = keys.map((key) => `${key} = @${key}`).join(", ");
      db.prepare(
        `UPDATE technical_settings_v1
         SET ${setters}, updated_at = CURRENT_TIMESTAMP, updated_by = @updated_by
         WHERE id = 1`
      ).run({ ...patch, updated_by: updatedBy });
    }

    const row = db
      .prepare("SELECT * FROM technical_settings_v1 WHERE id = 1")
      .get() as TechnicalSettingsRow | undefined;

    return row ?? null;
  } finally {
    db.close();
  }
}
