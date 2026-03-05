import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { del, get, list, put } from "@vercel/blob";
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

type BlobAdminSessionRecord = {
  session_id: string;
  user_id: number;
  email: string;
  role: AdminRole;
  mfa_verified: number;
  issued_at: number;
  expires_at: number;
  revoked_at: string | null;
  last_seen_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
};

const ADMIN_SESSION_BLOB_PREFIX = "cms/admin-sessions";
const ADMIN_USERS_BLOB_PATH = "cms/admin-users-v1.json";
const ADMIN_AUDIT_BLOB_PATH = "cms/admin-audit-v1.json";
const ADMIN_AUDIT_MAX_ENTRIES = 2000;

type BlobAdminUsersStore = {
  next_id: number;
  users: AdminUserRecord[];
};

type BlobAuditEntry = {
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
};

type BlobAdminAuditStore = {
  next_id: number;
  logs: BlobAuditEntry[];
};

function shouldUseBlobSessionStore() {
  return Boolean(process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN);
}

function nowIso() {
  return new Date().toISOString();
}

function adminSessionBlobPath(userId: number, sessionId: string) {
  return `${ADMIN_SESSION_BLOB_PREFIX}/u-${userId}/s-${sessionId}.json`;
}

async function readBlobAdminSession(userId: number, sessionId: string): Promise<BlobAdminSessionRecord | null> {
  const blob = await get(adminSessionBlobPath(userId, sessionId), { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200 || !blob.stream) return null;

  try {
    const parsed = (await new Response(blob.stream).json()) as Partial<BlobAdminSessionRecord>;
    if (!parsed || parsed.session_id !== sessionId || Number(parsed.user_id) !== userId) return null;
    return {
      session_id: String(parsed.session_id),
      user_id: Number(parsed.user_id),
      email: String(parsed.email ?? ""),
      role: String(parsed.role ?? "EDITOR") as AdminRole,
      mfa_verified: Number(parsed.mfa_verified ?? 0),
      issued_at: Number(parsed.issued_at ?? 0),
      expires_at: Number(parsed.expires_at ?? 0),
      revoked_at: parsed.revoked_at ? String(parsed.revoked_at) : null,
      last_seen_at: parsed.last_seen_at ? String(parsed.last_seen_at) : null,
      ip_address: parsed.ip_address ? String(parsed.ip_address) : null,
      user_agent: parsed.user_agent ? String(parsed.user_agent) : null
    };
  } catch {
    return null;
  }
}

async function writeBlobAdminSession(record: BlobAdminSessionRecord) {
  await put(adminSessionBlobPath(record.user_id, record.session_id), JSON.stringify(record), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8"
  });
}

async function listAllUserSessionBlobPaths(userId: number) {
  const prefix = `${ADMIN_SESSION_BLOB_PREFIX}/u-${userId}/`;
  const paths: string[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ prefix, limit: 1000, cursor });
    for (const blob of page.blobs) {
      paths.push(blob.pathname);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return paths;
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  const blob = await get(pathname, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200 || !blob.stream) return null;
  try {
    return (await new Response(blob.stream).json()) as T;
  } catch {
    return null;
  }
}

async function writeBlobJson(pathname: string, payload: unknown) {
  await put(pathname, JSON.stringify(payload), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8"
  });
}

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

async function readBlobUsersStore(): Promise<BlobAdminUsersStore> {
  const parsed = await readBlobJson<Partial<BlobAdminUsersStore>>(ADMIN_USERS_BLOB_PATH);
  if (!parsed || !Array.isArray(parsed.users)) {
    return { next_id: 1, users: [] };
  }

  const users = parsed.users
    .filter((user): user is AdminUserRecord => Boolean(user && typeof user.email === "string"))
    .map((user) => ({
      ...user,
      id: Number(user.id),
      email: String(user.email).toLowerCase(),
      role: user.role,
      status: user.status,
      mfa_enabled: Number(user.mfa_enabled ?? 0),
      mfa_secret_enc: user.mfa_secret_enc ?? null,
      force_logout_after: user.force_logout_after ?? null,
      deleted_at: user.deleted_at ?? null,
      created_at: user.created_at ?? nowIso(),
      updated_at: user.updated_at ?? nowIso(),
      last_login_at: user.last_login_at ?? null
    }));

  const nextId = Number(parsed.next_id);
  return {
    next_id: Number.isFinite(nextId) && nextId > 0 ? nextId : users.reduce((max, user) => Math.max(max, user.id), 0) + 1,
    users
  };
}

