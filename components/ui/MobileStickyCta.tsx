"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MouseEvent } from "react";

type MobileStickyCtaProps = {
  href: string;
  label: string;
  visibleSectionIds: string[];
};

export function MobileStickyCta({ href, label, visibleSectionIds }: MobileStickyCtaProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      if (window.innerWidth >= 768) {
        setIsVisible(false);
        return;
      }

      const viewportOffset = window.innerHeight * 0.35;
      const shouldShow = visibleSectionIds.some((id) => {
        const section = document.getElementById(id);
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= viewportOffset && rect.bottom > viewportOffset;
      });

      setIsVisible(shouldShow);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [visibleSectionIds]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) return;

    event.preventDefault();
    const targetId = href.slice(1);
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.location.hash !== href) {
        history.pushState(null, "", href);
      }
      return;
    }

    history.pushState(null, "", href);
  };

  return (
    <div
      className={`mobile-sticky-cta md:hidden transition-opacity duration-200 ${isVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <Link
        href={href}
        onClick={handleClick}
        data-cta="mobile_bookings_primary"
        className="pointer-events-auto inline-flex min-h-11 w-full max-w-[22rem] items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-6 py-3 text-sm font-bold text-[var(--color-bg-deep)] shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
      >
        {label}
      </Link>
    </div>
  );
}
