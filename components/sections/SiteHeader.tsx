"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import type { NavItem } from "@/lib/types";

type SiteHeaderProps = {
  brandName: string;
  navigation: NavItem[];
};

export function SiteHeader({ brandName, navigation }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string>(navigation[0]?.href ?? "#main-content");

  const sectionIds = useMemo(
    () =>
      navigation
        .map((item) => item.href)
        .filter((href) => href.startsWith("#"))
        .map((href) => href.slice(1)),
    [navigation]
  );

  const handleCloseMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const handleNavClick = (href: string) => {
    setActiveHref(href);
    handleCloseMenu();
  };

  useEffect(() => {
    const updateActiveSection = () => {
      const viewportOffset = window.innerHeight * 0.35;
      let current = navigation[0]?.href ?? "#main-content";

      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.top <= viewportOffset) {
          current = `#${id}`;
        }
      });

      setActiveHref(current);
    };

    const updateFromHash = () => {
      if (window.location.hash) {
        setActiveHref(window.location.hash);
      }
    };

    updateFromHash();
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("hashchange", updateFromHash);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("hashchange", updateFromHash);
    };
  }, [navigation, sectionIds]);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line-muted)] bg-[rgba(26,20,18,0.82)] backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center justify-between gap-4 px-6">
        <Link href="#main-content" className="inline-flex items-center">
          <Image
            src="/brand/logos/bohem-logo-white-moon-color.webp"
            alt={brandName}
            width={220}
            height={84}
            className="h-10 w-auto sm:h-11"
            priority
          />
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-sm font-semibold transition-transform active:scale-[0.98] md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Sluit menu" : "Open menu"}
          onClick={toggleMenu}
        >
          {isMenuOpen ? "Sluiten" : "Menu"}
        </button>

        <nav aria-label="Snelle navigatie" className="hidden md:block">
          <ul className="flex min-w-max gap-5 text-sm">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={activeHref === item.href ? "page" : undefined}
                  onClick={() => handleNavClick(item.href)}
                  className={`transition-colors hover:text-[#f3d7b0] focus-visible:text-[#f3d7b0] ${
                    activeHref === item.href ? "text-[#f3d7b0] underline decoration-[1.5px] underline-offset-[6px]" : ""
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {isMenuOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Mobiel menu"
          className="mobile-menu-panel border-t border-[var(--color-line-muted)] bg-[rgba(26,20,18,0.96)] md:hidden"
        >
          <ul className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-6 py-4">
            {navigation.map((item) => (
              <li key={`mobile-${item.href}`}>
                <Link
                  href={item.href}
                  aria-current={activeHref === item.href ? "page" : undefined}
                  className={`mobile-menu-link block rounded-xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.05)] px-4 py-3 text-base font-medium transition-colors hover:border-[#c8873e] hover:text-[#f3d7b0] active:scale-[0.99] ${
                    activeHref === item.href ? "border-[#c8873e] text-[#f3d7b0]" : ""
                  }`}
                  onClick={() => handleNavClick(item.href)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
