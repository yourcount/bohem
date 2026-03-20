"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import type { MobileStickyCtaProps } from "@/components/ui/MobileStickyCta";
import type { StickyListenBarProps } from "@/components/ui/StickyListenBar";

const ScrollExperience = dynamic(() => import("@/components/ui/ScrollExperience").then((mod) => mod.ScrollExperience), {
  ssr: false
});

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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      {isReady ? <ScrollExperience /> : null}
      {isReady && enableStickyListenBar && stickyListenBarProps ? <StickyListenBar {...stickyListenBarProps} /> : null}
      {isReady && enableMobileStickyCta && mobileStickyCtaProps ? <MobileStickyCta {...mobileStickyCtaProps} /> : null}
    </>
  );
}
