"use client";

import { useEffect, useMemo, useState } from "react";
import { StickyStatusBar, formatFieldErrors, useUnsavedChangesGuard, type StatusTone } from "@/components/super-admin/admin-ui";

type CacheSettings = {
  id: number;
  public_content_ttl_seconds: number;
  seo_settings_ttl_seconds: number;
  updated_at: string;
  updated_by: string;
};

type RuntimeStatus = {
  entries: number;
  keys: Array<{ key: string; createdAt: string; expiresAt: string; secondsRemaining: number }>;
};

type Invalidation = {
  id: number;
  scope: "sitewide" | "route";
  route_path: string | null;
  reason: string | null;
  triggered_by: string;
  created_at: string;
};

type CachePayload = {
  ok: boolean;
  settings: CacheSettings;
  runtime: RuntimeStatus;
  recentInvalidations: Invalidation[];
};

type ApiError = {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

export function CacheManagementPanel() {
  const [settings, setSettings] = useState<CacheSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<CacheSettings | null>(null);
  const [runtime, setRuntime] = useState<RuntimeStatus>({ entries: 0, keys: [] });
  const [invalidations, setInvalidations] = useState<Invalidation[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [statusDetails, setStatusDetails] = useState<string[]>([]);
  const [lastActionAt, setLastActionAt] = useState("");
  const [invalidationScope, setInvalidationScope] = useState<"sitewide" | "route">("sitewide");
  const [invalidationRoute, setInvalidationRoute] = useState("/");
  const [invalidationReason, setInvalidationReason] = useState("");

  const isPristine = useMemo(() => {
    if (!settings || !initialSettings) return true;
    return (
      settings.public_content_ttl_seconds === initialSettings.public_content_ttl_seconds &&
      settings.seo_settings_ttl_seconds === initialSettings.seo_settings_ttl_seconds
    );
  }, [settings, initialSettings]);
  useUnsavedChangesGuard(!isPristine);

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/super-admin/cache/settings");
      const payload = (await response.json()) as CachePayload | ApiError;
      if (!response.ok || !("ok" in payload)) {
        const apiError = payload as ApiError;
        setStatusMessage(apiError.error ?? "Cache data laden mislukt.");
        setStatusTone("error");
        setStatusDetails(formatFieldErrors(apiError.fieldErrors));
        return;
      }

      setSettings(payload.settings);
      setInitialSettings(payload.settings);
      setRuntime(payload.runtime);
      setInvalidations(payload.recentInvalidations);
      setLastActionAt(payload.settings.updated_at);
    } catch {
      setStatusMessage("Netwerkfout bij laden van cache data.");
      setStatusTone("error");
      setStatusDetails([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const inputClass =
    "mt-2 w-full rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)]";

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setFieldErrors({});
    setStatusMessage("Cache instellingen opslaan...");
    setStatusTone("neutral");
    setStatusDetails([]);

    try {
      const response = await fetch("/api/super-admin/cache/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_content_ttl_seconds: settings.public_content_ttl_seconds,
          seo_settings_ttl_seconds: settings.seo_settings_ttl_seconds
        })
      });

      const payload = (await response.json()) as CachePayload | ApiError;
      if (!response.ok || !("ok" in payload)) {
        const apiError = payload as ApiError;
        setFieldErrors(apiError.fieldErrors ?? {});
        setStatusMessage(apiError.error ?? "Opslaan mislukt.");
        setStatusTone("error");
        setStatusDetails(formatFieldErrors(apiError.fieldErrors));
        return;
      }

      setSettings(payload.settings);
      setInitialSettings(payload.settings);
      setRuntime(payload.runtime);
      setInvalidations(payload.recentInvalidations);
      setStatusMessage("Cache instellingen opgeslagen.");
      setStatusTone("success");
      setStatusDetails([]);
      setLastActionAt(payload.settings.updated_at);
    } catch {
      setStatusMessage("Netwerkfout bij opslaan.");
      setStatusTone("error");
      setStatusDetails([]);
    } finally {
      setIsSaving(false);
    }
  };

  const runInvalidation = async () => {
    const impact =
      invalidationScope === "sitewide"
        ? "Deze actie leegt de volledige sitecache."
        : `Deze actie leegt de cache voor route "${invalidationRoute}".`;
    const confirmed = window.confirm(`Cache invalidatie starten?\n\nImpact: ${impact}\n\nWeet je zeker dat je door wilt gaan?`);
    if (!confirmed) return;

    setIsInvalidating(true);
    setStatusMessage("Cache invalidatie uitvoeren...");
    setStatusTone("neutral");
    setStatusDetails([]);

    try {
      const response = await fetch("/api/super-admin/cache/invalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: invalidationScope,
          routePath: invalidationScope === "route" ? invalidationRoute : null,
          reason: invalidationReason
        })
      });

      const payload = (await response.json()) as
        | { ok: true; message: string; runtime: RuntimeStatus; recentInvalidations: Invalidation[] }
        | ApiError;

      if (!response.ok || !("ok" in payload)) {
        const apiError = payload as ApiError;
        setStatusMessage(apiError.error ?? "Cache invalidatie mislukt.");
        setStatusTone("error");
        setStatusDetails(formatFieldErrors(apiError.fieldErrors));
        return;
      }

      setRuntime(payload.runtime);
      setInvalidations(payload.recentInvalidations);
      setStatusMessage(payload.message);
      setStatusTone("success");
      setStatusDetails([]);
      setLastActionAt(new Date().toLocaleString("nl-NL"));
    } catch {
      setStatusMessage("Netwerkfout bij invalidatie.");
      setStatusTone("error");
      setStatusDetails([]);
    } finally {
      setIsInvalidating(false);
    }
  };

  if (isLoading || !settings) {
    return <p className="text-sm text-[#d9c6ac]">Cache instellingen laden...</p>;
  }

  return (
    <div className="grid gap-6">
      <StickyStatusBar
        tone={statusTone}
        message={statusMessage}
        details={statusDetails}
        hasUnsavedChanges={!isPristine}
        updatedAt={lastActionAt || settings.updated_at}
      />
      <form onSubmit={saveSettings} className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">TTL instellingen</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Stel per cachetype in hoe lang data in runtime-cache mag blijven.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Public content TTL (seconden)
            <input
              type="number"
              min={5}
              max={3600}
              className={inputClass}
              value={settings.public_content_ttl_seconds}
              onChange={(event) =>
                setSettings((prev) => (prev ? { ...prev, public_content_ttl_seconds: Number(event.target.value) } : prev))
              }
            />
            {fieldErrors.public_content_ttl_seconds?.map((error) => (
              <span key={error} className="mt-1 block text-xs text-[#ffb4a8]">
                {error}
              </span>
            ))}
          </label>

          <label className="text-sm">
            SEO settings TTL (seconden)
            <input
              type="number"
              min={5}
              max={3600}
              className={inputClass}
              value={settings.seo_settings_ttl_seconds}
              onChange={(event) =>
                setSettings((prev) => (prev ? { ...prev, seo_settings_ttl_seconds: Number(event.target.value) } : prev))
              }
            />
            {fieldErrors.seo_settings_ttl_seconds?.map((error) => (
              <span key={error} className="mt-1 block text-xs text-[#ffb4a8]">
                {error}
              </span>
            ))}
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#d9c6ac]">Laatst bijgewerkt: {settings.updated_at} door {settings.updated_by}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!initialSettings) return;
                setSettings(initialSettings);
                setFieldErrors({});
                setStatusDetails([]);
                setStatusMessage("TTL wijzigingen teruggezet.");
                setStatusTone("neutral");
              }}
              disabled={isSaving || isPristine}
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSaving || isPristine}
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </form>

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Handmatige invalidatie</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Gebruik sitewide voor alle publieke cache. Gebruik route voor gerichte flush (vooral `/`).</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            Scope
            <select
              className={inputClass}
              value={invalidationScope}
              onChange={(event) => setInvalidationScope(event.target.value as "sitewide" | "route")}
            >
              <option value="sitewide">Sitewide</option>
              <option value="route">Per route</option>
            </select>
          </label>

          <label className="text-sm">
            Route pad
            <input
              className={inputClass}
              value={invalidationRoute}
              disabled={invalidationScope !== "route"}
              onChange={(event) => setInvalidationRoute(event.target.value)}
              placeholder="/"
            />
          </label>

          <label className="text-sm">
            Reden (optioneel)
            <input className={inputClass} value={invalidationReason} onChange={(event) => setInvalidationReason(event.target.value)} />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#d9c6ac]">Runtime cache entries: {runtime.entries}</p>
          <button
            type="button"
            onClick={() => void runInvalidation()}
            disabled={isInvalidating}
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isInvalidating ? "Uitvoeren..." : "Invalidatie uitvoeren"}
          </button>
        </div>

        <ul className="mt-4 grid gap-2">
          {runtime.keys.map((entry) => (
            <li key={entry.key} className="rounded-lg border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-3 text-xs text-[#d9c6ac]">
              <strong className="text-[var(--color-text-primary)]">{entry.key}</strong> · verloopt over {entry.secondsRemaining}s
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Laatste invalidaties</h2>
        <ul className="mt-4 max-h-[360px] space-y-2 overflow-auto">
          {invalidations.map((item) => (
            <li key={item.id} className="rounded-lg border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-3 text-sm">
              <p className="font-semibold text-[var(--color-text-primary)]">
                {item.scope === "sitewide" ? "Sitewide" : `Route ${item.route_path}`}
              </p>
              <p className="text-xs text-[#d9c6ac]">Door {item.triggered_by} · {item.created_at}</p>
              {item.reason ? <p className="mt-1 text-xs text-[#d9c6ac]">Reden: {item.reason}</p> : null}
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
