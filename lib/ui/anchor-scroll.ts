export function scrollToAnchor(href: string, options?: { behavior?: ScrollBehavior; extraOffset?: number }) {
  if (!href.startsWith("#")) return false;

  const targetId = href.slice(1);
  const target = document.getElementById(targetId);
  if (!target) return false;

  const behavior = options?.behavior ?? "smooth";
  const extraOffset = options?.extraOffset ?? 8;
  const header = document.getElementById("site-header");
  const headerOffset = header ? header.getBoundingClientRect().height : 0;
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset - extraOffset);

  window.scrollTo({ top, behavior });
  if (window.location.hash !== href) {
    history.pushState(null, "", href);
  }

  return true;
}
