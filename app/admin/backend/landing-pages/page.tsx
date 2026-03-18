import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth/admin-session";

export default async function SuperAdminLandingPagesPage() {
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
          <h1 className="font-display text-4xl">SEO landingspagina&apos;s</h1>
          <p className="text-sm text-[#d9c6ac]">Beheer de indexeerbare SEO-pagina&apos;s voor boekingsintentie, Kampvuurklanken en pers.</p>
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

      <div className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5 text-sm text-[#d9c6ac]">
        Deze beheerpagina is verplaatst naar <Link href="/admin/backend/landings" className="underline underline-offset-2">SEO landingspagina&apos;s</Link>.
      </div>
    </main>
  );
}
