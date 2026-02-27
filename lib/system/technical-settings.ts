import { readTechnicalSettings } from "@/lib/db/system-controls-db";

export function shouldAutoInvalidateCacheOnUpdate() {
  try {
    const settings = readTechnicalSettings();
    if (!settings) return true;
    return settings.cache_auto_invalidate_on_update === 1;
  } catch {
    return true;
  }
}
