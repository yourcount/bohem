import Image from "next/image";

import type { SiteContent } from "@/lib/types";

type SiteFooterProps = {
  footer: SiteContent["footer"];
};

export function SiteFooter({ footer }: SiteFooterProps) {
  const year = new Date().getFullYear();

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
        <p>&copy; {year} {footer.copyright}</p>
      </div>
    </footer>
  );
}
