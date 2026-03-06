import { siteContent } from "@/lib/content";
import { sanitizeSiteContent } from "@/lib/content/sanitize-site-content";
import { validatePublicContent } from "@/lib/content/public-content";
import { getCachePolicySafe } from "@/lib/cache/policy";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache/tags";
import { readRuntimeCache, writeRuntimeCache } from "@/lib/cache/runtime-cache";
import { contentDbExists, readPublicContent } from "@/lib/db/content-db";
import { readFullSiteContent } from "@/lib/db/full-site-content-db";
import type { SiteContent } from "@/lib/types";
import { unstable_cache } from "next/cache";

function cloneBaseContent(): SiteContent {
  return JSON.parse(JSON.stringify(siteContent)) as SiteContent;
}

function shouldUseRuntimeCache() {
  return !process.env.VERCEL;
}

function applyCmsOverrides(base: SiteContent) {
  if (!contentDbExists()) return base;

  const row = readPublicContent();
  const parsed = validatePublicContent(row);
  if (!parsed.ok) return base;

  const cms = parsed.data;

  base.hero.headline = cms.hero_title;
  base.hero.subhead = cms.hero_subtitle;
  base.hero.image.src = cms.hero_image_url;

  if (base.hero.ctas[0]) {
    base.hero.ctas[0].label = cms.booking_cta_label;
    base.hero.ctas[0].href = cms.booking_cta_url;
  }

  base.about.intro = cms.about_text;

  const arthurBio = base.about.bios.find((bio) => bio.name.toLowerCase().includes("arthur"));
  if (arthurBio) {
    arthurBio.text = cms.arthur_bio;
  }

  const bettinaBio = base.about.bios.find((bio) => bio.name.toLowerCase().includes("bettina"));
  if (bettinaBio) {
    bettinaBio.text = cms.bettina_bio;
  }

  base.bookings.cta.label = cms.booking_cta_label;
  base.bookings.cta.href = cms.booking_cta_url;

  base.contact.email = cms.contact_email;
  if (base.bookings.press) {
    base.bookings.press.contactEmail = cms.contact_email;
  }

  return base;
}

export async function getLiveSiteContent(): Promise<SiteContent> {
  if (process.env.VERCEL) {
    return getLiveSiteContentCached();
  }

  if (shouldUseRuntimeCache()) {
    const cached = readRuntimeCache<SiteContent>("site_content");
    if (cached) {
      return cached;
    }
  }

  const policy = getCachePolicySafe();

  try {
    const fullRecord = await readFullSiteContent();
    if (fullRecord) {
      const sanitized = sanitizeSiteContent(fullRecord.content);
      if (shouldUseRuntimeCache()) {
        writeRuntimeCache("site_content", sanitized, policy.publicContentTtlSeconds);
      }
      return sanitized;
    }
  } catch {
    // fall through
  }

  const base = cloneBaseContent();
  try {
    const resolved = sanitizeSiteContent(applyCmsOverrides(base));
    if (shouldUseRuntimeCache()) {
      writeRuntimeCache("site_content", resolved, policy.publicContentTtlSeconds);
    }
    return resolved;
  } catch {
    if (shouldUseRuntimeCache()) {
      writeRuntimeCache("site_content", base, policy.publicContentTtlSeconds);
    }
    return base;
  }
}

const getLiveSiteContentCached = unstable_cache(
  async () => {
    const base = cloneBaseContent();

    try {
      const fullRecord = await readFullSiteContent();
      if (fullRecord) {
        return sanitizeSiteContent(fullRecord.content);
      }
    } catch {
      // fall through to legacy/local fallback
    }

    try {
      return sanitizeSiteContent(applyCmsOverrides(base));
    } catch {
      return base;
    }
  },
  ["site-content-v1"],
  {
    tags: [CACHE_TAGS.siteContent],
    revalidate: CACHE_REVALIDATE_SECONDS.siteContent
  }
);
