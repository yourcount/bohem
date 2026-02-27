import type { SessionPayload } from "@/lib/auth/types";

type EdgeSessionPayload = SessionPayload;

function base64UrlToUint8Array(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function verifySessionTokenEdge(token: string | undefined, secret: string): Promise<EdgeSessionPayload | null> {
  if (!token || !secret) return null;

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign"
  ]);
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadPart));
  const expectedSignature = uint8ArrayToBase64Url(new Uint8Array(signatureBytes));
  if (expectedSignature !== signaturePart) return null;

  let payload: EdgeSessionPayload;
  try {
    const decoded = new TextDecoder().decode(base64UrlToUint8Array(payloadPart));
    payload = JSON.parse(decoded) as EdgeSessionPayload;
  } catch {
    return null;
  }

  if (payload.sub !== "admin" || !payload.email || !payload.sid || !payload.uid || !payload.role) return null;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
