"use client";

import { usePathname } from "next/navigation";

function shouldShowLiquidBackground(pathname: string | null) {
  if (!pathname) return true;
  if (pathname.startsWith("/admin")) return false;
  return true;
}

export function ConditionalLiquidBackground() {
  const pathname = usePathname();

  if (!shouldShowLiquidBackground(pathname)) {
    return null;
  }

  return (
    <div aria-hidden="true" className="liquid-gradient-bg">
      <span className="liquid-blob liquid-blob-a" />
      <span className="liquid-blob liquid-blob-b" />
      <span className="liquid-blob liquid-blob-c" />
      <span className="liquid-mesh" />
    </div>
  );
}
