"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent, YoutubeVideoItem } from "@/lib/types";
import { getExternalLinkProps } from "@/lib/ui/link-target";

type VideoSectionProps = {
  videoContent: SiteContent["video"];
  videos: YoutubeVideoItem[];
};

const dutchDate = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatPublishedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return dutchDate.format(date);
}

function getVideoExcerpt(video: YoutubeVideoItem) {
  const text = (video.description?.trim() ?? "").replace(/\s+/g, " ");
  const lower = text.toLowerCase();

  if (
    !text ||
    text.includes("@musicbybohem") ||
    text.split("-").length >= 4 ||
    lower.includes("bettina kraaieveld") ||
    lower.includes("arthur bont")
  ) {
    return "Een live-fragment van Bohèm, opgenomen in een aandachtige setting met ruimte voor liedjes en samenspel.";
  }

  if (text.length <= 110) return text;
  return `${text.slice(0, 109).trimEnd()}…`;
}

function getVideoDisplayTitle(video: YoutubeVideoItem) {
  const raw = video.title.trim();

  const xinixSessionMatch = raw.match(/Sunday sessions #(\d+)/i);
  if (xinixSessionMatch) {
    return `Sunday Sessions #${xinixSessionMatch[1]} in Xinix`;
  }

  const xinixLiveMatch = raw.match(/Boh[eè]m\s*\|\s*(.+?)\s+live in Xinix/i);
  if (xinixLiveMatch?.[1]) {
    return `${xinixLiveMatch[1].trim()} live in Xinix`;
  }

  const compact = raw
    .replace(/\s*\|\s*Bettina.*$/i, "")
    .replace(/^Boh[eè]m\s+live\s+at\s+/i, "Live in ")
    .replace(/^Boh[eè]m\s*\|\s*/i, "")
    .trim();

  return compact || raw;
}

function getVideoContextLabel(video: YoutubeVideoItem) {
  const raw = video.title.toLowerCase();
  if (raw.includes("sunday sessions")) {
    return "Live sessie";
  }
  if (raw.includes("xinix")) {
    return "Podiumopname";
  }
  return "YouTube-video";
}

function getEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

function VideoModal({
  video,
  onClose
}: {
  video: YoutubeVideoItem;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const isShort = video.kind === "short";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,10,18,0.82)] px-4 py-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      onClick={onClose}
    >
      <div
        className={`relative w-full overflow-hidden rounded-[30px] border border-[rgba(243,215,176,0.16)] bg-[linear-gradient(160deg,rgba(15,23,36,0.96)_0%,rgba(22,16,27,0.98)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.45)] ${isShort ? "max-w-[1080px]" : "max-w-[1240px]"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(243,215,176,0.16)] bg-[rgba(9,14,24,0.68)] text-lg text-[#f8f1e5] transition-colors hover:border-[rgba(243,215,176,0.3)] hover:bg-[rgba(9,14,24,0.92)]"
          aria-label="Sluit video"
        >
          ×
        </button>

        {isShort ? (
          <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
            <div className="flex items-center justify-center bg-[radial-gradient(circle_at_50%_12%,rgba(242,139,14,0.14)_0%,transparent_34%),linear-gradient(180deg,rgba(11,16,24,0.96)_0%,rgba(11,16,24,0.82)_100%)] p-6">
              <div className="relative w-full max-w-[300px] overflow-hidden rounded-[34px] border border-[rgba(243,215,176,0.16)] bg-black shadow-[0_22px_60px_rgba(0,0,0,0.42)]">
                <div className="pointer-events-none absolute left-1/2 top-3 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[rgba(244,233,220,0.2)]" />
                <div className="aspect-[9/16]">
                  <iframe
                    src={getEmbedUrl(video.id)}
                    title={video.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">Short</p>
                <h3 id="video-modal-title" className="font-display text-3xl leading-tight text-[#f8f1e5] sm:text-4xl">
                  {video.title}
                </h3>
                <p className="mt-3 text-sm text-[#cbb79d]">{formatPublishedDate(video.publishedAt)}</p>
                <p className="mt-5 max-w-[52ch] text-[#e3d5c4]">{getVideoExcerpt(video)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={video.url}
                  {...getExternalLinkProps(video.url)}
                  data-cta={`home_video_external_${video.id}`}
                  className="inline-flex items-center justify-center rounded-full border border-[rgba(243,215,176,0.18)] px-5 py-2.5 text-sm font-bold text-[#f3d7b0] transition-colors hover:bg-[rgba(244,233,220,0.08)] hover:text-[#fff6e9]"
                >
                  Open op YouTube
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-[linear-gradient(180deg,rgba(11,16,24,0.98)_0%,rgba(11,16,24,0.84)_100%)] p-4 md:p-5">
              <div className="overflow-hidden rounded-[24px] border border-[rgba(243,215,176,0.12)] bg-black shadow-[0_18px_50px_rgba(0,0,0,0.38)]">
                <div className="aspect-video">
                  <iframe
                    src={getEmbedUrl(video.id)}
                    title={video.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 bg-[linear-gradient(160deg,rgba(18,25,38,0.92)_0%,rgba(26,17,25,0.96)_100%)] p-6 md:p-8">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">Live video</p>
                <h3 id="video-modal-title" className="font-display text-3xl leading-tight text-[#f8f1e5] sm:text-4xl">
                  {video.title}
                </h3>
                <p className="mt-3 text-sm text-[#cbb79d]">{formatPublishedDate(video.publishedAt)}</p>
                <p className="mt-5 max-w-[44ch] text-[#e3d5c4]">{getVideoExcerpt(video)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={video.url}
                  {...getExternalLinkProps(video.url)}
                  data-cta={`home_video_external_${video.id}`}
                  className="inline-flex items-center justify-center rounded-full border border-[rgba(243,215,176,0.18)] px-5 py-2.5 text-sm font-bold text-[#f3d7b0] transition-colors hover:bg-[rgba(244,233,220,0.08)] hover:text-[#fff6e9]"
                >
                  Open op YouTube
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoCard({
  video,
  variant,
  onOpen
}: {
  video: YoutubeVideoItem;
  variant: "featured" | "secondary" | "rail";
  onOpen: (video: YoutubeVideoItem) => void;
}) {
  const isFeatured = variant === "featured";
  const isRail = variant === "rail";
  const publishedLabel = formatPublishedDate(video.publishedAt);
  const isShort = video.kind === "short";
  const displayTitle = getVideoDisplayTitle(video);
  const contextLabel = getVideoContextLabel(video);

  return (
    <article
      className={
        isFeatured
          ? "group subtle-lift-card chiaroscuro-panel relative overflow-hidden rounded-[28px] border border-[rgba(243,215,176,0.18)] bg-[linear-gradient(160deg,rgba(12,20,33,0.86)_0%,rgba(20,16,26,0.92)_100%)]"
          : isRail
            ? "group subtle-lift-card relative overflow-hidden rounded-[22px] border border-[rgba(243,215,176,0.12)] bg-[rgba(18,14,22,0.72)]"
            : `video-accordion-card group subtle-lift-card chiaroscuro-panel relative flex min-h-[220px] flex-1 overflow-hidden rounded-[24px] border ${isShort ? "md:min-h-[280px]" : ""} border-[rgba(243,215,176,0.12)] bg-[linear-gradient(160deg,rgba(18,26,42,0.84)_0%,rgba(18,14,22,0.92)_100%)]`
      }
    >
      <button
        type="button"
        onClick={() => onOpen(video)}
        data-cta={isFeatured ? "home_video_featured" : `home_video_${video.id}`}
        className={isFeatured ? "block h-full w-full text-left" : "block h-full w-full flex-1 text-left"}
      >
        <div className={isFeatured ? "flex h-full flex-col" : isRail ? "flex h-full items-stretch gap-3 p-3" : `flex h-full ${isShort ? "flex-col md:grid md:grid-cols-[0.95fr_1.05fr]" : "flex-col"}`}>
          <div className={`relative overflow-hidden ${isFeatured ? "min-h-[340px] md:min-h-[460px]" : isRail ? "h-24 w-32 shrink-0 rounded-[16px]" : isShort ? "min-h-[300px]" : "min-h-[260px] md:min-h-[290px]"}`}>
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover brightness-[1.08] contrast-[1.08] saturate-[1.08] transition-transform duration-500 group-hover:scale-[1.03] group-focus-within:scale-[1.03]"
              sizes={isFeatured ? "(max-width: 767px) 92vw, (max-width: 1279px) 56vw, 620px" : isRail ? "128px" : "(max-width: 767px) 92vw, 360px"}
              quality={78}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,11,18,0.02)_0%,rgba(7,11,18,0.08)_42%,rgba(7,11,18,0.34)_100%)]" />
            <div className={`absolute ${isRail ? "left-2 top-2 h-8 w-8" : "left-4 top-4"} inline-flex items-center justify-center rounded-full border border-[rgba(243,215,176,0.28)] bg-[rgba(9,14,24,0.62)] text-[var(--color-surface)] shadow-[0_10px_24px_rgba(0,0,0,0.24)] ${isShort ? "h-11 w-11" : isRail ? "" : "h-12 w-12"}`}>
              <span aria-hidden="true" className="ml-0.5 text-base">
                ▶
              </span>
            </div>
            {hasText(publishedLabel) && !isRail ? (
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex rounded-full border border-[rgba(243,215,176,0.18)] bg-[rgba(9,14,24,0.54)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f3d7b0] backdrop-blur-[2px]">
                  {publishedLabel}
                </span>
              </div>
            ) : null}
            {isShort && !isRail ? (
              <span className="absolute bottom-4 right-4 inline-flex rounded-full border border-[rgba(243,215,176,0.22)] bg-[rgba(9,14,24,0.58)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">
                Shorts
              </span>
            ) : null}
          </div>

          <div className={isFeatured ? "flex h-full flex-col justify-between gap-3 p-5 md:p-6" : isRail ? "flex min-w-0 flex-1 flex-col justify-center gap-2 py-1 pr-1" : "flex h-full flex-col justify-between gap-3 p-4 md:p-5"}>
            <div>
              {hasText(publishedLabel) && isRail ? (
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">{publishedLabel}</p>
              ) : null}
              <h3 className={isFeatured ? "font-display text-[2rem] leading-tight text-[#f8f1e5] sm:text-[2.25rem]" : isRail ? "text-base font-semibold leading-snug text-[#f8f1e5]" : `font-display leading-tight text-[#f8f1e5] ${isShort ? "text-[1.35rem]" : "text-[1.5rem]"}`}>
                {displayTitle}
              </h3>
              {!isRail ? <p className={`text-[#dfd1c1] ${isFeatured ? "max-w-[48ch]" : "max-w-[28ch] text-sm"}`}>{getVideoExcerpt(video)}</p> : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full border border-[rgba(243,215,176,0.18)] bg-[rgba(244,233,220,0.06)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#f3d7b0]">
                {isShort ? "Short" : contextLabel}
              </span>
              {!isRail ? (
                <span className="inline-flex shrink-0 items-center rounded-full border border-[rgba(243,215,176,0.18)] bg-[rgba(244,233,220,0.06)] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#fff4e4]">
                  Kijk video
                </span>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#fff4e4]">Open</span>
              )}
            </div>
          </div>
        </div>
      </button>
    </article>
  );
}

export function VideoSection({ videoContent, videos }: VideoSectionProps) {
  const featuredVideo = videos[0];
  const secondaryVideos = videos.slice(1, 3);
  const hasCta = hasText(videoContent.cta.label) && hasText(videoContent.cta.href);
  const [activeVideo, setActiveVideo] = useState<YoutubeVideoItem | null>(null);

  return (
    <>
      <section
        id="video"
        aria-labelledby="video-title"
        className="section-ambient section-contrast-open relative overflow-hidden bg-[linear-gradient(180deg,#28283a_0%,#25273a_44%,#242233_100%)] py-16"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            background:
              "radial-gradient(circle at 12% 14%, rgba(243,215,176,0.11) 0%, transparent 28%), radial-gradient(circle at 88% 18%, rgba(40,167,193,0.12) 0%, transparent 26%)"
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1120px] px-4 sm:px-6">
          <Reveal>
            <div className="mb-8 max-w-[72ch]">
              {hasText(videoContent.eyebrow) ? (
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">{videoContent.eyebrow}</p>
              ) : null}
              <h2 id="video-title" className="mb-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
                {videoContent.title}
              </h2>
              <p className="text-[#e7d6c1]">{videoContent.intro}</p>
            </div>
          </Reveal>

          {featuredVideo ? (
            <div className="space-y-4">
              <Reveal className="h-full">
                <VideoCard video={featuredVideo} variant="featured" onOpen={setActiveVideo} />
              </Reveal>

              {secondaryVideos.length > 0 || hasCta ? (
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-stretch">
                  {secondaryVideos.map((video, index) => (
                    <Reveal key={video.id} delayMs={120 + index * 70}>
                      <VideoCard video={video} variant="rail" onOpen={setActiveVideo} />
                    </Reveal>
                  ))}

                  {hasCta ? (
                    <Reveal delayMs={250}>
                      <Link
                        href={videoContent.cta.href}
                        {...getExternalLinkProps(videoContent.cta.href)}
                        data-cta="home_video_channel"
                        className="group inline-flex h-full min-h-[102px] w-full items-center rounded-[22px] border border-[rgba(243,215,176,0.14)] bg-[linear-gradient(160deg,rgba(22,29,44,0.84)_0%,rgba(23,17,28,0.88)_100%)] px-5 py-4 text-left transition-colors hover:border-[rgba(243,215,176,0.24)] hover:bg-[linear-gradient(160deg,rgba(26,34,51,0.9)_0%,rgba(28,20,32,0.94)_100%)]"
                      >
                        <div className="flex w-full items-center justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f3d7b0]">Verder kijken</p>
                            <p className="mt-1 text-base font-semibold leading-snug text-[#fff4e4]">{videoContent.cta.label}</p>
                          </div>
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(243,215,176,0.18)] bg-[rgba(244,233,220,0.06)] text-[#fff4e4] transition-transform group-hover:translate-x-0.5">
                            →
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {activeVideo ? <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} /> : null}
    </>
  );
}
