import Image from "next/image";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import { getImageObjectPosition } from "@/lib/image-focus";
import type { Cta, ImageAsset } from "@/lib/types";

type LandingHeroProps = {
  id?: string;
  eyebrow?: string;
  audienceLabel?: string;
  title: string;
  intro: string;
  note?: string;
  listenCue?: {
    intro: string;
    ctaLabel: string;
    href: string;
  };
  quickPanel?: {
    title: string;
    items?: string[];
    primaryCta?: Cta;
    secondaryCta?: Cta;
  };
  image?: ImageAsset & {
    width?: number;
    height?: number;
  };
  primaryCta?: Cta;
  secondaryCta?: Cta;
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function LandingHero({ id = "intro", eyebrow, audienceLabel, title, intro, note, listenCue, quickPanel, image, primaryCta, secondaryCta }: LandingHeroProps) {
  const actions = [primaryCta, secondaryCta].filter(
    (cta): cta is Cta => Boolean(cta && hasText(cta.label) && hasText(cta.href))
  );
  const quickPanelActions = [quickPanel?.primaryCta, quickPanel?.secondaryCta].filter(
    (cta): cta is Cta => Boolean(cta && hasText(cta.label) && hasText(cta.href))
  );
  const quickPanelItems = (quickPanel?.items ?? []).filter((item) => hasText(item));
  const hasImage = Boolean(image?.src);
  const imageWidth = image?.width ?? 1536;
  const imageHeight = image?.height ?? 864;
  const hasListenCue = Boolean(listenCue && hasText(listenCue.intro) && hasText(listenCue.ctaLabel) && hasText(listenCue.href));
  const hasQuickPanel = Boolean(quickPanel && (hasText(quickPanel.title) || quickPanelItems.length > 0 || quickPanelActions.length > 0));
  const hasMetaDrawer = hasText(audienceLabel) || hasText(note) || hasListenCue || hasQuickPanel;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="section-ambient overflow-hidden bg-[linear-gradient(180deg,#241a18_0%,#2b201f_56%,#211816_100%)] py-16 sm:py-20"
    >
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <Reveal className="max-w-[760px]">
          <div>
            {(hasText(eyebrow) || hasText(audienceLabel)) ? (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {hasText(eyebrow) ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">
                    {eyebrow}
                  </p>
                ) : null}
                {hasText(audienceLabel) ? (
                  <p className="inline-flex max-w-full rounded-full border border-[rgba(242,139,14,0.22)] bg-[rgba(242,139,14,0.08)] px-3 py-1.5 text-xs text-[#f3d7b0] sm:text-sm">
                    {audienceLabel}
                  </p>
                ) : null}
              </div>
            ) : null}
            <h1 id={`${id}-title`} className="font-display text-4xl leading-[1.08] text-[#f8f1e5] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-[56ch] text-base leading-7 text-[var(--color-text-primary)] sm:text-[1.05rem] sm:leading-8">
              {intro}
            </p>
            {actions.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {actions.map((cta) => (
                  <ButtonLink key={`${cta.label}-${cta.href}`} href={cta.href} variant={cta.variant ?? "primary"} dataCta={`landing_${id}_${cta.label}`}>
                    {cta.label}
                  </ButtonLink>
                ))}
              </div>
            ) : null}
            {hasMetaDrawer ? (
              <details className="mt-5 max-w-[62ch] overflow-hidden rounded-2xl border border-[rgba(243,215,176,0.18)] bg-[rgba(248,241,229,0.05)] shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-[#f1dfc5] marker:content-none">
                  <span>Meer context</span>
                  <span aria-hidden="true" className="text-xs uppercase tracking-[0.12em] text-[#f3d7b0]">
                    Open
                  </span>
                </summary>
                <div className="border-t border-[rgba(243,215,176,0.12)] px-5 py-5">
                  {hasText(note) ? (
                    <p className="max-w-[56ch] text-sm leading-7 text-[#d9c4a8]">{note}</p>
                  ) : null}
                  {hasListenCue ? (
                    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[rgba(67,135,133,0.28)] bg-[rgba(18,30,46,0.34)] px-4 py-4 text-sm text-[#e7d7c1] sm:flex-row sm:items-center sm:justify-between">
                      <span className="inline-flex min-w-0 items-start gap-2 leading-6 sm:flex-1">
                        <span aria-hidden="true" className="equalizer-icon text-[#f3d7b0]">
                          <span />
                          <span />
                          <span />
                        </span>
                        <span className="min-w-0">{listenCue!.intro}</span>
                      </span>
                      <div className="shrink-0 self-start sm:self-center">
                        <ButtonLink href={listenCue!.href} variant="secondary" dataCta={`landing_${id}_listen_context`}>
                          {listenCue!.ctaLabel}
                        </ButtonLink>
                      </div>
                    </div>
                  ) : null}
                  {hasQuickPanel ? (
                    <div className="mt-4">
                      {hasText(quickPanel?.title) ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">{quickPanel!.title}</p>
                      ) : null}
                      {quickPanelItems.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {quickPanelItems.map((item) => (
                            <span
                              key={item}
                              className="inline-flex rounded-full border border-[rgba(243,215,176,0.14)] bg-[rgba(248,241,229,0.05)] px-3 py-1.5 text-xs leading-5 text-[#ead7bc] sm:text-sm"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {quickPanelActions.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {quickPanelActions.map((cta) => (
                            <ButtonLink key={`${cta.label}-${cta.href}`} href={cta.href} variant={cta.variant ?? "primary"} dataCta={`landing_${id}_panel_${cta.label}`}>
                              {cta.label}
                            </ButtonLink>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>
        </Reveal>

        {hasImage ? (
          <Reveal delayMs={120} className="lg:justify-self-end">
            <figure className="chiaroscuro-frame overflow-hidden rounded-3xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.04)] shadow-[0_18px_36px_rgba(0,0,0,0.28)]">
              <Image
                src={image!.src}
                alt={image!.alt}
                width={imageWidth}
                height={imageHeight}
                className="h-full w-full object-cover"
                style={{ objectPosition: getImageObjectPosition(image!) }}
                priority={id === "intro"}
                quality={88}
                sizes="(max-width: 1023px) 92vw, 520px"
              />
            </figure>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
