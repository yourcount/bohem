import { unstable_cache } from "next/cache";

import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache/tags";
import { readRuntimeCache, writeRuntimeCache } from "@/lib/cache/runtime-cache";
import type { YoutubeVideoItem } from "@/lib/types";

const YOUTUBE_CHANNEL_HANDLE = "@VideoBoh%C3%A8m";
const YOUTUBE_CHANNEL_ID = "UCkbQg0of6Txq426zaFfWn-Q";
const YOUTUBE_CHANNEL_URL = `https://www.youtube.com/${YOUTUBE_CHANNEL_HANDLE}`;
const YOUTUBE_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
const LOCAL_CACHE_KEY = "youtube_videos";
const MAX_ITEMS = 3;

let lastSuccessfulVideos: YoutubeVideoItem[] = [];

function decodeXmlEntities(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function cleanText(value: string | undefined | null) {
  if (!value) return "";
  return decodeXmlEntities(value).replace(/\s+/g, " ").trim();
}

function clipDescription(value: string | undefined | null, maxLength = 180) {
  const text = cleanText(value);
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function detectVideoKind(title: string, description: string) {
  const haystack = `${title} ${description}`.toLowerCase();
  return /\bshorts?\b|#shorts\b/.test(haystack) ? "short" : "standard";
}

async function resolveCanonicalKind(videoId: string, fallbackKind: YoutubeVideoItem["kind"]) {
  if (!videoId) return fallbackKind;

  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      next: { revalidate: CACHE_REVALIDATE_SECONDS.youtubeVideos, tags: [CACHE_TAGS.youtubeVideos] },
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) return fallbackKind;

    const html = await response.text();
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]?.trim() ?? "";
    if (canonical.includes("/shorts/")) return "short";
    if (canonical.includes("/watch")) return "standard";
    return fallbackKind;
  } catch {
    return fallbackKind;
  }
}

async function excludeShorts(items: YoutubeVideoItem[]) {
  const resolved = await Promise.all(
    items.map(async (item) => ({
      ...item,
      kind: await resolveCanonicalKind(item.id, item.kind)
    }))
  );

  return resolved.filter((item) => item.kind === "standard");
}

