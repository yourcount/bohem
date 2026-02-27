"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  ok?: boolean;
  nextPath?: string;
  error?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = (await response.json()) as LoginResponse;
      if (!response.ok) {
        setError(result.error ?? "Inloggen mislukt. Probeer opnieuw.");
        return;
      }

      router.push(result.nextPath ?? "/admin");
      router.refresh();
    } catch {
      setError("Er ging iets mis. Probeer opnieuw.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmitLogin} className="w-full max-w-sm space-y-4 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.42)] p-6">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold">
          E-mailadres
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-[var(--color-text-primary)]"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold">
          Wachtwoord
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-[var(--color-text-primary)]"
        />
      </div>

      {error ? <p className="text-sm text-[#ffb4a8]">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Bezig..." : "Inloggen"}
      </button>
    </form>
  );
}
