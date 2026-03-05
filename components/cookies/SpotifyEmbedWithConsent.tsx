"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentProvider";

type SpotifyEmbedWithConsentProps = {
  embedUrl: string;
  title: string;
};

export function SpotifyEmbedWithConsent({ embedUrl, title }: SpotifyEmbedWithConsentProps) {
  const { isReady, hasConsentFor, savePreferences, openPreferences, consent } = useCookieConsent();

  if (!isReady || !hasConsentFor("externalMedia")) {
    return (
      <div className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.55)] p-4">
        <p className="text-sm text-[#e7d6c1]">Spotify-embed staat uit totdat je externe media accepteert.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-transparent bg-[var(--color-accent-amber)] px-4 py-2 text-xs font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
            onClick={() => savePreferences({ ...consent, externalMedia: true })}
          >
            Externe media toestaan
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
            onClick={openPreferences}
          >
            Instellingen beheren
          </button>
        </div>
      </div>
    );
  }

  return (
    <iframe
      style={{ borderRadius: "12px" }}
      src={embedUrl}
      width="100%"
      height="152"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      title={title}
    />
  );
}
