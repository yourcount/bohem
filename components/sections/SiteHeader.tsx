"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";

import type { NavItem } from "@/lib/types";
import { scrollToAnchor } from "@/lib/ui/anchor-scroll";

type SiteHeaderProps = {
  brandName: string;
  navigation: NavItem[];
};

const socialLinks = [
  {
    href: "https://www.youtube.com/@VideoBoh%C3%A8m",
    label: "YouTube van Bohèm",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M23.5 6.2a3.2 3.2 0 0 0-2.2-2.3C19.2 3.3 12 3.3 12 3.3s-7.2 0-9.3.6A3.2 3.2 0 0 0 .5 6.2 33.7 33.7 0 0 0 0 12a33.7 33.7 0 0 0 .5 5.8 3.2 3.2 0 0 0 2.2 2.3c2.1.6 9.3.6 9.3.6s7.2 0 9.3-.6a3.2 3.2 0 0 0 2.2-2.3A33.7 33.7 0 0 0 24 12a33.7 33.7 0 0 0-.5-5.8ZM9.6 15.5V8.5L15.8 12l-6.2 3.5Z" />
      </svg>
    )
  },
  {
    href: "https://www.instagram.com/musicbybohem/?__d=1%2F",
    label: "Instagram van Bohèm",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6A5.2 5.2 0 0 1 16.8 22H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm0 1.9A3.3 3.3 0 0 0 3.9 7.2v9.6a3.3 3.3 0 0 0 3.3 3.3h9.6a3.3 3.3 0 0 0 3.3-3.3V7.2a3.3 3.3 0 0 0-3.3-3.3H7.2Zm10.1 1.5a1.2 1.2 0 1 1 0 2.3 1.2 1.2 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Z" />
      </svg>
    )
  }
] as const;

export function SiteHeader({ brandName, navigation }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string>("");
  const pendingHrefRef = useRef<string | null>(null);

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
  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    pendingHrefRef.current = null;
    setActiveHref("");
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      event.preventDefault();
    }

    pendingHrefRef.current = href;
    setActiveHref(href);
    handleCloseMenu();

    if (!href.startsWith("#")) return;

    requestAnimationFrame(() => {
      scrollToAnchor(href, { behavior: "smooth" });
    });
  };

  useEffect(() => {
    const updateActiveSection = () => {
      const viewportOffset = window.innerHeight * 0.35;
      const pendingHref = pendingHrefRef.current;

      if (pendingHref) {
        const pendingId = pendingHref.slice(1);
        const pendingSection = document.getElementById(pendingId);
        if (!pendingSection) {
          pendingHrefRef.current = null;
        } else {
          const rect = pendingSection.getBoundingClientRect();
          const isReached = rect.top <= viewportOffset && rect.bottom > viewportOffset;
          if (isReached) {
            pendingHrefRef.current = null;
          } else {
            // While smooth-scrolling to a clicked target, keep its active state stable.
            return;
          }
        }
      }

      let current = "";

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
        pendingHrefRef.current = null;
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
    <header id="site-header" className="sticky top-0 z-30 border-b border-[var(--color-line-muted)] bg-[rgba(26,20,18,0.82)] backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        <Link href="#" onClick={handleLogoClick} className="inline-flex items-center">
          <Image
            src="/brand/logos/bohem-logo-white-moon-color.webp"
            alt={brandName}
            width={220}
            height={84}
            className="logo-intro h-10 w-auto sm:h-11"
            sizes="(max-width: 640px) 160px, 220px"
            quality={78}
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

        <div className="hidden items-center gap-3 md:flex">
          <nav aria-label="Snelle navigatie">
            <ul className="flex min-w-max gap-5 text-sm">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={activeHref === item.href ? "page" : undefined}
                    onClick={(event) => handleNavClick(event, item.href)}
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
          <div className="ml-1 flex items-center gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line-muted)] text-[#f3d7b0] transition-colors hover:border-[#c8873e] hover:text-white"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {isMenuOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Mobiel menu"
          className="mobile-menu-panel border-t border-[var(--color-line-muted)] bg-[rgba(26,20,18,0.96)] md:hidden"
        >
          <ul className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-4 py-4 sm:px-6">
            {navigation.map((item) => (
              <li key={`mobile-${item.href}`}>
                <Link
                  href={item.href}
                  aria-current={activeHref === item.href ? "page" : undefined}
                  className={`mobile-menu-link block rounded-xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.05)] px-4 py-3 text-base font-medium transition-colors hover:border-[#c8873e] hover:text-[#f3d7b0] active:scale-[0.99] ${
                    activeHref === item.href ? "border-[#c8873e] text-[#f3d7b0]" : ""
                  }`}
                  onClick={(event) => handleNavClick(event, item.href)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex items-center gap-2">
              {socialLinks.map((link) => (
                <a
                  key={`mobile-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.05)] text-[#f3d7b0] transition-colors hover:border-[#c8873e] hover:text-white"
                >
                  {link.icon}
                </a>
              ))}
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
