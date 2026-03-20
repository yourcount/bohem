import Link from "next/link";
import Image from "next/image";

import { LandingPageShell } from "@/components/landing/LandingPageShell";
import { SectionMotifDivider } from "@/components/ui/SectionMotifDivider";
import { getLiveSiteContent } from "@/lib/content/live-content";
import {
  buildNewsIndexJsonLd,
  buildNewsIndexMetadata,
  formatNewsDate,
  getAllNewsItems,
  getNewsTypeLabel
} from "@/lib/content/news";
import { getImageObjectPosition } from "@/lib/image-focus";

export const revalidate = 90;

export async function generateMetadata() {
  return buildNewsIndexMetadata();
}

export default async function NewsIndexPage() {
  const siteContent = await getLiveSiteContent();
  const items = getAllNewsItems();
  const jsonLd = buildNewsIndexJsonLd(items);
  const navigation = [
    { label: "Nieuws", href: "/nieuws" },
    { label: "Pers", href: "/pers" },
    { label: "Contact", href: "/#contact" }
  ];

  return (
    <LandingPageShell brandName={siteContent.brand.name} navigation={navigation} footer={siteContent.footer}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(200,135,62,0.18),transparent_42%),linear-gradient(180deg,#171319_0%,#151f2d_52%,#0f1723_100%)] py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d7b0]">Nieuws</p>
            <h1 className="mt-3 max-w-[11ch] font-display text-4xl leading-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              Releases, shows en context rond Bohèm
            </h1>
            <p className="mt-5 max-w-[64ch] text-base leading-8 text-[#e7d7c1] sm:text-lg">
              Op deze pagina staan alleen updates die iets toevoegen: nieuwe muziek, publieke shows en context voor redacties,
              programmeurs en luisteraars die Bohèm via het eigen domein willen volgen.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[rgba(243,215,176,0.18)] bg-[rgba(244,233,220,0.05)] p-6 shadow-[0_24px_54px_rgba(0,0,0,0.24)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f3d7b0]">Wat je hier vindt</p>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-[#ead7bc]">
              <p>Nieuwe releases met luisterlinks en duiding.</p>
              <p>Show-updates die meer doen dan alleen datum en locatie noemen.</p>
              <p>Media- en programmeercontext die doorlinkt naar de juiste vaste pagina&apos;s.</p>
            </div>
          </div>
        </div>
      </section>

      <SectionMotifDivider />

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f3d7b0]">Overzicht</p>
              <h2 className="mt-2 font-display text-3xl text-[var(--color-text-primary)] sm:text-4xl">Actuele berichten op het eigen domein</h2>
            </div>
            <p className="max-w-[44ch] text-sm leading-7 text-[#d9c6ac]">
              Hier vind je compacte updates met extra context, luisterlinks en praktische vervolgstappen als je Bohèm verder wilt volgen of boeken.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.slug}
                className="subtle-lift-card overflow-hidden rounded-[1.9rem] border border-[rgba(67,135,133,0.24)] bg-[linear-gradient(160deg,rgba(22,30,44,0.9)_0%,rgba(18,20,29,0.92)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.22)]"
              >
                <div className="relative h-56 overflow-hidden border-b border-[rgba(243,215,176,0.12)]">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    className="object-cover"
                    style={{ objectPosition: getImageObjectPosition(item.image) }}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,16,0.08)_0%,rgba(8,10,16,0.64)_100%)]" />
                  <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[rgba(243,215,176,0.24)] bg-[rgba(8,10,16,0.45)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#f3d7b0]">
                      {getNewsTypeLabel(item.type)}
                    </span>
                    <span className="rounded-full border border-[rgba(243,215,176,0.14)] bg-[rgba(8,10,16,0.38)] px-3 py-1 text-xs text-[#ead7bc]">
                      {formatNewsDate(item.publishedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex h-full flex-col p-6">
                  <h3 className="font-display text-2xl text-[var(--color-text-primary)]">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#e7d7c1]">{item.excerpt}</p>

                  <div className="mt-6 flex flex-wrap gap-2 text-xs text-[#d9c6ac]">
                    {item.internalLinks.map((link) => (
                      <span
                        key={`${item.slug}-${link.href}`}
                        className="rounded-full border border-[rgba(67,135,133,0.22)] bg-[rgba(244,233,220,0.04)] px-3 py-1"
                      >
                        {link.label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/nieuws/${item.slug}`}
                      className="inline-flex items-center rounded-full border border-[rgba(243,215,176,0.22)] px-5 py-2.5 text-sm font-semibold text-[#f3d7b0] transition-colors hover:border-[#c8873e] hover:text-white"
                    >
                      Lees bericht
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </LandingPageShell>
  );
}
