"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StickyListenBarProps = {
  sectionId: string;
  contactId: string;
  trackTitle: string;
  trackHref: string;
  artistHref: string;
};

export function StickyListenBar({
  sectionId,
  contactId,
  trackTitle,
  trackHref,
  artistHref
}: StickyListenBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const section = document.getElementById(sectionId);
      const contactSection = document.getElementById(contactId);
      if (!section) return;

      const sectionRect = section.getBoundingClientRect();
      const contactRect = contactSection?.getBoundingClientRect();
      const enteredDiscography = sectionRect.top <= window.innerHeight * 0.8;
      const beforeContact = contactRect ? contactRect.top > window.innerHeight * 0.24 : true;

      setIsVisible(enteredDiscography && beforeContact);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [contactId, sectionId]);

  return (
    <aside
      aria-label="Nu luisteren"
      className={`sticky-listen-bar hidden md:block ${isVisible ? "is-visible" : ""}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">Nu luisteren</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{trackTitle}</p>
      <div className="mt-2 flex gap-2">
        <Link
          href={trackHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-3 py-1.5 text-xs font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
        >
          Open track
        </Link>
        <Link
          href={artistHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
        >
          Artist
        </Link>
      </div>
    </aside>
  );
}
