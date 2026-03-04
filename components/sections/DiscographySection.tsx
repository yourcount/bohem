import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type DiscographySectionProps = {
  discography: SiteContent["discography"];
};

export function DiscographySection({ discography }: DiscographySectionProps) {
  const isReleaseLinkVisible = (label: string) => !label.toLowerCase().includes("artiestprofiel");

  return (
    <section
      id="discografie"
      aria-labelledby="discografie-title"
      className="section-ambient section-ambient-discography relative overflow-hidden bg-[linear-gradient(180deg,#242b3a_0%,#28283a_54%,#2a2537_100%)] py-16"
    >
      <div
        className="discography-parallax pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(165deg, rgba(13,20,31,0.0) 0%, rgba(24,41,63,0.56) 20%, rgba(24,41,63,0.82) 50%, rgba(77,65,110,0.82) 100%), url('/brand/docs/roest-en-metaal.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 top-8 hidden h-56 w-56 opacity-[0.1] md:block"
        style={{ backgroundImage: "url('/brand/elements/bohem-b-monogram-color.webp')", backgroundSize: "contain", backgroundRepeat: "no-repeat" }}
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Reveal>
          <h2 id="discografie-title" className="mb-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
            {discography.title}
          </h2>
          <p className="mb-7 max-w-[70ch]">{discography.intro}</p>
        </Reveal>

        <div className="mb-6 grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-stretch">
          <Reveal className="h-full">
            <article className="flex h-full flex-col rounded-2xl border border-[var(--color-line-muted)] bg-[linear-gradient(165deg,rgba(244,233,220,0.12)_0%,rgba(244,233,220,0.04)_100%)] p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">
                {discography.featuredSingleEyebrow ?? "Nieuw uitgelicht"}
              </p>
              <h3 className="mb-2 font-display text-2xl sm:text-3xl">{discography.featuredSingle.title}</h3>
              <p className="mb-4 text-[#e7d6c1]">{discography.featuredSingle.description}</p>
              <iframe
                style={{ borderRadius: "12px" }}
                src={discography.featuredSingle.embedUrl}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="Spotify player eerste nieuwe single Bohèm"
              />
              <Link
                href={discography.featuredSingle.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="discography_featured_single"
                className="cta-glow listen-pulse mt-4 inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
              >
                <span className="equalizer-icon mr-2" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                {discography.featuredSingle.ctaLabel ?? "Luister op Spotify"}
              </Link>
            </article>
          </Reveal>

          <Reveal delayMs={120} className="h-full">
            <article className="flex h-full flex-col rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.06)] p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">
                {discography.artistEyebrow ?? "Streaming"}
              </p>
              <h3 className="mb-2 font-display text-2xl sm:text-3xl">{discography.artist.title}</h3>
              <p className="mb-4 text-[#e7d6c1]">{discography.artist.description}</p>
              <Link
                href={discography.artist.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="discography_artist_profile"
                className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-bold transition-colors hover:border-[#c8873e] hover:bg-[rgba(200,135,62,0.16)]"
              >
                {discography.artist.ctaLabel ?? "Open Spotify-profiel"}
              </Link>

              {discography.productionItems && discography.productionItems.length > 0 ? (
                <div className="mt-5 border-t border-[var(--color-line-muted)] pt-4">
                  {discography.productionTitle ? (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#f3d7b0]">{discography.productionTitle}</p>
                  ) : null}
                  <ul className="mb-3 space-y-1.5 text-sm text-[#e7d6c1]">
                    {discography.productionItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {discography.legal ? <p className="text-xs text-[#d9c6ac]">{discography.legal}</p> : null}
                </div>
              ) : null}

            </article>
          </Reveal>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {discography.releases.map((release, index) => (
            <Reveal key={release.title} delayMs={index * 100}>
              <article className="discography-tilt-card group h-full rounded-2xl border border-[var(--color-line-muted)] bg-[linear-gradient(165deg,rgba(244,233,220,0.12)_0%,rgba(244,233,220,0.04)_100%)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#b17a47]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#9c744e] bg-[rgba(200,135,62,0.12)] px-3 py-1 text-xs font-semibold tracking-[0.08em] text-[#f3d7b0]">
                    {release.format}
                  </span>
                  <span className="text-sm text-[#d6be9f]">{release.year}</span>
                </div>

                <h3 className="mb-2 font-display text-2xl sm:text-3xl">{release.title}</h3>
                <p className="mb-5 text-sm text-[#e7d6c1]">{release.note}</p>

                <div className="mt-auto flex flex-wrap gap-2">
                  {release.links.filter((link) => isReleaseLinkVisible(link.label)).map((link) => (
                    <Link
                      key={`${release.title}-${link.label}`}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cta={`release_${release.title.toLowerCase().replace(/\s+/g, "_")}`}
                      className="cta-glow rounded-full border border-[var(--color-line-muted)] bg-[rgba(26,20,18,0.4)] px-3 py-2 text-xs font-semibold transition-colors hover:border-[#c8873e] hover:bg-[rgba(200,135,62,0.18)] focus-visible:border-[#c8873e]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