function isValidVideo(item: Partial<YoutubeVideoItem>): item is YoutubeVideoItem {
  return Boolean(
    item.id &&
      item.title &&
      item.url &&
      item.thumbnailUrl &&
      item.publishedAt &&
      !Number.isNaN(new Date(item.publishedAt).getTime())
  );
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    next: { revalidate: CACHE_REVALIDATE_SECONDS.youtubeVideos, tags: [CACHE_TAGS.youtubeVideos] }
  });

  if (!response.ok) {
    throw new Error(`YouTube API responded with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    next: { revalidate: CACHE_REVALIDATE_SECONDS.youtubeVideos, tags: [CACHE_TAGS.youtubeVideos] }
  });

  if (!response.ok) {
    throw new Error(`YouTube feed responded with ${response.status}`);
  }

  return response.text();
}

async function resolveBestThumbnailUrl(videoId: string, fallbackUrl = "") {
  const candidates = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    fallbackUrl,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  ].filter((value, index, array) => value && array.indexOf(value) === index);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        method: "HEAD",
        next: { revalidate: CACHE_REVALIDATE_SECONDS.youtubeVideos, tags: [CACHE_TAGS.youtubeVideos] }
      });

      if (response.ok) {
        return candidate;
      }
    } catch {
      // try the next candidate
    }
  }

  return fallbackUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

type YoutubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      publishedAt?: string;
      title?: string;
      description?: string;
      channelTitle?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
};

async function fetchYoutubeVideosFromApi(limit: number): Promise<YoutubeVideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing YOUTUBE_API_KEY");
  }

  const apiUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  apiUrl.searchParams.set("part", "snippet");
  apiUrl.searchParams.set("channelId", YOUTUBE_CHANNEL_ID);
  apiUrl.searchParams.set("order", "date");
  apiUrl.searchParams.set("type", "video");
  apiUrl.searchParams.set("maxResults", String(Math.max(limit, 3)));
  apiUrl.searchParams.set("key", apiKey);

  const payload = await fetchJson<YoutubeSearchResponse>(apiUrl.toString());

  const normalized = await Promise.all(
    (payload.items ?? []).map(async (item) => {
      const videoId = item.id?.videoId?.trim() ?? "";
      const snippet = item.snippet;
      const thumbnailUrl =
        snippet?.thumbnails?.high?.url?.trim() ??
        snippet?.thumbnails?.medium?.url?.trim() ??
        snippet?.thumbnails?.default?.url?.trim() ??
        "";
      const resolvedThumbnailUrl = videoId ? await resolveBestThumbnailUrl(videoId, thumbnailUrl) : thumbnailUrl;

      const normalized: Partial<YoutubeVideoItem> = {
        id: videoId,
        title: cleanText(snippet?.title),
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
        thumbnailUrl: resolvedThumbnailUrl,
        publishedAt: snippet?.publishedAt?.trim() ?? "",
        description: clipDescription(snippet?.description),
        channelTitle: cleanText(snippet?.channelTitle),
        kind: detectVideoKind(cleanText(snippet?.title), clipDescription(snippet?.description)),
        source: "api"
      };

      return isValidVideo(normalized) ? normalized : null;
    })
  );

  const filtered = normalized
    .filter((item): item is YoutubeVideoItem => item !== null)
    .slice(0, Math.max(limit + 3, 6));

  return (await excludeShorts(filtered)).slice(0, limit);
}

async function fetchYoutubeVideosFromFeed(limit: number): Promise<YoutubeVideoItem[]> {
  const xml = await fetchText(YOUTUBE_FEED_URL);
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

  const normalized = await Promise.all(
    entries.map(async (entry) => {
      const block = entry[1] ?? "";
      const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim() ?? "";
      const title = cleanText(block.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
      const publishedAt = block.match(/<published>([^<]+)<\/published>/)?.[1]?.trim() ?? "";
      const channelTitle = cleanText(block.match(/<author>\s*<name>([\s\S]*?)<\/name>/)?.[1]);
      const description = clipDescription(block.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1]);
      const thumbnailUrl =
        block.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1]?.trim() ??
        block.match(/<media:thumbnail[^>]+url='([^']+)'/)?.[1]?.trim() ??
        (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");
      const resolvedThumbnailUrl = videoId ? await resolveBestThumbnailUrl(videoId, thumbnailUrl) : thumbnailUrl;
      const linkUrl =
        block.match(/<link[^>]+href="([^"]+)"/)?.[1]?.trim() ??
        block.match(/<link[^>]+href='([^']+)'/)?.[1]?.trim() ??
        (videoId ? `https://www.youtube.com/watch?v=${videoId}` : "");

      const normalized: Partial<YoutubeVideoItem> = {
        id: videoId,
        title,
        url: linkUrl,
        thumbnailUrl: resolvedThumbnailUrl,
        publishedAt,
        description,
        channelTitle,
        kind: detectVideoKind(title, description),
        source: "feed"
      };

      return isValidVideo(normalized) ? normalized : null;
    })
  );

  const filtered = normalized
    .filter((item): item is YoutubeVideoItem => item !== null)
    .slice(0, Math.max(limit + 3, 6));

  return (await excludeShorts(filtered)).slice(0, limit);
}

async function fetchYoutubeVideosInternal(limit = MAX_ITEMS): Promise<YoutubeVideoItem[]> {
  try {
    const fromApi = await fetchYoutubeVideosFromApi(limit);
    if (fromApi.length > 0) {
      lastSuccessfulVideos = fromApi;
      return fromApi;
    }
  } catch {
    // fall through to feed fallback
  }

  try {
    const fromFeed = await fetchYoutubeVideosFromFeed(limit);
    if (fromFeed.length > 0) {
      lastSuccessfulVideos = fromFeed;
      return fromFeed;
    }
  } catch {
    // fall through to in-memory fallback
  }

  return lastSuccessfulVideos.slice(0, limit);
}

const getYoutubeVideosCached = unstable_cache(
  async () => fetchYoutubeVideosInternal(MAX_ITEMS),
  ["youtube-videos-v2"],
  {
    tags: [CACHE_TAGS.youtubeVideos],
    revalidate: CACHE_REVALIDATE_SECONDS.youtubeVideos
  }
);

export async function getYoutubeVideos(limit = MAX_ITEMS): Promise<YoutubeVideoItem[]> {
  if (process.env.VERCEL) {
    const videos = await getYoutubeVideosCached();
    return videos.slice(0, limit);
  }

  const cached = readRuntimeCache<YoutubeVideoItem[]>(LOCAL_CACHE_KEY);
  if (cached && cached.length > 0) {
    return cached.slice(0, limit);
  }

  const videos = await fetchYoutubeVideosInternal(limit);
  if (videos.length > 0) {
    writeRuntimeCache(LOCAL_CACHE_KEY, videos, CACHE_REVALIDATE_SECONDS.youtubeVideos);
  }

  return videos.slice(0, limit);
}

export function getYoutubeChannelUrl() {
  return YOUTUBE_CHANNEL_URL;
}
