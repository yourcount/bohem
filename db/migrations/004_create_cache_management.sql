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
