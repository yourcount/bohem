import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type DiscographySectionProps = {
  discography: SiteContent["discography"];
};

export function DiscographySection({ discography }: DiscographySectionProps) {
  return (
    <section id="discografie" aria-labelledby="discografie-title" className="relative overflow-hidden py-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(165deg, rgba(13,20,31,0.86) 0%, rgba(24,41,63,0.82) 45%, rgba(77,65,110,0.82) 100%), url('/brand/docs/roest-en-metaal.webp')",
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
      <div className="relative z-10 mx-auto w-full max-w-[1120px] px-6">
        <Reveal>
          <h2 id="discografie-title" className="mb-4 font-display text-4xl leading-tight sm:text-5xl">
            {discography.title}
          </h2>
          <p className="mb-7 max-w-[70ch]">{discography.intro}</p>
        </Reveal>

        <div className="mb-6 grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[linear-gradient(165deg,rgba(244,233,220,0.12)_0%,rgba(244,233,220,0.04)_100%)] p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">Nieuw uitgelicht</p>
              <h3 className="mb-2 font-display text-3xl">{discography.featuredSingle.title}</h3>
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
                className="mt-4 inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
              >
                Luister op Spotify
              </Link>
            </article>
          </Reveal>

          <Reveal delayMs={120}>
            <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.06)] p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">Spotify</p>
              <h3 className="mb-2 font-display text-3xl">{discography.artist.title}</h3>
              <p className="mb-4 text-[#e7d6c1]">{discography.artist.description}</p>
              <Link
                href={discography.artist.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-bold transition-colors hover:border-[#c8873e] hover:bg-[rgba(200,135,62,0.16)]"
              >
                Open artist profiel
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
              <article className="group h-full rounded-2xl border border-[var(--color-line-muted)] bg-[linear-gradient(165deg,rgba(244,233,220,0.12)_0%,rgba(244,233,220,0.04)_100%)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#b17a47]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#9c744e] bg-[rgba(200,135,62,0.12)] px-3 py-1 text-xs font-semibold tracking-[0.08em] text-[#f3d7b0]">
                    {release.format}
                  </span>
                  <span className="text-sm text-[#d6be9f]">{release.year}</span>
                </div>

                <h3 className="mb-2 font-display text-3xl">{release.title}</h3>
                <p className="mb-5 text-sm text-[#e7d6c1]">{release.note}</p>

                <div className="mt-auto flex flex-wrap gap-2">
                  {release.links.map((link) => (
                    <Link
                      key={`${release.title}-${link.label}`}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-[var(--color-line-muted)] bg-[rgba(26,20,18,0.4)] px-3 py-2 text-xs font-semibold transition-colors hover:border-[#c8873e] hover:bg-[rgba(200,135,62,0.18)] focus-visible:border-[#c8873e]"
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
