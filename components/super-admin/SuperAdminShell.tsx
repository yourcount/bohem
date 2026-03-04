"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HealthResponse = {
  ok: boolean;
  checks: Array<{ name: string; status: "ok" | "fail"; detail: string }>;
  generatedAt: string;
};

type AuditResponse = {
  ok: boolean;
  events: Array<{
    id: number;
    actorEmail: string;
    action: string;
    targetType: string;
    targetId: string;
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
    title: "System",
    description: "Feature flags, health checks en job/queue observability.",
    status: "Actief",
    href: "/admin/backend/system"
  }
];

export function SuperAdminShell() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [loadError, setLoadError] = useState<string>("");

  const load = async () => {
    setLoadError("");
    try {
      const [healthRes, auditRes] = await Promise.all([
        fetch("/api/super-admin/system/health"),
        fetch("/api/super-admin/audit/recent")
      ]);

      if (!healthRes.ok || !auditRes.ok) {
        setLoadError("Admin backend data laden mislukt.");
        return;
      }

      setHealth((await healthRes.json()) as HealthResponse);
      setAudit((await auditRes.json()) as AuditResponse);
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

  return (
    <div className="grid gap-6">
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
              {domain.href ? (
                <Link
                  href={domain.href}
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                >
                  Open {domain.title}
                </Link>
              ) : (
                <span className="mt-4 inline-flex items-center rounded-full border border-[var(--color-line-muted)] px-3 py-1 text-xs text-[#d9c6ac]">
                  Binnenkort beschikbaar
                </span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
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

        <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl">Recent changes</h2>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
            >
              Vernieuwen
            </button>
          </div>
          {audit ? (
            <ul className="mt-4 max-h-[420px] space-y-2 overflow-auto">
              {audit.events.map((event) => (
                <li key={event.id} className="rounded-lg border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-[#d9c6ac]">{event.action}</p>
                  <p className="text-sm text-[var(--color-text-primary)]">{event.actorEmail}</p>
                  <p className="text-xs text-[#d9c6ac]">{event.targetType}:{event.targetId}</p>
                  <p className="text-xs text-[#d9c6ac]">{event.createdAt}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#d9c6ac]">Audit events laden...</p>
          )}
          {audit && audit.events.length === 0 ? <p className="mt-4 text-sm text-[#d9c6ac]">Nog geen recente wijzigingen.</p> : null}
        </article>
      </section>

      {loadError ? <p className="text-sm text-[#ffb4a8]">{loadError}</p> : null}
    </div>
  );
}
