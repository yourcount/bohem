"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type HeroSectionProps = {
  hero: SiteContent["hero"];
};

export function HeroSection({ hero }: HeroSectionProps) {
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const updateParallax = () => {
      setParallaxY(Math.min(window.scrollY, 320));
    };

    updateParallax();
    window.addEventListener("scroll", updateParallax, { passive: true });
    return () => window.removeEventListener("scroll", updateParallax);
  }, []);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative grid min-h-[82svh] items-end overflow-clip pb-20 pt-10 sm:min-h-[85svh] sm:pb-24 sm:pt-12 md:min-h-[calc(100svh-4rem)]"
    >
      <div className="absolute inset-0">
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          className="hero-mobile-zoom object-cover object-top"
          priority
          quality={92}
          sizes="(max-width: 767px) 100vw, 100vw"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(14,22,34,0.58)_0%,rgba(14,22,34,0.2)_42%,rgba(14,22,34,0.68)_100%)]" />
      <Image
        src="/brand/elements/bohem-moon-element.webp"
        alt=""
        width={420}
        height={420}
        className="pointer-events-none absolute -right-20 top-20 hidden opacity-20 md:block"
        style={{ transform: `translateY(${parallaxY * 0.08}px)` }}
        aria-hidden="true"
      />
      <Image
        src="/brand/elements/bohem-crow-element.webp"
        alt=""
        width={160}
        height={152}
        className="pointer-events-none absolute bottom-8 right-8 hidden opacity-30 md:block"
        style={{ transform: `translateY(${-parallaxY * 0.06}px)` }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Reveal className="hero-intro" delayMs={40}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#f3d7b0]">{hero.eyebrow}</p>
        </Reveal>
        <Reveal className="hero-intro" delayMs={120}>
          <h1 id="hero-title" className="mb-4 max-w-[18ch] font-display text-4xl leading-[1.1] sm:text-5xl md:text-6xl">
            {hero.headline}
          </h1>
        </Reveal>
        <Reveal className="hero-intro" delayMs={220}>
          <p className="mb-6 max-w-[56ch] text-[0.98rem] text-[var(--color-text-primary)] sm:text-base">{hero.subhead}</p>
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
