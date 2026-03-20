import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LandingPageShell } from "@/components/landing/LandingPageShell";
import { SectionMotifDivider } from "@/components/ui/SectionMotifDivider";
import { getLiveSiteContent } from "@/lib/content/live-content";
import {
  buildNewsArticleJsonLd,
  buildNewsArticleMetadata,
  formatNewsDate,
  getAllNewsItems,
  getNewsItemBySlug,
  getNewsTypeLabel
} from "@/lib/content/news";
import { getImageObjectPosition } from "@/lib/image-focus";

export const revalidate = 90;

export async function generateStaticParams() {
  return getAllNewsItems().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getNewsItemBySlug(slug);
  if (!item) return {};
  return buildNewsArticleMetadata(item);
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getNewsItemBySlug(slug);

  if (!item) {
    notFound();
  }

  const siteContent = await getLiveSiteContent();
  const jsonLd = buildNewsArticleJsonLd(item);
  const navigation = [
    { label: "Nieuws", href: "/nieuws" },
    { label: "Pers", href: "/pers" },
    { label: "Contact", href: "/#contact" }
  ];

  return (
    <LandingPageShell brandName={siteContent.brand.name} navigation={navigation} footer={siteContent.footer}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(200,135,62,0.18),transparent_36%),linear-gradient(180deg,#171319_0%,#151f2d_52%,#0f1723_100%)] py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[rgba(243,215,176,0.24)] bg-[rgba(8,10,16,0.34)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#f3d7b0]">
                {getNewsTypeLabel(item.type)}
              </span>
              <span className="rounded-full border border-[rgba(243,215,176,0.16)] bg-[rgba(8,10,16,0.28)] px-3 py-1 text-xs text-[#ead7bc]">
                {formatNewsDate(item.publishedAt)}
              </span>
            </div>
            <h1 className="mt-4 max-w-[13ch] font-display text-4xl leading-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              {item.title}
            </h1>
            <p className="mt-5 max-w-[62ch] text-base leading-8 text-[#e7d7c1] sm:text-lg">{item.excerpt}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/nieuws"
                className="inline-flex items-center rounded-full border border-[rgba(243,215,176,0.22)] px-5 py-2.5 text-sm font-semibold text-[#f3d7b0] transition-colors hover:border-[#c8873e] hover:text-white"
              >
                Terug naar nieuws
              </Link>
              <Link
                href="/pers"
                className="inline-flex items-center rounded-full border border-[rgba(67,135,133,0.32)] bg-[rgba(244,233,220,0.04)] px-5 py-2.5 text-sm font-semibold text-[#e7d7c1] transition-colors hover:border-[#c8873e] hover:text-white"
              >
                Bekijk persinfo
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <figure className="overflow-hidden rounded-[2rem] border border-[rgba(243,215,176,0.16)] bg-[rgba(244,233,220,0.04)] shadow-[0_24px_54px_rgba(0,0,0,0.24)]">
              <Image
                src={item.image.src}
                alt={item.image.alt}
                width={item.image.width}
                height={item.image.height}
                className="h-auto w-full object-cover"
                style={{ objectPosition: getImageObjectPosition(item.image) }}
                priority
              />
            </figure>
          </div>
        </div>
      </section>

      <SectionMotifDivider />

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-[2rem] border border-[rgba(67,135,133,0.2)] bg-[rgba(18,30,46,0.34)] p-6 sm:p-8">
            <div className="grid gap-6 text-base leading-8 text-[#ead7bc]">
              {item.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <aside className="grid h-fit gap-5">
            <section className="rounded-[1.8rem] border border-[rgba(243,215,176,0.16)] bg-[rgba(244,233,220,0.04)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f3d7b0]">Op de site</p>
              <div className="mt-4 grid gap-3">
                {item.internalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(18,30,46,0.4)] px-4 py-3 text-sm text-[#e7d7c1] transition-colors hover:border-[#c8873e] hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[1.8rem] border border-[rgba(67,135,133,0.18)] bg-[rgba(18,30,46,0.28)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f3d7b0]">Externe context</p>
              <div className="mt-4 grid gap-3">
                {item.relatedLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.04)] px-4 py-3 text-sm text-[#e7d7c1] transition-colors hover:border-[#c8873e] hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </LandingPageShell>
  );
}
