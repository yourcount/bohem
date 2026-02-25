import type { SiteContent } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

type AboutSectionProps = {
  about: SiteContent["about"];
};

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <section id="bio" aria-labelledby="over-title" className="bg-[var(--color-bg-soft)] py-16">
      <div className="mx-auto w-full max-w-[1120px] px-6">
        <Reveal>
          <h2 id="over-title" className="mb-4 font-display text-4xl leading-tight sm:text-5xl">
            {about.title}
          </h2>
          <p className="mb-6 max-w-[74ch]">{about.intro}</p>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2" aria-label="Bio's">
          {about.bios.map((bio, index) => (
            <Reveal key={bio.name} delayMs={index * 120}>
              <article className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.06)] p-6">
                <h3 className="mb-3 font-display text-3xl">{bio.name}</h3>
                <p className="mb-0">{bio.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
