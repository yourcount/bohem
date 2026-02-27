import type { PublicContentRow } from "@/lib/db/content-db";
import { validateFullContent, type ContentFields } from "@/lib/content/content-contract";

export type PublicContentV1 = ContentFields & {
  updated_at: string;
};

export function validatePublicContent(row: PublicContentRow | null): { ok: true; data: PublicContentV1 } | { ok: false; issues: string[] } {
  if (!row) return { ok: false, issues: ["CONTENT_NOT_FOUND"] };

  const fullValidation = validateFullContent({
    hero_title: row.hero_title,
    hero_subtitle: row.hero_subtitle,
    about_text: row.about_text,
    arthur_bio: row.arthur_bio,
    bettina_bio: row.bettina_bio,
    booking_cta_label: row.booking_cta_label,
    booking_cta_url: row.booking_cta_url,
    contact_email: row.contact_email,
    hero_image_url: row.hero_image_url
  });

  if (!fullValidation.ok) {
    return { ok: false, issues: Object.keys(fullValidation.errors) };
  }

  return {
    ok: true,
    data: {
      hero_title: row.hero_title,
      hero_subtitle: row.hero_subtitle,
      about_text: row.about_text,
      arthur_bio: row.arthur_bio,
      bettina_bio: row.bettina_bio,
      booking_cta_label: row.booking_cta_label,
      booking_cta_url: row.booking_cta_url,
      contact_email: row.contact_email,
      hero_image_url: row.hero_image_url,
      updated_at: row.updated_at
    }
  };
}
