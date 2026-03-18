import { Reveal } from "@/components/ui/Reveal";

export type LandingHighlightItem = {
  title: string;
  body: string;
};

type LandingHighlightsProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  items: LandingHighlightItem[];
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function LandingHighlights({ id = "highlights", eyebrow, title, intro, items }: LandingHighlightsProps) {
  const visibleItems = items.filter((item) => hasText(item.title) || hasText(item.body));
  if (visibleItems.length === 0) return null;

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="section-ambient py-16">
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Reveal>
          <div className="mb-7 max-w-[780px]">
            {hasText(eyebrow) ? (
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">
                {eyebrow}
              </p>
            ) : null}
            <h2 id={`${id}-title`} className="font-display text-3xl text-[#f8f1e5] sm:text-4xl">
              {title}
            </h2>
            {hasText(intro) ? <p className="mt-3 max-w-[64ch] text-[var(--color-text-primary)]">{intro}</p> : null}
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item, index) => (
            <Reveal key={`${item.title}-${index}`} delayMs={index * 80}>
              <article className="flex h-full flex-col rounded-2xl border border-[rgba(67,135,133,0.45)] bg-[rgba(18,30,46,0.55)] p-5 text-sm text-[#e7d7c1] shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                {hasText(item.title) ? <h3 className="font-display text-2xl text-[#f8f1e5]">{item.title}</h3> : null}
                {hasText(item.body) ? <p className="mt-3 leading-7">{item.body}</p> : null}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
