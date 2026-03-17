"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type HealthResponse = {
  ok: boolean;
  checks: Array<{ name: string; status: "ok" | "fail"; detail: string }>;
  generatedAt: string;
};

type OverviewResponse = {
  ok: boolean;
  contentStatus: {
    updatedAt: string;
    updatedBy: string;
    storage: string;
    cacheAutoInvalidateOnUpdate: boolean;
  };
  frontendImpact: Array<{
    key: string;
    label: string;
    state: "visible" | "hidden";
    reason: string;
  }>;
  contactHealth: {
    status: "ok" | "attention";
    mailgun: {
      configured: boolean;
      hasApiKey: boolean;
      hasDomain: boolean;
      hasFromEmail: boolean;
      hasToEmail: boolean;
      hasFromName: boolean;
      region: string;
    };
    turnstile: {
      enabled: boolean;
      hasSiteKey: boolean;
      hasSecretKey: boolean;
    };
    inbox: string;
  };
  configurationSummary: {
    siteUrl: string;
    runtime: string;
    storage: string;
    blobConfigured: boolean;
    analyticsEnabled: boolean;
    authSecretSet: boolean;
    region: string;
  };
  cacheSummary: {
    runtimeEntries: number;
    publicContentTtlSeconds: number;
    seoSettingsTtlSeconds: number;
    recentInvalidations: Array<{
      id: number;
      scope: "sitewide" | "route";
      route_path: string | null;
      reason: string | null;
      triggered_by: string;
      created_at: string;
    }>;
  };
  warnings: string[];
};

type AuditResponse = {
  ok: boolean;
  events: Array<{
    id: number;
    actorEmail: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
  }>;
};

const domains = [
  {
    key: "seo",
    title: "SEO",
    description: "Global defaults, per-pagina metadata, OG, canonical en JSON-LD templates.",
    status: "Actief",
    href: "/admin/backend/seo"
  },
  {
    key: "users",
    title: "Gebruikers",
    description: "Rollen, accountstatus, reset flow en sessiebeheer.",
    status: "Actief",
    href: "/admin/backend/users"
  },
  {
    key: "cache",
    title: "Cache",
    description: "Cache-status, invalidatie en TTL per type.",
    status: "Actief",
    href: "/admin/backend/cache"
  },
  {
    key: "system",
    title: "Systeem",
    description: "Feature flags, health checks en job/queue observability.",
    status: "Actief",
    href: "/admin/backend/system"
  }
];