async function writeBlobUsersStore(store: BlobAdminUsersStore) {
  await writeBlobJson(ADMIN_USERS_BLOB_PATH, store);
}

async function ensureBlobUsersSeed() {
  const seed = loadLegacySeed();
  const store = await readBlobUsersStore();
  const now = nowIso();

  if (!seed.email || !seed.passwordHash) {
    if (store.users.length === 0) {
      await writeBlobUsersStore(store);
    }
    return;
  }

  const existing = store.users.find((user) => user.email === seed.email?.toLowerCase() && !user.deleted_at);
  const role: AdminRole = seed.role ?? "SUPER_ADMIN";
  const status: AccountStatus = seed.status ?? "active";
  const shouldEnableMfa = seed.mfaEnabled ?? role === "SUPER_ADMIN";
  const envSecret = process.env.SUPER_ADMIN_MFA_SECRET?.trim();
  const finalSecret = envSecret || (process.env.NODE_ENV === "production" ? "" : getDefaultDevMfaSecret());
  const mfaSecretEnc = seed.mfaSecretEnc ?? (shouldEnableMfa && finalSecret ? encryptMfaSecret(finalSecret) : null);

  if (!existing) {
    store.users.push({
      id: store.next_id++,
      email: seed.email.toLowerCase(),
      password_hash: seed.passwordHash,
      role,
      status,
      mfa_enabled: shouldEnableMfa ? 1 : 0,
      mfa_secret_enc: mfaSecretEnc,
      force_logout_after: null,
      deleted_at: null,
      created_at: now,
      updated_at: now,
      last_login_at: null
    });
    await writeBlobUsersStore(store);
    return;
  }

  const changed =
    existing.role !== role ||
    existing.status !== status ||
    existing.password_hash !== seed.passwordHash ||
    existing.mfa_enabled !== (shouldEnableMfa ? 1 : 0) ||
    (!existing.mfa_secret_enc && mfaSecretEnc);

  if (changed) {
    existing.role = role;
    existing.status = status;
    existing.password_hash = seed.passwordHash;
    existing.mfa_enabled = shouldEnableMfa ? 1 : 0;
    existing.mfa_secret_enc = existing.mfa_secret_enc ?? mfaSecretEnc;
    existing.updated_at = now;
    await writeBlobUsersStore(store);
  }
}

async function readBlobAuditStore(): Promise<BlobAdminAuditStore> {
  const parsed = await readBlobJson<Partial<BlobAdminAuditStore>>(ADMIN_AUDIT_BLOB_PATH);
  if (!parsed || !Array.isArray(parsed.logs)) {
    return { next_id: 1, logs: [] };
  }
  const logs = parsed.logs
    .filter((entry): entry is BlobAuditEntry => Boolean(entry && typeof entry.action === "string"))
    .map((entry) => ({
      ...entry,
      id: Number(entry.id),
      actor_user_id: entry.actor_user_id ?? null,
      actor_email: String(entry.actor_email ?? ""),
      action: String(entry.action ?? ""),
      target_type: String(entry.target_type ?? ""),
      target_id: String(entry.target_id ?? ""),
      metadata_json: entry.metadata_json ?? null,
      ip_address: entry.ip_address ?? null,
      user_agent: entry.user_agent ?? null,
      created_at: entry.created_at ?? nowIso()
    }));
  const nextId = Number(parsed.next_id);
  return {
    next_id: Number.isFinite(nextId) && nextId > 0 ? nextId : logs.reduce((max, row) => Math.max(max, row.id), 0) + 1,
    logs
  };
}

async function writeBlobAuditStore(store: BlobAdminAuditStore) {
  await writeBlobJson(ADMIN_AUDIT_BLOB_PATH, store);
}

