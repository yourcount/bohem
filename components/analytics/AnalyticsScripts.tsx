"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

import { useCookieConsent } from "@/components/cookies/CookieConsentProvider";

const GA_ID = "G-W2Z0GGDLDX";

export function AnalyticsScripts() {
  const { isReady, hasConsentFor } = useCookieConsent();
  const hasStatisticsConsent = hasConsentFor("statistics");
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!isReady || !hasStatisticsConsent) {
      return;
    }

    const idleCallback = (window as Window & { requestIdleCallback?: (cb: IdleRequestCallback) => number }).requestIdleCallback;
    if (typeof idleCallback === "function") {
      const handle = idleCallback(() => setShouldLoad(true));
      return () => {
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(handle);
        }
      };
    }

    const timeout = window.setTimeout(() => setShouldLoad(true), 1200);
    return () => window.clearTimeout(timeout);
  }, [isReady, hasStatisticsConsent]);

  if (!shouldLoad) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
