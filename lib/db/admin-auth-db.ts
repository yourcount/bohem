import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import Database from "better-sqlite3";

import { ADMIN_DATA_PATH } from "@/lib/auth/constants";
import { decryptMfaSecret, encryptMfaSecret, getDefaultDevMfaSecret } from "@/lib/auth/mfa";
import type { AccountStatus, AdminRole } from "@/lib/auth/types";
import { getDbPath } from "@/lib/db/content-db";

type AdminSeed = {
  email?: string;
  passwordHash?: string;
  role?: AdminRole;
  status?: AccountStatus;
  mfaEnabled?: boolean;
  mfaSecretEnc?: string;
};

export type AdminUserRecord = {
  id: number;
  email: string;
  password_hash: string;
  role: AdminRole;
  status: AccountStatus;
  mfa_enabled: number;
  mfa_secret_enc: string | null;
  force_logout_after: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type AdminUserListItem = {
  id: number;
  email: string;
  role: AdminRole;
  status: AccountStatus;
  force_logout_after: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  active_sessions: number;
};

export type AuditEventInput = {
  actorUserId: number | null;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

function openDb() {
  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  return new Database(dbPath);
}

function loadLegacySeed(): AdminSeed {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envHash = process.env.ADMIN_PASSWORD_HASH;

  if (envEmail && envHash) {
    return {
      email: envEmail,
      passwordHash: envHash,
      role: (process.env.ADMIN_ROLE as AdminRole | undefined) ?? "SUPER_ADMIN",
      status: "active",
      mfaEnabled: true
    };
  }

  const path = join(process.cwd(), ADMIN_DATA_PATH);
  if (!existsSync(path)) {
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as AdminSeed;
    return parsed;
  } catch {
    return {};
  }
}

export function ensureAdminAuthSchema() {
  const db = openDb();

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('EDITOR','ADMIN','SUPER_ADMIN')),
        status TEXT NOT NULL CHECK (status IN ('active','suspended')) DEFAULT 'active',
        mfa_enabled INTEGER NOT NULL DEFAULT 0,
        mfa_secret_enc TEXT,
        force_logout_after DATETIME,
        deleted_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        session_id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        mfa_verified INTEGER NOT NULL DEFAULT 0,
        issued_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        revoked_at DATETIME,
        last_seen_at DATETIME,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES admin_users(id)
      );

      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_user_id INTEGER,
        actor_email TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        metadata_json TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_user_id) REFERENCES admin_users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_revoked ON admin_sessions(revoked_at);
      CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);
    `);

    const seed = loadLegacySeed();
    if (!seed.email || !seed.passwordHash) {
      return;
    }

    const existing = db
      .prepare("SELECT id, role, mfa_enabled, mfa_secret_enc FROM admin_users WHERE email = ?")
      .get(seed.email) as Pick<AdminUserRecord, "id" | "role" | "mfa_enabled" | "mfa_secret_enc"> | undefined;

    const role: AdminRole = seed.role ?? "SUPER_ADMIN";
    const status: AccountStatus = seed.status ?? "active";
    const shouldEnableMfa = seed.mfaEnabled ?? role === "SUPER_ADMIN";
    const envSecret = process.env.SUPER_ADMIN_MFA_SECRET?.trim();
    const finalSecret = envSecret || (process.env.NODE_ENV === "production" ? "" : getDefaultDevMfaSecret());
    const mfaSecretEnc = seed.mfaSecretEnc ?? (shouldEnableMfa && finalSecret ? encryptMfaSecret(finalSecret) : null);

    if (!existing) {
      db.prepare(
        `INSERT INTO admin_users (
          email, password_hash, role, status, mfa_enabled, mfa_secret_enc, created_at, updated_at
        ) VALUES (
          @email, @password_hash, @role, @status, @mfa_enabled, @mfa_secret_enc, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`
      ).run({
        email: seed.email,
        password_hash: seed.passwordHash,
        role,
        status,
        mfa_enabled: shouldEnableMfa ? 1 : 0,
        mfa_secret_enc: mfaSecretEnc
      });
      return;
    }

    if (existing.role !== role || existing.mfa_enabled !== (shouldEnableMfa ? 1 : 0) || (!existing.mfa_secret_enc && mfaSecretEnc)) {
      db.prepare(
        `UPDATE admin_users
         SET role = @role,
             mfa_enabled = @mfa_enabled,
             mfa_secret_enc = COALESCE(@mfa_secret_enc, mfa_secret_enc),
             updated_at = CURRENT_TIMESTAMP
         WHERE email = @email`
      ).run({
        email: seed.email,
        role,
        mfa_enabled: shouldEnableMfa ? 1 : 0,
        mfa_secret_enc: mfaSecretEnc
      });
    }
  } finally {
    db.close();
  }
}

export function findAdminUserByEmail(email: string): AdminUserRecord | null {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    const row = db
      .prepare("SELECT * FROM admin_users WHERE email = ? AND deleted_at IS NULL")
      .get(email.toLowerCase()) as AdminUserRecord | undefined;
    return row ?? null;
  } finally {
    db.close();
  }
}

export function findAdminUserById(userId: number): AdminUserRecord | null {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    const row = db
      .prepare("SELECT * FROM admin_users WHERE id = ? AND deleted_at IS NULL")
      .get(userId) as AdminUserRecord | undefined;
    return row ?? null;
  } finally {
    db.close();
  }
}

export function getUserMfaSecret(user: AdminUserRecord): string | null {
  if (!user.mfa_secret_enc) return null;
  return decryptMfaSecret(user.mfa_secret_enc);
}

export function markUserLoginSuccess(userId: number) {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    db.prepare("UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(userId);
  } finally {
    db.close();
  }
}

export function createAdminSessionRecord(input: {
  sessionId: string;
  userId: number;
  email: string;
  role: AdminRole;
  mfaVerified: boolean;
  issuedAt: number;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
}) {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    db.prepare(
      `INSERT INTO admin_sessions (
        session_id, user_id, email, role, mfa_verified, issued_at, expires_at, ip_address, user_agent
      ) VALUES (
        @session_id, @user_id, @email, @role, @mfa_verified, @issued_at, @expires_at, @ip_address, @user_agent
      )`
    ).run({
      session_id: input.sessionId,
      user_id: input.userId,
      email: input.email,
      role: input.role,
      mfa_verified: input.mfaVerified ? 1 : 0,
      issued_at: input.issuedAt,
      expires_at: input.expiresAt,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null
    });
  } finally {
    db.close();
  }
}

export function isSessionActive(sessionId: string): boolean {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    const row = db
      .prepare("SELECT session_id, expires_at, revoked_at FROM admin_sessions WHERE session_id = ?")
      .get(sessionId) as { session_id: string; expires_at: number; revoked_at: string | null } | undefined;

    if (!row) return false;
    if (row.revoked_at) return false;
    if (row.expires_at < Math.floor(Date.now() / 1000)) return false;

    db.prepare("UPDATE admin_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE session_id = ?").run(sessionId);
    return true;
  } finally {
    db.close();
  }
}

export function revokeSessionById(sessionId: string) {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    db.prepare("UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_id = ?").run(sessionId);
  } finally {
    db.close();
  }
}

export function logAuditEvent(event: AuditEventInput) {
  ensureAdminAuthSchema();
  const db = openDb();

  try {
    db.prepare(
      `INSERT INTO admin_audit_logs (
        actor_user_id, actor_email, action, target_type, target_id, metadata_json, ip_address, user_agent, created_at
      ) VALUES (
        @actor_user_id, @actor_email, @action, @target_type, @target_id, @metadata_json, @ip_address, @user_agent, CURRENT_TIMESTAMP
      )`
    ).run({
      actor_user_id: event.actorUserId,
      actor_email: event.actorEmail,
      action: event.action,
      target_type: event.targetType,
      target_id: event.targetId,
      metadata_json: event.metadata ? JSON.stringify(event.metadata) : null,
      ip_address: event.ipAddress ?? null,
      user_agent: event.userAgent ?? null
    });
  } finally {
    db.close();
  }
}

export function readRecentAuditEvents(limit = 30) {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    return db
      .prepare(
        `SELECT id, actor_user_id, actor_email, action, target_type, target_id, metadata_json, ip_address, user_agent, created_at
         FROM admin_audit_logs
         ORDER BY datetime(created_at) DESC
         LIMIT ?`
      )
      .all(limit) as Array<{
      id: number;
      actor_user_id: number | null;
      actor_email: string;
      action: string;
      target_type: string;
      target_id: string;
      metadata_json: string | null;
      ip_address: string | null;
      user_agent: string | null;
      created_at: string;
    }>;
  } finally {
    db.close();
  }
}

export function listAdminUsers() {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    const nowEpoch = Math.floor(Date.now() / 1000);
    return db
      .prepare(
        `SELECT
          u.id,
          u.email,
          u.role,
          u.status,
          u.force_logout_after,
          u.created_at,
          u.updated_at,
          u.last_login_at,
          (
            SELECT COUNT(*)
            FROM admin_sessions s
            WHERE s.user_id = u.id
              AND s.revoked_at IS NULL
              AND s.expires_at > @now_epoch
          ) AS active_sessions
         FROM admin_users u
         WHERE u.deleted_at IS NULL
         ORDER BY CASE u.role WHEN 'SUPER_ADMIN' THEN 0 WHEN 'ADMIN' THEN 1 ELSE 2 END, LOWER(u.email) ASC`
      )
      .all({ now_epoch: nowEpoch }) as AdminUserListItem[];
  } finally {
    db.close();
  }
}

export function createAdminUser(input: {
  email: string;
  passwordHash: string;
  role: AdminRole;
  status: AccountStatus;
}) {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    const result = db
      .prepare(
        `INSERT INTO admin_users (
          email, password_hash, role, status, mfa_enabled, mfa_secret_enc, created_at, updated_at
        ) VALUES (
          @email, @password_hash, @role, @status, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`
      )
      .run({
        email: input.email,
        password_hash: input.passwordHash,
        role: input.role,
        status: input.status
      });

    return Number(result.lastInsertRowid);
  } finally {
    db.close();
  }
}

export function updateAdminUser(input: {
  userId: number;
  role?: AdminRole;
  status?: AccountStatus;
}) {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    const updateParts: string[] = [];
    const params: Record<string, unknown> = { user_id: input.userId };

    if (input.role) {
      updateParts.push("role = @role");
      params.role = input.role;
    }

    if (input.status) {
      updateParts.push("status = @status");
      params.status = input.status;
    }

    if (updateParts.length === 0) {
      return findAdminUserById(input.userId);
    }

    db.prepare(
      `UPDATE admin_users
       SET ${updateParts.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = @user_id AND deleted_at IS NULL`
    ).run(params);

    return db
      .prepare("SELECT * FROM admin_users WHERE id = ? AND deleted_at IS NULL")
      .get(input.userId) as AdminUserRecord | undefined;
  } finally {
    db.close();
  }
}

export function updateAdminUserPassword(userId: number, passwordHash: string) {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    const result = db
      .prepare(
        `UPDATE admin_users
         SET password_hash = @password_hash, updated_at = CURRENT_TIMESTAMP
         WHERE id = @user_id AND deleted_at IS NULL`
      )
      .run({
        user_id: userId,
        password_hash: passwordHash
      });

    return result.changes > 0;
  } finally {
    db.close();
  }
}

export function countActiveSuperAdmins() {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    const row = db
      .prepare("SELECT COUNT(*) as total FROM admin_users WHERE role = 'SUPER_ADMIN' AND deleted_at IS NULL")
      .get() as { total: number };
    return row.total;
  } finally {
    db.close();
  }
}

export function softDeleteAdminUser(userId: number) {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    const transaction = db.transaction(() => {
      db.prepare("UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL").run(userId);
      const result = db
        .prepare(
          `UPDATE admin_users
           SET status = 'suspended', deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND deleted_at IS NULL`
        )
        .run(userId);
      return result.changes > 0;
    });

    return transaction();
  } finally {
    db.close();
  }
}

export function forceLogoutUserSessions(userId: number) {
  ensureAdminAuthSchema();
  const db = openDb();
  try {
    db.prepare("UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL").run(userId);
    const updated = db
      .prepare(
        `UPDATE admin_users
         SET force_logout_after = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND deleted_at IS NULL`
      )
      .run(userId);

    return updated.changes > 0;
  } finally {
    db.close();
  }
}
