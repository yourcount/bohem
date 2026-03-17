import type { SiteContent } from "@/lib/types";

const dutchMonthAliases: Record<string, { number: string; label: string }> = {
  jan: { number: "01", label: "januari" },
  januari: { number: "01", label: "januari" },
  feb: { number: "02", label: "februari" },
  februari: { number: "02", label: "februari" },
  mrt: { number: "03", label: "maart" },
  maart: { number: "03", label: "maart" },
  apr: { number: "04", label: "april" },
  april: { number: "04", label: "april" },
  mei: { number: "05", label: "mei" },
  jun: { number: "06", label: "juni" },
  juni: { number: "06", label: "juni" },
  jul: { number: "07", label: "juli" },
  juli: { number: "07", label: "juli" },
  aug: { number: "08", label: "augustus" },
  augustus: { number: "08", label: "augustus" },
  sep: { number: "09", label: "september" },
  sept: { number: "09", label: "september" },
  september: { number: "09", label: "september" },
  okt: { number: "10", label: "oktober" },
  oktober: { number: "10", label: "oktober" },
  nov: { number: "11", label: "november" },
  november: { number: "11", label: "november" },
  dec: { number: "12", label: "december" },
  december: { number: "12", label: "december" }
};

export type UpcomingShow = NonNullable<SiteContent["bookings"]["upcomingShows"]>[number];

function getTodayPartsInAmsterdam() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return { year, month, day };
}

function normalizeMonthKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.+$/g, "");
}

function normalizeYear(value: string | undefined) {
  if (!value || value.trim().length === 0) {
    return getTodayPartsInAmsterdam().year;
  }

  const trimmed = value.trim();
  if (/^\d{2}$/.test(trimmed)) {
    return `20${trimmed}`;
  }
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function normalizeDutchShowDateInput(dateLabel: string): string {
  const raw = dateLabel.trim();
  if (!raw) return "";

  const compact = raw.replace(/[,/.-]+/g, " ").replace(/\s+/g, " ").trim();
  const match = compact.match(/^(\d{1,2})\s+([a-zA-Z\u00C0-\u017F]+)(?:\s+(\d{2,4}))?$/);
  if (!match) {
    return raw;
  }

  const [, dayRaw, monthRaw, yearRaw] = match;
  const month = dutchMonthAliases[normalizeMonthKey(monthRaw)];
  const year = normalizeYear(yearRaw);
  const day = Number(dayRaw);

  if (!month || !year || day < 1 || day > 31) {
    return raw;
  }

  return `${String(day).padStart(2, "0")} ${month.label} ${year}`;
}

export function parseDutchShowDate(dateLabel: string): string | null {
  const normalized = normalizeDutchShowDateInput(dateLabel);
  const match = normalized.match(/^(\d{1,2})\s+([a-zA-Z\u00C0-\u017F]+)\s+(\d{4})$/);
  if (!match) return null;
  const [, dayRaw, monthRaw, year] = match;
  const month = dutchMonthAliases[normalizeMonthKey(monthRaw)];
  if (!month) return null;
  const day = dayRaw.padStart(2, "0");
  return `${year}-${month.number}-${day}`;
}

function getTodayIsoInAmsterdam() {
  const { year, month, day } = getTodayPartsInAmsterdam();
  return `${year}-${month}-${day}`;
}

export function filterFutureShows(shows: UpcomingShow[] | undefined | null): UpcomingShow[] {
  if (!Array.isArray(shows) || shows.length === 0) return [];

  const todayIso = getTodayIsoInAmsterdam();
  return shows.filter((show) => {
    const parsedDate = parseDutchShowDate(show.date);
    if (!parsedDate) {
      return true;
    }
    return parsedDate >= todayIso;
  });
}
