"use client";

import { useEffect, useMemo, useState } from "react";

type SeoSettings = {
  global_title_template: string;
  global_meta_template: string;
  home_title: string;
  home_description: string;
  home_og_title: string;
  home_og_description: string;
  home_canonical: string;
  home_robots_index: boolean;
  home_robots_follow: boolean;
  home_json_ld_mode: "auto" | "custom";
  home_json_ld_custom: string;
};

type SeoApiSuccess = {
  ok: true;
  settings: SeoSettings;
  updated_at: string;
  updated_by: string;
};

type SeoApiError = {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

type StatusTone = "neutral" | "success" | "error";

const initialValues: SeoSettings = {
  global_title_template: "%s",
  global_meta_template: "%s",
  home_title: "",
  home_description: "",
  home_og_title: "",
  home_og_description: "",
  home_canonical: "/",
  home_robots_index: true,
  home_robots_follow: true,
  home_json_ld_mode: "auto",
  home_json_ld_custom: ""
};

function toneClasses(tone: StatusTone) {
  if (tone === "success") return "text-[#b6efb9]";
  if (tone === "error") return "text-[#ffb4a8]";
  return "text-[#d9c6ac]";
}

export function SeoSettingsForm() {
  const [form, setForm] = useState<SeoSettings>(initialValues);
  const [initial, setInitial] = useState<SeoSettings>(initialValues);
  const [updatedAt, setUpdatedAt] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setStatusMessage("");
      setStatusTone("neutral");

      try {
        const response = await fetch("/api/super-admin/seo/settings", { method: "GET" });
        const payload = (await response.json()) as SeoApiSuccess | SeoApiError;

        if (!response.ok || !("ok" in payload)) {
          const apiError = payload as SeoApiError;
          setStatusMessage(apiError.error ?? "SEO instellingen laden mislukt.");
          setStatusTone("error");
          return;
        }

        setForm(payload.settings);
        setInitial(payload.settings);
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

  const isPristine = useMemo(() => JSON.stringify(form) === JSON.stringify(initial), [form, initial]);

  const updateField = <K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: [] }));

    if (statusTone !== "error") {
      setStatusMessage("Niet-opgeslagen wijzigingen.");
      setStatusTone("neutral");
    }
  };

  const onReset = () => {
    setForm(initial);
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
      const response = await fetch("/api/super-admin/seo/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as SeoApiSuccess | SeoApiError;

      if (!response.ok || !("ok" in payload)) {
        const apiError = payload as SeoApiError;
        setFieldErrors(apiError.fieldErrors ?? {});
        setStatusMessage(apiError.error ?? "SEO instellingen opslaan mislukt.");
        setStatusTone("error");
        return;
      }

      setForm(payload.settings);
      setInitial(payload.settings);
      setUpdatedAt(payload.updated_at);
      setUpdatedBy(payload.updated_by);
      setStatusMessage("SEO instellingen opgeslagen.");
      setStatusTone("success");
    } catch {
      setStatusMessage("Netwerkfout bij opslaan.");
      setStatusTone("error");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)]";

  if (isLoading) {
    return <p className="text-sm text-[#d9c6ac]">SEO instellingen laden...</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Global SEO defaults</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Gebruik `%s` als placeholder. Voorbeeld: `%s | Bohèm`.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Titel template
            <input
              className={inputClass}
              value={form.global_title_template}
              onChange={(event) => updateField("global_title_template", event.target.value)}
            />
            {fieldErrors.global_title_template?.map((err) => (
              <span key={err} className="mt-1 block text-xs text-[#ffb4a8]">
                {err}
              </span>
            ))}
          </label>

          <label className="text-sm">
            Beschrijving template
            <input
              className={inputClass}
              value={form.global_meta_template}
              onChange={(event) => updateField("global_meta_template", event.target.value)}
            />
            {fieldErrors.global_meta_template?.map((err) => (
              <span key={err} className="mt-1 block text-xs text-[#ffb4a8]">
                {err}
              </span>
            ))}
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Homepagina metadata</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Alles hieronder geldt voor `https://musicbybohem.nl/`.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Paginatitel
            <input className={inputClass} value={form.home_title} onChange={(event) => updateField("home_title", event.target.value)} />
            {fieldErrors.home_title?.map((err) => (
              <span key={err} className="mt-1 block text-xs text-[#ffb4a8]">
                {err}
              </span>
            ))}
          </label>

          <label className="text-sm md:col-span-2">
            Meta description
            <textarea
              className={`${inputClass} min-h-28 resize-y`}
              value={form.home_description}
              onChange={(event) => updateField("home_description", event.target.value)}
            />
            {fieldErrors.home_description?.map((err) => (
              <span key={err} className="mt-1 block text-xs text-[#ffb4a8]">
                {err}
              </span>
            ))}
          </label>

          <label className="text-sm">
            OG titel
            <input className={inputClass} value={form.home_og_title} onChange={(event) => updateField("home_og_title", event.target.value)} />
            {fieldErrors.home_og_title?.map((err) => (
              <span key={err} className="mt-1 block text-xs text-[#ffb4a8]">
                {err}
              </span>
            ))}
          </label>

          <label className="text-sm">
            Canonical URL
            <input className={inputClass} value={form.home_canonical} onChange={(event) => updateField("home_canonical", event.target.value)} />
            {fieldErrors.home_canonical?.map((err) => (
              <span key={err} className="mt-1 block text-xs text-[#ffb4a8]">
                {err}
              </span>
            ))}
          </label>

          <label className="text-sm md:col-span-2">
            OG beschrijving
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={form.home_og_description}
              onChange={(event) => updateField("home_og_description", event.target.value)}
            />
            {fieldErrors.home_og_description?.map((err) => (
              <span key={err} className="mt-1 block text-xs text-[#ffb4a8]">
                {err}
              </span>
            ))}
          </label>

          <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.4)] p-4 md:col-span-2">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Robots directives</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.home_robots_index}
                  onChange={(event) => updateField("home_robots_index", event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-line-muted)]"
                />
                Zoekmachines mogen indexeren
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.home_robots_follow}
                  onChange={(event) => updateField("home_robots_follow", event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-line-muted)]"
                />
                Zoekmachines mogen links volgen
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">JSON-LD</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Laat op automatisch staan tenzij je bewust een custom schema wilt beheren.</p>

        <div className="mt-4 grid gap-4">
          <label className="text-sm">
            JSON-LD modus
            <select
              className={inputClass}
              value={form.home_json_ld_mode}
              onChange={(event) => updateField("home_json_ld_mode", event.target.value as "auto" | "custom")}
            >
              <option value="auto">Automatisch (aanbevolen)</option>
              <option value="custom">Custom JSON-LD</option>
            </select>
            {fieldErrors.home_json_ld_mode?.map((err) => (
              <span key={err} className="mt-1 block text-xs text-[#ffb4a8]">
                {err}
              </span>
            ))}
          </label>

          {form.home_json_ld_mode === "custom" ? (
            <label className="text-sm">
              JSON-LD invoer
              <textarea
                className={`${inputClass} min-h-[220px] resize-y font-mono text-xs`}
                value={form.home_json_ld_custom}
                onChange={(event) => updateField("home_json_ld_custom", event.target.value)}
                spellCheck={false}
              />
              {fieldErrors.home_json_ld_custom?.map((err) => (
                <span key={err} className="mt-1 block text-xs text-[#ffb4a8]">
                  {err}
                </span>
              ))}
            </label>
          ) : null}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className={`text-sm ${toneClasses(statusTone)}`}>{statusMessage}</div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving || isPristine}
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Terugzetten
          </button>
          <button
            type="submit"
            disabled={isSaving || isPristine}
            className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </section>

      <p className="text-xs text-[#d9c6ac]">Laatst bijgewerkt: {updatedAt || "onbekend"} door {updatedBy || "onbekend"}</p>
    </form>
  );
}
