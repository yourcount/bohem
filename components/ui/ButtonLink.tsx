"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { scrollToAnchor } from "@/lib/ui/anchor-scroll";

type ButtonLinkProps = {
  href: string;
  children: string;
  variant?: "primary" | "secondary";
  dataCta?: string;
};

const variants: Record<NonNullable<ButtonLinkProps["variant"]>, string> = {
  primary:
    "border border-transparent bg-[var(--color-accent-amber)] text-[var(--color-bg-deep)] hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)] focus-visible:bg-[var(--color-accent-copper)] focus-visible:text-[var(--color-text-primary)]",
  secondary:
    "border border-[var(--color-line-muted)] bg-transparent text-[var(--color-text-primary)] hover:bg-[rgba(244,233,220,0.08)] focus-visible:bg-[rgba(244,233,220,0.08)]"
};

export function ButtonLink({ href, children, variant = "primary", dataCta }: ButtonLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) return;

    event.preventDefault();
    scrollToAnchor(href, { behavior: "smooth" });
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      data-cta={dataCta}
      className={`cta-glow inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-colors ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}
