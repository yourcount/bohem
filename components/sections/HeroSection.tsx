"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type HeroSectionProps = {
  hero: SiteContent["hero"];
};

export function HeroSection({ hero }: HeroSectionProps) {
  const [parallaxY, setParallaxY] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const allowInteractiveLightRef = useRef(false);
  const driftFrameRef = useRef<number | null>(null);
  const driftStartRef = useRef(0);
  const hasPointerInteractedRef = useRef(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    allowInteractiveLightRef.current = !reduceMotion && desktop;
    if (reduceMotion) return;

    const updateParallax = () => {
      setParallaxY(Math.min(window.scrollY, 320));
    };

    updateParallax();
    window.addEventListener("scroll", updateParallax, { passive: true });
    return () => window.removeEventListener("scroll", updateParallax);
  }, []);

  useEffect(() => {
    if (!allowInteractiveLightRef.current || !sectionRef.current) return;

    driftStartRef.current = performance.now();

    const animateIdleLight = (timestamp: number) => {
      if (!sectionRef.current || !allowInteractiveLightRef.current) return;
      if (!hasPointerInteractedRef.current) {
        const t = (timestamp - driftStartRef.current) / 1000;
        const x = 86 + Math.sin(t * 0.46) * 3.6 + Math.sin(t * 0.2) * 1.2;
        const y = 42 + Math.cos(t * 0.38) * 2.8 + Math.sin(t * 0.25) * 0.9;
        sectionRef.current.style.setProperty("--hero-spot-x", `${Math.min(Math.max(x, 78), 93)}%`);
        sectionRef.current.style.setProperty("--hero-spot-y", `${Math.min(Math.max(y, 36), 49)}%`);
      }

      driftFrameRef.current = window.requestAnimationFrame(animateIdleLight);
    };

    driftFrameRef.current = window.requestAnimationFrame(animateIdleLight);
    return () => {
      if (driftFrameRef.current !== null) {
        window.cancelAnimationFrame(driftFrameRef.current);
        driftFrameRef.current = null;
      }
    };
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!allowInteractiveLightRef.current || !sectionRef.current) return;
    hasPointerInteractedRef.current = true;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    sectionRef.current.style.setProperty("--hero-spot-x", `${Math.min(Math.max(x, 0), 100)}%`);
    sectionRef.current.style.setProperty("--hero-spot-y", `${Math.min(Math.max(y, 0), 100)}%`);
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      onPointerMove={handlePointerMove}
      className="hero-spotlight-shell relative grid min-h-[82svh] items-end overflow-clip pb-20 pt-10 sm:min-h-[85svh] sm:pb-24 sm:pt-12 md:min-h-[calc(100svh-4rem)]"
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
      <div className="hero-mask absolute inset-0" />
      <div className="hero-spotlight pointer-events-none absolute inset-0 hidden md:block" />
      <Image
        src="/brand/elements/bohem-moon-element.webp"
        alt=""
        width={420}
        height={420}
        className="pointer-events-none absolute bottom-8 right-6 hidden h-auto w-[190px] opacity-[0.2] md:block lg:right-8 lg:w-[230px] xl:w-[275px] 2xl:right-10 2xl:w-[320px] 2xl:opacity-[0.22]"
        style={{ transform: `translateY(${parallaxY * 0.08}px)` }}
        aria-hidden="true"
      />
      <Image
        src="/brand/elements/bohem-crow-element.webp"
        alt=""
        width={160}
        height={152}
        className="pointer-events-none absolute bottom-8 right-8 hidden h-auto w-[160px] opacity-30 md:block"
        style={{ width: "auto", height: "auto", transform: `translateY(${-parallaxY * 0.06}px)` }}
        aria-hidden="true"
      />
      <div className="hero-scroll-indicator pointer-events-none absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-3 md:flex" aria-hidden="true">
        <span className="hero-scroll-moon">◐</span>
        <span className="hero-scroll-track">
          <span className="hero-scroll-spark" />
        </span>
        <span className="hero-scroll-crow">✦</span>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1120px] px-4 sm:px-6 2xl:max-w-[1440px] 2xl:px-12">
        <Reveal className="hero-intro" delayMs={20}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#f3d7b0]">{hero.eyebrow}</p>
        </Reveal>
        <Reveal className="hero-intro" delayMs={110}>
          <h1 id="hero-title" className="mb-4 max-w-[18ch] font-display text-4xl leading-[1.1] sm:text-5xl md:text-6xl 2xl:max-w-[22ch] 2xl:text-7xl">
            {hero.headline}
          </h1>
        </Reveal>
        <Reveal className="hero-intro" delayMs={200}>
          <p className="mb-6 max-w-[56ch] text-[0.98rem] text-[var(--color-text-primary)] sm:text-base 2xl:max-w-[64ch] 2xl:text-xl">
            {hero.subhead}
          </p>
        </Reveal>
        <Reveal className="hero-intro" delayMs={290}>
          <div aria-label="Primaire acties" className="flex flex-wrap gap-3">
            {hero.ctas.map((cta) => (
              <ButtonLink key={cta.label} href={cta.href} variant={cta.variant ?? "primary"} dataCta="hero_book_primary">
                {cta.label}
              </ButtonLink>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
