import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import type { Cta } from "@/lib/types";

type LandingCtaBandProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  body: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  homeLink?: {
    label: string;
    href: string;
    intro?: string;
  };
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function LandingCtaBand({ id = "contact", eyebrow, title, body, primaryCta, secondaryCta, homeLink }: LandingCtaBandProps) {
  const actions = [primaryCta, secondaryCta].filter(
    (cta): cta is Cta => Boolean(cta && hasText(cta.label) && hasText(cta.href))
  );
  const showHomeLink = Boolean(homeLink && hasText(homeLink.label) && hasText(homeLink.href));

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="section-ambient py-16">
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Reveal>
          <div className="rounded-3xl border border-[rgba(242,139,14,0.45)] bg-[linear-gradient(145deg,rgba(39,27,21,0.92)_0%,rgba(28,22,31,0.92)_100%)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.24)] md:p-8">
            {hasText(eyebrow) ? (
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">
                {eyebrow}
              </p>
            ) : null}
            <h2 id={`${id}-title`} className="font-display text-3xl text-[#f8f1e5] sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 max-w-[64ch] text-[var(--color-text-primary)]">{body}</p>
            {actions.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {actions.map((cta) => (
                  <ButtonLink key={`${cta.label}-${cta.href}`} href={cta.href} variant={cta.variant ?? "primary"} dataCta={`landing_${id}_${cta.label}`}>
                    {cta.label}
                  </ButtonLink>
                ))}
              </div>
            ) : null}
            {showHomeLink ? (
              <div className="mt-6 border-t border-[rgba(242,139,14,0.2)] pt-5 text-sm text-[var(--color-text-primary)]">
                {hasText(homeLink?.intro) ? <p>{homeLink?.intro}</p> : null}
                <div className="mt-3">
                  <ButtonLink href={homeLink!.href} variant="secondary" dataCta={`landing_${id}_home`}>
                    {homeLink!.label}
                  </ButtonLink>
                </div>
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
