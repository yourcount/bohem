import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { readRuntimeCacheStatus } from "@/lib/cache/runtime-cache";
import { listRecentCacheInvalidations, readCacheSettings } from "@/lib/db/cache-management-db";
import { readFullSiteContent } from "@/lib/db/full-site-content-db";
import { listFeatureFlags, readTechnicalSettings } from "@/lib/db/system-controls-db";
import { getSiteUrl } from "@/lib/seo";

const NON_CONTENT_KEYS = new Set(["href", "variant", "id", "type", "autoComplete", "required", "width", "height", "focusX", "focusY"]);

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasSectionContent(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some((item) => hasSectionContent(item));

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([entryKey, entryValue]) => {
      if (NON_CONTENT_KEYS.has(entryKey)) return false;
      return hasSectionContent(entryValue);
    });
  }

  return false;
}

function getMailgunStatus() {
  const apiKey = process.env.MAILGUN_API_KEY?.trim() ?? "";
  const domain = process.env.MAILGUN_DOMAIN?.trim() ?? "";
  const fromEmail = process.env.MAILGUN_FROM_EMAIL?.trim() ?? "";
  const toEmail = process.env.MAILGUN_TO_EMAIL?.trim() ?? "";
  const fromName = process.env.MAILGUN_FROM_NAME?.trim() ?? "";
  const region = (process.env.MAILGUN_REGION?.trim().toLowerCase() ?? "us") === "eu" ? "EU" : "US";

  return {
    configured: apiKey.length > 0 && domain.length > 0 && fromEmail.length > 0 && toEmail.length > 0,
    hasApiKey: apiKey.length > 0,
    hasDomain: domain.length > 0,
    hasFromEmail: fromEmail.length > 0,
    hasToEmail: toEmail.length > 0,
    hasFromName: fromName.length > 0,
    region
  };
}

function getTurnstileStatus() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";

  return {
    enabled: siteKey.length > 0 && secretKey.length > 0,
    hasSiteKey: siteKey.length > 0,
    hasSecretKey: secretKey.length > 0
  };
}

