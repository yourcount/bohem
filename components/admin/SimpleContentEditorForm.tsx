"use client";

import { useEffect, useMemo, useState } from "react";

type EditorContent = {
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  arthur_bio: string;
  bettina_bio: string;
  booking_cta_label: string;
  booking_cta_url: string;
  contact_email: string;
  hero_image_url: string;
};

type EditorApiResponse = EditorContent & {
  updated_at: string;
  updated_by: string;
};

type ApiError = {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

type StatusTone = "neutral" | "success" | "error";

const EMPTY_CONTENT: EditorContent = {
  hero_title: "",
  hero_subtitle: "",
  about_text: "",
  arthur_bio: "",
  bettina_bio: "",
  booking_cta_label: "",
  booking_cta_url: "",
  contact_email: "",
  hero_image_url: ""
};

function toneClass(tone: StatusTone) {
  if (tone === "success") return "text-[#b6efb9]";
  if (tone === "error") return "text-[#ffb4a8]";
  return "text-[#d9c6ac]";
}

export function SimpleContentEditorForm() {
  const [form, setForm] = useState<EditorContent>(EMPTY_CONTENT);
  const [initialForm, setInitialForm] = useState<EditorContent>(EMPTY_CONTENT);
  const [updatedAt, setUpdatedAt] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const inputClass =
    "mt-2 w-full rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)]";

  const isPristine = useMemo(() => JSON.stringify(form) === JSON.stringify(initialForm), [form, initialForm]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/content/admin", { method: "GET" });
        const payload = (await response.json()) as EditorApiResponse | ApiError;

        if (!response.ok || !("hero_title" in payload)) {
          const apiError = payload as ApiError;
          setStatusMessage(apiError.error ?? "Inhoud laden mislukt.");
          setStatusTone("error");
          return;
        }

        const loaded: EditorContent = {
          hero_title: payload.hero_title || "",
          hero_subtitle: payload.hero_subtitle || "",
          about_text: payload.about_text || "",
          arthur_bio: payload.arthur_bio || "",
          bettina_bio: payload.bettina_bio || "",
          booking_cta_label: payload.booking_cta_label || "",
          booking_cta_url: payload.booking_cta_url || "",
          contact_email: payload.contact_email || "",
          hero_image_url: payload.hero_image_url || ""
        };

        setForm(loaded);
        setInitialForm(loaded);
        setUpdatedAt(payload.updated_at);
        setUpdatedBy(payload.updated_by);
      } catch {
        setStatusMessage("Er ging iets mis bij laden. Ververs de pagina.");
        setStatusTone("error");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const updateField = <K extends keyof EditorContent>(key: K, value: EditorContent[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: [] }));
    if (statusTone !== "error") {
      setStatusMessage("Niet-opgeslagen wijzigingen.");
      setStatusTone("neutral");
    }
  };

  const onReset = () => {
    setForm(initialForm);
    setFieldErrors({});
    setStatusMessage("Wijzigingen teruggezet.");
    setStatusTone("neutral");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage("Opslaan...");
    setStatusTone("neutral");
    setFieldErrors({});

    try {
      const response = await fetch("/api/content/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { ok: true; updated_at: string; updated_by: string } | ApiError;

      if (!response.ok || !("ok" in payload)) {
        const apiError = payload as ApiError;
        setFieldErrors(apiError.fieldErrors ?? {});
        setStatusMessage(apiError.error ?? "Opslaan mislukt.");
        setStatusTone("error");
        return;
      }

      setInitialForm(form);
      setUpdatedAt(payload.updated_at);
      setUpdatedBy(payload.updated_by);
      setStatusMessage("Wijzigingen opgeslagen en direct live.");
      setStatusTone("success");
    } catch {
      setStatusMessage("Netwerkfout bij opslaan.");
      setStatusTone("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-[#d9c6ac]">Inhoud laden...</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Hero</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Dit is het eerste wat bezoekers zien op de homepage.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Hoofdtitel
            <input className={inputClass} value={form.hero_title} onChange={(e) => updateField("hero_title", e.target.value)} />
            <span className="mt-1 block text-xs text-[#d9c6ac]">Houd kort en krachtig (liefst 4-8 woorden).</span>
            {fieldErrors.hero_title?.map((err) => (
              <span key={err} className="mt-1 block text-xs text-[#ffb4a8]">{err}</span>
            ))}
          </label>

          <label className="text-sm md:col-span-2">
            Korte intro onder titel
            <textarea className={`${inputClass} min-h-24 resize-y`} value={form.hero_subtitle} onChange={(e) => updateField("hero_subtitle", e.target.value)} />
            <span className="mt-1 block text-xs text-[#d9c6ac]">1 tot 2 zinnen die de sfeer en stijl van Bohèm direct uitleggen.</span>
          </label>

          <label className="text-sm md:col-span-2">
            Hero foto (link)
            <input className={inputClass} value={form.hero_image_url} onChange={(e) => updateField("hero_image_url", e.target.value)} />
            <span className="mt-1 block text-xs text-[#d9c6ac]">Gebruik een pad zoals `/images/bohem-hero.jpg` of een volledige link.</span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Over Bohèm</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Kerntekst en persoonlijke bio’s.</p>

        <div className="mt-4 grid gap-4">
          <label className="text-sm">
            Introtekst over Bohèm
            <textarea className={`${inputClass} min-h-28 resize-y`} value={form.about_text} onChange={(e) => updateField("about_text", e.target.value)} />
            <span className="mt-1 block text-xs text-[#d9c6ac]">Kies duidelijke taal; bezoekers moeten in 10 seconden begrijpen wie jullie zijn.</span>
          </label>

          <label className="text-sm">
            Bio Arthur
            <textarea className={`${inputClass} min-h-28 resize-y`} value={form.arthur_bio} onChange={(e) => updateField("arthur_bio", e.target.value)} />
          </label>

          <label className="text-sm">
            Bio Bettina
            <textarea className={`${inputClass} min-h-28 resize-y`} value={form.bettina_bio} onChange={(e) => updateField("bettina_bio", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Boeking & contact</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Pas de belangrijkste actie en contactgegevens aan.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Knoptekst boeking
            <input className={inputClass} value={form.booking_cta_label} onChange={(e) => updateField("booking_cta_label", e.target.value)} />
            <span className="mt-1 block text-xs text-[#d9c6ac]">Bijvoorbeeld: `Vraag beschikbaarheid aan`.</span>
          </label>

          <label className="text-sm">
            Knoplink boeking
            <input className={inputClass} value={form.booking_cta_url} onChange={(e) => updateField("booking_cta_url", e.target.value)} />
            <span className="mt-1 block text-xs text-[#d9c6ac]">Gebruik een pagina-anker (`#contact`) of volledige URL.</span>
          </label>

          <label className="text-sm md:col-span-2">
            Contact e-mailadres
            <input className={inputClass} value={form.contact_email} onChange={(e) => updateField("contact_email", e.target.value)} />
            <span className="mt-1 block text-xs text-[#d9c6ac]">Hierop komen boekingsaanvragen binnen.</span>
          </label>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${toneClass(statusTone)}`}>{statusMessage}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving || isPristine}
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
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
          <button
            type="submit"
            disabled={isSaving || isPristine}
            className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </section>

      <p className="text-xs text-[#d9c6ac]">Laatst opgeslagen: {updatedAt || "onbekend"} door {updatedBy || "onbekend"}</p>
    </form>
  );
}
