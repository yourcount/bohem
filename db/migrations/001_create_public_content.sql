CREATE TABLE IF NOT EXISTS public_content_v1 (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT NOT NULL,
  about_text TEXT NOT NULL,
  arthur_bio TEXT NOT NULL,
  bettina_bio TEXT NOT NULL,
  booking_cta_label TEXT NOT NULL,
  booking_cta_url TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  hero_image_url TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT 'system',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
