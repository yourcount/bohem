"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  ok?: boolean;
  nextPath?: string;
  error?: string;
};

export function LoginForm() {
  const router = useRouter();
  const errorId = useId();
  const statusId = useId();
  const helpId = useId();
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

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
    <form
      onSubmit={onSubmitLogin}
      aria-describedby={helpId}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.42)] p-6"
    >
      <p id={helpId} className="text-xs text-[#d9c6ac]">
        Gebruik je e-mailadres en wachtwoord. Je gegevens worden niet zichtbaar opgeslagen in de browser.
      </p>
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
          disabled={isSubmitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-[var(--color-text-primary)] outline-none transition disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(15,24,37,0.9)]"
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
          disabled={isSubmitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onKeyUp={(event) => {
            if (typeof event.getModifierState === "function") {
              setCapsLockOn(event.getModifierState("CapsLock"));
            }
          }}
          onBlur={() => setCapsLockOn(false)}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.65)] px-3 py-2 text-[var(--color-text-primary)] outline-none transition disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(15,24,37,0.9)]"
        />
        {capsLockOn ? <p className="mt-1 text-xs text-[#ffd1c9]">Caps Lock staat aan.</p> : null}
      </div>

      {error ? (
        <p
          id={errorId}
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-md border border-[rgba(255,136,120,0.45)] bg-[rgba(181,47,29,0.16)] px-3 py-2 text-sm text-[#ffd1c9] outline-none"
        >
          {error}
        </p>
      ) : null}
      <p id={statusId} className="min-h-5 text-sm text-[#d9c6ac]" aria-live="polite">
        {isSubmitting ? "Bezig met inloggen..." : ""}
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-describedby={statusId}
        aria-busy={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(15,24,37,0.9)]"
      >
        {isSubmitting ? (
          <>
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-bg-deep)] border-t-transparent"
            />
            Bezig met inloggen...
          </>
        ) : (
          "Inloggen"
        )}
      </button>
    </form>
  );
}
