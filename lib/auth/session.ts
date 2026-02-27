import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { SESSION_TTL_SECONDS } from "@/lib/auth/constants";
import type { AdminRole, SessionPayload } from "@/lib/auth/types";

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long.");
  }
  return secret;
}

function sign(payloadPart: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadPart).digest("base64url");
}

function signPayload(payload: Record<string, unknown>): string {
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signaturePart = sign(payloadPart, getAuthSecret());
  return `${payloadPart}.${signaturePart}`;
}

function verifyRawToken(token: string | undefined): Record<string, unknown> | null {
  if (!token) return null;

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expectedSig = sign(payloadPart, getAuthSecret());
  const actualSig = Buffer.from(signaturePart, "utf8");
  const expectedSigBuffer = Buffer.from(expectedSig, "utf8");
  if (actualSig.length !== expectedSigBuffer.length) return null;
  if (!timingSafeEqual(actualSig, expectedSigBuffer)) return null;

  try {
    return JSON.parse(base64UrlDecode(payloadPart)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function createSessionToken(input: {
  userId: number;
  email: string;
  role: AdminRole;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: "admin",
    sid: randomUUID(),
    uid: input.userId,
    email: input.email,
    role: input.role,
    iat: now,
    exp: now + SESSION_TTL_SECONDS
  };

  return {
    token: signPayload(payload),
    payload
  };
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  const rawPayload = verifyRawToken(token);
  if (!rawPayload) return null;

  const payload = rawPayload as Partial<SessionPayload>;
  if (payload.sub !== "admin") return null;
  if (!payload.sid || !payload.uid || !payload.email || !payload.role) return null;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload as SessionPayload;
}
