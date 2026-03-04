"use client";

import { useEffect } from "react";

export type StatusTone = "neutral" | "success" | "error";

const DEFAULT_GUARD_MESSAGE = "Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je deze pagina wilt verlaten?";

export function toneClass(tone: StatusTone) {
  if (tone === "success") return "text-[#b6efb9]";
  if (tone === "error") return "text-[#ffb4a8]";
  return "text-[#d9c6ac]";
}

function toLabel(field: string, labels?: Record<string, string>) {
  if (labels?.[field]) return labels[field];
  return field.replace(/[_.]/g, " ").replace(/\s+/g, " ").trim();
}

function toSolution(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("geldig") && lower.includes("e-mail")) {
    return "Gebruik een geldig e-mailadres, bijvoorbeeld naam@domein.nl.";
  }
  if (lower.includes("url") || lower.includes("link")) {
    return "Gebruik een volledige URL die begint met https://.";
  }
  if (lower.includes("minimaal")) {
    return "Vul meer tekens in en voldoe aan de minimale lengte-eis.";
  }
  if (lower.includes("maximaal") || lower.includes("te lang")) {
    return "Maak de waarde korter zodat deze binnen de limiet valt.";
  }
  if (lower.includes("getal")) {
    return "Gebruik alleen cijfers en controleer of de waarde binnen het toegestane bereik valt.";
  }
  if (lower.includes("verplicht") || lower.includes("mag niet leeg")) {
    return "Vul dit veld in voordat je opnieuw opslaat.";
  }
  return "Controleer dit veld en probeer opnieuw op te slaan.";
}

export function formatFieldErrors(
  fieldErrors?: Record<string, string[]>,
  labels?: Record<string, string>
): string[] {
  if (!fieldErrors) return [];
  return Object.entries(fieldErrors).flatMap(([field, messages]) =>
    messages.map((message) => {
      const label = toLabel(field, labels);
      return `Veld "${label}": ${message} Oplossing: ${toSolution(message)}`;
    })
  );
}

type StickyStatusBarProps = {
  tone: StatusTone;
  message: string;
  details?: string[];
  hasUnsavedChanges?: boolean;
  updatedAt?: string;
};

export function StickyStatusBar({ tone, message, details = [], hasUnsavedChanges = false, updatedAt }: StickyStatusBarProps) {
  return (
    <section className="sticky top-4 z-40 rounded-xl border border-[var(--color-line-muted)] bg-[linear-gradient(135deg,rgba(16,22,33,0.96),rgba(35,27,22,0.94))] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-amber)]">Status</p>
          <p className={`mt-1 text-sm ${toneClass(tone)}`} aria-live="polite">
            {tone === "success" && message ? <span aria-hidden="true" className="success-pop">✓</span> : null}
            {message || "Nog geen wijzigingen uitgevoerd."}
          </p>
        </div>
        <div className="text-right text-xs text-[#d9c6ac]">
          <p>{hasUnsavedChanges ? "Niet-opgeslagen wijzigingen aanwezig" : "Alle wijzigingen opgeslagen"}</p>
          <p className="mt-1">Laatste actie: {updatedAt ?? "onbekend"}</p>
        </div>
      </div>
      {details.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#ffb4a8]">
          {details.slice(0, 8).map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function useUnsavedChangesGuard(enabled: boolean, message = DEFAULT_GUARD_MESSAGE) {
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!enabled) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!enabled) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank") return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;

      const nextUrl = new URL(href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const changesPage = nextUrl.pathname !== currentUrl.pathname || nextUrl.search !== currentUrl.search;
      if (!changesPage) return;

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [enabled, message]);
}

