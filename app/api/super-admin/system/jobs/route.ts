import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { listRecentCacheInvalidations } from "@/lib/db/cache-management-db";
import { readTechnicalSettings } from "@/lib/db/system-controls-db";
import { readRuntimeCacheStatus } from "@/lib/cache/runtime-cache";

export async function GET() {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  try {
    const settings = readTechnicalSettings();
    if (!settings) {
      return NextResponse.json({ error: "Technische instellingen niet gevonden.", code: "SYSTEM_SETTINGS_NOT_FOUND" }, { status: 404 });
    }

    const recentInvalidations = listRecentCacheInvalidations(10);
    const runtime = readRuntimeCacheStatus();

    const jobs = [
      {
        key: "cache-refresh-worker",
        label: "Cache refresh worker",
        status: settings.jobs_enabled === 1 ? "online" : "paused",
        mode: "read-only",
        pollIntervalSeconds: settings.jobs_poll_interval_seconds,
        lastSignalAt: recentInvalidations[0]?.created_at || null,
        note: "Gebruik cache invalidatie bij content- of SEO-wijzigingen."
      },
      {
        key: "runtime-cache-observer",
        label: "Runtime cache observer",
        status: "online",
        mode: "read-only",
        activeEntries: runtime.entries,
        note: "Toont actuele runtime cache status per process."
      }
    ];

    return NextResponse.json({ ok: true, jobs }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Jobstatus laden mislukt.", code: "JOBS_READ_FAILED" }, { status: 500 });
  }
}
