"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import type { MobileStickyCtaProps } from "@/components/ui/MobileStickyCta";
import type { StickyListenBarProps } from "@/components/ui/StickyListenBar";

const StickyListenBar = dynamic(() => import("@/components/ui/StickyListenBar").then((mod) => mod.StickyListenBar), {
  ssr: false
});

const MobileStickyCta = dynamic(() => import("@/components/ui/MobileStickyCta").then((mod) => mod.MobileStickyCta), {
  ssr: false
});

type DeferredHomeChromeProps = {
  enableStickyListenBar: boolean;
  stickyListenBarProps: StickyListenBarProps | null;
  enableMobileStickyCta: boolean;
  mobileStickyCtaProps: MobileStickyCtaProps | null;
};

export function DeferredHomeChrome({
  enableStickyListenBar,
  stickyListenBarProps,
  enableMobileStickyCta,
  mobileStickyCtaProps
}: DeferredHomeChromeProps) {
  const [showAssistiveChrome, setShowAssistiveChrome] = useState(false);

  useEffect(() => {
    const idleCallback = window.requestIdleCallback;
    if (typeof idleCallback === "function") {
      const handle = idleCallback(() => setShowAssistiveChrome(true), { timeout: 900 });
      return () => window.cancelIdleCallback?.(handle);
    }

    const timeout = window.setTimeout(() => setShowAssistiveChrome(true), 450);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <>
      {showAssistiveChrome && enableStickyListenBar && stickyListenBarProps ? <StickyListenBar {...stickyListenBarProps} /> : null}
      {showAssistiveChrome && enableMobileStickyCta && mobileStickyCtaProps ? <MobileStickyCta {...mobileStickyCtaProps} /> : null}
    </>
  );
}