export async function GET() {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  try {
    const [contentRecord, technicalSettings] = await Promise.all([readFullSiteContent(), Promise.resolve(readTechnicalSettings())]);
    const cacheSettings = readCacheSettings();
    const runtime = readRuntimeCacheStatus();
    const flags = Object.fromEntries(listFeatureFlags().map((flag) => [flag.key, flag.enabled === 1]));
    const invalidations = listRecentCacheInvalidations(6);

    if (!contentRecord || !technicalSettings || !cacheSettings) {
      return NextResponse.json({ error: "Overzichtsdata is niet volledig beschikbaar.", code: "DASHBOARD_DATA_INCOMPLETE" }, { status: 500 });
    }

    const siteContent = contentRecord.content;
    const hasAboutSection = hasSectionContent(siteContent.about);
    const hasDiscographySection = flags.enable_discography_section && hasSectionContent(siteContent.discography);
    const hasMusicExperienceSection = hasSectionContent(siteContent.musicExperience);
    const hasShows = (siteContent.bookings.upcomingShows?.length ?? 0) > 0;
    const hasKampvuurSection = flags.enable_kampvuur_section && hasSectionContent(siteContent.kampvuur);
    const hasBookingsSection = hasSectionContent(siteContent.bookings);
    const hasContactSection = hasSectionContent(siteContent.contact);
    const hasPressSection = hasBookingsSection && hasSectionContent(siteContent.bookings.press ?? null);
    const stickyListenActive =
      Boolean(flags.enable_sticky_listen_bar) &&
      hasDiscographySection &&
      hasSectionContent(siteContent.discography.featuredSingle);
    const mobileStickyCtaActive =
      Boolean(flags.enable_mobile_sticky_cta) &&
      hasBookingsSection &&
      hasText(siteContent.bookings.cta.label) &&
      hasText(siteContent.bookings.cta.href);

    const mailgun = getMailgunStatus();
    const turnstile = getTurnstileStatus();
    const analyticsEnabled = true;
    const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
    const storageLabel = process.env.VERCEL ? "Vercel Blob" : "Lokale database";

    const frontendImpact = [
      {
        key: "about",
        label: "Over Bohèm",
        state: hasAboutSection ? "visible" : "hidden",
        reason: hasAboutSection ? "Sectie bevat inhoud." : "Sectie is leeg."
      },
      {
        key: "discography",
        label: "Discografie",
        state: hasDiscographySection ? "visible" : "hidden",
        reason: hasDiscographySection
          ? flags.enable_discography_section
            ? "Feature flag staat aan en de sectie bevat inhoud."
            : "Sectie bevat inhoud."
          : flags.enable_discography_section
            ? "Sectie is leeg."
            : "Feature flag staat uit."
      },
      {
        key: "music",
        label: "Muziekbeleving",
        state: hasMusicExperienceSection ? "visible" : "hidden",
        reason: hasMusicExperienceSection ? "Sectie bevat inhoud." : "Sectie is leeg."
      },
      {
        key: "shows",
        label: "Volgende shows",
        state: hasShows ? "visible" : "hidden",
        reason: hasShows ? `${siteContent.bookings.upcomingShows?.length ?? 0} show(s) gepland.` : "Er zijn geen shows ingevuld."
      },
      {
        key: "kampvuur",
        label: "Kampvuurklanken",
        state: hasKampvuurSection ? "visible" : "hidden",
        reason: hasKampvuurSection
          ? "Feature flag staat aan en de sectie bevat inhoud."
          : flags.enable_kampvuur_section
            ? "Sectie is leeg."
            : "Feature flag staat uit."
      },
      {
        key: "bookings",
        label: "Live & boekingen",
        state: hasBookingsSection ? "visible" : "hidden",
        reason: hasBookingsSection ? "Sectie bevat inhoud." : "Sectie is leeg."
      },
      {
        key: "press",
        label: "Persblok",
        state: hasPressSection ? "visible" : "hidden",
        reason: hasPressSection ? "Persinformatie bevat inhoud." : "Persblok is leeg of niet actief."
      },
      {
        key: "contact",
        label: "Contact",
        state: hasContactSection ? "visible" : "hidden",
        reason: hasContactSection ? "Contactsectie bevat inhoud." : "Contactsectie is leeg."
      },
      {
        key: "sticky_listen",
        label: "Sticky luisterbalk",
        state: stickyListenActive ? "visible" : "hidden",
        reason: stickyListenActive
          ? "Feature flag staat aan en de uitgelichte single is gevuld."
          : flags.enable_sticky_listen_bar
            ? "Feature flag staat aan, maar de uitgelichte single mist zichtbare inhoud."
            : "Feature flag staat uit."
      },
      {
        key: "mobile_cta",
        label: "Mobiele sticky CTA",
        state: mobileStickyCtaActive ? "visible" : "hidden",
        reason: mobileStickyCtaActive
          ? "Feature flag staat aan en de boekingsknop is compleet."
          : flags.enable_mobile_sticky_cta
            ? "Feature flag staat aan, maar label of link ontbreekt."
            : "Feature flag staat uit."
      }
    ];

    const warnings: string[] = [];
    if (!mailgun.configured) warnings.push("Mailgun is niet volledig geconfigureerd. Het contactformulier kan dan geen mails versturen.");
    if (!turnstile.enabled) warnings.push("Turnstile staat uit. Het contactformulier heeft dan geen actieve botcheck.");
    if (!blobConfigured && process.env.VERCEL) warnings.push("Vercel Blob is niet geconfigureerd. Content-opslag is dan niet persistent.");
    if (!hasShows) warnings.push("Er zijn nu geen volgende shows ingevuld. De shows-sectie blijft verborgen.");

    const showsWithoutCta = (siteContent.bookings.upcomingShows ?? []).filter(
      (show) => !hasText(show.ticketsHref) && !hasText(show.infoHref)
    ).length;
    if (showsWithoutCta > 0) warnings.push(`${showsWithoutCta} show(s) missen zowel een kaartjeslink als extra infolink.`);
    if (!hasText(siteContent.discography.featuredSingle.href)) warnings.push("De uitgelichte single mist een geldige luisterlink.");
    if (!hasText(siteContent.footer.instagramHref) && !hasText(siteContent.footer.youtubeHref)) {
      warnings.push("Footer-socials zijn leeg. YouTube en Instagram worden dan niet getoond.");
    }
    if (hasPressSection && !hasText(siteContent.bookings.press?.kitHref)) warnings.push("Het persblok bevat geen technische rider of perskit-link.");

    return NextResponse.json(
      {
        ok: true,
        contentStatus: {
          updatedAt: contentRecord.updated_at,
          updatedBy: contentRecord.updated_by,
          storage: storageLabel,
          cacheAutoInvalidateOnUpdate: technicalSettings.cache_auto_invalidate_on_update === 1
        },
        frontendImpact,
        contactHealth: {
          status: mailgun.configured && turnstile.enabled ? "ok" : "attention",
          mailgun,
          turnstile,
          inbox: siteContent.contact.email
        },
        configurationSummary: {
          siteUrl: getSiteUrl(),
          runtime: process.env.VERCEL ? "vercel" : "local",
          storage: storageLabel,
          blobConfigured,
          analyticsEnabled,
          authSecretSet: Boolean(process.env.AUTH_SECRET?.trim()),
          region:
            process.env.VERCEL_REGION?.trim() ??
            process.env.FLY_REGION?.trim() ??
            process.env.AWS_REGION?.trim() ??
            "onbekend"
        },
        cacheSummary: {
          runtimeEntries: runtime.entries,
          publicContentTtlSeconds: cacheSettings.public_content_ttl_seconds,
          seoSettingsTtlSeconds: cacheSettings.seo_settings_ttl_seconds,
          recentInvalidations: invalidations
        },
        warnings
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Dashboard-overzicht laden mislukt.", code: "DASHBOARD_OVERVIEW_FAILED" }, { status: 500 });
  }
}
