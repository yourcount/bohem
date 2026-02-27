import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "scrypt";
const DEFAULT_N = 16384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const DEFAULT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64");
  const derivedKey = scryptSync(password, salt, DEFAULT_KEYLEN, {
    N: DEFAULT_N,
    r: DEFAULT_R,
    p: DEFAULT_P
  }).toString("base64");

  return [HASH_PREFIX, DEFAULT_N, DEFAULT_R, DEFAULT_P, DEFAULT_KEYLEN, salt, derivedKey].join("$");
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const parts = passwordHash.split("$");
  if (parts.length !== 7 || parts[0] !== HASH_PREFIX) return false;

  const [, nRaw, rRaw, pRaw, keyLenRaw, salt, expectedHashBase64] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  const keylen = Number(keyLenRaw);

  if (![N, r, p, keylen].every(Number.isFinite)) return false;

  const expectedHash = Buffer.from(expectedHashBase64, "base64");
  const actualHash = scryptSync(password, salt, keylen, { N, r, p });

  if (expectedHash.length !== actualHash.length) return false;
  return timingSafeEqual(expectedHash, actualHash);
}
