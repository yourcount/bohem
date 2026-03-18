import Image from "next/image";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import { getImageObjectPosition } from "@/lib/image-focus";
import type { Cta, ImageAsset } from "@/lib/types";

type LandingHeroProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  intro: string;
  note?: string;
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

export function LandingHero({ id = "intro", eyebrow, title, intro, note, image, primaryCta, secondaryCta }: LandingHeroProps) {
  const actions = [primaryCta, secondaryCta].filter(
    (cta): cta is Cta => Boolean(cta && hasText(cta.label) && hasText(cta.href))
  );
  const hasImage = Boolean(image?.src);
  const imageWidth = image?.width ?? 1536;
  const imageHeight = image?.height ?? 864;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="section-ambient overflow-hidden bg-[linear-gradient(180deg,#241a18_0%,#2b201f_56%,#211816_100%)] py-16 sm:py-20"
    >
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <Reveal className="max-w-[760px]">
          <div>
            {hasText(eyebrow) ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">
                {eyebrow}
              </p>
            ) : null}
            <h1 id={`${id}-title`} className="font-display text-4xl leading-[1.08] text-[#f8f1e5] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-[60ch] text-[1.02rem] leading-8 text-[var(--color-text-primary)] sm:text-lg">
              {intro}
            </p>
            {hasText(note) ? <p className="mt-4 max-w-[55ch] text-sm text-[#d9c4a8]">{note}</p> : null}
            {actions.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {actions.map((cta) => (
                  <ButtonLink key={`${cta.label}-${cta.href}`} href={cta.href} variant={cta.variant ?? "primary"} dataCta={`landing_${id}_${cta.label}`}>
                    {cta.label}
                  </ButtonLink>
                ))}
              </div>
            ) : null}
          </div>
        </Reveal>

        {hasImage ? (
          <Reveal delayMs={120} className="lg:justify-self-end">
            <figure className="overflow-hidden rounded-3xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.04)] shadow-[0_18px_36px_rgba(0,0,0,0.28)]">
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
