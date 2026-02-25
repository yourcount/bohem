import Link from "next/link";
import Image from "next/image";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type BookingsSectionProps = {
  bookings: SiteContent["bookings"];
};

export function BookingsSection({ bookings }: BookingsSectionProps) {
  return (
    <section
      id="boekingen"
      aria-labelledby="boekingen-title"
      className="section-ambient section-ambient-bookings bg-[linear-gradient(180deg,#232031_0%,#251a1a_58%,#221816_100%)] py-16"
    >
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-6 md:grid-cols-[1.15fr_1fr]">
        {bookings.pressQuotes && bookings.pressQuotes.length > 0 ? (
          <Reveal className="hidden md:col-span-2 md:block">
            <section aria-label="Persquotes" className="press-marquee-wrap rounded-2xl border border-[var(--color-line-muted)]">
              <div className="press-marquee-track">
                {bookings.pressQuotes.map((quote) => (
                  <p key={`quote-${quote}`} className="press-marquee-item">
                    {quote}
                  </p>
                ))}
                {bookings.pressQuotes.map((quote) => (
                  <p key={`quote-duplicate-${quote}`} className="press-marquee-item press-marquee-item-duplicate">
                    {quote}
                  </p>
                ))}
              </div>
            </section>
          </Reveal>
        ) : null}

        {bookings.socialProof && bookings.socialProof.length > 0 ? (
          <Reveal className="md:col-span-2">
            <section
              aria-label="Social proof"
              className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.05)] p-6"
            >
              {bookings.socialProofTitle ? (
                <h3 className="mb-4 font-display text-3xl text-[var(--color-text-primary)]">{bookings.socialProofTitle}</h3>
              ) : null}
              <div className="grid gap-4 md:grid-cols-3">
                {bookings.socialProof.map((item) => (
                  <blockquote
                    key={item.quote}
                    className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,24,37,0.35)] p-4"
                  >
                    <p className="mb-3 text-sm text-[var(--color-text-primary)]">“{item.quote}”</p>
                    <footer className="text-xs text-[#d6be9f]">{item.source}</footer>
                  </blockquote>
                ))}
              </div>
            </section>
          </Reveal>
        ) : null}

        <Reveal>
          <div>
            <h2 id="boekingen-title" className="mb-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {bookings.title}
            </h2>
            <p>{bookings.body}</p>
            {bookings.highlightImage ? (
              <figure className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-line-muted)]">
                <Image
                  src={bookings.highlightImage.src}
                  alt={bookings.highlightImage.alt}
                  width={bookings.highlightImage.width}
                  height={bookings.highlightImage.height}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
                {bookings.highlightImage.caption ? (
                  <figcaption className="border-t border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-2 text-xs uppercase tracking-[0.08em] text-[#d6be9f]">
                    {bookings.highlightImage.caption}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}
            <div className="mt-5">
              <ButtonLink href={bookings.cta.href} variant={bookings.cta.variant ?? "primary"}>
                {bookings.cta.label}
              </ButtonLink>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={140}>
          <aside
            aria-label="Boekingsinformatie"
            className="rounded-2xl border border-[rgba(36,27,23,0.10)] bg-[var(--color-surface)] p-6 text-[var(--color-text-dark)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            <h3 className="mb-3 font-display text-2xl sm:text-3xl">{bookings.infoTitle}</h3>
            <ul className="space-y-3">
              {bookings.infoItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            {bookings.upcomingShows && bookings.upcomingShows.length > 0 ? (
              <section aria-label="Aankomende optredens" className="mt-6 border-t border-[rgba(36,27,23,0.12)] pt-4">
                <h4 className="mb-3 font-display text-2xl">Volgende shows</h4>
                <ol className="space-y-3">
                  {bookings.upcomingShows.slice(0, 3).map((show) => (
                    <li key={`${show.date}-${show.venue}`} className="timeline-card">
                      <p className="timeline-date">{show.date}</p>
                      <p className="font-semibold">{show.venue}</p>
                      <p className="text-sm text-[rgba(31,37,48,0.8)]">{show.city}</p>
                      <Link
                        href={show.ctaHref}
                        className="mt-2 inline-flex w-fit items-center justify-center rounded-full border border-[rgba(31,37,48,0.3)] px-4 py-2 text-xs font-semibold text-[var(--color-text-dark)] transition-colors hover:border-[var(--color-accent-copper)] hover:bg-[rgba(181,47,29,0.08)] focus-visible:border-[var(--color-accent-copper)]"
                      >
                        {show.ctaLabel}
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
