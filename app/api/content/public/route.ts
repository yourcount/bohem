import { NextResponse } from "next/server";

import { contentDbExists, getDbPath, readPublicContent } from "@/lib/db/content-db";
import { validatePublicContent } from "@/lib/content/public-content";

export async function GET() {
  if (!contentDbExists()) {
    return NextResponse.json(
      {
        error: "Database niet gevonden. Voer migratie en seed uit.",
        code: "DB_UNAVAILABLE",
        dbPath: getDbPath()
      },
      { status: 500 }
    );
  }

  let row;
  try {
    row = readPublicContent();
  } catch {
    return NextResponse.json(
      {
        error: "Kon content niet ophalen uit database.",
        code: "DB_READ_FAILED"
      },
      { status: 500 }
    );
  }

  const parsed = validatePublicContent(row);
  if (!parsed.ok) {
    if (parsed.issues.includes("CONTENT_NOT_FOUND")) {
      return NextResponse.json(
        {
          error: "Geen publieke content gevonden.",
          code: "CONTENT_NOT_FOUND"
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: "Content in database is ongeldig.",
        code: "CONTENT_INVALID",
        fields: parsed.issues
      },
      { status: 500 }
    );
  }

  return NextResponse.json(parsed.data, { status: 200 });
}
