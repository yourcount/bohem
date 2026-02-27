import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/admin-session";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 }) };
  }

  return { session, response: null };
}

export async function requireBackendAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 }) };
  }

  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    return { session: null, response: NextResponse.json({ error: "Geen toegang.", code: "FORBIDDEN" }, { status: 403 }) };
  }

  return { session, response: null };
}

export async function requireSuperAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Niet geautoriseerd.", code: "UNAUTHORIZED" }, { status: 401 }) };
  }

  if (session.role !== "SUPER_ADMIN") {
    return { session: null, response: NextResponse.json({ error: "Geen toegang.", code: "FORBIDDEN" }, { status: 403 }) };
  }

  return { session, response: null };
}
