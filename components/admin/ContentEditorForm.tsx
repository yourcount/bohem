"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import type { SiteContent } from "@/lib/types";

type ApiError = {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

type AdminFullContentResponse = {
  content: SiteContent;
  updated_at: string;
  updated_by: string;
};

type EditableField = {
  path: string;
  section: string;
  label: string;
  helper: string;
  multiline: boolean;
  value: string;
};

type StatusTone = "neutral" | "success" | "error";

const sectionLabels: Record<string, string> = {
  meta: "SEO en pagina-info",
  brand: "Merk",
  navigation: "Navigatie",
  hero: "Hero",
  about: "Over Bohèm",
  discography: "Discografie",
  musicExperience: "Muziekbeleving",
  kampvuur: "Kampvuurklanken",
  bookings: "Boekingen",
  contact: "Contact",
  footer: "Footer"
};

const keyLabels: Record<string, string> = {
  title: "Titel",
  description: "Beschrijving",
  locale: "Taal",
  canonical: "Canonieke link",
  ogTitle: "OG titel",
  ogDescription: "OG beschrijving",
  name: "Naam",
  label: "Label",
  href: "Link",
  eyebrow: "Boventitel",
  headline: "Hoofdtitel",
  subhead: "Subtitel",
  src: "Afbeelding",
  alt: "Afbeelding omschrijving",
  intro: "Intro",
  text: "Tekst",
  website: "Persoonlijke website",
  body: "Tekstblok",
  quote: "Quote",
  city: "Plaats",
  venue: "Locatie",
  date: "Datum",
  ctaLabel: "Knoptekst",
  ctaHref: "Knoplink",
  contactEmail: "E-mailadres",
  contactPhone: "Telefoon",
  email: "E-mailadres",
  responseTimeText: "Reactietijd",
  intakeHint: "Formulier hint",
  copyright: "Footertekst",
  format: "Type release",
  year: "Jaar",
  note: "Toelichting",
  embedUrl: "Spotify embed link"
};

const helperByKey: Record<string, string> = {
  href: "Gebruik een volledige link (https://...) of een pagina-anker (#contact).",
  canonical: "Bijv. / of https://musicbybohem.nl/",
  email: "Gebruik een geldig e-mailadres.",
  contactEmail: "Gebruik een geldig e-mailadres.",
  contactPhone: "Gebruik internationaal formaat, bijv. +31 6...",
  alt: "Beschrijf kort wat er op de foto te zien is (toegankelijkheid).",
  embedUrl: "Spotify embed URL, bijv. https://open.spotify.com/embed/...",
  src: "Pad of URL van de afbeelding, bijv. /uploads/hero/....jpg"
};

function pathParts(path: string) {
  return path.split(".");
}

function prettifyPart(part: string) {
  if (/^\d+$/.test(part)) {
    return `Item ${Number(part) + 1}`;
  }
  return keyLabels[part] ?? part.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function helperForPath(path: string) {
  const parts = pathParts(path);
  const leaf = parts[parts.length - 1] ?? "";
  return helperByKey[leaf] ?? "";
}

function labelForPath(path: string) {
  const parts = pathParts(path);
  if (parts.length === 0) return path;
  const leaf = parts[parts.length - 1] ?? "";
  const parent = parts.length > 1 ? prettifyPart(parts[parts.length - 2] ?? "") : "";

  if (/^\d+$/.test(parts[parts.length - 2] ?? "")) {
    const grandParent = parts.length > 2 ? prettifyPart(parts[parts.length - 3] ?? "") : "Item";
    return `${grandParent} - ${prettifyPart(parts[parts.length - 2] ?? "")} - ${prettifyPart(leaf)}`;
  }

  return parent ? `${parent} - ${prettifyPart(leaf)}` : prettifyPart(leaf);
}

function flattenEditableFields(value: unknown, path = "", section = ""): EditableField[] {
  if (typeof value === "string") {
    const parts = pathParts(path);
    const leaf = parts[parts.length - 1] ?? "";
    return [
      {
        path,
        section,
        label: labelForPath(path),
        helper: helperForPath(path),
        multiline: value.length > 80 || ["description", "text", "body", "intro", "boilerplate", "note", "quote", "subhead"].includes(leaf),
        value
      }
    ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenEditableFields(item, path ? `${path}.${index}` : String(index), section));
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    return Object.entries(objectValue).flatMap(([key, nested]) => {
      const nextPath = path ? `${path}.${key}` : key;
      const nextSection = section || key;
      return flattenEditableFields(nested, nextPath, nextSection);
    });
  }

  return [];
}

function getValueAtPath(input: unknown, path: string): unknown {
  const parts = pathParts(path);
  let current: unknown = input;

  for (const part of parts) {
    if (Array.isArray(current)) {
      current = current[Number(part)];
      continue;
    }

    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function setValueAtPath<T>(input: T, path: string, value: string): T {
  const draft = structuredClone(input) as unknown;
  const parts = pathParts(path);
  let current: unknown = draft;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (Array.isArray(current)) {
      current = current[Number(part)];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  const last = parts[parts.length - 1];
  if (Array.isArray(current)) {
    current[Number(last)] = value;
  } else {
    (current as Record<string, unknown>)[last] = value;
  }

  return draft as T;
}

function normalizeApiFieldErrors(fieldErrors?: Record<string, string[]>) {
  const normalized: Record<string, string[]> = {};
  if (!fieldErrors) return normalized;

  for (const [path, messages] of Object.entries(fieldErrors)) {
    const cleanPath = path.startsWith("content.") ? path.slice("content.".length) : path;
    normalized[cleanPath] = messages;
  }

  return normalized;
}

export function ContentEditorForm() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [initialContent, setInitialContent] = useState<SiteContent | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [lastSavedBy, setLastSavedBy] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setStatusMessage("");
      setStatusTone("neutral");

      try {
        const response = await fetch("/api/content/admin/full", { method: "GET" });
        const payload = (await response.json()) as AdminFullContentResponse & ApiError;

        if (!response.ok || !("content" in payload)) {
          setStatusMessage(payload.error ?? "Kon content niet laden.");
          setStatusTone("error");
          return;
        }

        setContent(payload.content);
        setInitialContent(payload.content);
        setLastSavedAt(payload.updated_at);
        setLastSavedBy(payload.updated_by);
      } catch {
        setStatusMessage("Er ging iets mis bij laden. Ververs de pagina.");
        setStatusTone("error");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const editableFields = useMemo(() => {
    if (!content) return [];
    return flattenEditableFields(content);
  }, [content]);

  const groupedFields = useMemo(() => {
    const groups = new Map<string, EditableField[]>();

    for (const field of editableFields) {
      const section = sectionLabels[field.section] ?? prettifyPart(field.section);
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)?.push(field);
    }

    return Array.from(groups.entries());
  }, [editableFields]);

  const isPristine = useMemo(() => {
    if (!content || !initialContent) return true;
    return JSON.stringify(content) === JSON.stringify(initialContent);
  }, [content, initialContent]);

  const onChangeField = (path: string, value: string) => {
    setContent((prev) => (prev ? setValueAtPath(prev, path, value) : prev));
    setFieldErrors((prev) => ({ ...prev, [path]: [] }));

    if (statusTone !== "error") {
      setStatusMessage("Niet-opgeslagen wijzigingen.");
      setStatusTone("neutral");
    }
  };

  const onReset = () => {
    if (!initialContent) return;
    setContent(initialContent);
    setFieldErrors({});
    setStatusMessage("Wijzigingen teruggezet.");
    setStatusTone("neutral");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content) return;

    setIsSaving(true);
    setStatusMessage("Opslaan...");
    setStatusTone("neutral");
    setFieldErrors({});

    try {
      const response = await fetch("/api/content/admin/full", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      const payload = (await response.json()) as
        | { ok: true; content: SiteContent; updated_at: string; updated_by: string }
        | ApiError;

      if (!response.ok) {
        const apiError = payload as ApiError;
        const normalizedErrors = normalizeApiFieldErrors(apiError.fieldErrors);
        setFieldErrors(normalizedErrors);
        setStatusMessage(apiError.error ?? "Opslaan is niet gelukt.");
        setStatusTone("error");

        const firstPath = Object.keys(normalizedErrors)[0];
        if (firstPath) {
          const firstField = fieldRefs.current[firstPath];
          firstField?.focus();
          firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      if ("content" in payload) {
        setContent(payload.content);
        setInitialContent(payload.content);
        setLastSavedAt(payload.updated_at);
        setLastSavedBy(payload.updated_by);
      }

      setStatusMessage("Wijzigingen opgeslagen.");
      setStatusTone("success");
    } catch {
      setStatusMessage("Er ging iets mis bij opslaan. Probeer opnieuw.");
      setStatusTone("error");
    } finally {
      setIsSaving(false);
    }
  };

  const onUploadHeroImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setIsUploadingImage(true);
    setStatusMessage("Afbeelding uploaden...");
    setStatusTone("neutral");

    try {
      const body = new FormData();
      body.append("file", selected);

      const response = await fetch("/api/content/admin/hero-image", {
        method: "POST",
        body
      });

      const payload = (await response.json()) as
        | { ok: true; hero_image_url: string; updated_at: string; updated_by: string }
        | ApiError;

      if (!response.ok || !("hero_image_url" in payload)) {
        const errorPayload = payload as ApiError;
        setStatusMessage(errorPayload.error ?? "Uploaden is niet gelukt.");
        setStatusTone("error");
        return;
      }

      setContent((prev) => (prev ? setValueAtPath(prev, "hero.image.src", payload.hero_image_url) : prev));
      setInitialContent((prev) => (prev ? setValueAtPath(prev, "hero.image.src", payload.hero_image_url) : prev));
      setLastSavedAt(payload.updated_at);
      setLastSavedBy(payload.updated_by);
      setStatusMessage("Hero-afbeelding vervangen en opgeslagen.");
      setStatusTone("success");
    } catch {
      setStatusMessage("Er ging iets mis bij uploaden. Probeer opnieuw.");
      setStatusTone("error");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  if (isLoading) {
    return <p className="text-[#d9c6ac]">Inhoud laden...</p>;
  }

  if (!content) {
    return <p className="text-[#ffb4a8]">Geen content gevonden om te bewerken.</p>;
  }

  const statusColorClass =
    statusTone === "success" ? "text-[#b6efb9]" : statusTone === "error" ? "text-[#ffb4a8]" : "text-[#d9c6ac]";

  const heroImage = String(getValueAtPath(content, "hero.image.src") ?? "");

  return (
    <section
      aria-labelledby="content-editor-title"
      className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-5 sm:p-6"
    >
      <h2 id="content-editor-title" className="mb-2 font-display text-3xl">
        Website-inhoud
      </h2>
      <p className="mb-4 text-sm text-[#d9c6ac]">
        Alles wat bezoekers op de website zien kun je hieronder aanpassen. Wijziging klaar? Klik op Opslaan.
      </p>

      <div className="mb-6 rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.52)] p-4">
        <p className="mb-2 text-sm font-semibold text-[#f8f5f1]">Hero afbeelding vervangen</p>
        <p className="mb-3 text-xs text-[#d9c6ac]">Kies JPG, PNG of WEBP (maximaal 8 MB).</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]">
            {isUploadingImage ? "Uploaden..." : "Kies afbeelding"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onUploadHeroImage}
              disabled={isUploadingImage}
            />
          </label>
          <a href={heroImage} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-2">
            Huidige afbeelding bekijken
          </a>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 pb-28">
        {groupedFields.map(([sectionTitle, fields]) => (
          <details
            key={sectionTitle}
            open
            className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.36)] p-4 sm:p-5"
          >
            <summary className="cursor-pointer select-none text-base font-semibold text-[#f8f5f1]">{sectionTitle}</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {fields.map((field) => {
                const inputId = `field-${field.path.replace(/[^a-zA-Z0-9]+/g, "-")}`;
                const helperId = `${inputId}-helper`;
                const errorId = `${inputId}-error`;
                const error = fieldErrors[field.path]?.[0];
                const describedBy = [field.helper ? helperId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;

                return (
                  <div key={field.path} className={field.multiline ? "md:col-span-2" : ""}>
                    <label htmlFor={inputId} className="mb-1 block text-sm font-semibold text-[#f8f5f1]">
                      {field.label}
                    </label>
                    {field.multiline ? (
                      <textarea
                        id={inputId}
                        ref={(node) => {
                          fieldRefs.current[field.path] = node;
                        }}
                        rows={4}
                        value={field.value}
                        onChange={(event) => onChangeField(field.path, event.target.value)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        className="w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-[var(--color-text-primary)]"
                      />
                    ) : (
                      <input
                        id={inputId}
                        ref={(node) => {
                          fieldRefs.current[field.path] = node;
                        }}
                        type="text"
                        value={field.value}
                        onChange={(event) => onChangeField(field.path, event.target.value)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        className="w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-[var(--color-text-primary)]"
                      />
                    )}
                    {field.helper ? (
                      <p id={helperId} className="mt-1 text-xs text-[#d9c6ac]">
                        {field.helper}
                      </p>
                    ) : null}
                    {error ? (
                      <p id={errorId} className="mt-1 text-sm text-[#ffb4a8]">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </details>
        ))}

        <div className="sticky bottom-3 z-10 rounded-xl border border-[var(--color-line-muted)] bg-[rgba(14,19,30,0.94)] p-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSaving || isPristine}
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-6 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Opslaan..." : "Opslaan"}
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving || isPristine}
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Ongedaan maken
            </button>
            <p className="text-xs text-[#d9c6ac]">
              Laatst opgeslagen: {lastSavedAt || "onbekend"} {lastSavedBy ? `door ${lastSavedBy}` : ""}
            </p>
          </div>
          <p aria-live="polite" className={`mt-2 text-sm ${statusColorClass}`}>
            {statusMessage || "Geen openstaande wijzigingen."}
          </p>
        </div>
      </form>
    </section>
  );
}
