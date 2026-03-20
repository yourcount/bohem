import type { Metadata } from "next";
import localFont from "next/font/local";

import { CookieConsentProvider } from "@/components/cookies/CookieConsentProvider";
import { DeferredConsentClients } from "@/components/ui/DeferredConsentClients";
import { ConditionalLiquidBackground } from "@/components/ui/ConditionalLiquidBackground";
import { getSiteUrl } from "@/lib/seo";

import "./globals.css";

const backslashFont = localFont({
  src: "../public/brand/font/backslash-regular.otf",
  variable: "--font-backslash",
  display: "swap",
  preload: true
});

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
    <html lang="nl" className={backslashFont.variable}>
      <body>
        <ConditionalLiquidBackground />
        <div className="site-layer">
          <CookieConsentProvider>
            <DeferredConsentClients />
            {children}
          </CookieConsentProvider>
        </div>
      </body>
    </html>
  );
}
