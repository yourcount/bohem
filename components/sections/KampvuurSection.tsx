import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type KampvuurSectionProps = {
  kampvuur: SiteContent["kampvuur"];
};

export function KampvuurSection({ kampvuur }: KampvuurSectionProps) {
  return (
    <section
      id="kampvuurklanken"
      aria-labelledby="kampvuur-title"
      className="section-ambient kampvuur-section bg-[linear-gradient(180deg,#2b2230_0%,#2c2225_48%,#2a1d1b_100%)] py-16"
    >
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
          <Reveal className="md:order-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">Speciale avond</p>
              <h2 id="kampvuur-title" className="mb-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
                {kampvuur.title}
              </h2>
              <p className="mb-4 text-lg text-[var(--color-text-primary)]">{kampvuur.intro}</p>
              <div className="space-y-4 text-[var(--color-text-primary)]">
                {kampvuur.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </Reveal>

          {kampvuur.image ? (
            <Reveal delayMs={120} className="md:order-1">
              <figure className="kampvuur-media overflow-hidden rounded-2xl border border-[var(--color-line-muted)]">
                <Image
                  src={kampvuur.image.src}
                  alt={kampvuur.image.alt}
                  width={kampvuur.image.width}
                  height={kampvuur.image.height}
                  className="h-full w-full object-cover object-center contrast-[1.08] saturate-[1.14]"
                  loading="lazy"
                />
              </figure>
            </Reveal>
          ) : null}
        </div>

        <Reveal delayMs={160}>
          <div className="mx-auto mt-14 max-w-[760px]">
            <article className="kampvuur-benefits mt-6 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.06)] p-5 text-center">
              <h3 className="mb-3 font-display text-2xl sm:text-3xl">{kampvuur.benefitsTitle}</h3>
              <ul className="mx-auto w-fit space-y-2 text-left">
                {kampvuur.benefits.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-[1px] text-[#f3d7b0]">✔</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <blockquote className="kampvuur-quote mx-auto mt-5 max-w-[44ch] text-center text-[#f3d7b0]">“{kampvuur.quote}”</blockquote>

            <p className="mt-5 text-center text-[var(--color-text-primary)]">{kampvuur.contactPrompt}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <a
                href={`mailto:${kampvuur.contactEmail}`}
                className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
              >
                {kampvuur.contactEmail}
              </a>
              <a
                href={`tel:${kampvuur.contactPhone.replace(/\s+/g, "")}`}
                className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
              >
                {kampvuur.contactPhone}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
