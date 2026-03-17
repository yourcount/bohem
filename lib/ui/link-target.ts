export function isExternalHttpUrl(href: string | undefined | null) {
  if (typeof href !== "string") return false;
  return /^https?:\/\//i.test(href.trim());
}

export function getExternalLinkProps(href: string | undefined | null) {
  return isExternalHttpUrl(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
