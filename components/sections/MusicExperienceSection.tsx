import Image from "next/image";
import Link from "next/link";

import type { SiteContent } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

type MusicExperienceSectionProps = {
  musicExperience: SiteContent["musicExperience"];
};

export function MusicExperienceSection({ musicExperience }: MusicExperienceSectionProps) {
  return (
    <section
      id="muziek"
      aria-labelledby="muziek-title"
      className="section-ambient section-ambient-experience bg-[linear-gradient(180deg,#2a2537_0%,#2b2434_56%,#2b2230_100%)] py-16"
    >
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 sm:px-6 md:grid-cols-[1.15fr_1fr]">
        <Reveal>
          <div>
            <h2 id="muziek-title" className="mb-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {musicExperience.title}
            </h2>
            <p>{musicExperience.body}</p>
            <Link
              href={musicExperience.cta.href}
              className="inline-block font-bold text-[#f3d7b0] underline decoration-2 underline-offset-[3px]"
            >
              {musicExperience.cta.label}
            </Link>
          </div>
        </Reveal>
        <Reveal delayMs={140}>
          <figure className="overflow-hidden rounded-2xl border border-[var(--color-line-muted)]">
            <Image
              src={musicExperience.image.src}
              alt={musicExperience.image.alt}
              width={musicExperience.image.width}
              height={musicExperience.image.height}
              className="h-full w-full object-cover object-[center_30%] contrast-[1.12] saturate-[1.04] aspect-[4/5] md:aspect-[16/10]"
              loading="lazy"
            />
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
