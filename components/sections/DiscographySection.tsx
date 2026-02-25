import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type DiscographySectionProps = {
  discography: SiteContent["discography"];
};

export function DiscographySection({ discography }: DiscographySectionProps) {
  return (
    <section id="discografie" aria-labelledby="discografie-title" className="bg-[var(--color-bg-soft)]/40 py-16">
      <div className="mx-auto w-full max-w-[1120px] px-6">
        <Reveal>
          <h2 id="discografie-title" className="mb-4 font-display text-4xl leading-tight sm:text-5xl">
            {discography.title}
          </h2>
          <p className="mb-7 max-w-[70ch]">{discography.intro}</p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
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
