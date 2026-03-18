"use client";

import { useEffect, useMemo, useState } from "react";

import { StickyStatusBar, formatFieldErrors, useUnsavedChangesGuard, type StatusTone } from "@/components/super-admin/admin-ui";
import type { LandingExtraSection, LandingFaqItem, LandingHighlightItem, LandingPageContent, LandingSocialProofItem } from "@/lib/types";

type LandingPageKey = "musicDuo" | "theaterConcert" | "kampvuur" | "huiskamerconcert" | "press";

type LandingPageDraft = LandingPageContent;

type LandingPagesDraft = Record<LandingPageKey, LandingPageDraft>;

type LandingPagesApiSuccess = {
  ok: true;
  landingPages: LandingPagesDraft;
  updated_at: string;
  updated_by: string;
};

type LandingPagesApiError = {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

const LOCAL_SEO_PAGE_KEYS: LandingPageKey[] = ["musicDuo", "theaterConcert", "huiskamerconcert"];

const PAGE_META: Array<{
  key: LandingPageKey;
  title: string;
  description: string;
}> = [
  {
    key: "musicDuo",
    title: "Muziekduo boeken",
    description: "Brede boekingspagina voor Bohèm als live muziekduo."
  },
  {
    key: "theaterConcert",
    title: "Theaterconcert boeken",
    description: "Pagina voor theaters, culturele programmeurs en luisterpubliek."
  },
  {
    key: "kampvuur",
    title: "Kampvuurklanken",
    description: "Pagina voor teams, management en organisaties."
  },
  {
    key: "huiskamerconcert",
    title: "Huiskamerconcert boeken",
    description: "Pagina voor intieme, kleinschalige live settings."
  },
  {
    key: "press",
    title: "Pers & media",
    description: "Korte perspagina met boilerplate, feiten en contact."
  }
];

function createEmptyFaqItem(): LandingFaqItem {
  return { question: "", answer: "" };
}

function createEmptyHighlightItem(): LandingHighlightItem {
  return { title: "", body: "" };
}

function createEmptySocialProofItem(): LandingSocialProofItem {
  return { quote: "", source: "", context: "" };
}

function createEmptyExtraSection(): LandingExtraSection {
  return { title: "", body: "" };
}

function normalizeTextList(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return next.length > 0 ? next : fallback;
}

function normalizeFaqItems(value: unknown, fallback: LandingFaqItem[] = [createEmptyFaqItem()]) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .map((item) => ({
      question: typeof item === "object" && item !== null && typeof (item as { question?: unknown }).question === "string"
        ? (item as { question: string }).question.trim()
        : "",
      answer: typeof item === "object" && item !== null && typeof (item as { answer?: unknown }).answer === "string"
        ? (item as { answer: string }).answer.trim()
        : ""
    }))
    .filter((item) => item.question.length > 0 || item.answer.length > 0);
  return next.length > 0 ? next : fallback;
}

function normalizeHighlightItems(value: unknown, fallback: LandingHighlightItem[] = [createEmptyHighlightItem()]) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .map((item) =>
      typeof item === "string"
        ? { title: "", body: item.trim() }
        : {
            title: typeof item === "object" && item !== null && typeof (item as { title?: unknown }).title === "string"
              ? (item as { title: string }).title.trim()
              : "",
            body: typeof item === "object" && item !== null && typeof (item as { body?: unknown }).body === "string"
              ? (item as { body: string }).body.trim()
              : ""
          }
    )
    .filter((item) => item.title.length > 0 || item.body.length > 0);
  return next.length > 0 ? next : fallback;
}

function normalizeExtraSections(value: unknown, fallback: LandingExtraSection[] = [createEmptyExtraSection()]) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .map((item) => ({
      title: typeof item === "object" && item !== null && typeof (item as { title?: unknown }).title === "string"
        ? (item as { title: string }).title.trim()
        : "",
      body: typeof item === "object" && item !== null && typeof (item as { body?: unknown }).body === "string"
        ? (item as { body: string }).body.trim()
        : ""
    }))
    .filter((item) => item.title.length > 0 || item.body.length > 0);
  return next.length > 0 ? next : fallback;
}

