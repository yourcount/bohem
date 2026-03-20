import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentProvider";
import { ConditionalLiquidBackground } from "@/components/ui/ConditionalLiquidBackground";
import { getSiteUrl } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  verification: {
    google: "kratEAespNbD3M93NVF-AXEl4dwR7FbJq3M3qNgBCxU"
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  category: "music"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>
        <ConditionalLiquidBackground />
        <div className="site-layer">
          <CookieConsentProvider>
            <AnalyticsScripts />
            {children}
          </CookieConsentProvider>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
