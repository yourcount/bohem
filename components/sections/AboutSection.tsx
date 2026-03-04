import Image from "next/image";

import type { SiteContent } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { getImageObjectPosition } from "@/lib/image-focus";

type AboutSectionProps = {
  about: SiteContent["about"];
};

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <section
      id="bio"
      aria-labelledby="over-title"
      className="section-ambient section-ambient-bio bg-[linear-gradient(180deg,#1a2431_0%,#1f2938_46%,#242b3a_100%)] py-16"
    >
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Reveal>
          <h2 id="over-title" className="mb-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
            {about.title}
          </h2>
          <p className="mb-6 max-w-[74ch]">{about.intro}</p>
        </Reveal>

        {about.photoMoments && about.photoMoments.length > 0 ? (
          <div className="bio-photo-slider mb-6 md:grid md:grid-cols-2" aria-label="Fotomomenten">
            {about.photoMoments.map((photo, index) => (
              <Reveal key={photo.src} delayMs={index * 120} className="bio-photo-item">
                <figure className="bio-photo-slide overflow-hidden border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.24)]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: getImageObjectPosition(photo) }}
                    loading="lazy"
                    quality={78}
                    sizes="(max-width: 767px) 92vw, (max-width: 1279px) 46vw, 520px"
                  />
                </figure>
              </Reveal>
            ))}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2" aria-label="Bio's">
          {about.bios.map((bio, index) => (
            <Reveal key={bio.name} delayMs={index * 120} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.06)] p-6">
                <h3 className="mb-3 font-display text-2xl sm:text-3xl">{bio.name}</h3>
                <p className="mb-0">{bio.text}</p>
                {bio.website ? (
                  <div className="mt-auto pt-5">
                    <a
                      href={bio.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center justify-center rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[#c8873e] hover:bg-[rgba(200,135,62,0.14)]"
                    >
                      Persoonlijke website
                    </a>
                  </div>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>

        {about.lineupItems && about.lineupItems.length > 0 ? (
          <Reveal delayMs={220}>
            <article className="mt-6 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(244,233,220,0.04)] p-6">
              {about.lineupTitle ? <h3 className="mb-3 font-display text-2xl sm:text-3xl">{about.lineupTitle}</h3> : null}
              <ul className="space-y-2">
                {about.lineupItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
