import Image from "next/image";
import Link from "next/link";

import type { SiteContent } from "@/lib/types";

type SiteFooterProps = {
  footer: SiteContent["footer"];
};

export function SiteFooter({ footer }: SiteFooterProps) {
  const footerText = footer.copyright?.trim() ?? "";
  const footerLinks = (footer.links ?? [])
    .map((item) => ({ label: item.label?.trim() ?? "", href: item.href?.trim() ?? "" }))
    .filter((item) => item.label.length > 0 && item.href.length > 0);
  const socialLinks = [
    {
      href: footer.youtubeHref?.trim() ?? "",
      label: "YouTube van Bohèm",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M23.5 6.2a3.2 3.2 0 0 0-2.2-2.3C19.2 3.3 12 3.3 12 3.3s-7.2 0-9.3.6A3.2 3.2 0 0 0 .5 6.2 33.7 33.7 0 0 0 0 12a33.7 33.7 0 0 0 .5 5.8 3.2 3.2 0 0 0 2.2 2.3c2.1.6 9.3.6 9.3.6s7.2 0 9.3-.6a3.2 3.2 0 0 0 2.2-2.3A33.7 33.7 0 0 0 24 12a33.7 33.7 0 0 0-.5-5.8ZM9.6 15.5V8.5L15.8 12l-6.2 3.5Z" />
        </svg>
      )
    },
    {
      href: footer.instagramHref?.trim() ?? "",
      label: "Instagram van Bohèm",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6A5.2 5.2 0 0 1 16.8 22H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm0 1.9A3.3 3.3 0 0 0 3.9 7.2v9.6a3.3 3.3 0 0 0 3.3 3.3h9.6a3.3 3.3 0 0 0 3.3-3.3V7.2a3.3 3.3 0 0 0-3.3-3.3H7.2Zm10.1 1.5a1.2 1.2 0 1 1 0 2.3 1.2 1.2 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Z" />
        </svg>
      )
    }
  ].filter((item) => item.href.length > 0);

  return (
    <footer aria-label="Footer" className="border-t border-[var(--color-line-muted)] bg-[#111d30] py-8 text-[#d6e3ec]">
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-6 lg:grid-cols-[180px_minmax(420px,1fr)_260px] lg:items-start">
        <div className="lg:pt-1">
          <Image
            src="/brand/logos/bohem-logo-white-moon-color.webp"
            alt={footerText || "Bohèm"}
            width={180}
            height={68}
            className="h-8 w-auto"
          />
        </div>

        {footerLinks.length > 0 ? (
          <nav aria-label="Belangrijke links" className="w-full lg:pl-6 xl:pl-10">
            <div className="max-w-[560px]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">Belangrijke links</p>
              <ul className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
                {footerLinks.map((link) => (
                  <li key={`${link.label}-${link.href}`} className="min-w-0">
                    <Link
                      href={link.href}
                      className="quiet-link text-sm text-[#d6e3ec] underline decoration-transparent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        ) : (
          <div />
        )}

        <div className="text-sm text-[#cfd9e2] lg:ml-auto lg:max-w-[260px] lg:text-right">
          {socialLinks.length > 0 ? (
            <div className="mb-3 flex items-center gap-2 lg:justify-end">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line-muted)] text-[#f3d7b0] transition-[transform,border-color,color,box-shadow] duration-200 hover:-translate-y-[1px] hover:border-[#c8873e] hover:text-white hover:shadow-[0_8px_18px_rgba(0,0,0,0.18)]"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          ) : null}
          {footerText ? <p className="mb-3 text-sm text-[#d6e3ec]">{footerText}</p> : null}
          <p>
            Designed &amp; Developed by{" "}
            <a
              id="footer-designer-link"
              href="https://www.instagram.com/yourcounter/"
              target="_blank"
              rel="noopener noreferrer"
              className="quiet-link underline"
            >
              Tijmen de Graaf
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
