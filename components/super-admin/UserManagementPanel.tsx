"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type AdminRole = "EDITOR" | "ADMIN" | "SUPER_ADMIN";
type AccountStatus = "active" | "suspended";

type UserRow = {
  id: number;
  email: string;
  role: AdminRole;
  status: AccountStatus;
  forceLogoutAfter: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  activeSessions: number;
};

type UsersResponse = {
  ok: boolean;
  users: UserRow[];
};

type ApiError = {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

type StatusTone = "neutral" | "success" | "error";

type Props = {
  currentUserId: number;
  currentUserEmail: string;
  currentUserRole: AdminRole;
};

function toneClass(tone: StatusTone) {
  if (tone === "success") return "text-[#b6efb9]";
  if (tone === "error") return "text-[#ffb4a8]";
  return "text-[#d9c6ac]";
}

export function UserManagementPanel({ currentUserId, currentUserEmail, currentUserRole }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [busyByUser, setBusyByUser] = useState<Record<number, boolean>>({});
  const [editing, setEditing] = useState<Record<number, { role: AdminRole; status: AccountStatus }>>({});
  const [resetValues, setResetValues] = useState<Record<number, string>>({});
  const [createForm, setCreateForm] = useState({ email: "", password: "", role: "ADMIN" as "ADMIN" | "EDITOR", status: "active" as AccountStatus });
  const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});
  const [isCreating, setIsCreating] = useState(false);

  const syncEditing = (rows: UserRow[]) => {
    const next: Record<number, { role: AdminRole; status: AccountStatus }> = {};
    for (const row of rows) {
      next[row.id] = { role: row.role, status: row.status };
    }
    setEditing(next);
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/super-admin/users", { method: "GET" });
      const payload = (await response.json()) as UsersResponse | ApiError;
      if (!response.ok || !("ok" in payload)) {
        const apiError = payload as ApiError;
        setStatusMessage(apiError.error ?? "Gebruikers laden mislukt.");
        setStatusTone("error");
        return;
      }

      setUsers(payload.users);
      syncEditing(payload.users);
    } catch {
      setStatusMessage("Netwerkfout bij laden van gebruikers.");
      setStatusTone("error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => user.email.toLowerCase().includes(q) || user.role.toLowerCase().includes(q));
  }, [users, query]);

  const setBusy = (userId: number, busy: boolean) => {
    setBusyByUser((prev) => ({ ...prev, [userId]: busy }));
  };

  const updateUser = async (userId: number) => {
    const next = editing[userId];
    if (!next) return;

    setBusy(userId, true);
    setStatusMessage("Wijziging opslaan...");
    setStatusTone("neutral");

    try {
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      });
      const payload = (await response.json()) as { ok: true } | ApiError;

      if (!response.ok) {
        setStatusMessage((payload as ApiError).error ?? "Gebruiker bijwerken mislukt.");
        setStatusTone("error");
        return;
      }

      setStatusMessage("Gebruiker bijgewerkt.");
      setStatusTone("success");
      await loadUsers();
    } catch {
      setStatusMessage("Netwerkfout bij opslaan.");
      setStatusTone("error");
    } finally {
      setBusy(userId, false);
    }
  };

  const resetPassword = async (userId: number) => {
    const value = (resetValues[userId] ?? "").trim();
    if (!value) {
      setStatusMessage("Vul een nieuw wachtwoord in.");
      setStatusTone("error");
      return;
    }

    setBusy(userId, true);
    setStatusMessage("Wachtwoord resetten...");
    setStatusTone("neutral");

    try {
      const response = await fetch(`/api/super-admin/users/${userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: value })
      });
      const payload = (await response.json()) as { ok: true; message: string } | ApiError;

      if (!response.ok) {
        setStatusMessage((payload as ApiError).error ?? "Wachtwoord resetten mislukt.");
        setStatusTone("error");
        return;
      }

      const successPayload = payload as { ok: true; message: string };
      setStatusMessage(successPayload.message);
      setStatusTone("success");
      setResetValues((prev) => ({ ...prev, [userId]: "" }));
      await loadUsers();
    } catch {
      setStatusMessage("Netwerkfout bij wachtwoord resetten.");
      setStatusTone("error");
    } finally {
      setBusy(userId, false);
    }
  };

  const forceLogout = async (userId: number) => {
    setBusy(userId, true);
    setStatusMessage("Actieve sessies afmelden...");
    setStatusTone("neutral");

    try {
      const response = await fetch(`/api/super-admin/users/${userId}/force-logout`, { method: "POST" });
      const payload = (await response.json()) as { ok: true; message: string } | ApiError;

      if (!response.ok) {
        setStatusMessage((payload as ApiError).error ?? "Force logout mislukt.");
        setStatusTone("error");
        return;
      }

      const successPayload = payload as { ok: true; message: string };
      setStatusMessage(successPayload.message);
      setStatusTone("success");
      await loadUsers();
    } catch {
      setStatusMessage("Netwerkfout bij force logout.");
      setStatusTone("error");
    } finally {
      setBusy(userId, false);
    }
  };

  const createUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setCreateErrors({});
    setStatusMessage("Gebruiker aanmaken...");
    setStatusTone("neutral");

    try {
      const response = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm)
      });

      const payload = (await response.json()) as { ok: true; users: UserRow[] } | ApiError;
      if (!response.ok || !("ok" in payload)) {
        const apiError = payload as ApiError;
        setCreateErrors(apiError.fieldErrors ?? {});
        setStatusMessage(apiError.error ?? "Gebruiker aanmaken mislukt.");
        setStatusTone("error");
        return;
      }

      setUsers(payload.users);
      syncEditing(payload.users);
      setCreateForm({ email: "", password: "", role: "ADMIN", status: "active" });
      setStatusMessage("Nieuwe gebruiker toegevoegd.");
      setStatusTone("success");
    } catch {
      setStatusMessage("Netwerkfout bij gebruiker aanmaken.");
      setStatusTone("error");
    } finally {
      setIsCreating(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)]";

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <h2 className="font-display text-3xl">Gebruiker toevoegen</h2>
        <p className="mt-1 text-sm text-[#d9c6ac]">Voeg een beheeraccount toe met rol `EDITOR` of `ADMIN`.</p>

        <form onSubmit={createUser} className="mt-4 grid gap-4 md:grid-cols-4">
          <label className="text-sm md:col-span-2">
            E-mailadres
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
              value={createForm.email}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            {createErrors.email?.map((error) => (
              <span key={error} className="mt-1 block text-xs text-[#ffb4a8]">
                {error}
              </span>
            ))}
          </label>

          <label className="text-sm">
            Rol
            <select
              className={inputClass}
              value={createForm.role}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as "ADMIN" | "EDITOR" }))}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="EDITOR">EDITOR</option>
            </select>
          </label>

          <label className="text-sm">
            Status
            <select
              className={inputClass}
              value={createForm.status}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as AccountStatus }))}
            >
              <option value="active">Actief</option>
              <option value="suspended">Gepauzeerd</option>
            </select>
          </label>

          <label className="text-sm md:col-span-3">
            Tijdelijk wachtwoord
            <input
              className={inputClass}
              type="text"
              autoComplete="new-password"
              value={createForm.password}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <span className="mt-1 block text-xs text-[#d9c6ac]">Minimaal 12 tekens met letters en cijfers.</span>
            {createErrors.password?.map((error) => (
              <span key={error} className="mt-1 block text-xs text-[#ffb4a8]">
                {error}
              </span>
            ))}
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex w-full items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Toevoegen..." : "Gebruiker toevoegen"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--color-line-muted)] bg-[rgba(16,22,33,0.45)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl">Gebruikersbeheer</h2>
          <input
            className="w-full max-w-[300px] rounded-full border border-[var(--color-line-muted)] bg-[rgba(15,24,37,0.45)] px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-amber)]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zoek op e-mail of rol"
          />
        </div>

        {isLoading ? <p className="mt-4 text-sm text-[#d9c6ac]">Gebruikers laden...</p> : null}

        <div className="mt-4 grid gap-4">
          {filteredUsers.map((user) => {
            const local = editing[user.id] ?? { role: user.role, status: user.status };
            const isCurrent = user.id === currentUserId;
            const isSuperAdmin = user.role === "SUPER_ADMIN";
            const canManageTarget = currentUserRole === "SUPER_ADMIN" || !isSuperAdmin;
            const isBusy = Boolean(busyByUser[user.id]);

            return (
              <article key={user.id} className="rounded-xl border border-[var(--color-line-muted)] bg-[rgba(24,41,63,0.28)] p-4">
                <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{user.email}</p>
                    <p className="mt-1 text-xs text-[#d9c6ac]">
                      Laatste login: {user.lastLoginAt ?? "Nog niet ingelogd"} · Actieve sessies: {user.activeSessions}
                    </p>
                    {isCurrent ? <p className="mt-1 text-xs text-[#d9c6ac]">Dit is jouw account ({currentUserEmail}).</p> : null}
                  </div>

                  <label className="text-sm">
                    Rol
                    <select
                      className={inputClass}
                      value={local.role}
                      disabled={isSuperAdmin || isBusy || !canManageTarget}
                      onChange={(event) =>
                        setEditing((prev) => ({
                          ...prev,
                          [user.id]: { ...local, role: event.target.value as AdminRole }
                        }))
                      }
                    >
                      {isSuperAdmin ? <option value="SUPER_ADMIN">SUPER_ADMIN</option> : null}
                      <option value="ADMIN">ADMIN</option>
                      <option value="EDITOR">EDITOR</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    Status
                    <select
                      className={inputClass}
                      value={local.status}
                      disabled={isBusy || isCurrent || !canManageTarget}
                      onChange={(event) =>
                        setEditing((prev) => ({
                          ...prev,
                          [user.id]: { ...local, status: event.target.value as AccountStatus }
                        }))
                      }
                    >
                      <option value="active">Actief</option>
                      <option value="suspended">Gepauzeerd</option>
                    </select>
                  </label>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => void updateUser(user.id)}
                      disabled={isBusy || !canManageTarget}
                      className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Wijzigingen opslaan
                    </button>

                    <button
                      type="button"
                      onClick={() => void forceLogout(user.id)}
                      disabled={isBusy || !canManageTarget}
                      className="inline-flex items-center justify-center rounded-full border border-[var(--color-line-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(244,233,220,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Force logout
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
                  <label className="text-sm">
                    Wachtwoord resetten
                    <input
                      className={inputClass}
                      type="text"
                      autoComplete="new-password"
                      placeholder="Nieuw wachtwoord"
                      value={resetValues[user.id] ?? ""}
                      onChange={(event) =>
                        setResetValues((prev) => ({
                          ...prev,
                          [user.id]: event.target.value
                        }))
                      }
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => void resetPassword(user.id)}
                      disabled={isBusy || !canManageTarget}
                      className="inline-flex items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-2.5 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reset wachtwoord
                    </button>
                  </div>
                </div>

                {!canManageTarget ? (
                  <p className="mt-2 text-xs text-[#d9c6ac]">Alleen SUPER_ADMIN kan dit account beheren.</p>
                ) : null}
              </article>
            );
          })}
        </div>

        {!isLoading && filteredUsers.length === 0 ? <p className="mt-4 text-sm text-[#d9c6ac]">Geen gebruikers gevonden.</p> : null}
      </section>

      <p className={`text-sm ${toneClass(statusTone)}`}>{statusMessage}</p>
    </div>
  );
}