async function countActiveBlobSessionsForUser(userId: number) {
  const prefix = `${ADMIN_SESSION_BLOB_PREFIX}/u-${userId}/`;
  const nowEpoch = Math.floor(Date.now() / 1000);
  let cursor: string | undefined;
  let total = 0;

  do {
    const page = await list({ prefix, limit: 500, cursor });
    for (const item of page.blobs) {
      const parsed = await readBlobJson<BlobAdminSessionRecord>(item.pathname);
      if (!parsed) continue;
      if (parsed.revoked_at) continue;
      if (parsed.expires_at < nowEpoch) continue;
      total += 1;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return total;
}

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

export async function ensureAdminAuthSchema() {
  if (shouldUseBlobSessionStore()) {
    await ensureBlobUsersSeed();
    return;
  }

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
      .prepare("SELECT id, role, status, password_hash, mfa_enabled, mfa_secret_enc FROM admin_users WHERE email = ?")
      .get(seed.email) as
      | Pick<AdminUserRecord, "id" | "role" | "status" | "password_hash" | "mfa_enabled" | "mfa_secret_enc">
      | undefined;

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

    if (
      existing.role !== role ||
      existing.status !== status ||
      existing.password_hash !== seed.passwordHash ||
      existing.mfa_enabled !== (shouldEnableMfa ? 1 : 0) ||
      (!existing.mfa_secret_enc && mfaSecretEnc)
    ) {
      db.prepare(
        `UPDATE admin_users
         SET role = @role,
             status = @status,
             password_hash = @password_hash,
             mfa_enabled = @mfa_enabled,
             mfa_secret_enc = COALESCE(@mfa_secret_enc, mfa_secret_enc),
             updated_at = CURRENT_TIMESTAMP
         WHERE email = @email`
      ).run({
        email: seed.email,
        role,
        status,
        password_hash: seed.passwordHash,
        mfa_enabled: shouldEnableMfa ? 1 : 0,
        mfa_secret_enc: mfaSecretEnc
      });
    }
  } finally {
    db.close();
  }
}

export async function findAdminUserByEmail(email: string): Promise<AdminUserRecord | null> {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobUsersStore();
    const normalizedEmail = email.toLowerCase();
    return store.users.find((user) => user.email === normalizedEmail && !user.deleted_at) ?? null;
  }

  await ensureAdminAuthSchema();
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

export async function findAdminUserById(userId: number): Promise<AdminUserRecord | null> {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobUsersStore();
    return store.users.find((user) => user.id === userId && !user.deleted_at) ?? null;
  }

  await ensureAdminAuthSchema();
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

export async function markUserLoginSuccess(userId: number) {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobUsersStore();
    const user = store.users.find((entry) => entry.id === userId && !entry.deleted_at);
    if (!user) return;
    user.last_login_at = nowIso();
    user.updated_at = nowIso();
    await writeBlobUsersStore(store);
    return;
  }

  await ensureAdminAuthSchema();
  const db = openDb();
  try {
    db.prepare("UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(userId);
  } finally {
    db.close();
  }
}

export async function createAdminSessionRecord(input: {
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
  if (shouldUseBlobSessionStore()) {
    await writeBlobAdminSession({
      session_id: input.sessionId,
      user_id: input.userId,
      email: input.email,
      role: input.role,
      mfa_verified: input.mfaVerified ? 1 : 0,
      issued_at: input.issuedAt,
      expires_at: input.expiresAt,
      revoked_at: null,
      last_seen_at: null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null
    });
    return;
  }

  await ensureAdminAuthSchema();
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

export async function isSessionActive(sessionId: string, userId?: number): Promise<boolean> {
  if (shouldUseBlobSessionStore() && userId) {
    const record = await readBlobAdminSession(userId, sessionId);
    if (!record) return false;
    if (record.revoked_at) return false;
    if (record.expires_at < Math.floor(Date.now() / 1000)) return false;

    await writeBlobAdminSession({
      ...record,
      last_seen_at: new Date().toISOString()
    });
    return true;
  }

  await ensureAdminAuthSchema();
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

export async function revokeSessionById(sessionId: string, userId?: number) {
  if (shouldUseBlobSessionStore() && userId) {
    const record = await readBlobAdminSession(userId, sessionId);
    if (!record) return;
    await writeBlobAdminSession({
      ...record,
      revoked_at: new Date().toISOString()
    });
    return;
  }

  await ensureAdminAuthSchema();
  const db = openDb();
  try {
    db.prepare("UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_id = ?").run(sessionId);
  } finally {
    db.close();
  }
}

export async function logAuditEvent(event: AuditEventInput) {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobAuditStore();
    const row: BlobAuditEntry = {
      id: store.next_id++,
      actor_user_id: event.actorUserId ?? null,
      actor_email: event.actorEmail,
      action: event.action,
      target_type: event.targetType,
      target_id: event.targetId,
      metadata_json: event.metadata ? JSON.stringify(event.metadata) : null,
      ip_address: event.ipAddress ?? null,
      user_agent: event.userAgent ?? null,
      created_at: nowIso()
    };
    store.logs.push(row);
    if (store.logs.length > ADMIN_AUDIT_MAX_ENTRIES) {
      store.logs = store.logs.slice(-ADMIN_AUDIT_MAX_ENTRIES);
    }
    await writeBlobAuditStore(store);
    return;
  }

  await ensureAdminAuthSchema();
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

export async function readRecentAuditEvents(limit = 30) {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobAuditStore();
    return [...store.logs]
      .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
      .slice(0, Math.max(1, limit));
  }

  await ensureAdminAuthSchema();
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

export async function listAdminUsers() {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobUsersStore();
    const activeUsers = store.users.filter((user) => !user.deleted_at);
    const withSessions = await Promise.all(
      activeUsers.map(async (user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        force_logout_after: user.force_logout_after,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
        active_sessions: await countActiveBlobSessionsForUser(user.id)
      }))
    );
    return withSessions.sort((a, b) => {
      const rank = (role: AdminRole) => (role === "SUPER_ADMIN" ? 0 : role === "ADMIN" ? 1 : 2);
      const roleDiff = rank(a.role) - rank(b.role);
      if (roleDiff !== 0) return roleDiff;
      return a.email.localeCompare(b.email);
    }) as AdminUserListItem[];
  }

  await ensureAdminAuthSchema();
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

export async function createAdminUser(input: {
  email: string;
  passwordHash: string;
  role: AdminRole;
  status: AccountStatus;
}) {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobUsersStore();
    const normalizedEmail = input.email.toLowerCase();
    if (store.users.some((user) => user.email === normalizedEmail && !user.deleted_at)) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    const now = nowIso();
    const id = store.next_id++;
    store.users.push({
      id,
      email: normalizedEmail,
      password_hash: input.passwordHash,
      role: input.role,
      status: input.status,
      mfa_enabled: 0,
      mfa_secret_enc: null,
      force_logout_after: null,
      deleted_at: null,
      created_at: now,
      updated_at: now,
      last_login_at: null
    });
    await writeBlobUsersStore(store);
    return id;
  }

  await ensureAdminAuthSchema();
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

export async function updateAdminUser(input: {
  userId: number;
  role?: AdminRole;
  status?: AccountStatus;
}) {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobUsersStore();
    const user = store.users.find((entry) => entry.id === input.userId && !entry.deleted_at);
    if (!user) return null;
    if (input.role) user.role = input.role;
    if (input.status) user.status = input.status;
    user.updated_at = nowIso();
    await writeBlobUsersStore(store);
    return user;
  }

  await ensureAdminAuthSchema();
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
      return await findAdminUserById(input.userId);
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

export async function updateAdminUserPassword(userId: number, passwordHash: string) {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobUsersStore();
    const user = store.users.find((entry) => entry.id === userId && !entry.deleted_at);
    if (!user) return false;
    user.password_hash = passwordHash;
    user.updated_at = nowIso();
    await writeBlobUsersStore(store);
    return true;
  }

  await ensureAdminAuthSchema();
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

export async function countActiveSuperAdmins() {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobUsersStore();
    return store.users.filter((user) => !user.deleted_at && user.role === "SUPER_ADMIN").length;
  }

  await ensureAdminAuthSchema();
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

export async function softDeleteAdminUser(userId: number) {
  if (shouldUseBlobSessionStore()) {
    await ensureAdminAuthSchema();
    const store = await readBlobUsersStore();
    const user = store.users.find((entry) => entry.id === userId && !entry.deleted_at);
    if (!user) return false;
    user.status = "suspended";
    user.deleted_at = nowIso();
    user.updated_at = nowIso();
    await writeBlobUsersStore(store);
    try {
      const paths = await listAllUserSessionBlobPaths(userId);
      await Promise.all(paths.map((pathname) => del(pathname)));
    } catch {
      // ignore cleanup failures
    }
    return true;
  }

  await ensureAdminAuthSchema();
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

export async function forceLogoutUserSessions(userId: number) {
  if (shouldUseBlobSessionStore()) {
    try {
      const paths = await listAllUserSessionBlobPaths(userId);
      await Promise.all(paths.map((pathname) => del(pathname)));
    } catch {
      // continue and still force logout by timestamp below
    }
  }

  await ensureAdminAuthSchema();
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
