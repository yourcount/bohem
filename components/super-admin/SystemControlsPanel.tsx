"use client";

import { useEffect, useState } from "react";

type FeatureFlag = {
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
  updatedBy: string;
};

type SystemSettings = {
  jobs_enabled: boolean;
  jobs_poll_interval_seconds: number;
  cache_auto_invalidate_on_update: boolean;
  updated_at: string;
  updated_by: string;
};

type EnvProfile = {
  nodeEnv: string;
  siteUrl: string;
  authSecretSet: boolean;
  authSecretPreview: string;
  runtime: string;
  region: string;
};

type JobsPayload = {
  ok: true;
  jobs: Array<Record<string, unknown>>;
};

type ApiError = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

type StatusTone = "neutral" | "success" | "error";

function toneClass(tone: StatusTone) {
  if (tone === "success") return "text-[#b6efb9]";
  if (tone === "error") return "text-[#ffb4a8]";
  return "text-[#d9c6ac]";
}

export function SystemControlsPanel() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [env, setEnv] = useState<EnvProfile | null>(null);
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([]);
  const [flagDraft, setFlagDraft] = useState<Record<string, boolean>>({});
  const [settingsDraft, setSettingsDraft] = useState<SystemSettings | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingFlags, setIsSavingFlags] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const inputClass =
    "mt-2 w-full rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)]";

  const load = async () => {
    setIsLoading(true);
    try {
      const [flagsRes, settingsRes, jobsRes] = await Promise.all([
        fetch("/api/super-admin/system/feature-flags"),
        fetch("/api/super-admin/system/settings"),
        fetch("/api/super-admin/system/jobs")
      ]);

      const flagsPayload = (await flagsRes.json()) as { ok: true; flags: FeatureFlag[] } | ApiError;
      const settingsPayload = (await settingsRes.json()) as
        | { ok: true; settings: SystemSettings; environment: EnvProfile }
        | ApiError;
      const jobsPayload = (await jobsRes.json()) as JobsPayload | ApiError;

      if (!flagsRes.ok || !("ok" in flagsPayload)) {
        const apiError = flagsPayload as ApiError;
        throw new Error(apiError.error || "Feature flags laden mislukt.");
      }
      if (!settingsRes.ok || !("ok" in settingsPayload)) {
        const apiError = settingsPayload as ApiError;
        throw new Error(apiError.error || "System settings laden mislukt.");
      }
      if (!jobsRes.ok || !("ok" in jobsPayload)) {
        const apiError = jobsPayload as ApiError;
        throw new Error(apiError.error || "Jobstatus laden mislukt.");
      }

      setFlags(flagsPayload.flags);
      setFlagDraft(Object.fromEntries(flagsPayload.flags.map((flag) => [flag.key, flag.enabled])));
      setSettings(settingsPayload.settings);
      setSettingsDraft(settingsPayload.settings);
      setEnv(settingsPayload.environment);
      setJobs(jobsPayload.jobs);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "System data laden mislukt.");
      setStatusTone("error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const hasFlagChanges =
    flags.length > 0 &&
    flags.some((flag) => {
      const draftValue = flagDraft[flag.key];
      return typeof draftValue === "boolean" && draftValue !== flag.enabled;
    });

  const saveFlags = async () => {
    setIsSavingFlags(true);
    setStatusMessage("Feature flags opslaan...");
    setStatusTone("neutral");

    try {
      const response = await fetch("/api/super-admin/system/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flagDraft)
      });

      const payload = (await response.json()) as { ok: true; flags: FeatureFlag[] } | ApiError;
      if (!response.ok || !("ok" in payload)) {
        const apiError = payload as ApiError;
        const validationDetails = apiError.fieldErrors
          ? Object.entries(apiError.fieldErrors)
              .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
              .join(" | ")
          : "";
        setStatusMessage(validationDetails ? `${apiError.error || "Feature flags opslaan mislukt."} (${validationDetails})` : (apiError.error || "Feature flags opslaan mislukt."));
        setStatusTone("error");
        return;
      }

      setFlags(payload.flags);
      setFlagDraft(Object.fromEntries(payload.flags.map((flag) => [flag.key, flag.enabled])));
      setStatusMessage("Feature flags opgeslagen.");
      setStatusTone("success");
      await load();
    } catch {
      setStatusMessage("Netwerkfout bij feature flags opslaan.");
      setStatusTone("error");
    } finally {
      setIsSavingFlags(false);
    }
  };

  const onToggleFlag = (key: string, checked: boolean) => {
    setFlagDraft((prev) => ({ ...prev, [key]: checked }));
    setStatusMessage("Niet-opgeslagen wijzigingen in feature flags.");
    setStatusTone("neutral");
  };

  const saveSettings = async () => {
    if (!settingsDraft) return;

    setIsSavingSettings(true);
    setStatusMessage("Technische instellingen opslaan...");
    setStatusTone("neutral");

    try {
      const response = await fetch("/api/super-admin/system/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobs_enabled: settingsDraft.jobs_enabled,
          jobs_poll_interval_seconds: settingsDraft.jobs_poll_interval_seconds,
          cache_auto_invalidate_on_update: settingsDraft.cache_auto_invalidate_on_update
        })
      });

      const payload = (await response.json()) as { ok: true; settings: SystemSettings; environment: EnvProfile } | ApiError;
      if (!response.ok || !("ok" in payload)) {
        setStatusMessage((payload as ApiError).error || "Technische instellingen opslaan mislukt.");
        setStatusTone("error");
        return;
      }

      setSettings(payload.settings);
      setSettingsDraft(payload.settings);
      setEnv(payload.environment);
      setStatusMessage("Technische instellingen opgeslagen.");
      setStatusTone("success");
      await load();
    } catch {
      setStatusMessage("Netwerkfout bij technische instellingen opslaan.");
      setStatusTone("error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading || !settingsDraft || !settings || !env) {
    return <p className="text-sm text-[#d9c6ac]">System controls laden...</p>;
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Feature flags</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Schakel visuele of functionele onderdelen gecontroleerd aan of uit.</p>
        <p className={`mt-2 text-xs ${toneClass(statusTone)}`} aria-live="polite">
          {statusTone === "success" && statusMessage ? <span aria-hidden="true" className="success-pop">✓</span> : null}
          {statusMessage || "Nog geen wijzigingen opgeslagen."}
        </p>

        <ul className="mt-4 grid gap-3">
          {flags.map((flag) => (
            <li key={flag.key} className="rounded-lg border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-3">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(flagDraft[flag.key])}
                  onChange={(event) => onToggleFlag(flag.key, event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[var(--color-line-muted)]"
                />
                <span>
                  <span className="block font-semibold text-[var(--color-text-primary)]">{flag.key}</span>
                  <span className="block text-[#d9c6ac]">{flag.description}</span>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      flagDraft[flag.key]
                        ? "bg-[rgba(118,203,147,0.2)] text-[#b6efb9]"
                        : "bg-[rgba(255,180,168,0.2)] text-[#ffb4a8]"
                    }`}
                  >
                    {flagDraft[flag.key] ? "Aan" : "Uit"}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => void saveFlags()}
          disabled={isSavingFlags || !hasFlagChanges}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSavingFlags ? "Opslaan..." : hasFlagChanges ? "Feature flags opslaan" : "Geen wijzigingen"}
        </button>
      </section>

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Technische instellingen</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Veilige runtime-parameters voor beheer en invalidatiegedrag.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            Jobs actief
            <select
              className={inputClass}
              value={settingsDraft.jobs_enabled ? "true" : "false"}
              onChange={(event) =>
                setSettingsDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        jobs_enabled: event.target.value === "true"
                      }
                    : prev
                )
              }
            >
              <option value="true">Ja</option>
              <option value="false">Nee</option>
            </select>
          </label>

          <label className="text-sm">
            Poll interval (seconden)
            <input
              type="number"
              min={10}
              max={3600}
              className={inputClass}
              value={settingsDraft.jobs_poll_interval_seconds}
              onChange={(event) =>
                setSettingsDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        jobs_poll_interval_seconds: Number(event.target.value)
                      }
                    : prev
                )
              }
            />
          </label>

          <label className="text-sm">
            Auto invalidatie bij updates
            <select
              className={inputClass}
              value={settingsDraft.cache_auto_invalidate_on_update ? "true" : "false"}
              onChange={(event) =>
                setSettingsDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        cache_auto_invalidate_on_update: event.target.value === "true"
                      }
                    : prev
                )
              }
            >
              <option value="true">Ja</option>
              <option value="false">Nee</option>
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-[#d9c6ac]">Laatst bijgewerkt: {settings.updated_at} door {settings.updated_by}</p>

        <button
          type="button"
          onClick={() => void saveSettings()}
          disabled={isSavingSettings}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSavingSettings ? "Opslaan..." : "Technische instellingen opslaan"}
        </button>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
          <h2 className="font-display text-3xl">Omgeving (veilig)</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#d9c6ac]">
            <li>Environment: <strong className="text-[var(--color-text-primary)]">{env.nodeEnv}</strong></li>
            <li>Site URL: <strong className="text-[var(--color-text-primary)]">{env.siteUrl}</strong></li>
            <li>Auth secret: <strong className="text-[var(--color-text-primary)]">{env.authSecretPreview}</strong></li>
            <li>Runtime: <strong className="text-[var(--color-text-primary)]">{env.runtime}</strong></li>
            <li>Region: <strong className="text-[var(--color-text-primary)]">{env.region}</strong></li>
          </ul>
        </article>

        <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
          <h2 className="font-display text-3xl">Jobs & queue (read-only)</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#d9c6ac]">
            {jobs.map((job) => (
              <li key={String(job.key)} className="rounded-lg border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-3">
                <p className="font-semibold text-[var(--color-text-primary)]">{String(job.label)}</p>
                <p>Status: {String(job.status)} · modus: {String(job.mode)}</p>
                {job.note ? <p>{String(job.note)}</p> : null}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <p className={`text-sm ${toneClass(statusTone)}`}>
        {statusTone === "success" && statusMessage ? <span aria-hidden="true" className="success-pop">✓</span> : null}
        {statusMessage}
      </p>
    </div>
  );
}
