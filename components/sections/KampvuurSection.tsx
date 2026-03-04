import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";
import { getImageObjectPosition } from "@/lib/image-focus";
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
      <div className="kampvuur-embers" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-stretch">
          <Reveal className="md:order-2">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">
                <span className="kampvuur-ember-dot" aria-hidden="true" />
                Speciale avond
              </p>
              <div className="mb-4 flex items-center gap-3">
                <h2 id="kampvuur-title" className="font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
                  {kampvuur.title}
                </h2>
                <div className="kampvuur-flame-lottie shrink-0 self-center -translate-y-1" aria-hidden="true">
                  <span className="kampvuur-flame-core" />
                  <span className="kampvuur-flame-mid" />
                  <span className="kampvuur-flame-outer" />
                  <span className="kampvuur-flame-spark kampvuur-flame-spark-a" />
                  <span className="kampvuur-flame-spark kampvuur-flame-spark-b" />
                  <span className="kampvuur-flame-spark kampvuur-flame-spark-c" />
                </div>
              </div>
              <div className="kampvuur-flame-divider mb-4" aria-hidden="true" />
              <p className="mb-4 text-lg text-[var(--color-text-primary)]">{kampvuur.intro}</p>
              <div className="space-y-4 text-[var(--color-text-primary)]">
                {kampvuur.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </Reveal>

          {kampvuur.image ? (
            <Reveal delayMs={120} className="md:order-1 h-full">
              <figure className="kampvuur-media h-full overflow-hidden rounded-2xl border border-[var(--color-line-muted)]">
                <Image
                  src={kampvuur.image.src}
                  alt={kampvuur.image.alt}
                  width={kampvuur.image.width}
                  height={kampvuur.image.height}
                  className="h-full w-full object-cover contrast-[1.08] saturate-[1.14]"
                  style={{ objectPosition: getImageObjectPosition(kampvuur.image) }}
                  loading="lazy"
                  quality={78}
                  sizes="(max-width: 767px) 92vw, (max-width: 1279px) 44vw, 460px"
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
                    <span aria-hidden="true" className="mt-[5px] h-2 w-2 rounded-full bg-[#f3d7b0] shadow-[0_0_10px_rgba(242,139,14,0.6)]" />
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
                data-cta="kampvuur_contact_email"
                className="kampvuur-fire-cta inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
              >
                {kampvuur.contactEmail}
              </a>
              <a
                href={`tel:${kampvuur.contactPhone.replace(/\s+/g, "")}`}
                data-cta="kampvuur_contact_phone"
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
