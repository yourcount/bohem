import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type ShowsSectionProps = {
  shows: NonNullable<SiteContent["bookings"]["upcomingShows"]>;
};

export function ShowsSection({ shows }: ShowsSectionProps) {
  if (!shows || shows.length === 0) return null;

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
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">Live agenda</p>
                <h2 id="shows-title" className="font-display text-3xl text-[#f8f1e5] sm:text-4xl">
                  Volgende shows
                </h2>
              </div>
              <span className="rounded-full border border-[rgba(242,139,14,0.45)] bg-[rgba(242,139,14,0.14)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#f3d7b0]">
                Actueel
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shows.map((show, index) => (
                <Reveal key={`${show.date}-${show.venue}`} delayMs={index * 90}>
                  <article
                    className="flex h-full flex-col rounded-2xl border border-[rgba(242,139,14,0.34)] bg-[linear-gradient(160deg,rgba(26,18,22,0.8)_0%,rgba(21,17,21,0.92)_100%)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(242,139,14,0.58)] hover:shadow-[0_10px_26px_rgba(0,0,0,0.32)]"
                  >
                    <p className="mb-3 inline-flex w-fit rounded-full border border-[rgba(242,139,14,0.36)] bg-[rgba(242,139,14,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#f3d7b0]">
                      {show.date}
                    </p>
                    <p className="text-xl font-semibold text-[#f8f1e5]">{show.venue}</p>
                    <p className="mt-1 text-sm text-[#d9c4a8]">{show.city}</p>
                    <Link
                      href={show.ctaHref}
                      data-cta={`show_${show.venue.toLowerCase().replace(/\s+/g, "_")}`}
                      className="cta-glow ticket-burst mt-5 inline-flex w-full items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-4 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
                    >
                      <span className="ticket-burst-label">{show.ctaLabel || "Tickets"}</span>
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </section>
  );
}
