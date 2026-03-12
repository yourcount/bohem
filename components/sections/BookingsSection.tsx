import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";
import { getImageObjectPosition } from "@/lib/image-focus";
import type { SiteContent } from "@/lib/types";

type BookingsSectionProps = {
  bookings: SiteContent["bookings"];
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function nonEmptyItems(items: string[] | undefined) {
  return (items ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
}

export function BookingsSection({ bookings }: BookingsSectionProps) {
  const pressQuotes = nonEmptyItems(bookings.pressQuotes);
  const socialProof = (bookings.socialProof ?? []).filter((item) => hasText(item.quote) || hasText(item.source));
  const fitItems = nonEmptyItems(bookings.fitItems);
  const infoItems = nonEmptyItems(bookings.infoItems);
  const bookabilityItems = nonEmptyItems(bookings.bookabilityItems);
  const requestSteps = nonEmptyItems(bookings.requestSteps);
  const pressFacts = nonEmptyItems(bookings.press?.facts);
  const hasPressKitCta = hasText(bookings.press?.kitHref) && hasText(bookings.press?.kitLabel);
  const hasPressEmailCta = hasText(bookings.press?.contactEmail);
  const hasPressPhoneCta = hasText(bookings.press?.contactPhone);
  const hasPressActions = hasPressKitCta || hasPressEmailCta || hasPressPhoneCta;
  const hasPressBlock =
    hasText(bookings.press?.title) ||
    hasText(bookings.press?.boilerplate) ||
    pressFacts.length > 0 ||
    hasPressActions;
  const hasCoverKofferBlock =
    hasText(bookings.coverKoffer?.title) ||
    hasText(bookings.coverKoffer?.body) ||
    Boolean(bookings.coverKoffer?.image?.src);
  const hasIntroBlock = hasText(bookings.title) || hasText(bookings.body);
  const hasLeftCards = bookabilityItems.length > 0 || fitItems.length > 0;
  const hasLeftColumn = hasIntroBlock || hasLeftCards;
  const hasRightColumn = hasText(bookings.infoTitle) || infoItems.length > 0 || bookabilityItems.length > 0 || requestSteps.length > 0 || hasText(bookings.availabilityText);
  const gridLayoutClass = hasLeftColumn && hasRightColumn ? "md:grid-cols-[1.15fr_1fr] md:items-stretch" : "";

  return (
    <section
      id="boekingen"
      aria-labelledby="boekingen-title"
      className="section-ambient section-ambient-bookings bg-[linear-gradient(180deg,#2a1d1b_0%,#271b19_56%,#231816_100%)] py-16"
    >
      <div className={`mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-6 ${gridLayoutClass}`.trim()}>
        {pressQuotes.length > 0 ? (
          <Reveal className="hidden md:col-span-2 md:block">
            <section aria-label="Persquotes" className="press-marquee-wrap rounded-2xl border border-[var(--color-line-muted)]">
              <div className="press-marquee-track">
                {pressQuotes.map((quote) => (
                  <p key={`quote-${quote}`} className="press-marquee-item">
                    {quote}
                  </p>
                ))}
                {pressQuotes.map((quote) => (
                  <p key={`quote-duplicate-${quote}`} className="press-marquee-item press-marquee-item-duplicate">
                    {quote}
                  </p>
                ))}
              </div>
            </section>
          </Reveal>
        ) : null}

        {socialProof.length > 0 ? (
          <Reveal className="md:col-span-2">
            <section
              aria-label="Social proof"
              className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.05)] p-6"
            >
              {hasText(bookings.socialProofTitle) ? (
                <h3 className="mb-4 font-display text-3xl text-[var(--color-text-primary)]">{bookings.socialProofTitle}</h3>
              ) : null}
              <div className="grid gap-4 md:grid-cols-3">
                {socialProof.map((item, index) => (
                  <blockquote
                    key={`${item.quote || item.source || "proof"}-${index}`}
                    className="flex h-full flex-col rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,24,37,0.35)] p-4"
                  >
                    {hasText(item.quote) ? <p className="mb-3 text-sm text-[var(--color-text-primary)]">“{item.quote}”</p> : null}
                    {hasText(item.source) ? <footer className="mt-auto text-left text-xs text-[#d6be9f]">{item.source}</footer> : null}
                  </blockquote>
                ))}
              </div>
            </section>
          </Reveal>
        ) : null}

        {hasLeftColumn ? (
          <Reveal className="h-full">
            <div className="flex h-full flex-col md:max-w-[640px]">
              {hasIntroBlock ? (
                <div>
                  {hasText(bookings.title) ? (
                    <h2 id="boekingen-title" className="mb-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
                      {bookings.title}
                    </h2>
                  ) : null}
                  {hasText(bookings.body) ? <p>{bookings.body}</p> : null}
                </div>
              ) : null}
            {bookabilityItems.length > 0 ? (
              <article className="mt-5 flex flex-col justify-center rounded-2xl border border-[rgba(242,139,14,0.42)] bg-[rgba(242,139,14,0.08)] p-5 md:flex-1">
                <h3 className="mb-3 font-display text-2xl text-[var(--color-text-primary)]">{bookings.quickFactsTitle ?? "In 20 sec geregeld"}</h3>
                <ul className="space-y-2 text-sm text-[#f1deca]">
                  {bookabilityItems.slice(0, 4).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </article>
            ) : null}
            {fitItems.length > 0 ? (
              <article className="mt-5 flex flex-col justify-center rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.05)] p-5 md:flex-1">
                {hasText(bookings.fitTitle) ? <h3 className="mb-3 font-display text-2xl text-[var(--color-text-primary)]">{bookings.fitTitle}</h3> : null}
                <ul className="space-y-2 text-[#ead7bc]">
                  {fitItems.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </article>
            ) : null}

            </div>
          </Reveal>
        ) : null}

        {hasRightColumn ? (
          <Reveal delayMs={140} className="h-full">
            <aside
              aria-label="Boekingsinformatie"
              className="booking-info-panel h-full rounded-2xl border border-[var(--color-line-muted)] bg-[linear-gradient(145deg,rgba(35,24,22,0.82)_0%,rgba(28,20,24,0.84)_100%)] p-6 text-[var(--color-text-primary)] shadow-[0_12px_28px_rgba(0,0,0,0.24)]"
            >
            {hasText(bookings.infoTitle) ? <h3 className="mb-3 font-display text-2xl sm:text-3xl">{bookings.infoTitle}</h3> : null}
            {infoItems.length > 0 ? (
              <ul className="space-y-3 text-[#ead7bc]">
                {infoItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}

            {bookabilityItems.length > 0 ? (
              <section aria-label="Boekbaarheid details" className="mt-6 border-t border-[rgba(67,135,133,0.45)] pt-4">
                {hasText(bookings.bookabilityTitle) ? <h4 className="mb-3 font-display text-2xl text-[#f8f1e5]">{bookings.bookabilityTitle}</h4> : null}
                <ul className="space-y-2 text-[#ead7bc]">
                  {bookabilityItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {requestSteps.length > 0 ? (
              <section aria-label="Aanvraagstappen" className="mt-6 border-t border-[rgba(67,135,133,0.45)] pt-4">
                {hasText(bookings.requestStepsTitle) ? <h4 className="mb-3 font-display text-2xl text-[#f8f1e5]">{bookings.requestStepsTitle}</h4> : null}
                <ul className="space-y-2 text-[#ead7bc]">
                  {requestSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                {hasText(bookings.availabilityText) ? <p className="mt-3 text-sm text-[#d9c4a8]">{bookings.availabilityText}</p> : null}
              </section>
            ) : null}

            </aside>
          </Reveal>
        ) : null}

        {bookings.coverKoffer && hasCoverKofferBlock ? (
          <Reveal className="md:col-span-2">
            <section
              aria-label="Coverkoffer"
              className="max-h-[30rem] overflow-hidden rounded-2xl border border-[var(--color-line-muted)] bg-[linear-gradient(145deg,rgba(38,24,20,0.82)_0%,rgba(25,20,27,0.86)_100%)] shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
            >
              <div className="grid h-full gap-0 md:grid-cols-[1fr_1fr]">
                <div className="flex items-center overflow-auto p-6 sm:p-8">
                  <div>
                    {hasText(bookings.coverKoffer.eyebrow) ? (
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#f3d7b0]">{bookings.coverKoffer.eyebrow}</p>
                    ) : null}
                    {hasText(bookings.coverKoffer.title) ? (
                      <h3 className="mb-4 font-display text-3xl text-[var(--color-text-primary)] sm:text-4xl">{bookings.coverKoffer.title}</h3>
                    ) : null}
                    {hasText(bookings.coverKoffer.body) ? (
                      <p className="max-w-[62ch] text-[var(--color-text-primary)]">{bookings.coverKoffer.body}</p>
                    ) : null}
                  </div>
                </div>
                {bookings.coverKoffer.image && hasText(bookings.coverKoffer.image.src) ? (
                  <figure className="h-full min-h-0">
                    <Image
                      src={bookings.coverKoffer.image.src}
                      alt={bookings.coverKoffer.image.alt}
                      width={bookings.coverKoffer.image.width}
                      height={bookings.coverKoffer.image.height}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: getImageObjectPosition(bookings.coverKoffer.image) }}
                      loading="lazy"
                      quality={80}
                      sizes="(max-width: 767px) 92vw, (max-width: 1279px) 46vw, 540px"
                    />
                  </figure>
                ) : null}
              </div>
            </section>
          </Reveal>
        ) : null}

        {bookings.press && hasPressBlock ? (
          <Reveal className="md:col-span-2">
            <div className="mt-8 border-t border-[rgba(67,135,133,0.35)] pt-8 md:mt-12 md:pt-10">
              <section
                id="pers"
                aria-labelledby="pers-title"
                className="rounded-2xl border border-[rgba(67,135,133,0.45)] bg-[linear-gradient(150deg,rgba(20,30,42,0.88)_0%,rgba(22,30,38,0.9)_100%)] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
              >
                {hasText(bookings.press.title) ? (
                  <h2 id="pers-title" className="mb-3 font-display text-3xl text-[var(--color-text-primary)]">
                    {bookings.press.title}
                  </h2>
                ) : null}
                {pressFacts.length > 0 ? (
                  <ul className="mb-4 grid gap-2 md:grid-cols-2">
                    {pressFacts.map((fact) => (
                      <li key={fact} className="text-sm text-[#ead7bc]">
                        • {fact}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {hasText(bookings.press.boilerplate) ? <p className="mb-4 max-w-[80ch] text-sm text-[#ead7bc]">{bookings.press.boilerplate}</p> : null}
                {hasPressActions ? (
                  <div className="flex flex-wrap items-center gap-3">
                    {hasPressKitCta ? (
                      <a
                        href={bookings.press.kitHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        data-cta="epk_download"
                        className="perskit-download-cue inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
                      >
                        <span className="perskit-download-icon" aria-hidden="true">
                          <span className="perskit-download-shaft" />
                          <span className="perskit-download-head" />
                        </span>
                        {bookings.press.kitLabel}
                      </a>
                    ) : null}
                    {hasPressEmailCta ? (
                      <a
                        href={`mailto:${bookings.press.contactEmail}`}
                        data-cta="press_contact_email"
                        className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                      >
                        {bookings.press.contactEmail}
                      </a>
                    ) : null}
                    {hasPressPhoneCta ? (
                      <a
                        href={`tel:${bookings.press.contactPhone.replace(/\s+/g, "")}`}
                        data-cta="press_contact_phone"
                        className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                      >
                        {bookings.press.contactPhone}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </section>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
