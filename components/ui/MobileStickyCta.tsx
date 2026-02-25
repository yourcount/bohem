import Link from "next/link";

type MobileStickyCtaProps = {
  href: string;
  label: string;
};

export function MobileStickyCta({ href, label }: MobileStickyCtaProps) {
  return (
    <div className="mobile-sticky-cta md:hidden">
      <Link
        href={href}
        className="inline-flex w-full items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-6 py-3 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
      >
        {label}
      </Link>
    </div>
  );
}
