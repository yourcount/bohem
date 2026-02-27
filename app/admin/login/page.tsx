import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { LoginForm } from "@/components/admin/LoginForm";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (session) {
    redirect(session.role === "ADMIN" || session.role === "SUPER_ADMIN" ? "/admin/backend" : "/admin");
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[linear-gradient(160deg,#111a2a_0%,#1a2234_45%,#2a1e1b_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 14% 16%, rgba(242,139,14,0.32) 0%, transparent 34%), radial-gradient(circle at 82% 20%, rgba(67,135,133,0.28) 0%, transparent 36%)"
        }}
      />
      <div className="mx-auto flex min-h-svh w-full max-w-[1120px] items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-6 inline-flex items-center">
            <Image
              src="/brand/logos/bohem-logo-white-moon-color.webp"
              alt="Bohèm"
              width={240}
              height={92}
              className="h-12 w-auto sm:h-14"
              priority
            />
          </Link>
          <h1 className="mb-3 font-display text-4xl">Admin Login</h1>
          <p className="mb-6 text-sm text-[#d9c6ac]">Log in om Bohèm te beheren.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
