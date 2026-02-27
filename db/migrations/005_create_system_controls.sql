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
