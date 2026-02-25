import Image from "next/image";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type HeroSectionProps = {
  hero: SiteContent["hero"];
};

export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section aria-labelledby="hero-title" className="relative grid min-h-[85svh] items-end overflow-clip pb-24 pt-12">
      <div className="absolute inset-0">
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          className="hero-mobile-zoom object-cover object-top"
          priority
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(14,22,34,0.58)_0%,rgba(14,22,34,0.2)_42%,rgba(14,22,34,0.68)_100%)]" />
      <Image
        src="/brand/elements/bohem-moon-element.webp"
        alt=""
        width={420}
        height={420}
        className="pointer-events-none absolute -right-20 top-20 hidden opacity-20 md:block"
        aria-hidden="true"
      />
      <Image
        src="/brand/elements/bohem-crow-element.webp"
        alt=""
        width={160}
        height={152}
        className="pointer-events-none absolute bottom-8 right-8 hidden opacity-30 md:block"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1120px] px-6">
        <Reveal className="hero-intro" delayMs={40}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#f3d7b0]">{hero.eyebrow}</p>
        </Reveal>
        <Reveal className="hero-intro" delayMs={120}>
          <h1 id="hero-title" className="mb-4 max-w-[18ch] font-display text-5xl leading-[1.1] sm:text-6xl">
            {hero.headline}
          </h1>
        </Reveal>
        <Reveal className="hero-intro" delayMs={220}>
          <p className="mb-6 max-w-[56ch] text-[var(--color-text-primary)]">{hero.subhead}</p>
        </Reveal>
        <Reveal className="hero-intro" delayMs={320}>
          <div aria-label="Primaire acties" className="flex flex-wrap gap-3">
            {hero.ctas.map((cta) => (
              <ButtonLink key={cta.label} href={cta.href} variant={cta.variant ?? "primary"}>
                {cta.label}
              </ButtonLink>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