function normalizeSocialProofItems(value: unknown, fallback: LandingSocialProofItem[] = [createEmptySocialProofItem()]) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .map((item) => ({
      quote:
        typeof item === "object" && item !== null && typeof (item as { quote?: unknown }).quote === "string"
          ? (item as { quote: string }).quote.trim()
          : "",
      source:
        typeof item === "object" && item !== null && typeof (item as { source?: unknown }).source === "string"
          ? (item as { source: string }).source.trim()
          : "",
      context:
        typeof item === "object" && item !== null && typeof (item as { context?: unknown }).context === "string"
          ? (item as { context: string }).context.trim()
          : ""
    }))
    .filter((item) => item.quote.length > 0 || item.source.length > 0 || item.context.length > 0);
  return next.length > 0 ? next : fallback;
}

function normalizeLandingPage(value: unknown): LandingPageDraft {
  const current = (value && typeof value === "object" ? (value as Record<string, unknown>) : {}) as Record<string, unknown>;
  const cta = current.cta && typeof current.cta === "object" ? (current.cta as Record<string, unknown>) : undefined;
  const image = current.image && typeof current.image === "object" ? (current.image as Record<string, unknown>) : undefined;

  return {
    heroLabel: typeof current.heroLabel === "string" ? current.heroLabel : "",
    audienceLabel: typeof current.audienceLabel === "string" ? current.audienceLabel : "",
    title: typeof current.title === "string" ? current.title : "",
    intro: typeof current.intro === "string" ? current.intro : "",
    seoTitle: typeof current.seoTitle === "string" ? current.seoTitle : "",
    seoDescription: typeof current.seoDescription === "string" ? current.seoDescription : "",
    ogTitle: typeof current.ogTitle === "string" ? current.ogTitle : "",
    ogDescription: typeof current.ogDescription === "string" ? current.ogDescription : "",
    cta: cta
      ? {
          label: typeof cta.label === "string" ? cta.label : "",
          href: typeof cta.href === "string" ? cta.href : "",
          variant: cta.variant === "primary" || cta.variant === "secondary" ? cta.variant : "primary"
        }
      : { label: "", href: "", variant: "primary" },
    image: image
      ? {
          src: typeof image.src === "string" ? image.src : "",
          alt: typeof image.alt === "string" ? image.alt : "",
          width: typeof image.width === "number" ? image.width : 1536,
          height: typeof image.height === "number" ? image.height : 864,
          focusX: typeof image.focusX === "number" ? image.focusX : 50,
          focusY: typeof image.focusY === "number" ? image.focusY : 50
        }
      : {
          src: "",
          alt: "",
          width: 1536,
          height: 864,
          focusX: 50,
          focusY: 50
        },
    positioningTitle: typeof current.positioningTitle === "string" ? current.positioningTitle : "",
    positioningBody: typeof current.positioningBody === "string" ? current.positioningBody : "",
    fitTitle: typeof current.fitTitle === "string" ? current.fitTitle : "",
    fitItems: normalizeTextList(current.fitItems, [""]),
    practicalInfoItems: normalizeTextList(current.practicalInfoItems, [""]),
    highlights: normalizeHighlightItems(current.highlights),
    socialProofItems: normalizeSocialProofItems(current.socialProofItems),
    extraSections: normalizeExtraSections(current.extraSections),
    faqTitle: typeof current.faqTitle === "string" ? current.faqTitle : "",
    faqItems: normalizeFaqItems(current.faqItems),
    ctaContextTitle: typeof current.ctaContextTitle === "string" ? current.ctaContextTitle : "",
    ctaContextBody: typeof current.ctaContextBody === "string" ? current.ctaContextBody : "",
    localAreaTitle: typeof current.localAreaTitle === "string" ? current.localAreaTitle : "",
    localAreaIntro: typeof current.localAreaIntro === "string" ? current.localAreaIntro : "",
    priorityCities: normalizeTextList(current.priorityCities, [""]),
    localProofTitle: typeof current.localProofTitle === "string" ? current.localProofTitle : "",
    localProofItems: normalizeTextList(current.localProofItems, [""]),
    localFaqTitle: typeof current.localFaqTitle === "string" ? current.localFaqTitle : "",
    localFaqItems: normalizeFaqItems(current.localFaqItems),
    localLinkLabel: typeof current.localLinkLabel === "string" ? current.localLinkLabel : "",
    localLinkHref: typeof current.localLinkHref === "string" ? current.localLinkHref : "",
    proofTitle: typeof current.proofTitle === "string" ? current.proofTitle : ""
  };
}

