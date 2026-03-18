import { Reveal } from "@/components/ui/Reveal";

type LandingFaqItem = {
  question: string;
  answer: string;
};

type LandingFaqProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  items: LandingFaqItem[];
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function LandingFaq({ id = "faq", eyebrow, title, items }: LandingFaqProps) {
  const visibleItems = items.filter((item) => hasText(item.question) && hasText(item.answer));
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
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {visibleItems.map((item, index) => (
            <Reveal key={`${item.question}-${index}`} delayMs={index * 70}>
              <details className="group rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.05)] p-5">
                <summary className="cursor-pointer list-none font-display text-xl text-[#f8f1e5]">
                  <span>{item.question}</span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-[#e7d7c1]">{item.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
