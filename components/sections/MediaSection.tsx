import type { SiteContent } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

type MediaSectionProps = {
  media: SiteContent["media"];
};

export function MediaSection({ media }: MediaSectionProps) {
  return (
    <section id="media" aria-labelledby="media-title" className="bg-[var(--color-bg-soft)] py-16">
      <div className="mx-auto w-full max-w-[1120px] px-6">
        <Reveal>
          <h2 id="media-title" className="mb-4 font-display text-4xl leading-tight sm:text-5xl">
            {media.title}
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {media.cards.map((card, index) => (
            <Reveal key={card.title} delayMs={index * 120}>
              <article className="grid gap-4 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.06)] p-6">
                <h3 className="font-display text-3xl">{card.title}</h3>
                {card.type === "video" ? (
                  <div
                    aria-hidden="true"
                    className="grid min-h-40 place-items-center rounded-[10px] bg-[linear-gradient(140deg,#d4b08a_0%,#f4e9dc_100%)] font-bold text-[var(--color-text-dark)]"
                  >
                    Video preview
                  </div>
                ) : (
                  <audio controls preload="none" aria-label="Audiofragment van Bohèm" className="w-full">
                    <source src={card.source ?? ""} type="audio/mpeg" />
                    Je browser ondersteunt geen audio-afspelen.
                  </audio>
                )}
                <p className="mb-0">{card.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
