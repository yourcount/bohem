"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { scrollToAnchor } from "@/lib/ui/anchor-scroll";
import { getExternalLinkProps } from "@/lib/ui/link-target";

export type MobileStickyCtaProps = {
  href: string;
  label: string;
  visibleSectionIds: string[];
};

export function MobileStickyCta({ href, label, visibleSectionIds }: MobileStickyCtaProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolledIntoFlow, setHasScrolledIntoFlow] = useState(false);
  const isCtaVisible = isVisible && hasScrolledIntoFlow;

  useEffect(() => {
    const visibleSet = new Set<string>();
    let observer: IntersectionObserver | null = null;

    const handleFlowVisibility = () => {
      if (window.innerWidth >= 768) {
        setIsVisible(false);
        setHasScrolledIntoFlow(false);
        return;
      }

      setHasScrolledIntoFlow(window.scrollY > 80);
      setIsVisible(visibleSet.size > 0);
    };

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          if (!id) return;
          if (entry.isIntersecting) {
            visibleSet.add(id);
          } else {
            visibleSet.delete(id);
          }
        });
        handleFlowVisibility();
      },
      {
        root: null,
        rootMargin: "-35% 0px -55% 0px",
        threshold: 0
      }
    );

    visibleSectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer?.observe(section);
    });

    handleFlowVisibility();
    window.addEventListener("scroll", handleFlowVisibility, { passive: true });
    window.addEventListener("resize", handleFlowVisibility);
    return () => {
      window.removeEventListener("scroll", handleFlowVisibility);
      window.removeEventListener("resize", handleFlowVisibility);
      observer?.disconnect();
    };
  }, [visibleSectionIds]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const className = "has-mobile-sticky-cta";
    if (isCtaVisible) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
    return () => {
      document.body.classList.remove(className);
    };
  }, [isCtaVisible]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) return;

    event.preventDefault();
    scrollToAnchor(href, { behavior: "smooth" });
  };

  return (
    <div
      className={`mobile-sticky-cta md:hidden ${isCtaVisible ? "is-visible opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <Link
        href={href}
        {...getExternalLinkProps(href)}
        onClick={handleClick}
        data-cta="mobile_bookings_primary"
        className="cta-glow pointer-events-auto inline-flex min-h-11 w-full max-w-[22rem] items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-6 py-3 text-sm font-bold text-[var(--color-bg-deep)] shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
      >
        {label}
      </Link>
    </div>
  );
}
