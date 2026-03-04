import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { ContentEditorForm } from "@/components/admin/ContentEditorForm";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { getAdminSession } from "@/lib/auth/admin-session";

export default async function AdminHomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await getAdminSession() : null;
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6">
      <h1 className="mb-2 font-display text-4xl">Website inhoud bewerken</h1>
      <p className="mb-6 text-[#d9c6ac]">
        Ingelogd als {session.email}. Pas hier alle zichtbare website-inhoud aan, inclusief foto&apos;s en discografie.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)]"
          >
            Uitloggen
          </button>
        </form>
        {session.role === "ADMIN" || session.role === "SUPER_ADMIN" ? (
          <Link href="/admin/backend" className="text-sm underline underline-offset-2">
            Naar Admin Backend
          </Link>
        ) : null}
        <Link href="/" className="text-sm underline underline-offset-2">
          Terug naar website
        </Link>
      </div>

      <ContentEditorForm />
    </main>
  );
}
