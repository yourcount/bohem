import type { AccountStatus, AdminRole } from "@/lib/auth/types";

export type FieldErrors = Record<string, string[]>;

export type CreateUserInput = {
  email: string;
  password: string;
  role: AdminRole;
  status: AccountStatus;
};

export type UpdateUserInput = {
  role?: AdminRole;
  status?: AccountStatus;
};

export type ResetPasswordInput = {
  newPassword: string;
};

const ASSIGNABLE_ROLES: AdminRole[] = ["EDITOR", "ADMIN"];
const VALID_STATUSES: AccountStatus[] = ["active", "suspended"];

function addError(errors: FieldErrors, field: string, message: string) {
  if (!errors[field]) errors[field] = [];
  errors[field].push(message);
}

function sanitizeText(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

export function sanitizeEmail(value: string) {
  return sanitizeText(value).toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasStrongEnoughPassword(value: string) {
  if (value.length < 12) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  return hasLetter && hasNumber;
}

export function parseUserId(raw: string) {
  const numeric = Number(raw);
  if (!Number.isInteger(numeric) || numeric <= 0) return null;
  return numeric;
}

export function validateCreateUserBody(input: unknown) {
  const fieldErrors: FieldErrors = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false as const, fieldErrors: { body: ["Body moet een object zijn."] } };
  }

  const raw = input as Record<string, unknown>;
  const email = typeof raw.email === "string" ? sanitizeEmail(raw.email) : "";
  const password = typeof raw.password === "string" ? sanitizeText(raw.password) : "";
  const role = typeof raw.role === "string" ? sanitizeText(raw.role).toUpperCase() : "";
  const status = typeof raw.status === "string" ? sanitizeText(raw.status).toLowerCase() : "active";

  if (!email || !isValidEmail(email)) addError(fieldErrors, "email", "Vul een geldig e-mailadres in.");
  if (!password || !hasStrongEnoughPassword(password)) {
    addError(fieldErrors, "password", "Minimaal 12 tekens, met letters en cijfers.");
  }

  if (!ASSIGNABLE_ROLES.includes(role as AdminRole)) {
    addError(fieldErrors, "role", "Kies een geldige rol.");
  }

  if (!VALID_STATUSES.includes(status as AccountStatus)) {
    addError(fieldErrors, "status", "Kies een geldige accountstatus.");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false as const, fieldErrors };
  }

  return {
    ok: true as const,
    value: {
      email,
      password,
      role: role as AdminRole,
      status: status as AccountStatus
    }
  };
}

export function validateUpdateUserBody(input: unknown) {
  const fieldErrors: FieldErrors = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false as const, fieldErrors: { body: ["Body moet een object zijn."] } };
  }

  const raw = input as Record<string, unknown>;
  const next: UpdateUserInput = {};

  if ("role" in raw) {
    const role = typeof raw.role === "string" ? sanitizeText(raw.role).toUpperCase() : "";
    if (!ASSIGNABLE_ROLES.includes(role as AdminRole)) {
      addError(fieldErrors, "role", "Kies een geldige rol.");
    } else {
      next.role = role as AdminRole;
    }
  }

  if ("status" in raw) {
    const status = typeof raw.status === "string" ? sanitizeText(raw.status).toLowerCase() : "";
    if (!VALID_STATUSES.includes(status as AccountStatus)) {
      addError(fieldErrors, "status", "Kies een geldige accountstatus.");
    } else {
      next.status = status as AccountStatus;
    }
  }

  if (!("role" in raw) && !("status" in raw)) {
    addError(fieldErrors, "body", "Geen wijzigingsvelden opgegeven.");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false as const, fieldErrors };
  }

  return { ok: true as const, value: next };
}

export function validateResetPasswordBody(input: unknown) {
  const fieldErrors: FieldErrors = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false as const, fieldErrors: { body: ["Body moet een object zijn."] } };
  }

  const raw = input as Record<string, unknown>;
  const newPassword = typeof raw.newPassword === "string" ? sanitizeText(raw.newPassword) : "";

  if (!newPassword || !hasStrongEnoughPassword(newPassword)) {
    addError(fieldErrors, "newPassword", "Minimaal 12 tekens, met letters en cijfers.");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false as const, fieldErrors };
  }

  return {
    ok: true as const,
    value: {
      newPassword
    }
  };
}
