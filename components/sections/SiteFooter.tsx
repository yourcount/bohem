import Image from "next/image";

import type { SiteContent } from "@/lib/types";

type SiteFooterProps = {
  footer: SiteContent["footer"];
};

export function SiteFooter({ footer }: SiteFooterProps) {
  return (
    <footer aria-label="Footer" className="border-t border-[var(--color-line-muted)] bg-[#111d30] py-8 text-[#d6e3ec]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
        <Image
          src="/brand/logos/bohem-logo-white-moon-color.webp"
          alt={footer.copyright}
          width={180}
          height={68}
          className="h-8 w-auto"
        />
        <span className="block mt-3 text-sm text-[#cfd9e2] sm:mt-0">
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
