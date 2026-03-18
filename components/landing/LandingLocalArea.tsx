import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";

type LandingLocalAreaProps = {
  id?: string;
  title: string;
  intro?: string;
  cities?: string[];
  proofTitle?: string;
  proofItems?: string[];
  cta?: {
    label: string;
    href: string;
    variant?: "primary" | "secondary";
  };
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function LandingLocalArea({ id = "regio", title, intro, cities = [], proofTitle, proofItems = [], cta }: LandingLocalAreaProps) {
  const visibleCities = cities.map((city) => city.trim()).filter((city) => city.length > 0);
  const visibleProof = proofItems.map((item) => item.trim()).filter((item) => item.length > 0);
  const hasCta = Boolean(cta && hasText(cta.label) && hasText(cta.href));

  if (!hasText(title) && !hasText(intro) && visibleCities.length === 0 && visibleProof.length === 0 && !hasCta) {
    return null;
  }

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="section-ambient py-16">
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Reveal>
          <div className="chiaroscuro-panel rounded-3xl border border-[rgba(67,135,133,0.45)] bg-[linear-gradient(155deg,rgba(17,31,45,0.92)_0%,rgba(27,24,34,0.92)_100%)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.22)] md:p-8">
            {hasText(title) ? (
              <h2 id={`${id}-title`} className="font-display text-3xl text-[#f8f1e5] sm:text-4xl">
                {title}
              </h2>
            ) : null}
            {hasText(intro) ? <p className="mt-4 max-w-[68ch] text-[var(--color-text-primary)]">{intro}</p> : null}

            {visibleCities.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {visibleCities.map((city) => (
                  <span
                    key={city}
                    className="inline-flex items-center rounded-full border border-[rgba(242,139,14,0.35)] bg-[rgba(242,139,14,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#f3d7b0]"
                  >
                    {city}
                  </span>
                ))}
              </div>
            ) : null}

            {visibleProof.length > 0 ? (
              <div className="mt-6">
                {hasText(proofTitle) ? <h3 className="font-display text-2xl text-[#f8f1e5]">{proofTitle}</h3> : null}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {visibleProof.map((item) => (
                    <article key={item} className="subtle-lift-card chiaroscuro-panel rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.05)] p-4 text-sm text-[#e7d7c1]">
                      {item}
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {hasCta ? (
              <div className="mt-6">
                <ButtonLink href={cta!.href} variant={cta!.variant ?? "secondary"} dataCta={`landing_local_${id}`}>
                  {cta!.label}
                </ButtonLink>
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
