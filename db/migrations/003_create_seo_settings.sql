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
  home_json_ld_mode TEXT NOT NULL DEFAULT 'auto' CHECK (home_json_ld_mode IN ('auto', 'custom')),
  home_json_ld_custom TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT NOT NULL
);
