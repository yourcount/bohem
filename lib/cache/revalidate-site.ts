import { revalidatePath, revalidateTag } from "next/cache";

import { invalidateSiteRuntimeCache } from "@/lib/cache/runtime-cache";
import { CACHE_TAGS } from "@/lib/cache/tags";

export function revalidatePublicSiteCaches(path = "/") {
  invalidateSiteRuntimeCache();
  revalidateTag(CACHE_TAGS.siteContent, "max");
  revalidateTag(CACHE_TAGS.seoSettings, "max");
  revalidateTag(CACHE_TAGS.featureFlags, "max");
  revalidatePath(path);
}
