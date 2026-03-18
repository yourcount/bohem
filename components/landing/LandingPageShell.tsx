import type { ReactNode } from "react";

import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import type { NavItem, SiteContent } from "@/lib/types";

type LandingPageShellProps = {
  brandName: string;
  navigation: NavItem[];
  children: ReactNode;
  footer: SiteContent["footer"];
};

export function LandingPageShell({ brandName, navigation, children, footer }: LandingPageShellProps) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Ga direct naar inhoud
      </a>

      <SiteHeader brandName={brandName} navigation={navigation} />

      <main id="main-content" className="landing-page-shell">
        {children}
      </main>

      <SiteFooter footer={footer} />
    </>
  );
}
