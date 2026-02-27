import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { readRuntimeCacheStatus } from "@/lib/cache/runtime-cache";
import { ensureAdminAuthSchema, findAdminUserById } from "@/lib/db/admin-auth-db";
import { ensureCacheManagementSchema, readCacheSettings } from "@/lib/db/cache-management-db";
import { contentDbExists, getDbPath } from "@/lib/db/content-db";
import { ensureSeoSettingsSchema, readSeoSettings } from "@/lib/db/seo-settings-db";
import { ensureSystemControlsSchema, readTechnicalSettings } from "@/lib/db/system-controls-db";

export async function GET() {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  const checks: Array<{ name: string; status: "ok" | "fail"; detail: string }> = [];

  try {
    ensureAdminAuthSchema();
    const currentUser = findAdminUserById(auth.session.uid);
    checks.push({
      name: "auth-db",
      status: currentUser ? "ok" : "fail",
      detail: currentUser ? "Auth database bereikbaar." : "Gebruiker niet gevonden in auth database."
    });
  } catch {
    checks.push({ name: "auth-db", status: "fail", detail: "Auth database niet bereikbaar." });
  }

  checks.push({
    name: "content-db",
    status: contentDbExists() ? "ok" : "fail",
    detail: contentDbExists() ? "Content database bereikbaar." : `Content database ontbreekt op ${getDbPath()}`
  });

  try {
    ensureSeoSettingsSchema();
    const seo = readSeoSettings();
    checks.push({
      name: "seo-settings",
      status: seo ? "ok" : "fail",
      detail: seo ? "SEO instellingen beschikbaar." : "SEO instellingen ontbreken."
    });
  } catch {
    checks.push({ name: "seo-settings", status: "fail", detail: "SEO instellingen niet bereikbaar." });
  }

  checks.push({
    name: "cache",
    status: "ok",
    detail: `Runtime cache entries: ${readRuntimeCacheStatus().entries}`
  });

  try {
    ensureCacheManagementSchema();
    const cacheSettings = readCacheSettings();
    checks.push({
      name: "cache-settings",
      status: cacheSettings ? "ok" : "fail",
      detail: cacheSettings ? "Cache instellingen beschikbaar." : "Cache instellingen ontbreken."
    });
  } catch {
    checks.push({ name: "cache-settings", status: "fail", detail: "Cache instellingen niet bereikbaar." });
  }

  try {
    ensureSystemControlsSchema();
    const technicalSettings = readTechnicalSettings();
    checks.push({
      name: "system-controls",
      status: technicalSettings ? "ok" : "fail",
      detail: technicalSettings ? "System controls beschikbaar." : "System controls ontbreken."
    });
  } catch {
    checks.push({ name: "system-controls", status: "fail", detail: "System controls niet bereikbaar." });
  }

  const hasFailures = checks.some((check) => check.status === "fail");

  return NextResponse.json(
    {
      ok: !hasFailures,
      checks,
      generatedAt: new Date().toISOString()
    },
    { status: hasFailures ? 503 : 200 }
  );
}
