import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";

type RouteChooserItem = {
  label: string;
  description?: string;
  href: string;
};

type RouteChooserSectionProps = {
  title?: string;
  items?: RouteChooserItem[];
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

const FALLBACK_ITEMS: RouteChooserItem[] = [
  {
    label: "Muziekduo boeken",
    href: "/muziekduo-boeken",
    description: "Voor een avond die dichtbij voelt en muzikaal genoeg blijft om echt bij te blijven."
  },
  {
    label: "Theaterconcert boeken",
    href: "/theaterconcert-boeken",
    description: "Voor zalen en culturele avonden waar aandacht, sfeer en tekst samen mogen werken."
  },
  {
    label: "Kampvuurklanken",
    href: "/kampvuurklanken",
    description: "Voor teams en groepen die iets echts willen meemaken zonder standaard programma."
  },
  {
    label: "Huiskamerconcert boeken",
    href: "/huiskamerconcert-boeken",
    description: "Voor kleine ruimtes, hosts en een intieme setting met directe nabijheid."
  }
];

function normalizeItems(items?: RouteChooserItem[]) {
  const visible = (items ?? [])
    .map((item) => ({
      label: item.label?.trim() || "",
      description: item.description?.trim() || "",
      href: item.href?.trim() || ""
    }))
    .filter((item) => hasText(item.label) && hasText(item.href));

  return visible.length > 1 ? visible : FALLBACK_ITEMS;
}

export function RouteChooserSection({ title, items }: RouteChooserSectionProps) {
  const visibleItems = normalizeItems(items);

  if (visibleItems.length < 2) return null;

  return (
    <section className="section-ambient py-12 sm:py-14" aria-labelledby="route-chooser-title">
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="max-w-[32rem]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#f3d7b0]">Routekeuze</p>
              <h2 id="route-chooser-title" className="font-display text-3xl text-[#f8f1e5] sm:text-4xl">
                {hasText(title) ? title : "Kies de ingang die het best bij je vraag past"}
              </h2>
              <p className="mt-4 max-w-[34rem] text-[var(--color-text-primary)]">
                Je hoeft niet meteen alles door te nemen. Kies de route die het dichtst bij je vraag of setting ligt en ga
                daar verder.
              </p>
            </div>

            <div className="rounded-3xl border border-[rgba(67,135,133,0.28)] bg-[rgba(18,30,46,0.28)]">
              <div className="divide-y divide-[rgba(67,135,133,0.22)]">
                {visibleItems.map((item, index) => (
                  <Reveal key={`${item.label}-${item.href}`} delayMs={index * 70}>
                    <Link
                      href={item.href}
                      data-cta={`route_chooser_${item.label}`}
                      className="group flex flex-col gap-3 px-5 py-5 transition-colors hover:bg-[rgba(244,233,220,0.04)] focus-visible:bg-[rgba(244,233,220,0.04)] sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-2 font-display text-2xl text-[#f8f1e5] transition-colors group-hover:text-[var(--color-accent-amber)]">
                          {item.label}
                        </h3>
                        {hasText(item.description) ? (
                          <p className="mt-2 max-w-[44rem] text-sm leading-7 text-[#e7d7c1]">{item.description}</p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#f3d7b0] sm:pt-1">
                        <span>Open</span>
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
