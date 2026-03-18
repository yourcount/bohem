import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";
import { getExternalLinkProps } from "@/lib/ui/link-target";

type ShowsSectionProps = {
  shows: NonNullable<SiteContent["bookings"]["upcomingShows"]>;
  eyebrow?: string;
  title?: string;
  badgeLabel?: string;
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function ShowsSection({ shows, eyebrow, title, badgeLabel }: ShowsSectionProps) {
  const visibleShows = (shows ?? []).filter((show) => {
    const hasBasics = hasText(show.date) || hasText(show.venue) || hasText(show.city);
    const hasCta = Boolean(show.freeEntry) || hasText(show.ticketsHref) || hasText(show.infoHref);
    return hasBasics || hasCta;
  });
  if (visibleShows.length === 0) return null;

  return (
    <section
      id="shows"
      aria-labelledby="shows-title"
      className="section-ambient bg-[linear-gradient(180deg,#2b2230_0%,#2b232f_48%,#2b2230_100%)] py-16"
    >
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Reveal>
          <section
            aria-label="Volgende shows"
            className="relative my-2 overflow-hidden rounded-3xl border border-[rgba(242,139,14,0.55)] bg-[radial-gradient(circle_at_88%_18%,rgba(242,139,14,0.2)_0%,rgba(242,139,14,0.03)_36%,rgba(16,12,13,0)_64%),linear-gradient(155deg,rgba(66,35,26,0.74)_0%,rgba(31,20,24,0.88)_58%,rgba(20,14,18,0.94)_100%)] p-6 shadow-[0_22px_48px_rgba(0,0,0,0.34)] md:my-4 md:p-8"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(242,139,14,0)_0%,rgba(242,139,14,0.72)_50%,rgba(242,139,14,0)_100%)]" />
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">
                  {eyebrow ?? "Live agenda"}
                </p>
                <h2 id="shows-title" className="font-display text-3xl text-[#f8f1e5] sm:text-4xl">
                  {title ?? "Volgende shows"}
                </h2>
              </div>
              <span className="rounded-full border border-[rgba(242,139,14,0.45)] bg-[rgba(242,139,14,0.14)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#f3d7b0]">
                {badgeLabel ?? "Actueel"}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleShows.map((show, index) => {
                const showSlug = (show.venue || show.city || `show-${index}`).toLowerCase().replace(/\s+/g, "_");
                const freeEntryHref = show.freeEntry && hasText(show.infoHref) ? show.infoHref! : null;
                return (
                <Reveal key={`${show.date}-${show.venue}-${index}`} delayMs={index * 90}>
                  <article
                    className="flex h-full flex-col rounded-2xl border border-[rgba(242,139,14,0.34)] bg-[linear-gradient(160deg,rgba(26,18,22,0.8)_0%,rgba(21,17,21,0.92)_100%)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(242,139,14,0.58)] hover:shadow-[0_10px_26px_rgba(0,0,0,0.32)]"
                  >
                    {hasText(show.date) ? (
                      <p className="mb-3 inline-flex w-fit rounded-full border border-[rgba(242,139,14,0.36)] bg-[rgba(242,139,14,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#f3d7b0]">
                        {show.date}
                      </p>
                    ) : null}
                    {hasText(show.venue) ? <p className="text-xl font-semibold text-[#f8f1e5]">{show.venue}</p> : null}
                    {hasText(show.city) ? <p className="mt-1 text-sm text-[#d9c4a8]">{show.city}</p> : null}
                    {show.freeEntry || hasText(show.ticketsHref) || hasText(show.infoHref) ? (
                      <div className="mt-5 flex flex-col gap-2">
                      {show.freeEntry ? (
                        freeEntryHref ? (
                          <Link
                            href={freeEntryHref}
                            {...getExternalLinkProps(freeEntryHref)}
                            data-cta={`show_free_entry_${showSlug}`}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(118,203,147,0.46)] bg-[linear-gradient(180deg,rgba(118,203,147,0.26)_0%,rgba(79,162,113,0.22)_100%)] px-4 py-2.5 text-sm font-bold text-[#ecffe7] shadow-[0_10px_24px_rgba(44,87,59,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(118,203,147,0.7)] hover:bg-[linear-gradient(180deg,rgba(118,203,147,0.34)_0%,rgba(79,162,113,0.3)_100%)] hover:shadow-[0_14px_28px_rgba(44,87,59,0.32)]"
                          >
                            <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(12,24,16,0.26)] text-base leading-none">
                              ✓
                            </span>
                            <span>Gratis toegang</span>
                          </Link>
                        ) : (
                          <span className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(118,203,147,0.42)] bg-[linear-gradient(180deg,rgba(118,203,147,0.22)_0%,rgba(79,162,113,0.18)_100%)] px-4 py-2.5 text-sm font-bold text-[#dff7d8] shadow-[0_8px_20px_rgba(44,87,59,0.18)]">
                            <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(12,24,16,0.26)] text-base leading-none">
                              ✓
                            </span>
                            <span>Gratis toegang</span>
                          </span>
                        )
                      ) : hasText(show.ticketsHref) ? (
                        <Link
                          href={show.ticketsHref!}
                          {...getExternalLinkProps(show.ticketsHref)}
                          data-cta={`show_tickets_${showSlug}`}
                          className="cta-glow ticket-burst inline-flex w-full items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-4 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
                        >
                          <span className="ticket-burst-label">Tickets</span>
                        </Link>
                      ) : null}
                      {!show.freeEntry && hasText(show.infoHref) ? (
                        <Link
                          href={show.infoHref!}
                          {...getExternalLinkProps(show.infoHref)}
                          data-cta={`show_info_${showSlug}`}
                          className="inline-flex w-full items-center justify-center rounded-full border border-[rgba(242,139,14,0.52)] bg-transparent px-4 py-2.5 text-sm font-bold text-[#f3d7b0] transition-colors hover:bg-[rgba(242,139,14,0.16)] hover:text-[#f8f1e5]"
                        >
                          Extra info
                        </Link>
                      ) : null}
                    </div>
                    ) : null}
                  </article>
                </Reveal>
              );
              })}
            </div>
          </section>
        </Reveal>
      </div>
    </section>
  );
}
