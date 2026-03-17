"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type StickyListenBarProps = {
  visibleSectionIds: string[];
  eyebrow: string;
  trackTitle: string;
  trackHref: string;
  ctaLabel: string;
  artworkSrc: string;
  artworkAlt: string;
  artworkFocusX?: number;
  artworkFocusY?: number;
};

export function StickyListenBar({
  visibleSectionIds,
  eyebrow,
  trackTitle,
  trackHref,
  ctaLabel,
  artworkSrc,
  artworkAlt,
  artworkFocusX = 50,
  artworkFocusY = 50
}: StickyListenBarProps) {
  const [isEligible, setIsEligible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const viewportOffset = window.innerHeight * 0.35;
      const shouldShow = visibleSectionIds.some((id) => {
        const section = document.getElementById(id);
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= viewportOffset && rect.bottom > viewportOffset;
      });
      setIsEligible(shouldShow);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [visibleSectionIds]);

  const showBar = !isDismissed && (isEligible || isManuallyOpen);
  const showLauncher = !showBar;

  return (
    <>
      <aside aria-label="Nu luisteren" className={`sticky-listen-bar ${showBar ? "is-visible" : ""}`}>
        <button
          type="button"
          aria-label="Sluit luisterbalk"
          data-cta="listenbar_close"
          className="sticky-listen-close"
          onClick={() => {
            setIsDismissed(true);
            setIsManuallyOpen(false);
          }}
        >
          ×
        </button>
        <div className="sticky-listen-left">
          <div className="sticky-listen-vinyl" aria-hidden="true">
            <div className="sticky-listen-vinyl-label">B</div>
          </div>
          <div className="sticky-listen-content">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f3d7b0]">{eyebrow}</p>
            <p className="sticky-listen-title">{trackTitle}</p>
          </div>
        </div>

        <div className="sticky-listen-right">
          <figure className="sticky-listen-cover" aria-label="Single artwork">
            <Image
              src={artworkSrc}
              alt={artworkAlt}
              width={148}
              height={148}
              className="h-full w-full object-cover"
              style={{ objectPosition: `${artworkFocusX}% ${artworkFocusY}%` }}
              loading="lazy"
              sizes="148px"
              quality={76}
            />
          </figure>
          <Link
            href={trackHref}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="listenbar_spotify_play"
            className="sticky-listen-button inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-4 py-2 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
          >
            {ctaLabel}
          </Link>
        </div>
      </aside>

      <button
        type="button"
        aria-label="Open luisterbalk"
        data-cta="listenbar_open"
        className={`sticky-listen-launcher ${showLauncher ? "is-visible" : ""}`}
        onClick={() => {
          setIsDismissed(false);
          setIsManuallyOpen(true);
        }}
      >
        <span aria-hidden="true">♫</span>
      </button>
    </>
  );
}
