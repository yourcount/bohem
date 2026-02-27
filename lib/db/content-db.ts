import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

const dbPath = join(process.cwd(), "data", "content.db");

export type PublicContentRow = {
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  arthur_bio: string;
  bettina_bio: string;
  booking_cta_label: string;
  booking_cta_url: string;
  contact_email: string;
  hero_image_url: string;
  updated_by: string;
  updated_at: string;
};

export function getDbPath() {
  return dbPath;
}

export function contentDbExists() {
  return existsSync(dbPath);
}

export function openContentDb() {
  mkdirSync(dirname(dbPath), { recursive: true });
  return new Database(dbPath, { readonly: true });
}

function openContentDbReadWrite() {
  mkdirSync(dirname(dbPath), { recursive: true });
  return new Database(dbPath);
}

export function readPublicContent(): PublicContentRow | null {
  const db = openContentDb();
  try {
    const row = db
      .prepare(
        `SELECT
           hero_title, hero_subtitle, about_text, arthur_bio, bettina_bio,
           booking_cta_label, booking_cta_url, contact_email, hero_image_url, updated_by, updated_at
         FROM public_content_v1
         WHERE id = 1`
      )
      .get() as PublicContentRow | undefined;
    return row ?? null;
  } finally {
    db.close();
  }
}

export function updatePublicContentPatch(
  patch: Partial<Omit<PublicContentRow, "updated_at" | "updated_by">>,
  updatedBy: string
): PublicContentRow | null {
  const keys = Object.keys(patch);
  if (keys.length === 0) return readPublicContent();

  const db = openContentDbReadWrite();
  try {
    const current = db.prepare("SELECT id FROM public_content_v1 WHERE id = 1").get() as { id: number } | undefined;
    if (!current) return null;

    const setClauses = keys.map((key) => `${key} = @${key}`);
    setClauses.push("updated_by = @updated_by");
    setClauses.push("updated_at = CURRENT_TIMESTAMP");

    db.prepare(`UPDATE public_content_v1 SET ${setClauses.join(", ")} WHERE id = 1`).run({
      ...patch,
      updated_by: updatedBy
    });

    const row = db
      .prepare(
        `SELECT
           hero_title, hero_subtitle, about_text, arthur_bio, bettina_bio,
           booking_cta_label, booking_cta_url, contact_email, hero_image_url, updated_by, updated_at
         FROM public_content_v1
         WHERE id = 1`
      )
      .get() as PublicContentRow | undefined;

    return row ?? null;
  } finally {
    db.close();
  }
}
