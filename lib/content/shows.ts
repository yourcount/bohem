import type { SiteContent } from "@/lib/types";

const dutchMonthMap: Record<string, string> = {
  jan: "01",
  feb: "02",
  mrt: "03",
  apr: "04",
  mei: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  okt: "10",
  nov: "11",
  dec: "12"
};

export type UpcomingShow = NonNullable<SiteContent["bookings"]["upcomingShows"]>[number];

export function parseDutchShowDate(dateLabel: string): string | null {
  const match = dateLabel.toLowerCase().match(/^(\d{1,2})\s+([a-z]{3})\s+(\d{4})$/);
  if (!match) return null;
  const [, dayRaw, monthRaw, year] = match;
  const month = dutchMonthMap[monthRaw];
  if (!month) return null;
  const day = dayRaw.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayIsoInAmsterdam() {
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
