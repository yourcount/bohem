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
      className="bg-[linear-gradient(180deg,var(--color-bg-deep)_0%,#211714_100%)] py-16"
    >
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-6 md:grid-cols-[1.15fr_1fr]">
        <Reveal>
          <div>
            <h2 id="boekingen-title" className="mb-4 font-display text-4xl leading-tight sm:text-5xl">
              {bookings.title}
            </h2>
            <p>{bookings.body}</p>
            <ButtonLink href={bookings.cta.href} variant={bookings.cta.variant ?? "primary"}>
              {bookings.cta.label}
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delayMs={140}>
          <aside
            aria-label="Boekingsinformatie"
            className="rounded-2xl border border-[rgba(36,27,23,0.10)] bg-[var(--color-surface)] p-6 text-[var(--color-text-dark)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            <h3 className="mb-3 font-display text-3xl">{bookings.infoTitle}</h3>
            <ul className="space-y-3">
              {bookings.infoItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
