"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";

import type { SiteContent } from "@/lib/types";

type EditorManagedContent = Pick<
  SiteContent,
  "brand" | "navigation" | "hero" | "about" | "discography" | "musicExperience" | "kampvuur" | "bookings" | "contact" | "footer"
>;

type ApiError = {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
  validationSummary?: Array<{ path: string; message: string }>;
};

type AdminEditorContentResponse = {
  content: EditorManagedContent;
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

type MediaFile = {
  src: string;
  name: string;
  tags: string[];
  kind?: "photo" | "asset";
};

type StatusTone = "neutral" | "success" | "error";
const RELEASE_FORMAT_OPTIONS: Array<SiteContent["discography"]["releases"][number]["format"]> = [
  "Single",
  "EP",
  "Live Session",
  "Album"
];

const sectionLabels: Record<string, string> = {
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
  email: "Gebruik een geldig e-mailadres.",
  contactEmail: "Gebruik een geldig e-mailadres.",
  contactPhone: "Gebruik internationaal formaat, bijvoorbeeld +31 6...",
  alt: "Beschrijf kort wat er op de foto te zien is (toegankelijkheid).",
  embedUrl: "Spotify embed URL, bijvoorbeeld https://open.spotify.com/embed/...",
  src: "Kies via de fotobibliotheek of vul een afbeeldingspad in, bijvoorbeeld /uploads/library/....webp"
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
        multiline:
          value.length > 80 ||
          ["description", "text", "body", "intro", "boilerplate", "note", "quote", "subhead"].includes(leaf),
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

function formatValidationPath(path: string) {
  const clean = path.replace(/^content\./, "");
  return clean
    .split(".")
    .map((part) => {
      if (/^\d+$/.test(part)) return `#${Number(part) + 1}`;
      return keyLabels[part] ?? part.replace(/([A-Z])/g, " $1").replace(/_/g, " ").toLowerCase();
    })
    .join(" > ");
}

function isImageSourcePath(path: string) {
  return path.endsWith(".src");
}

function sectionToId(sectionTitle: string) {
  return `editor-section-${sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function ContentEditorForm() {
  const [content, setContent] = useState<EditorManagedContent | null>(null);
  const [initialContent, setInitialContent] = useState<EditorManagedContent | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [lastSavedBy, setLastSavedBy] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [statusDetails, setStatusDetails] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTargetPath, setMediaTargetPath] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaTag, setMediaTag] = useState("");
  const [mediaKind, setMediaKind] = useState<"photo" | "all">("photo");
  const [mediaTags, setMediaTags] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [jumpTarget, setJumpTarget] = useState("");

  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const mediaUploadInputRef = useRef<HTMLInputElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDetailsElement | null>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setStatusMessage("");
      setStatusTone("neutral");
      setStatusDetails([]);

      try {
        const response = await fetch("/api/content/admin/editor-full", { method: "GET" });
        const payload = (await response.json()) as AdminEditorContentResponse & ApiError;

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
    return flattenEditableFields(content).filter((field) => !field.path.startsWith("discography.releases."));
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

  useEffect(() => {
    setOpenSections((previous) => {
      const next: Record<string, boolean> = {};
      for (const [sectionTitle] of groupedFields) {
        next[sectionTitle] = previous[sectionTitle] ?? true;
      }
      return next;
    });
  }, [groupedFields]);

  const isPristine = useMemo(() => {
    if (!content || !initialContent) return true;
    return JSON.stringify(content) === JSON.stringify(initialContent);
  }, [content, initialContent]);

  const releases = content?.discography.releases ?? [];

  const setDirty = () => {
    if (statusTone !== "error") {
      setStatusMessage("Niet-opgeslagen wijzigingen.");
      setStatusTone("neutral");
    }
  };

  const onChangeField = (path: string, value: string) => {
    setContent((prev) => (prev ? setValueAtPath(prev, path, value) : prev));
    setFieldErrors((prev) => ({ ...prev, [path]: [] }));
    setDirty();
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
    setStatusDetails([]);
    setFieldErrors({});

    try {
      const response = await fetch("/api/content/admin/editor-full", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      const payload = (await response.json()) as
        | { ok: true; content: EditorManagedContent; updated_at: string; updated_by: string }
        | ApiError;

      if (!response.ok) {
        const apiError = payload as ApiError;
        const normalizedErrors = normalizeApiFieldErrors(apiError.fieldErrors);
        setFieldErrors(normalizedErrors);
        const summaryLines =
          apiError.validationSummary?.map((item) => `${formatValidationPath(item.path)}: ${item.message}`) ??
          Object.entries(apiError.fieldErrors ?? {})
            .slice(0, 6)
            .map(([path, messages]) => `${formatValidationPath(path)}: ${messages.join(" ")}`);
        setStatusDetails(summaryLines);
        setStatusMessage(apiError.error ?? "Opslaan is niet gelukt. Controleer de velden hieronder.");
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

      setStatusMessage("Wijzigingen opgeslagen en live.");
      setStatusTone("success");
      setStatusDetails([]);
    } catch {
      setStatusMessage("Er ging iets mis bij opslaan. Probeer opnieuw.");
      setStatusTone("error");
      setStatusDetails([]);
    } finally {
      setIsSaving(false);
    }
  };

  const loadMediaLibrary = async (options?: { query?: string; tag?: string; kind?: "photo" | "all" }) => {
    setIsMediaLoading(true);
    setMediaError("");

    try {
      const params = new URLSearchParams();
      const query = options?.query ?? mediaQuery;
      const tag = options?.tag ?? mediaTag;
      const kind = options?.kind ?? mediaKind;
      if (query.trim()) params.set("q", query.trim());
      if (tag.trim()) params.set("tag", tag.trim());
      params.set("kind", kind);
      const response = await fetch(`/api/content/admin/media?${params.toString()}`, { method: "GET" });
      const payload = (await response.json()) as { ok?: boolean; files?: MediaFile[]; tags?: string[]; error?: string };

      if (!response.ok || !payload.ok) {
        setMediaError(payload.error ?? "Mediabibliotheek kon niet geladen worden.");
        return;
      }

      setMediaFiles(payload.files ?? []);
      setMediaTags(payload.tags ?? []);
    } catch {
      setMediaError("Mediabibliotheek kon niet geladen worden.");
    } finally {
      setIsMediaLoading(false);
    }
  };

  const openMediaModal = (path: string) => {
    setMediaTargetPath(path);
    setMediaQuery("");
    setMediaTag("");
    setMediaKind("photo");
    setIsMediaModalOpen(true);
    void loadMediaLibrary({ query: "", tag: "", kind: "photo" });
  };

  const closeMediaModal = () => {
    setIsMediaModalOpen(false);
    setMediaTargetPath(null);
    setMediaError("");
  };

  const onSelectMedia = (src: string) => {
    if (!mediaTargetPath) return;
    onChangeField(mediaTargetPath, src);
    closeMediaModal();
  };

  const onUploadMedia = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setIsUploadingMedia(true);
    setMediaError("");

    try {
      const body = new FormData();
      body.append("file", selected);
      if (mediaTag) {
        body.append("tags", mediaTag);
      }

      const response = await fetch("/api/content/admin/media", {
        method: "POST",
        body
      });

      const payload = (await response.json()) as
        | { ok: true; file: { src: string; name: string } }
        | { error?: string };

      if (!response.ok || !("ok" in payload)) {
        const errorPayload = payload as { error?: string };
        setMediaError(errorPayload.error ?? "Uploaden is mislukt.");
        return;
      }

      if (mediaTargetPath) {
        onChangeField(mediaTargetPath, payload.file.src);
      }

      await loadMediaLibrary();
    } catch {
      setMediaError("Uploaden is mislukt.");
    } finally {
      setIsUploadingMedia(false);
      event.target.value = "";
    }
  };

  const addRelease = () => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.discography.releases.push({
        title: "Nieuwe release",
        year: String(new Date().getFullYear()),
        format: "Single",
        note: "",
        links: [{ label: "Luister op Spotify", href: "https://" }]
      });
      return next;
    });
    setDirty();
  };

  const removeRelease = (index: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      if (prev.discography.releases.length <= 1) return prev;
      const next = structuredClone(prev);
      next.discography.releases.splice(index, 1);
      return next;
    });
    setDirty();
  };

  const addReleaseLink = (releaseIndex: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.discography.releases[releaseIndex]?.links.push({ label: "Nieuwe link", href: "https://" });
      return next;
    });
    setDirty();
  };

  const removeReleaseLink = (releaseIndex: number, linkIndex: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const links = next.discography.releases[releaseIndex]?.links;
      if (!links || links.length <= 1) return prev;
      links.splice(linkIndex, 1);
      return next;
    });
    setDirty();
  };

  const updateReleaseField = (
    releaseIndex: number,
    key: keyof SiteContent["discography"]["releases"][number],
    value: string
  ) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const release = next.discography.releases[releaseIndex];
      if (!release) return prev;

      if (key === "format") {
        release.format = value as SiteContent["discography"]["releases"][number]["format"];
      } else if (key !== "links") {
        release[key] = value as never;
      }

      return next;
    });
    setFieldErrors((prev) => ({
      ...prev,
      [`discography.releases.${releaseIndex}.${key}`]: []
    }));
    setDirty();
  };

  const updateReleaseLinkField = (releaseIndex: number, linkIndex: number, key: "label" | "href", value: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const link = next.discography.releases[releaseIndex]?.links[linkIndex];
      if (!link) return prev;
      link[key] = value;
      return next;
    });
    setFieldErrors((prev) => ({
      ...prev,
      [`discography.releases.${releaseIndex}.links.${linkIndex}.${key}`]: []
    }));
    setDirty();
  };

  const setAllSectionsOpen = (isOpen: boolean) => {
    setOpenSections(() => {
      const next: Record<string, boolean> = {};
      for (const [sectionTitle] of groupedFields) {
        next[sectionTitle] = isOpen;
      }
      return next;
    });
  };

  const onToggleSection = (sectionTitle: string, isOpen: boolean) => {
    setOpenSections((previous) => ({ ...previous, [sectionTitle]: isOpen }));
  };

  const onJumpToSection = (sectionTitle: string) => {
    setOpenSections((previous) => ({ ...previous, [sectionTitle]: true }));
    const sectionId = sectionToId(sectionTitle);
    const node = sectionRefs.current[sectionId] ?? document.getElementById(sectionId);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return <p className="text-[#d9c6ac]">Inhoud laden...</p>;
  }

  if (!content) {
    return <p className="text-[#ffb4a8]">Geen content gevonden om te bewerken.</p>;
  }

  const statusColorClass =
    statusTone === "success" ? "text-[#b6efb9]" : statusTone === "error" ? "text-[#ffb4a8]" : "text-[#d9c6ac]";
  const editorInputClass =
    "mt-1 w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-sm text-[var(--color-text-primary)]";

  return (
    <section
      aria-labelledby="content-editor-title"
      className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-5 sm:p-6"
    >
      <h2 id="content-editor-title" className="mb-2 font-display text-3xl">
        Website-inhoud
      </h2>
      <p className="mb-4 text-sm text-[#d9c6ac]">
        Pas hier alle zichtbare website-inhoud aan. Technische instellingen staan bewust in de Admin Backend.
      </p>

      <div className="sticky top-0 z-30 mb-6 rounded-xl border border-[var(--color-accent-copper)] bg-[linear-gradient(135deg,rgba(16,22,33,0.96),rgba(35,27,22,0.94))] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-amber)]">Sectiemenu</p>
            <p className="text-xs text-[#d9c6ac]">Spring direct naar een onderdeel of klap alle secties in één keer open/dicht.</p>
            <p className={`mt-2 text-xs ${statusColorClass}`} aria-live="polite">
              {statusMessage || "Geen openstaande wijzigingen."}
            </p>
            {statusDetails.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#ffb4a8]">
                {statusDetails.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAllSectionsOpen(true)}
              className="rounded-full border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.06)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.12)]"
            >
              Alles openklappen
            </button>
            <button
              type="button"
              onClick={() => setAllSectionsOpen(false)}
              className="rounded-full border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.06)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.12)]"
            >
              Alles dichtklappen
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-xs font-semibold text-[#d9c6ac]" htmlFor="editor-section-jump">
            Ga naar sectie
          </label>
          <select
            id="editor-section-jump"
            value={jumpTarget}
            onChange={(event) => {
              const value = event.target.value;
              setJumpTarget(value);
              if (value) {
                onJumpToSection(value);
              }
            }}
            className="w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-sm text-[var(--color-text-primary)] sm:max-w-sm"
          >
            <option value="">Kies een sectie...</option>
            {groupedFields.map(([sectionTitle]) => (
              <option key={sectionTitle} value={sectionTitle}>
                {sectionTitle}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {groupedFields.map(([sectionTitle]) => (
              <button
                key={`jump-${sectionTitle}`}
                type="button"
                onClick={() => onJumpToSection(sectionTitle)}
                className="rounded-full border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.06)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.14)]"
              >
                {sectionTitle}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.52)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#f8f5f1]">Discografie beheren</p>
            <p className="text-xs text-[#d9c6ac]">Voeg hier nieuwe liedjes/releases toe of verwijder ze.</p>
          </div>
          <button
            type="button"
            onClick={addRelease}
            className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-4 py-2 text-sm font-semibold text-[var(--color-bg-deep)] hover:bg-[var(--color-accent-copper)]"
          >
            Nieuw liedje toevoegen
          </button>
        </div>
        <ul className="mt-3 space-y-3">
          {releases.map((release, index) => (
            <li key={`${release.title}-${index}`} className="rounded-lg border border-[var(--color-line-muted)] px-3 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-[#f8f5f1]">
                  {index + 1}. {release.title || "Nieuwe release"}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addReleaseLink(index)}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                  >
                    Link toevoegen
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRelease(index)}
                    disabled={releases.length <= 1}
                    className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Titel
                  <input
                    value={release.title}
                    onChange={(event) => updateReleaseField(index, "title", event.target.value)}
                    className={editorInputClass}
                  />
                  {fieldErrors[`discography.releases.${index}.title`]?.[0] ? (
                    <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.title`]?.[0]}</span>
                  ) : null}
                </label>
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Jaar
                  <input
                    value={release.year}
                    onChange={(event) => updateReleaseField(index, "year", event.target.value)}
                    className={editorInputClass}
                  />
                  {fieldErrors[`discography.releases.${index}.year`]?.[0] ? (
                    <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.year`]?.[0]}</span>
                  ) : null}
                </label>
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Type
                  <select
                    value={release.format}
                    onChange={(event) => updateReleaseField(index, "format", event.target.value)}
                    className={editorInputClass}
                  >
                    {RELEASE_FORMAT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {fieldErrors[`discography.releases.${index}.format`]?.[0] ? (
                    <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.format`]?.[0]}</span>
                  ) : null}
                </label>
              </div>

              <label className="mt-3 block text-xs font-semibold text-[#d9c6ac]">
                Korte toelichting
                <textarea
                  rows={3}
                  value={release.note}
                  onChange={(event) => updateReleaseField(index, "note", event.target.value)}
                  className={editorInputClass}
                />
                {fieldErrors[`discography.releases.${index}.note`]?.[0] ? (
                  <span className="mt-1 block text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.note`]?.[0]}</span>
                ) : null}
              </label>

              <p className="mt-3 text-xs font-semibold text-[#d9c6ac]">Links in deze release: {release.links.length}</p>
              <div className="mt-2 space-y-2">
                {release.links.map((link, linkIndex) => (
                  <div key={`${link.label}-${linkIndex}`} className="rounded-lg border border-[var(--color-line-muted)] p-2">
                    <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto] md:items-end">
                      <label className="text-xs font-semibold text-[#d9c6ac]">
                        Linktekst
                        <input
                          value={link.label}
                          onChange={(event) => updateReleaseLinkField(index, linkIndex, "label", event.target.value)}
                          className={editorInputClass}
                        />
                      </label>
                      <label className="text-xs font-semibold text-[#d9c6ac]">
                        Link URL
                        <input
                          value={link.href}
                          onChange={(event) => updateReleaseLinkField(index, linkIndex, "href", event.target.value)}
                          className={editorInputClass}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeReleaseLink(index, linkIndex)}
                        disabled={release.links.length <= 1}
                        className="h-10 rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Verwijder
                      </button>
                    </div>
                    {fieldErrors[`discography.releases.${index}.links.${linkIndex}.label`]?.[0] ? (
                      <p className="mt-1 text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.links.${linkIndex}.label`]?.[0]}</p>
                    ) : null}
                    {fieldErrors[`discography.releases.${index}.links.${linkIndex}.href`]?.[0] ? (
                      <p className="mt-1 text-xs text-[#ffb4a8]">{fieldErrors[`discography.releases.${index}.links.${linkIndex}.href`]?.[0]}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 pb-28">
        {groupedFields.map(([sectionTitle, fields]) => (
          <details
            key={sectionTitle}
            id={sectionToId(sectionTitle)}
            ref={(node) => {
              sectionRefs.current[sectionToId(sectionTitle)] = node;
            }}
            open={openSections[sectionTitle] ?? true}
            onToggle={(event) => onToggleSection(sectionTitle, (event.currentTarget as HTMLDetailsElement).open)}
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
                const showImageTools = isImageSourcePath(field.path);

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
                    {showImageTools ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openMediaModal(field.path)}
                          className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                        >
                          Kies uit fotobibliotheek
                        </button>
                        {field.value ? (
                          <a
                            href={field.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline underline-offset-2 text-[#d9c6ac]"
                          >
                            Voorbeeld openen
                          </a>
                        ) : null}
                      </div>
                    ) : null}
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
              Annuleren
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
            >
              Voorbeeld
            </a>
            <p className="text-xs text-[#d9c6ac]">
              Laatst opgeslagen: {lastSavedAt || "onbekend"} {lastSavedBy ? `door ${lastSavedBy}` : ""}
            </p>
          </div>
          <p aria-live="polite" className={`mt-2 text-sm ${statusColorClass}`}>{statusMessage || "Geen openstaande wijzigingen."}</p>
          {statusDetails.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#ffb4a8]">
              {statusDetails.map((item) => (
                <li key={`bottom-${item}`}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </form>

      {isMediaModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.72)] p-4" role="dialog" aria-modal="true" aria-label="Fotobibliotheek">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(14,19,30,0.98)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line-muted)] px-4 py-3 sm:px-5">
              <div>
                <p className="text-base font-semibold text-[#f8f5f1]">Fotobibliotheek</p>
                <p className="text-xs text-[#d9c6ac]">Kies een bestaande foto of upload een nieuwe.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => mediaUploadInputRef.current?.click()}
                  disabled={isUploadingMedia}
                  className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploadingMedia ? "Uploaden..." : "Foto uploaden"}
                </button>
                <button
                  type="button"
                  onClick={closeMediaModal}
                  className="rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                >
                  Sluiten
                </button>
              </div>
              <input
                ref={mediaUploadInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={onUploadMedia}
                className="sr-only"
              />
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px_180px_auto] sm:items-end">
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Zoek afbeelding
                  <input
                    value={mediaQuery}
                    onChange={(event) => setMediaQuery(event.target.value)}
                    placeholder="Zoek op naam of tag..."
                    className="mt-1 w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  />
                </label>
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Filter op tag
                  <select
                    value={mediaTag}
                    onChange={(event) => setMediaTag(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  >
                    <option value="">Alle tags</option>
                    {mediaTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-[#d9c6ac]">
                  Type
                  <select
                    value={mediaKind}
                    onChange={(event) => setMediaKind(event.target.value === "all" ? "all" : "photo")}
                    className="mt-1 w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  >
                    <option value="photo">Alleen foto&apos;s</option>
                    <option value="all">Alle assets</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void loadMediaLibrary()}
                  className="h-10 rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)]"
                >
                  Toepassen
                </button>
              </div>

              {mediaError ? <p className="mb-3 text-sm text-[#ffb4a8]">{mediaError}</p> : null}
              {isMediaLoading ? <p className="text-sm text-[#d9c6ac]">Fotobibliotheek laden...</p> : null}
              {!isMediaLoading && mediaFiles.length === 0 ? (
                <p className="text-sm text-[#d9c6ac]">Nog geen afbeeldingen gevonden.</p>
              ) : null}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {mediaFiles.map((file) => (
                  <button
                    key={file.src}
                    type="button"
                    onClick={() => onSelectMedia(file.src)}
                    className="overflow-hidden rounded-xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.6)] text-left transition-colors hover:border-[var(--color-accent-copper)]"
                  >
                    <Image
                      src={file.src}
                      alt={file.name}
                      width={480}
                      height={280}
                      className="h-28 w-full object-cover"
                    />
                    <p className="truncate px-2 py-2 text-[11px] text-[#d9c6ac]" title={file.src}>
                      {file.src}
                    </p>
                    {file.tags.length > 0 || file.kind ? (
                      <div className="flex flex-wrap gap-1 px-2 pb-2">
                        {file.kind ? (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] ${
                              file.kind === "photo"
                                ? "border-[rgba(118,203,147,0.4)] text-[#b6efb9]"
                                : "border-[var(--color-line-muted)] text-[#d9c6ac]"
                            }`}
                          >
                            {file.kind === "photo" ? "foto" : "asset"}
                          </span>
                        ) : null}
                        {file.tags.slice(0, 3).map((tag) => (
                          <span key={`${file.src}-${tag}`} className="rounded-full border border-[var(--color-line-muted)] px-2 py-0.5 text-[10px] text-[#d9c6ac]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
