import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import type { Cta } from "@/lib/types";

type LandingCtaBandProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  body: string;
  proofIntro?: string;
  proofItems?: string[];
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

export function LandingCtaBand({ id = "contact", eyebrow, title, body, proofIntro, proofItems, primaryCta, secondaryCta, homeLink }: LandingCtaBandProps) {
  const actions = [primaryCta, secondaryCta].filter(
    (cta): cta is Cta => Boolean(cta && hasText(cta.label) && hasText(cta.href))
  );
  const visibleProofItems = (proofItems ?? []).map((item) => item.trim()).filter((item) => item.length > 0).slice(0, 3);
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
            {hasText(proofIntro) || visibleProofItems.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-[rgba(243,215,176,0.16)] bg-[rgba(248,241,229,0.05)] p-4">
                {hasText(proofIntro) ? <p className="text-sm text-[#f3d7b0]">{proofIntro}</p> : null}
                {visibleProofItems.length > 0 ? (
                  <div className={`grid gap-3 md:grid-cols-3 ${hasText(proofIntro) ? "mt-3" : ""}`.trim()}>
                    {visibleProofItems.map((item) => (
                      <div key={item} className="rounded-xl border border-[rgba(243,215,176,0.12)] bg-[rgba(9,14,24,0.18)] px-3 py-3 text-sm leading-6 text-[#ead7bc]">
                        {item}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
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
