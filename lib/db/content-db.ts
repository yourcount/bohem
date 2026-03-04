import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

import { siteContent } from "@/lib/content";

function resolveDbPath() {
  if (process.env.VERCEL) {
    return "/tmp/bohem-content.db";
  }
  return join(process.cwd(), "data", "content.db");
}

const dbPath = resolveDbPath();

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
  if (process.env.VERCEL) {
    return true;
  }
  return existsSync(dbPath);
}

export function openContentDb() {
  mkdirSync(dirname(dbPath), { recursive: true });
  return new Database(dbPath);
}

function openContentDbReadWrite() {
  mkdirSync(dirname(dbPath), { recursive: true });
  return new Database(dbPath);
}

function ensurePublicContentSchema(db: Database.Database) {
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
}

function ensurePublicContentSeedRow(db: Database.Database) {
  const existing = db.prepare("SELECT id FROM public_content_v1 WHERE id = 1").get() as { id: number } | undefined;
  if (existing) return;

  const arthurBio = siteContent.about?.bios?.find((bio) => bio.name.toLowerCase().includes("arthur"))?.text ?? "";
  const bettinaBio = siteContent.about?.bios?.find((bio) => bio.name.toLowerCase().includes("bettina"))?.text ?? "";
  const cta = siteContent.hero?.ctas?.[0] ?? { label: "", href: "" };

  db.prepare(
    `INSERT INTO public_content_v1 (
      id, hero_title, hero_subtitle, about_text, arthur_bio, bettina_bio,
      booking_cta_label, booking_cta_url, contact_email, hero_image_url, updated_by, updated_at
    ) VALUES (
      1, @hero_title, @hero_subtitle, @about_text, @arthur_bio, @bettina_bio,
      @booking_cta_label, @booking_cta_url, @contact_email, @hero_image_url, @updated_by, CURRENT_TIMESTAMP
    )`
  ).run({
    hero_title: siteContent.hero?.headline ?? "",
    hero_subtitle: siteContent.hero?.subhead ?? "",
    about_text: siteContent.about?.intro ?? "",
    arthur_bio: arthurBio,
    bettina_bio: bettinaBio,
    booking_cta_label: cta.label,
    booking_cta_url: cta.href,
    contact_email: siteContent.contact?.email ?? "",
    hero_image_url: siteContent.hero?.image?.src ?? "",
    updated_by: "system:bootstrap"
  });
}

export function readPublicContent(): PublicContentRow | null {
  const db = openContentDb();
  try {
    ensurePublicContentSchema(db);
    ensurePublicContentSeedRow(db);

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
    ensurePublicContentSchema(db);
    ensurePublicContentSeedRow(db);

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
