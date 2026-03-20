"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const AnalyticsScripts = dynamic(
  () => import("@/components/analytics/AnalyticsScripts").then((mod) => mod.AnalyticsScripts),
  { ssr: false }
);

const Analytics = dynamic(() => import("@vercel/analytics/next").then((mod) => mod.Analytics), { ssr: false });
const SpeedInsights = dynamic(() => import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights), { ssr: false });

export function DeferredConsentClients() {
  const [isIdleReady, setIsIdleReady] = useState(false);

  useEffect(() => {
    const idleCallback = window.requestIdleCallback;
    if (typeof idleCallback === "function") {
      const handle = idleCallback(() => setIsIdleReady(true), { timeout: 2000 });
      return () => window.cancelIdleCallback?.(handle);
    }

    const timeout = window.setTimeout(() => setIsIdleReady(true), 1200);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!isIdleReady) return null;

  return (
    <>
      <AnalyticsScripts />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
