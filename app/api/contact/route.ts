import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getRequestMeta } from "@/lib/security/request";

type ContactPayload = {
  subject?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  company_website?: string;
};

function sanitize(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige aanvraagbron.", code: "INVALID_ORIGIN" }, { status: 403 });
  }

  const { ip } = getRequestMeta(request);
  const limiter = consumeRateLimit(`contact-submit:${ip}`, 8, 10 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Te veel aanvragen. Probeer over enkele minuten opnieuw.", code: "RATE_LIMITED" }, { status: 429 });
  }

  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag.", code: "INVALID_BODY" }, { status: 400 });
  }

  const companyWebsite = sanitize(body.company_website);

  // Honeypot: bots krijgen een succesvolle response zonder verwerking.
  if (companyWebsite) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const subject = sanitize(body.subject);
  const name = sanitize(body.name);
  const email = sanitize(body.email).toLowerCase();
  const phone = sanitize(body.phone);
  const message = sanitize(body.message);

  const fieldErrors: Record<string, string[]> = {};

  if (!subject) fieldErrors.subject = ["Kies een onderwerp."];
  if (!name || name.length < 2) fieldErrors.name = ["Vul een geldige naam in."];
  if (!isValidEmail(email)) fieldErrors.email = ["Vul een geldig e-mailadres in."];
  if (!phone || phone.length < 6) fieldErrors.phone = ["Vul een geldig telefoonnummer in."];
  if (!message || message.length < 8) fieldErrors.message = ["Bericht is te kort."];
  if (message.length > 2000) fieldErrors.message = ["Bericht is te lang (max 2000 tekens)."];

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Controleer de velden en probeer opnieuw.", code: "VALIDATION_ERROR", fieldErrors }, { status: 422 });
  }

  return NextResponse.json({ ok: true, message: "Bericht ontvangen. We reageren zo snel mogelijk." }, { status: 200 });
}

