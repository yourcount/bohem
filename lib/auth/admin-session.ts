import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";
import { findAdminUserById, isSessionActive, revokeSessionById } from "@/lib/db/admin-auth-db";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const parsed = verifySessionToken(token);
  if (!parsed) return null;

  try {
    if (!(await isSessionActive(parsed.sid, parsed.uid))) return null;
    const user = await findAdminUserById(parsed.uid);
    if (!user) return null;
    if (user.status !== "active") return null;
    if (user.force_logout_after) {
      const forcedAfterEpoch = Math.floor(new Date(user.force_logout_after).getTime() / 1000);
      if (Number.isFinite(forcedAfterEpoch) && parsed.iat <= forcedAfterEpoch) {
        await revokeSessionById(parsed.sid, parsed.uid);
        return null;
      }
    }

    return parsed;
  } catch {
    try {
      await revokeSessionById(parsed.sid, parsed.uid);
    } catch {
      // ignore cleanup failures
    }
    return null;
  }
}
