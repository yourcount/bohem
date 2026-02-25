import type { SiteContent } from "@/lib/types";

type SiteFooterProps = {
  footer: SiteContent["footer"];
};

export function SiteFooter({ footer }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer aria-label="Footer" className="border-t border-[var(--color-line-muted)] bg-[#140f0d] py-6 text-[#cdb49a]">
      <div className="mx-auto w-full max-w-[1120px] px-6">
        <p>&copy; {year} {footer.copyright}</p>
      </div>
    </footer>
  );
}
