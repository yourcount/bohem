import { Reveal } from "@/components/ui/Reveal";

export type LandingHighlightItem = {
  title: string;
  body: string;
};

export type LandingHighlightsVariant = "cards" | "split-scenarios" | "editorial-list" | "host-flow" | "facts";

type LandingHighlightsProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  items: LandingHighlightItem[];
  variant?: LandingHighlightsVariant;
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function LandingHighlights({ id = "highlights", eyebrow, title, intro, items, variant = "cards" }: LandingHighlightsProps) {
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

        {variant === "cards" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item, index) => (
              <Reveal key={`${item.title}-${index}`} delayMs={index * 80}>
                <article className="subtle-lift-card chiaroscuro-panel flex h-full flex-col rounded-2xl border border-[rgba(67,135,133,0.45)] bg-[rgba(18,30,46,0.55)] p-5 text-sm text-[#e7d7c1] shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                  {hasText(item.title) ? <h3 className="font-display text-2xl text-[#f8f1e5]">{item.title}</h3> : null}
                  {hasText(item.body) ? <p className={hasText(item.title) ? "mt-3 leading-7" : "leading-7"}>{item.body}</p> : null}
                </article>
              </Reveal>
            ))}
          </div>
        ) : null}

        {variant === "split-scenarios" ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {visibleItems.map((item, index) => (
              <Reveal key={`${item.title}-${index}`} delayMs={index * 80}>
                <article className="subtle-lift-card chiaroscuro-panel flex h-full flex-col justify-between rounded-[1.75rem] border border-[rgba(242,139,14,0.28)] bg-[linear-gradient(145deg,rgba(38,24,20,0.82)_0%,rgba(24,20,28,0.88)_100%)] p-6 text-sm text-[#ead7bc] shadow-[0_16px_36px_rgba(0,0,0,0.2)]">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f3d7b0]">{String(index + 1).padStart(2, "0")}</div>
                  {hasText(item.title) ? <h3 className="mt-4 font-display text-3xl text-[#f8f1e5]">{item.title}</h3> : null}
                  {hasText(item.body) ? <p className="mt-4 leading-7">{item.body}</p> : null}
                </article>
              </Reveal>
            ))}
          </div>
        ) : null}

        {variant === "editorial-list" ? (
          <div className="grid gap-4">
            {visibleItems.map((item, index) => (
              <Reveal key={`${item.title}-${index}`} delayMs={index * 80}>
                <article className="subtle-lift-card chiaroscuro-panel grid gap-4 rounded-[1.75rem] border border-[rgba(67,135,133,0.35)] bg-[rgba(18,30,46,0.4)] p-5 md:grid-cols-[auto_1fr] md:items-start md:gap-6 md:p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f3d7b0]">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    {hasText(item.title) ? <h3 className="font-display text-3xl text-[#f8f1e5]">{item.title}</h3> : null}
                    {hasText(item.body) ? <p className={`text-[#e7d7c1] leading-7 ${hasText(item.title) ? "mt-3" : ""}`}>{item.body}</p> : null}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : null}

        {variant === "host-flow" ? (
          <div className="grid gap-4 md:grid-cols-3">
            {visibleItems.map((item, index) => (
              <Reveal key={`${item.title}-${index}`} delayMs={index * 80}>
                <article className="subtle-lift-card chiaroscuro-panel relative rounded-[1.75rem] border border-[rgba(67,135,133,0.28)] bg-[rgba(244,233,220,0.05)] p-6 text-sm text-[#ead7bc]">
                  <div className="mb-4 inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[rgba(242,139,14,0.24)] bg-[rgba(242,139,14,0.08)] px-3 text-xs font-semibold tracking-[0.14em] text-[#f3d7b0]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  {hasText(item.title) ? <h3 className="font-display text-2xl text-[#f8f1e5]">{item.title}</h3> : null}
                  {hasText(item.body) ? <p className={`leading-7 ${hasText(item.title) ? "mt-3" : ""}`}>{item.body}</p> : null}
                </article>
              </Reveal>
            ))}
          </div>
        ) : null}

        {variant === "facts" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item, index) => (
              <Reveal key={`${item.title}-${index}`} delayMs={index * 70}>
                <article className="subtle-lift-card chiaroscuro-panel rounded-2xl border border-[rgba(243,215,176,0.18)] bg-[rgba(248,241,229,0.05)] px-4 py-4 text-sm text-[#ead7bc]">
                  {hasText(item.title) ? <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#f3d7b0]">{item.title}</p> : null}
                  {hasText(item.body) ? <p className={`leading-7 ${hasText(item.title) ? "mt-2" : ""}`}>{item.body}</p> : null}
                </article>
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
