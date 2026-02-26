import Link from "next/link";
import Image from "next/image";

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
      className="section-ambient section-ambient-bookings bg-[linear-gradient(180deg,#2a1d1b_0%,#271b19_56%,#231816_100%)] py-16"
    >
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-6 md:grid-cols-[1.15fr_1fr] md:items-start">
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

        {bookings.upcomingShows && bookings.upcomingShows.length > 0 ? (
          <Reveal className="md:col-span-2">
            <section
              aria-label="Volgende shows"
              className="rounded-2xl border border-[rgba(242,139,14,0.45)] bg-[linear-gradient(145deg,rgba(68,34,24,0.52)_0%,rgba(37,23,28,0.52)_100%)] p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-display text-3xl text-[#f8f1e5]">Volgende shows</h3>
                <span className="rounded-full border border-[rgba(242,139,14,0.45)] bg-[rgba(242,139,14,0.14)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#f3d7b0]">
                  Actueel
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {bookings.upcomingShows.slice(0, 3).map((show) => (
                  <article
                    key={`${show.date}-${show.venue}`}
                    className="rounded-xl border border-[rgba(242,139,14,0.28)] bg-[rgba(24,16,20,0.36)] p-4"
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#f3d7b0]">{show.date}</p>
                    <p className="font-semibold text-[#f8f1e5]">{show.venue}</p>
                    <p className="text-sm text-[#d9c4a8]">{show.city}</p>
                    <Link
                      href={show.ctaHref}
                      className="mt-3 inline-flex w-fit items-center justify-center rounded-full border border-[rgba(242,139,14,0.45)] px-4 py-2 text-xs font-semibold text-[#f2e7d8] transition-colors hover:border-[var(--color-accent-copper)] hover:bg-[rgba(181,47,29,0.18)]"
                    >
                      {show.ctaLabel}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>
        ) : null}

        <Reveal className="md:self-start">
          <div className="md:max-w-[640px]">
            <h2 id="boekingen-title" className="mb-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {bookings.title}
            </h2>
            <p>{bookings.body}</p>
            {bookings.fitItems && bookings.fitItems.length > 0 ? (
              <article className="mt-5 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.05)] p-5">
                {bookings.fitTitle ? <h3 className="mb-3 font-display text-2xl text-[var(--color-text-primary)]">{bookings.fitTitle}</h3> : null}
                <ul className="space-y-2 text-[#ead7bc]">
                  {bookings.fitItems.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </article>
            ) : null}

            {bookings.routeItems && bookings.routeItems.length > 0 ? (
              <article className="mt-5">
                {bookings.routeTitle ? <h3 className="mb-3 font-display text-2xl text-[var(--color-text-primary)]">{bookings.routeTitle}</h3> : null}
                <div className="grid gap-3 sm:grid-cols-3">
                  {bookings.routeItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.05)] p-4 transition-colors hover:border-[#f28b0e]"
                    >
                      <p className="mb-1 font-semibold text-[var(--color-text-primary)]">{item.label}</p>
                      <p className="text-xs text-[#d9c4a8]">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </article>
            ) : null}
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
          </div>
        </Reveal>

        <Reveal delayMs={140} className="md:self-start">
          <aside
            aria-label="Boekingsinformatie"
            className="booking-info-panel rounded-2xl border border-[var(--color-line-muted)] bg-[linear-gradient(145deg,rgba(35,24,22,0.82)_0%,rgba(28,20,24,0.84)_100%)] p-6 text-[var(--color-text-primary)] shadow-[0_12px_28px_rgba(0,0,0,0.24)]"
          >
            <h3 className="mb-3 font-display text-2xl sm:text-3xl">{bookings.infoTitle}</h3>
            <ul className="space-y-3 text-[#ead7bc]">
              {bookings.infoItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            {bookings.bookabilityItems && bookings.bookabilityItems.length > 0 ? (
              <section aria-label="Boekbaarheid details" className="mt-6 border-t border-[rgba(67,135,133,0.45)] pt-4">
                {bookings.bookabilityTitle ? <h4 className="mb-3 font-display text-2xl text-[#f8f1e5]">{bookings.bookabilityTitle}</h4> : null}
                <ul className="space-y-2 text-[#ead7bc]">
                  {bookings.bookabilityItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {bookings.requestSteps && bookings.requestSteps.length > 0 ? (
              <section aria-label="Aanvraagstappen" className="mt-6 border-t border-[rgba(67,135,133,0.45)] pt-4">
                {bookings.requestStepsTitle ? <h4 className="mb-3 font-display text-2xl text-[#f8f1e5]">{bookings.requestStepsTitle}</h4> : null}
                <ul className="space-y-2 text-[#ead7bc]">
                  {bookings.requestSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                {bookings.availabilityText ? <p className="mt-3 text-sm text-[#d9c4a8]">{bookings.availabilityText}</p> : null}
              </section>
            ) : null}

          </aside>
        </Reveal>

        {bookings.press ? (
          <Reveal className="md:col-span-2">
            <section
              id="pers"
              aria-labelledby="pers-title"
              className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.06)] p-6"
            >
              <h3 id="pers-title" className="mb-3 font-display text-3xl text-[var(--color-text-primary)]">
                {bookings.press.title}
              </h3>
              <ul className="mb-4 grid gap-2 md:grid-cols-2">
                {bookings.press.facts.map((fact) => (
                  <li key={fact} className="text-sm text-[#ead7bc]">
                    • {fact}
                  </li>
                ))}
              </ul>
              <p className="mb-4 max-w-[80ch] text-sm text-[#ead7bc]">{bookings.press.boilerplate}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={bookings.press.kitHref}
                  className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
                >
                  {bookings.press.kitLabel}
                </Link>
                <a
                  href={`mailto:${bookings.press.contactEmail}`}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                >
                  {bookings.press.contactEmail}
                </a>
                <a
                  href={`tel:${bookings.press.contactPhone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                >
                  {bookings.press.contactPhone}
                </a>
              </div>
            </section>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
