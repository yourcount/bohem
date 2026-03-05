import { NextResponse } from "next/server";

import { requireBackendAdmin } from "@/lib/auth/guards";
import { readRecentAuditEvents } from "@/lib/db/admin-auth-db";

export async function GET() {
  const auth = await requireBackendAdmin();
  if (auth.response) return auth.response;

  try {
    const events = (await readRecentAuditEvents(40)).map((event) => ({
      id: event.id,
      actorEmail: event.actor_email,
      action: event.action,
      targetType: event.target_type,
      targetId: event.target_id,
      metadata: event.metadata_json ? JSON.parse(event.metadata_json) : null,
      ipAddress: event.ip_address,
      userAgent: event.user_agent,
      createdAt: event.created_at
    }));

    return NextResponse.json({ ok: true, events }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Audit events laden mislukt.", code: "AUDIT_READ_FAILED" }, { status: 500 });
  }
}
