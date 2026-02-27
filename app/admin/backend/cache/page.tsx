import Link from "next/link";
import { redirect } from "next/navigation";

import { CacheManagementPanel } from "@/components/super-admin/CacheManagementPanel";
import { getAdminSession } from "@/lib/auth/admin-session";

export default async function SuperAdminCachePage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 py-12 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Cache beheer</h1>
          <p className="text-sm text-[#d9c6ac]">Bekijk runtime cache, stel TTL in en voer handmatige invalidaties uit.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/backend" className="text-sm underline underline-offset-2">
            Terug naar backend overzicht
          </Link>
          <Link href="/" className="text-sm underline underline-offset-2">
            Bekijk website
          </Link>
        </div>
      </div>

      <CacheManagementPanel />
    </main>
  );
}
