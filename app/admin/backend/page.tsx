import { redirect } from "next/navigation";
import Link from "next/link";

import { getAdminSession } from "@/lib/auth/admin-session";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";

export default async function SuperAdminPage() {
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
          <h1 className="font-display text-4xl">Admin Backend</h1>
          <p className="text-sm text-[#d9c6ac]">Ingelogd als {session.email} ({session.role}).</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm underline underline-offset-2">
            Naar Content Admin
          </Link>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
            >
              Uitloggen
            </button>
          </form>
        </div>
      </div>

      <SuperAdminShell />
    </main>
  );
}
