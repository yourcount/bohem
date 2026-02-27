import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

const dbPath = join(process.cwd(), "data", "content.db");
mkdirSync(dirname(dbPath), { recursive: true });

const contentPath = join(process.cwd(), "data", "site-content.json");
const siteContent = JSON.parse(readFileSync(contentPath, "utf8"));

const arthurBio = siteContent.about?.bios?.find((bio) => bio.name === "Arthur")?.text ?? "";
const bettinaBio = siteContent.about?.bios?.find((bio) => bio.name === "Bettina")?.text ?? "";

const cta = siteContent.hero?.ctas?.[0] ?? { label: "", href: "" };

const db = new Database(dbPath);
db.exec(`
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
`);

const hasUpdatedByRow = db
  .prepare("SELECT COUNT(*) AS count FROM pragma_table_info('public_content_v1') WHERE name = 'updated_by'")
  .get();
const hasUpdatedBy = Number(hasUpdatedByRow.count) > 0;
if (!hasUpdatedBy) {
  db.exec("ALTER TABLE public_content_v1 ADD COLUMN updated_by TEXT NOT NULL DEFAULT 'system';");
}

const upsert = db.prepare(`
INSERT INTO public_content_v1 (
  id, hero_title, hero_subtitle, about_text, arthur_bio, bettina_bio,
  booking_cta_label, booking_cta_url, contact_email, hero_image_url, updated_by, updated_at
) VALUES (
  1, @hero_title, @hero_subtitle, @about_text, @arthur_bio, @bettina_bio,
  @booking_cta_label, @booking_cta_url, @contact_email, @hero_image_url, @updated_by, CURRENT_TIMESTAMP
)
ON CONFLICT(id) DO UPDATE SET
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  about_text = excluded.about_text,
  arthur_bio = excluded.arthur_bio,
  bettina_bio = excluded.bettina_bio,
  booking_cta_label = excluded.booking_cta_label,
  booking_cta_url = excluded.booking_cta_url,
  contact_email = excluded.contact_email,
  hero_image_url = excluded.hero_image_url,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP
`);

upsert.run({
  hero_title: siteContent.hero?.headline ?? "",
  hero_subtitle: siteContent.hero?.subhead ?? "",
  about_text: siteContent.about?.intro ?? "",
  arthur_bio: arthurBio,
  bettina_bio: bettinaBio,
  booking_cta_label: cta.label,
  booking_cta_url: cta.href,
  contact_email: siteContent.contact?.email ?? "",
  hero_image_url: siteContent.hero?.image?.src ?? "",
  updated_by: "system:seed"
});

db.close();
console.log(`Seeded public content in ${dbPath}`);
