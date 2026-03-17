import Image from "next/image";

import type { SiteContent } from "@/lib/types";

type SiteFooterProps = {
  footer: SiteContent["footer"];
};

export function SiteFooter({ footer }: SiteFooterProps) {
  const footerText = footer.copyright?.trim() ?? "";
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
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
        <Image
          src="/brand/logos/bohem-logo-white-moon-color.webp"
          alt={footerText || "Bohèm"}
          width={180}
          height={68}
          className="h-8 w-auto"
        />
        <span className="block mt-3 text-sm text-[#cfd9e2] sm:mt-0">
          {socialLinks.length > 0 ? (
            <span className="mb-3 flex items-center gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line-muted)] text-[#f3d7b0] transition-colors hover:border-[#c8873e] hover:text-white"
                >
                  {link.icon}
                </a>
              ))}
            </span>
          ) : null}
          {footerText ? <span className="mb-3 block text-sm text-[#d6e3ec]">{footerText}</span> : null}
          Designed &amp; Developed by{" "}
          <a
            id="footer-designer-link"
            href="https://www.instagram.com/yourcounter/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-white"
          >
            Tijmen de Graaf
          </a>
          .
        </span>
      </div>
    </footer>
  );
}
