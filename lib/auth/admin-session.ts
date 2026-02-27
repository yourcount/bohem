import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";
import { findAdminUserById, isSessionActive, revokeSessionById } from "@/lib/db/admin-auth-db";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const parsed = verifySessionToken(token);
  if (!parsed) return null;

  if (!isSessionActive(parsed.sid)) return null;
  const user = findAdminUserById(parsed.uid);
  if (!user || user.status !== "active") return null;
  if (user.force_logout_after) {
    const forcedAfterEpoch = Math.floor(new Date(user.force_logout_after).getTime() / 1000);
    if (Number.isFinite(forcedAfterEpoch) && parsed.iat <= forcedAfterEpoch) {
      revokeSessionById(parsed.sid);
      return null;
    }
  }

  return parsed;
}
