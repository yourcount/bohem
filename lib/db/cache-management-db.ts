import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import { getDbPath } from "@/lib/db/content-db";

export type CacheSettingsRow = {
  id: number;
  public_content_ttl_seconds: number;
  seo_settings_ttl_seconds: number;
  updated_at: string;
  updated_by: string;
};

export type CacheInvalidationRow = {
  id: number;
  scope: "sitewide" | "route";
  route_path: string | null;
  reason: string | null;
  triggered_by: string;
  created_at: string;
};

function openDb() {
  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  return new Database(dbPath);
}

export function ensureCacheManagementSchema() {
  const db = openDb();

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS cache_settings_v1 (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        public_content_ttl_seconds INTEGER NOT NULL DEFAULT 90,
        seo_settings_ttl_seconds INTEGER NOT NULL DEFAULT 120,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cache_invalidations_v1 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scope TEXT NOT NULL CHECK (scope IN ('sitewide', 'route')),
        route_path TEXT,
        reason TEXT,
        triggered_by TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_cache_invalidations_created ON cache_invalidations_v1(created_at DESC);
    `);

    const existing = db.prepare("SELECT id FROM cache_settings_v1 WHERE id = 1").get() as { id: number } | undefined;
    if (existing) return;

    db.prepare(
      `INSERT INTO cache_settings_v1 (
        id,
        public_content_ttl_seconds,
        seo_settings_ttl_seconds,
        updated_at,
        updated_by
      ) VALUES (1, 90, 120, CURRENT_TIMESTAMP, @updated_by)`
    ).run({ updated_by: "system@local" });
  } finally {
    db.close();
  }
}

export function readCacheSettings(): CacheSettingsRow | null {
  ensureCacheManagementSchema();
  const db = openDb();

  try {
    const row = db
      .prepare("SELECT * FROM cache_settings_v1 WHERE id = 1")
      .get() as CacheSettingsRow | undefined;

    return row ?? null;
  } finally {
    db.close();
  }
}

export function updateCacheSettingsPatch(
  patch: Partial<Pick<CacheSettingsRow, "public_content_ttl_seconds" | "seo_settings_ttl_seconds">>,
  updatedBy: string
): CacheSettingsRow | null {
  ensureCacheManagementSchema();
  const db = openDb();

  try {
    const keys = Object.keys(patch);
    if (keys.length > 0) {
      const setters = keys.map((key) => `${key} = @${key}`).join(", ");
      db.prepare(
        `UPDATE cache_settings_v1
         SET ${setters}, updated_at = CURRENT_TIMESTAMP, updated_by = @updated_by
         WHERE id = 1`
      ).run({ ...patch, updated_by: updatedBy });
    }

    const row = db
      .prepare("SELECT * FROM cache_settings_v1 WHERE id = 1")
      .get() as CacheSettingsRow | undefined;

    return row ?? null;
  } finally {
    db.close();
  }
}

export function createCacheInvalidationLog(input: {
  scope: "sitewide" | "route";
  routePath?: string | null;
  reason?: string | null;
  triggeredBy: string;
}) {
  ensureCacheManagementSchema();
  const db = openDb();

  try {
    db.prepare(
      `INSERT INTO cache_invalidations_v1 (
        scope, route_path, reason, triggered_by, created_at
      ) VALUES (
        @scope, @route_path, @reason, @triggered_by, CURRENT_TIMESTAMP
      )`
    ).run({
      scope: input.scope,
      route_path: input.routePath ?? null,
      reason: input.reason ?? null,
      triggered_by: input.triggeredBy
    });
  } finally {
    db.close();
  }
}

export function listRecentCacheInvalidations(limit = 30) {
  ensureCacheManagementSchema();
  const db = openDb();

  try {
    return db
      .prepare(
        `SELECT id, scope, route_path, reason, triggered_by, created_at
         FROM cache_invalidations_v1
         ORDER BY datetime(created_at) DESC
         LIMIT ?`
      )
      .all(limit) as CacheInvalidationRow[];
  } finally {
    db.close();
  }
}
