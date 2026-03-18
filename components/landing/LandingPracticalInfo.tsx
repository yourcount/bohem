import { Reveal } from "@/components/ui/Reveal";

type LandingPracticalInfoProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  items: string[];
};

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function LandingPracticalInfo({ id = "praktisch", eyebrow, title, items }: LandingPracticalInfoProps) {
  const visibleItems = (items ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
  if (!hasText(title) || visibleItems.length === 0) return null;

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="section-ambient py-16">
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Reveal>
          <div className="mb-7 max-w-[760px]">
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
            <Reveal key={`${item}-${index}`} delayMs={index * 70}>
              <article className="rounded-2xl border border-[rgba(67,135,133,0.32)] bg-[rgba(244,233,220,0.05)] p-5 text-sm leading-7 text-[#e7d7c1]">
                {item}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