function normalizeLandingPages(value: unknown): LandingPagesDraft {
  const current = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    musicDuo: normalizeLandingPage(current.musicDuo),
    theaterConcert: normalizeLandingPage(current.theaterConcert),
    kampvuur: normalizeLandingPage(current.kampvuur),
    huiskamerconcert: normalizeLandingPage(current.huiskamerconcert),
    press: normalizeLandingPage(current.press)
  };
}

function pageFieldClass(baseClass = "") {
  return `mt-2 w-full rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)] ${baseClass}`.trim();
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function joinLines(value?: string[]) {
  return (value ?? []).join("\n");
}

function PageSection({
  page,
  title,
  description,
  value,
  onChange
}: {
  page: LandingPageKey;
  title: string;
  description: string;
  value: LandingPageDraft;
  onChange: (next: LandingPageDraft) => void;
}) {
  const update = <K extends keyof LandingPageDraft>(key: K, nextValue: LandingPageDraft[K]) => {
    onChange({ ...value, [key]: nextValue });
  };

  const updateCta = (key: keyof NonNullable<LandingPageDraft["cta"]>, nextValue: string) => {
    update("cta", {
      ...(value.cta ?? { label: "", href: "", variant: "primary" }),
      [key]: nextValue
    });
  };

  const updateList = (key: "fitItems" | "practicalInfoItems" | "priorityCities" | "localProofItems", nextValue: string) => {
    update(key, splitLines(nextValue));
  };

  const updateImage = (key: keyof NonNullable<LandingPageDraft["image"]>, nextValue: string | number) => {
    update("image", {
      src: value.image?.src ?? "",
      alt: value.image?.alt ?? "",
      width: value.image?.width ?? 1536,
      height: value.image?.height ?? 864,
      focusX: value.image?.focusX ?? 50,
      focusY: value.image?.focusY ?? 50,
      [key]: nextValue
    });
  };

  const updateHighlight = (index: number, key: keyof LandingHighlightItem, nextValue: string) => {
    const next = [...(value.highlights ?? [])];
    next[index] = { ...(next[index] ?? createEmptyHighlightItem()), [key]: nextValue };
    update("highlights", next);
  };

  const updateSocialProof = (index: number, key: keyof LandingSocialProofItem, nextValue: string) => {
    const next = [...(value.socialProofItems ?? [])];
    next[index] = { ...(next[index] ?? createEmptySocialProofItem()), [key]: nextValue };
    update("socialProofItems", next);
  };

  const updateFaq = (index: number, key: keyof LandingFaqItem, nextValue: string) => {
    const next = [...(value.faqItems ?? [])];
    next[index] = { ...(next[index] ?? createEmptyFaqItem()), [key]: nextValue };
    update("faqItems", next);
  };

  const updateLocalFaq = (index: number, key: keyof LandingFaqItem, nextValue: string) => {
    const next = [...(value.localFaqItems ?? [])];
    next[index] = { ...(next[index] ?? createEmptyFaqItem()), [key]: nextValue };
    update("localFaqItems", next);
  };

  const updateExtra = (index: number, key: keyof LandingExtraSection, nextValue: string) => {
    const next = [...(value.extraSections ?? [])];
    next[index] = { ...(next[index] ?? createEmptyExtraSection()), [key]: nextValue };
    update("extraSections", next);
  };

  const addHighlight = () => update("highlights", [...(value.highlights ?? []), createEmptyHighlightItem()]);
  const removeHighlight = (index: number) => update("highlights", (value.highlights ?? []).filter((_, itemIndex) => itemIndex !== index));
  const addSocialProof = () => update("socialProofItems", [...(value.socialProofItems ?? []), createEmptySocialProofItem()]);
  const removeSocialProof = (index: number) => update("socialProofItems", (value.socialProofItems ?? []).filter((_, itemIndex) => itemIndex !== index));
  const addFaq = () => update("faqItems", [...(value.faqItems ?? []), createEmptyFaqItem()]);
  const removeFaq = (index: number) => update("faqItems", (value.faqItems ?? []).filter((_, itemIndex) => itemIndex !== index));
  const addLocalFaq = () => update("localFaqItems", [...(value.localFaqItems ?? []), createEmptyFaqItem()]);
  const removeLocalFaq = (index: number) => update("localFaqItems", (value.localFaqItems ?? []).filter((_, itemIndex) => itemIndex !== index));
  const addExtra = () => update("extraSections", [...(value.extraSections ?? []), createEmptyExtraSection()]);
  const removeExtra = (index: number) => update("extraSections", (value.extraSections ?? []).filter((_, itemIndex) => itemIndex !== index));
  const showLocalSeo = LOCAL_SEO_PAGE_KEYS.includes(page);

  return (
    <details id={page} className="scroll-mt-6 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5" open={page === "musicDuo"}>
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-amber)]">Pagina</p>
            <h2 className="font-display text-3xl">{title}</h2>
            <p className="mt-1 text-sm text-[#d9c6ac]">{description}</p>
          </div>
          <span className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[#d9c6ac]">
            Klik om te openen
          </span>
        </div>
      </summary>

      <div className="mt-5 grid gap-5">
        <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4 text-sm text-[#e7d7c1]">
          <p className="font-semibold text-[var(--color-text-primary)]">Waar zie je deze pagina terug?</p>
          <p className="mt-2">
            Alles hier vormt de aparte landingspagina voor <span className="font-semibold">{title.toLowerCase()}</span>. Laat je een veld leeg, dan valt de pagina terug op de bestaande hoofdsite-inhoud.
          </p>
        </div>

        <div className="grid gap-5 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(18,30,46,0.22)] p-5">
          <div>
            <h3 className="font-display text-2xl">Zoekresultaat</h3>
            <p className="text-sm text-[#d9c6ac]">Wat mensen in Google of bij delen op social als eerste zien.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              SEO-titel in Google
              <input className={pageFieldClass()} value={value.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} />
            </label>

            <label className="text-sm">
              OpenGraph titel
              <input className={pageFieldClass()} value={value.ogTitle} onChange={(event) => update("ogTitle", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              SEO-beschrijving in Google
              <textarea className={pageFieldClass("min-h-24 resize-y")} value={value.seoDescription} onChange={(event) => update("seoDescription", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              OpenGraph beschrijving
              <textarea className={pageFieldClass("min-h-24 resize-y")} value={value.ogDescription} onChange={(event) => update("ogDescription", event.target.value)} />
            </label>
          </div>
        </div>

        <div className="grid gap-5 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(18,30,46,0.22)] p-5">
          <div>
            <h3 className="font-display text-2xl">Hero</h3>
            <p className="text-sm text-[#d9c6ac]">Dit ziet iemand direct bovenaan de landingspagina.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              Kleine boventitel
              <input className={pageFieldClass()} value={value.heroLabel ?? ""} onChange={(event) => update("heroLabel", event.target.value)} />
            </label>

            <label className="text-sm">
              Voor wie is deze pagina bedoeld?
              <input className={pageFieldClass()} value={value.audienceLabel ?? ""} onChange={(event) => update("audienceLabel", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Paginatitel
              <input className={pageFieldClass()} value={value.title} onChange={(event) => update("title", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Korte intro
              <textarea className={pageFieldClass("min-h-28 resize-y")} value={value.intro} onChange={(event) => update("intro", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Knoptekst bovenaan
              <input className={pageFieldClass()} value={value.cta?.label ?? ""} onChange={(event) => updateCta("label", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Link van de knop bovenaan
              <input className={pageFieldClass()} value={value.cta?.href ?? ""} onChange={(event) => updateCta("href", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Afbeelding op deze landingspagina
              <input className={pageFieldClass()} value={value.image?.src ?? ""} onChange={(event) => updateImage("src", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Omschrijving van de afbeelding
              <input className={pageFieldClass()} value={value.image?.alt ?? ""} onChange={(event) => updateImage("alt", event.target.value)} />
            </label>

            <label className="text-sm">
              Breedte van de afbeelding
              <input
                type="number"
                min={1}
                className={pageFieldClass()}
                value={value.image?.width ?? 1536}
                onChange={(event) => updateImage("width", Math.max(1, Number(event.target.value) || 1536))}
              />
            </label>

            <label className="text-sm">
              Hoogte van de afbeelding
              <input
                type="number"
                min={1}
                className={pageFieldClass()}
                value={value.image?.height ?? 864}
                onChange={(event) => updateImage("height", Math.max(1, Number(event.target.value) || 864))}
              />
            </label>
          </div>
        </div>

        <div className="grid gap-5 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(18,30,46,0.22)] p-5">
          <div>
            <h3 className="font-display text-2xl">Waarom dit past</h3>
            <p className="text-sm text-[#d9c6ac]">Leg uit wat voor avond dit wordt en waarom Bohèm hier sterk in is.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              Titel boven het overtuigingsblok
              <input className={pageFieldClass()} value={value.positioningTitle ?? ""} onChange={(event) => update("positioningTitle", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Uitleg bij waarom dit past
              <textarea className={pageFieldClass("min-h-24 resize-y")} value={value.positioningBody ?? ""} onChange={(event) => update("positioningBody", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Titel boven situaties of doelgroepen
              <input className={pageFieldClass()} value={value.fitTitle ?? ""} onChange={(event) => update("fitTitle", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Situaties of doelgroepen, één per regel
              <textarea className={pageFieldClass("min-h-28 resize-y")} value={joinLines(value.fitItems)} onChange={(event) => updateList("fitItems", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Praktische punten voor een organisator, één per regel
              <textarea className={pageFieldClass("min-h-28 resize-y")} value={joinLines(value.practicalInfoItems)} onChange={(event) => updateList("practicalInfoItems", event.target.value)} />
            </label>
          </div>
        </div>

        <div className="grid gap-5 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(18,30,46,0.22)] p-5">
          <div>
            <h3 className="font-display text-2xl">Bewijs en vertrouwen</h3>
            <p className="text-sm text-[#d9c6ac]">Gebruik dit blok voor kernpunten, reacties en vragen die helpen om contact op te nemen.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              Kleine titel boven het bewijsblok
              <input className={pageFieldClass()} value={value.proofTitle ?? ""} onChange={(event) => update("proofTitle", event.target.value)} />
            </label>
          </div>

          <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl">Kernpunten</h3>
              <p className="text-sm text-[#d9c6ac]">Deze kaarten leggen uit waarom deze landingspagina overtuigt.</p>
            </div>
            <button
              type="button"
              onClick={addHighlight}
              className="rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
            >
              Kernpunt toevoegen
            </button>
          </div>

          <div className="grid gap-3">
            {(value.highlights ?? []).map((item, index) => (
              <div key={`${page}-highlight-${index}`} className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Kernpunt {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeHighlight(index)}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[#d9c6ac] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                  >
                    Verwijder
                  </button>
                </div>

                <div className="mt-3 grid gap-3">
                  <label className="text-sm">
                    Titel
                    <input
                      className={pageFieldClass()}
                      value={item.title}
                      onChange={(event) => updateHighlight(index, "title", event.target.value)}
                    />
                  </label>

                  <label className="text-sm">
                    Uitleg
                    <textarea
                      className={pageFieldClass("min-h-24 resize-y")}
                      value={item.body}
                      onChange={(event) => updateHighlight(index, "body", event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl">Reacties en vertrouwen</h3>
                <p className="text-sm text-[#d9c6ac]">Korte reacties of context die laat zien wat deze setting teweegbrengt.</p>
              </div>
              <button
                type="button"
                onClick={addSocialProof}
                className="rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
              >
                Reactie toevoegen
              </button>
            </div>

            <div className="grid gap-3">
              {(value.socialProofItems ?? []).map((item, index) => (
                <div key={`${page}-social-${index}`} className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Reactie {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeSocialProof(index)}
                      className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[#d9c6ac] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                    >
                      Verwijder
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <label className="text-sm">
                      Quote of reactie
                      <textarea className={pageFieldClass("min-h-24 resize-y")} value={item.quote} onChange={(event) => updateSocialProof(index, "quote", event.target.value)} />
                    </label>

                    <label className="text-sm">
                      Van wie of welke context komt dit?
                      <input className={pageFieldClass()} value={item.source ?? ""} onChange={(event) => updateSocialProof(index, "source", event.target.value)} />
                    </label>

                    <label className="text-sm">
                      Korte extra context
                      <input className={pageFieldClass()} value={item.context ?? ""} onChange={(event) => updateSocialProof(index, "context", event.target.value)} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              Titel boven veelgestelde vragen
              <input className={pageFieldClass()} value={value.faqTitle ?? ""} onChange={(event) => update("faqTitle", event.target.value)} />
            </label>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl">Veelgestelde vragen</h3>
                <p className="text-sm text-[#d9c6ac]">Voeg hier vraag en antwoord toe. Leeg laten betekent: niet tonen op de site.</p>
              </div>
              <button
                type="button"
                onClick={addFaq}
                className="rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
              >
                Vraag toevoegen
              </button>
            </div>

            <div className="grid gap-3">
              {(value.faqItems ?? []).map((item, index) => (
                <div key={`${page}-faq-${index}`} className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Vraag {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[#d9c6ac] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                    >
                      Verwijder
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <label className="text-sm">
                      Vraag
                      <input className={pageFieldClass()} value={item.question} onChange={(event) => updateFaq(index, "question", event.target.value)} />
                    </label>

                    <label className="text-sm">
                      Antwoord
                      <textarea className={pageFieldClass("min-h-24 resize-y")} value={item.answer} onChange={(event) => updateFaq(index, "answer", event.target.value)} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showLocalSeo ? (
          <div className="grid gap-5 rounded-2xl border border-[rgba(67,135,133,0.45)] bg-[rgba(18,30,46,0.38)] p-5">
            <div>
              <h3 className="font-display text-2xl">Lokaal</h3>
              <p className="text-sm text-[#d9c6ac]">Gebruik dit blok om deze landingspagina regionaal relevanter te maken zonder aparte stadspagina's te bouwen.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm md:col-span-2">
                Titel boven lokaal speelgebied
                <input className={pageFieldClass()} value={value.localAreaTitle ?? ""} onChange={(event) => update("localAreaTitle", event.target.value)} />
              </label>

              <label className="text-sm md:col-span-2">
                Korte uitleg over waar Bohèm goed past
                <textarea className={pageFieldClass("min-h-24 resize-y")} value={value.localAreaIntro ?? ""} onChange={(event) => update("localAreaIntro", event.target.value)} />
              </label>

              <label className="text-sm md:col-span-2">
                Plaatsen die je wilt benoemen, één per regel
                <textarea className={pageFieldClass("min-h-24 resize-y")} value={joinLines(value.priorityCities)} onChange={(event) => updateList("priorityCities", event.target.value)} />
              </label>

              <label className="text-sm md:col-span-2">
                Titel boven lokale overtuigingspunten
                <input className={pageFieldClass()} value={value.localProofTitle ?? ""} onChange={(event) => update("localProofTitle", event.target.value)} />
              </label>

              <label className="text-sm md:col-span-2">
                Waarom Bohèm hier goed past, één punt per regel
                <textarea className={pageFieldClass("min-h-28 resize-y")} value={joinLines(value.localProofItems)} onChange={(event) => updateList("localProofItems", event.target.value)} />
              </label>

              <label className="text-sm">
                Tekst van lokale knop
                <input className={pageFieldClass()} value={value.localLinkLabel ?? ""} onChange={(event) => update("localLinkLabel", event.target.value)} />
              </label>

              <label className="text-sm">
                Link van lokale knop
                <input className={pageFieldClass()} value={value.localLinkHref ?? ""} onChange={(event) => update("localLinkHref", event.target.value)} />
              </label>

              <label className="text-sm md:col-span-2">
                Titel boven lokale veelgestelde vragen
                <input className={pageFieldClass()} value={value.localFaqTitle ?? ""} onChange={(event) => update("localFaqTitle", event.target.value)} />
              </label>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-display text-2xl">Lokale veelgestelde vragen</h4>
                  <p className="text-sm text-[#d9c6ac]">Deze vragen worden toegevoegd aan de bestaande FAQ van deze pagina en ook meegenomen in schema.</p>
                </div>
                <button
                  type="button"
                  onClick={addLocalFaq}
                  className="rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                >
                  Vraag toevoegen
                </button>
              </div>

              <div className="grid gap-3">
                {(value.localFaqItems ?? []).map((item, index) => (
                  <div key={`${page}-local-faq-${index}`} className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Lokale vraag {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeLocalFaq(index)}
                        className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[#d9c6ac] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                      >
                        Verwijder
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3">
                      <label className="text-sm">
                        Lokale vraag
                        <input className={pageFieldClass()} value={item.question} onChange={(event) => updateLocalFaq(index, "question", event.target.value)} />
                      </label>

                      <label className="text-sm">
                        Antwoord op deze lokale vraag
                        <textarea className={pageFieldClass("min-h-24 resize-y")} value={item.answer} onChange={(event) => updateLocalFaq(index, "answer", event.target.value)} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(18,30,46,0.22)] p-5">
          <div>
            <h3 className="font-display text-2xl">Slot-CTA</h3>
            <p className="text-sm text-[#d9c6ac]">De afsluitende band onderaan de landingspagina. Hier mag je directer naar contact toe werken.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              Titel in de afsluitende contactband
              <input className={pageFieldClass()} value={value.ctaContextTitle ?? ""} onChange={(event) => update("ctaContextTitle", event.target.value)} />
            </label>

            <label className="text-sm md:col-span-2">
              Uitleg in de afsluitende contactband
              <textarea className={pageFieldClass("min-h-24 resize-y")} value={value.ctaContextBody ?? ""} onChange={(event) => update("ctaContextBody", event.target.value)} />
            </label>
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(18,30,46,0.14)] p-5">
          <div>
            <h3 className="font-display text-2xl">Geavanceerd</h3>
            <p className="text-sm text-[#d9c6ac]">Alleen gebruiken als je echt een extra blok nodig hebt. Dit is niet de hoofdroute voor de pagina-opbouw.</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl">Extra toelichting</h3>
              <p className="text-sm text-[#d9c6ac]">Gebruik dit voor korte extra blokken met titel en uitleg.</p>
            </div>
            <button
              type="button"
              onClick={addExtra}
              className="rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
            >
              Blok toevoegen
            </button>
          </div>

          <div className="grid gap-3">
            {(value.extraSections ?? []).map((item, index) => (
              <div key={`${page}-extra-${index}`} className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Blok {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeExtra(index)}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[#d9c6ac] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                  >
                    Verwijder
                  </button>
                </div>

                <div className="mt-3 grid gap-3">
                  <label className="text-sm">
                    Titel
                    <input
                      className={pageFieldClass()}
                      value={item.title}
                      onChange={(event) => updateExtra(index, "title", event.target.value)}
                    />
                  </label>

                  <label className="text-sm">
                    Uitleg
                    <textarea
                      className={pageFieldClass("min-h-24 resize-y")}
                      value={item.body}
                      onChange={(event) => updateExtra(index, "body", event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

export function LandingPagesForm() {
  const [form, setForm] = useState<LandingPagesDraft | null>(null);
  const [initial, setInitial] = useState<LandingPagesDraft | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [statusDetails, setStatusDetails] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setStatusMessage("");
      setStatusTone("neutral");
      setStatusDetails([]);

      try {
        const response = await fetch("/api/super-admin/landing-pages", { method: "GET" });
        const payload = (await response.json()) as LandingPagesApiSuccess | LandingPagesApiError;

        if (!response.ok || !("ok" in payload)) {
          const apiError = payload as LandingPagesApiError;
          setStatusMessage(apiError.error ?? "Landingspagina's laden mislukt.");
          setStatusTone("error");
          setStatusDetails(formatFieldErrors(apiError.fieldErrors));
          return;
        }

        const next = normalizeLandingPages(payload.landingPages);
        setForm(next);
        setInitial(next);
        setUpdatedAt(payload.updated_at);
        setUpdatedBy(payload.updated_by);
      } catch {
        setStatusMessage("Er ging iets mis bij laden. Ververs de pagina.");
        setStatusTone("error");
        setStatusDetails([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const isPristine = useMemo(() => {
    if (!form || !initial) return true;
    return JSON.stringify(form) === JSON.stringify(initial);
  }, [form, initial]);

  useUnsavedChangesGuard(!isPristine);

  const updatePage = (key: LandingPageKey, next: LandingPageDraft) => {
    setForm((prev) => (prev ? { ...prev, [key]: next } : prev));
    setStatusDetails([]);
    setStatusMessage("Niet-opgeslagen wijzigingen.");
    setStatusTone("neutral");
  };

  const onReset = () => {
    if (!initial) return;
    setForm(initial);
    setStatusDetails([]);
    setStatusMessage("Wijzigingen teruggezet.");
    setStatusTone("neutral");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    setIsSaving(true);
    setStatusMessage("Opslaan...");
    setStatusTone("neutral");
    setStatusDetails([]);

    try {
      const response = await fetch("/api/super-admin/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landingPages: form })
      });

      const payload = (await response.json()) as LandingPagesApiSuccess | LandingPagesApiError;

      if (!response.ok || !("ok" in payload)) {
        const apiError = payload as LandingPagesApiError;
        setStatusMessage(apiError.error ?? "Landingspagina's opslaan mislukt.");
        setStatusTone("error");
        setStatusDetails(formatFieldErrors(apiError.fieldErrors));
        return;
      }

      const next = normalizeLandingPages(payload.landingPages);
      setForm(next);
      setInitial(next);
      setUpdatedAt(payload.updated_at);
      setUpdatedBy(payload.updated_by);
      setStatusMessage("SEO landingspagina's opgeslagen.");
      setStatusTone("success");
      setStatusDetails([]);
    } catch {
      setStatusMessage("Netwerkfout bij opslaan.");
      setStatusTone("error");
      setStatusDetails([]);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !form || !initial) {
    return <p className="text-sm text-[#d9c6ac]">Landingspagina's laden...</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <StickyStatusBar
        tone={statusTone}
        message={statusMessage}
        details={statusDetails}
        hasUnsavedChanges={!isPristine}
        updatedAt={updatedAt}
      />

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Beheer alleen voor adminrollen</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">
          Deze pagina is bedoeld voor SEO-landingen die op de site indexeerbaar moeten blijven, maar niet in de gewone editor horen.
        </p>
        <div className="mt-4 grid gap-3 text-sm text-[#e7d7c1] md:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
            <p className="font-semibold text-[var(--color-text-primary)]">Wat beheer je hier?</p>
            <p className="mt-1">Muziekduo boeken, theaterconcert boeken, Kampvuurklanken, huiskamerconcert boeken en pers.</p>
          </div>
          <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
            <p className="font-semibold text-[var(--color-text-primary)]">Wanneer wordt iets getoond?</p>
            <p className="mt-1">Alleen gevulde teksten en vragen tonen op de site. Lege onderdelen vallen terug op de hoofdsite.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Snel naar een pagina</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {PAGE_META.map((page) => (
            <a
              key={page.key}
              href={`#${page.key}`}
              className="rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
            >
              {page.title}
            </a>
          ))}
        </div>
      </section>

      {PAGE_META.map((page) => (
        <PageSection
          key={page.key}
          page={page.key}
          title={page.title}
          description={page.description}
          value={form[page.key]}
          onChange={(next) => updatePage(page.key, next)}
        />
      ))}

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#d9c6ac]">Laatst bijgewerkt door {updatedBy || "onbekend"} op {updatedAt || "onbekend"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
            >
              Terugzetten
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full border border-[var(--color-accent-amber)] bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-semibold text-[var(--color-bg-primary)] transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
