import { Reveal } from "@/components/ui/Reveal";
import type { LandingSocialProofItem } from "@/lib/types";

type LandingSocialProofProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  items: LandingSocialProofItem[];
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function LandingSocialProof({ id = "reacties", eyebrow, title, items }: LandingSocialProofProps) {
  const visibleItems = (items ?? [])
    .map((item) => ({
      quote: item.quote?.trim() || "",
      source: item.source?.trim() || "",
      context: item.context?.trim() || ""
    }))
    .filter((item) => item.quote.length > 0);

  if (!hasText(title) || visibleItems.length === 0) return null;

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
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item, index) => (
            <Reveal key={`${item.quote}-${index}`} delayMs={index * 80}>
              <article className="subtle-lift-card chiaroscuro-panel flex h-full flex-col rounded-2xl border border-[rgba(242,139,14,0.32)] bg-[rgba(36,24,22,0.62)] p-5 text-sm text-[#e7d7c1] shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                <p className="text-base leading-7 text-[#f8f1e5]">“{item.quote}”</p>
                {(hasText(item.source) || hasText(item.context)) ? (
                  <div className="mt-4 border-t border-[rgba(242,139,14,0.14)] pt-4 text-xs uppercase tracking-[0.08em] text-[#f3d7b0]">
                    {hasText(item.source) ? <p>{item.source}</p> : null}
                    {hasText(item.context) ? <p className="mt-1 text-[#d9c4a8]">{item.context}</p> : null}
                  </div>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
