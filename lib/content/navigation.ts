import type { NavItem } from "@/lib/types";

function hasText(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function ensureShowsNavigationItem(navigation: NavItem[], options: { hasShows: boolean }): NavItem[] {
  if (!options.hasShows) {
    return navigation;
  }

  const cleaned = navigation.filter((item) => hasText(item.label) && hasText(item.href));
  if (cleaned.some((item) => item.href === "#shows")) {
    return cleaned;
  }

  const next = [...cleaned];
  const musicIndex = next.findIndex((item) => item.href === "#muziek");
  const campfireIndex = next.findIndex((item) => item.href === "#kampvuurklanken");
  const bookingIndex = next.findIndex((item) => item.href === "#boekingen");

  let insertIndex = next.length;
  if (musicIndex >= 0) {
    insertIndex = musicIndex + 1;
  } else if (campfireIndex >= 0) {
    insertIndex = campfireIndex;
  } else if (bookingIndex >= 0) {
    insertIndex = bookingIndex;
  }

  next.splice(insertIndex, 0, { label: "Shows", href: "#shows" });
  return next;
}