const amsterdamDateTime = new Intl.DateTimeFormat("nl-NL", {
  timeZone: "Europe/Amsterdam",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

function formatAuditAction(action: string) {
  switch (action) {
    case "CONTENT_EDITOR_UPDATED":
      return "Website-inhoud opgeslagen";
    case "SYSTEM_TECHNICAL_SETTINGS_UPDATED":
      return "Technische instellingen opgeslagen";
    case "SYSTEM_FEATURE_FLAGS_UPDATED":
      return "Feature flags opgeslagen";
    case "CACHE_SETTINGS_UPDATED":
      return "Cache-instellingen opgeslagen";
    default:
      return action
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function formatAuditTarget(targetType: string, targetId: string) {
  if (targetType === "content" && targetId === "site_content_full_v1_editor") {
    return "Website-inhoud";
  }
  if (targetType === "system" && targetId === "technical_settings_v1") {
    return "Technische instellingen";
  }
  if (targetType === "system" && targetId === "feature_flags_v1") {
    return "Feature flags";
  }
  if (targetType === "cache" && targetId === "cache_settings_v1") {
    return "Cache-instellingen";
  }
  return `${targetType}:${targetId}`;
}

function formatAuditTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return amsterdamDateTime.format(date);
}

function formatYesNo(value: boolean) {
  return value ? "Ja" : "Nee";
}

function formatRuntimeLabel(value: string) {
  switch (value) {
    case "vercel":
      return "Vercel";
    case "local":
      return "Lokaal";
    default:
      return value;
  }
}

function getAuditDomain(event: AuditResponse["events"][number]) {
  if (event.targetType === "content") return "Inhoud";
  if (event.targetType === "cache") return "Cache";
  if (event.targetType === "system") return "Systeem";
  if (event.targetType === "user") return "Gebruikers";
  if (event.targetType === "seo") return "SEO";
  return event.targetType;
}

export function SuperAdminShell() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [auditQuery, setAuditQuery] = useState("");
  const [auditActorFilter, setAuditActorFilter] = useState("all");
  const [auditDomainFilter, setAuditDomainFilter] = useState("all");

  const load = async () => {
    setLoadError("");
    try {
      const [healthRes, auditRes, overviewRes] = await Promise.all([
        fetch("/api/super-admin/system/health"),
        fetch("/api/super-admin/audit/recent"),
        fetch("/api/super-admin/dashboard/overview")
      ]);

      if (!healthRes.ok || !auditRes.ok || !overviewRes.ok) {
        setLoadError("Admin backend data laden mislukt.");
        return;
      }

      setHealth((await healthRes.json()) as HealthResponse);
      setAudit((await auditRes.json()) as AuditResponse);
      setOverview((await overviewRes.json()) as OverviewResponse);
    } catch {
      setLoadError("Admin backend data laden mislukt.");
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoadError("");
      await load();
    };

    void run();
  }, []);

  const auditActors = useMemo(() => {
    if (!audit) return [];
    return Array.from(new Set(audit.events.map((event) => event.actorEmail))).sort((left, right) => left.localeCompare(right, "nl"));
  }, [audit]);

  const auditDomains = useMemo(() => {
    if (!audit) return [];
    return Array.from(new Set(audit.events.map((event) => getAuditDomain(event)))).sort((left, right) => left.localeCompare(right, "nl"));
  }, [audit]);

  const filteredAuditEvents = useMemo(() => {
    if (!audit) return [];
    const query = auditQuery.trim().toLowerCase();

    return audit.events.filter((event) => {
      const domain = getAuditDomain(event);
      const matchesActor = auditActorFilter === "all" || event.actorEmail === auditActorFilter;
      const matchesDomain = auditDomainFilter === "all" || domain === auditDomainFilter;
      const searchable = [
        event.actorEmail,
        formatAuditAction(event.action),
        formatAuditTarget(event.targetType, event.targetId),
        domain,
        typeof event.metadata?.path === "string" ? event.metadata.path : ""
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      return matchesActor && matchesDomain && matchesQuery;
    });
  }, [audit, auditActorFilter, auditDomainFilter, auditQuery]);

  return (
    <div className="grid gap-6">
      {overview ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl">Live site-overzicht</h2>
                <p className="mt-1 text-sm text-[#d9c6ac]">De belangrijkste live statuspunten op één plek voor inhoud, contact en zichtbare onderdelen.</p>
              </div>
              <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] px-4 py-3 text-sm">
                <p className="text-[#d9c6ac]">Laatste inhoudssave</p>
                <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{formatAuditTime(overview.contentStatus.updatedAt)}</p>
                <p className="mt-1 text-xs text-[#d9c6ac]">door {overview.contentStatus.updatedBy}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Inhoud-opslag</p>
                <p className="mt-2 text-lg font-semibold">{overview.contentStatus.storage}</p>
                <p className="mt-1 text-sm text-[#d9c6ac]">Auto cache verversen: {formatYesNo(overview.contentStatus.cacheAutoInvalidateOnUpdate)}</p>
              </div>
              <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Contact & mail</p>
                <p className="mt-2 text-lg font-semibold">{overview.contactHealth.status === "ok" ? "Operationeel" : "Aandacht nodig"}</p>
                <p className="mt-1 text-sm text-[#d9c6ac]">Mailgun: {formatYesNo(overview.contactHealth.mailgun.configured)} · Turnstile: {formatYesNo(overview.contactHealth.turnstile.enabled)}</p>
              </div>
              <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Runtime cache</p>
                <p className="mt-2 text-lg font-semibold">{overview.cacheSummary.runtimeEntries} entries</p>
                <p className="mt-1 text-sm text-[#d9c6ac]">Public TTL {overview.cacheSummary.publicContentTtlSeconds}s · SEO TTL {overview.cacheSummary.seoSettingsTtlSeconds}s</p>
              </div>
              <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Runtime</p>
                <p className="mt-2 text-lg font-semibold">{formatRuntimeLabel(overview.configurationSummary.runtime)}</p>
                <p className="mt-1 text-sm text-[#d9c6ac]">Regio: {overview.configurationSummary.region}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
            <h2 className="font-display text-2xl">Aandachtspunten</h2>
            <p className="mt-1 text-sm text-[#d9c6ac]">Signaleringen die nu direct effect kunnen hebben op live content of bereikbaarheid.</p>
            {overview.warnings.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {overview.warnings.map((warning) => (
                  <li key={warning} className="rounded-xl border border-[rgba(242,139,14,0.28)] bg-[rgba(242,139,14,0.1)] p-3 text-sm text-[#f8e5c8]">
                    {warning}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4 text-sm text-[#d9c6ac]">
                Geen directe aandachtspunten gevonden. De belangrijkste live randvoorwaarden staan goed.
              </p>
            )}
          </article>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Domeinen</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Kies een beheerdomein. Alleen ADMIN en SUPER_ADMIN hebben toegang.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {domains.map((domain) => (
            <article key={domain.key} className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.3)] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-[var(--color-text-primary)]">{domain.title}</h3>
                <span className="rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[#d9c6ac]">{domain.status}</span>
              </div>
              <p className="text-sm text-[#d9c6ac]">{domain.description}</p>
              <Link
                href={domain.href}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
              >
                Open {domain.title}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl">Recente wijzigingen</h2>
              <p className="mt-1 text-sm text-[#d9c6ac]">Laatste wijzigingen in de inhoud en backend, getoond in Amsterdamse tijd. Filter op gebruiker of domein om sneller te vinden wat je zoekt.</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
            >
              Vernieuwen
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.9fr_0.9fr]">
            <label className="text-sm text-[#d9c6ac]">
              Zoek op gebruiker, actie of bron
              <input
                type="search"
                value={auditQuery}
                onChange={(event) => setAuditQuery(event.target.value)}
                placeholder="Bijv. inhoud, cache, tijmen of seo"
                className="mt-2 w-full rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)]"
              />
            </label>
            <label className="text-sm text-[#d9c6ac]">
              Gebruiker
              <select
                value={auditActorFilter}
                onChange={(event) => setAuditActorFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)]"
              >
                <option value="all">Alle gebruikers</option>
                {auditActors.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-[#d9c6ac]">
              Domein
              <select
                value={auditDomainFilter}
                onChange={(event) => setAuditDomainFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)]"
              >
                <option value="all">Alle domeinen</option>
                {auditDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {audit ? (
            <ul className="mt-4 max-h-[420px] space-y-2 overflow-auto">
              {filteredAuditEvents.map((event) => (
                <li key={event.id} className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-[rgba(242,139,14,0.28)] bg-[rgba(242,139,14,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#f3d7b0]">
                          {getAuditDomain(event)}
                        </span>
                        <span className="inline-flex rounded-full border border-[rgba(242,139,14,0.28)] bg-[rgba(242,139,14,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#f3d7b0]">
                          {formatAuditAction(event.action)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{event.actorEmail}</p>
                        <p className="mt-1 text-xs text-[#d9c6ac]">{formatAuditTarget(event.targetType, event.targetId)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#d9c6ac]">Amsterdamse tijd</p>
                      <p className="mt-1 text-sm text-[var(--color-text-primary)]">{formatAuditTime(event.createdAt)}</p>
                    </div>
                  </div>
                  {event.metadata && typeof event.metadata === "object" && "path" in event.metadata ? (
                    <p className="mt-3 text-xs text-[#d9c6ac]">
                      Bron: <span className="font-semibold text-[#f8f5f1]">{String(event.metadata.path)}</span>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#d9c6ac]">Audit events laden...</p>
          )}
          {audit && filteredAuditEvents.length === 0 ? <p className="mt-4 text-sm text-[#d9c6ac]">Geen wijzigingen gevonden voor deze filters.</p> : null}
      </section>

      {overview ? (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
            <h2 className="font-display text-2xl">Frontend-impact</h2>
            <p className="mt-1 text-sm text-[#d9c6ac]">Welke onderdelen nu zichtbaar zijn op de site en waarom.</p>
            <ul className="mt-4 grid gap-3">
              {overview.frontendImpact.map((item) => (
                <li key={item.key} className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--color-text-primary)]">{item.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                        item.state === "visible" ? "bg-[rgba(88,171,119,0.16)] text-[#b6efb9]" : "bg-[rgba(255,180,168,0.14)] text-[#ffb4a8]"
                      }`}
                    >
                      {item.state === "visible" ? "Zichtbaar" : "Verborgen"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#d9c6ac]">{item.reason}</p>
                </li>
              ))}
            </ul>
          </article>

          <div className="grid gap-6">
            <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
              <h2 className="font-display text-2xl">Contact & mail health</h2>
              <p className="mt-1 text-sm text-[#d9c6ac]">Snelle check of formulierbeveiliging en mailverzending operationeel zijn geconfigureerd.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Turnstile</p>
                  <p className="mt-2 text-lg font-semibold">{overview.contactHealth.turnstile.enabled ? "Actief" : "Uit"}</p>
                  <p className="mt-1 text-sm text-[#d9c6ac]">Site key: {formatYesNo(overview.contactHealth.turnstile.hasSiteKey)} · Secret: {formatYesNo(overview.contactHealth.turnstile.hasSecretKey)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Mailgun</p>
                  <p className="mt-2 text-lg font-semibold">{overview.contactHealth.mailgun.configured ? "Actief" : "Onvolledig"}</p>
                  <p className="mt-1 text-sm text-[#d9c6ac]">Regio: {overview.contactHealth.mailgun.region} · Inbox: {overview.contactHealth.inbox}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-[#d9c6ac]">
                <li>API-sleutel: {formatYesNo(overview.contactHealth.mailgun.hasApiKey)}</li>
                <li>Domein: {formatYesNo(overview.contactHealth.mailgun.hasDomain)}</li>
                <li>Afzenderadres: {formatYesNo(overview.contactHealth.mailgun.hasFromEmail)}</li>
                <li>Ontvangstadres: {formatYesNo(overview.contactHealth.mailgun.hasToEmail)}</li>
                <li>Afzendernaam: {formatYesNo(overview.contactHealth.mailgun.hasFromName)}</li>
              </ul>
            </article>

            <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
              <h2 className="font-display text-2xl">Configuratie-overzicht</h2>
              <p className="mt-1 text-sm text-[#d9c6ac]">Snelle productiecheck voor URL, opslag, analytics en secrets.</p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <dt className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Site URL</dt>
                  <dd className="mt-2 break-all text-sm font-semibold">{overview.configurationSummary.siteUrl}</dd>
                </div>
                <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <dt className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Opslag</dt>
                  <dd className="mt-2 text-sm font-semibold">{overview.configurationSummary.storage}</dd>
                </div>
                <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <dt className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Blob geconfigureerd</dt>
                  <dd className="mt-2 text-sm font-semibold">{formatYesNo(overview.configurationSummary.blobConfigured)}</dd>
                </div>
                <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <dt className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Auth secret aanwezig</dt>
                  <dd className="mt-2 text-sm font-semibold">{formatYesNo(overview.configurationSummary.authSecretSet)}</dd>
                </div>
                <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <dt className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Analytics actief</dt>
                  <dd className="mt-2 text-sm font-semibold">{formatYesNo(overview.configurationSummary.analyticsEnabled)}</dd>
                </div>
                <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                  <dt className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Runtime</dt>
                  <dd className="mt-2 text-sm font-semibold">{formatRuntimeLabel(overview.configurationSummary.runtime)}</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
          <h2 className="font-display text-2xl">Systeemstatus</h2>
          {health ? (
            <ul className="mt-4 space-y-2">
              {health.checks.map((check) => (
                <li key={check.name} className="rounded-lg border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{check.name}</p>
                    <span className={`text-xs font-bold ${check.status === "ok" ? "text-[#b6efb9]" : "text-[#ffb4a8]"}`}>
                      {check.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#d9c6ac]">{check.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#d9c6ac]">Status laden...</p>
          )}
        </article>

        {overview ? (
          <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
            <h2 className="font-display text-2xl">Cache-overzicht</h2>
            <p className="mt-1 text-sm text-[#d9c6ac]">Samenvatting van runtime-cache en de laatste invalidaties, zodat je sneller ziet wat live al vernieuwd is.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Runtime entries</p>
                <p className="mt-2 text-lg font-semibold">{overview.cacheSummary.runtimeEntries}</p>
              </div>
              <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">Auto invalidatie na save</p>
                <p className="mt-2 text-lg font-semibold">{formatYesNo(overview.contentStatus.cacheAutoInvalidateOnUpdate)}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {overview.cacheSummary.recentInvalidations.length > 0 ? (
                overview.cacheSummary.recentInvalidations.map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        {entry.scope === "sitewide" ? "Volledige sitecache" : `Routecache ${entry.route_path || "/"}`}
                      </p>
                      <p className="text-xs text-[#d9c6ac]">{formatAuditTime(entry.created_at)}</p>
                    </div>
                    <p className="mt-1 text-sm text-[#d9c6ac]">Door {entry.triggered_by}{entry.reason ? ` · ${entry.reason}` : ""}</p>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4 text-sm text-[#d9c6ac]">
                  Nog geen recente cache-invalidaties geregistreerd.
                </li>
              )}
            </ul>
          </article>
        ) : null}
      </section>

      {overview ? (
        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
            <h2 className="font-display text-2xl">Gebruik voor superadmins</h2>
            <p className="mt-1 text-sm text-[#d9c6ac]">De home van de backend is nu vooral bedoeld als operationeel overzicht. Gebruik de domeinen hieronder voor detailbeheer.</p>
            <ul className="mt-4 space-y-3 text-sm text-[#d9c6ac]">
              <li className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                Kijk eerst naar <span className="font-semibold text-[var(--color-text-primary)]">Aandachtspunten</span> om blockers of ontbrekende configuratie te zien.
              </li>
              <li className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                Gebruik <span className="font-semibold text-[var(--color-text-primary)]">Frontend-impact</span> om te verifiëren welke secties en sticky elementen nu echt zichtbaar zijn op de live site.
              </li>
              <li className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                Gebruik <span className="font-semibold text-[var(--color-text-primary)]">Recente wijzigingen</span> met filters om snel te zien wie iets heeft aangepast.
              </li>
              <li className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                Gebruik <span className="font-semibold text-[var(--color-text-primary)]">Contact & mail health</span> als eerste check bij formulier- of mailproblemen.
              </li>
            </ul>
          </article>
        </section>
      ) : null}

      {loadError ? <p className="text-sm text-[#ffb4a8]">{loadError}</p> : null}
    </div>
  );
}
