import { NextResponse } from "next/server";
import FormData from "form-data";
import Mailgun from "mailgun.js";

import { getLiveSiteContent } from "@/lib/content/live-content";
import { getSiteUrl } from "@/lib/seo";
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

function getMailgunConfig() {
  const apiKey = process.env.MAILGUN_API_KEY?.trim() ?? "";
  const domain = process.env.MAILGUN_DOMAIN?.trim() ?? "";
  const fromEmail = process.env.MAILGUN_FROM_EMAIL?.trim() ?? "";
  const fromName = (process.env.MAILGUN_FROM_NAME?.trim() ?? "Bohèm").slice(0, 120);
  const toEmail = process.env.MAILGUN_TO_EMAIL?.trim() ?? "";
  const region = (process.env.MAILGUN_REGION?.trim().toLowerCase() ?? "eu") === "eu" ? "eu" : "us";

  return { apiKey, domain, fromEmail, fromName, toEmail, region };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function tokenReplace(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "");
}

function toHtmlParagraphs(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function parseMailProviderError(error: unknown) {
  const fallback = {
    userMessage: "Je bericht kon niet worden verzonden. Probeer het opnieuw of mail direct naar info@musicbybohem.nl.",
    code: "MAIL_SEND_FAILED",
    status: 502
  } as const;

  if (!error || typeof error !== "object") return fallback;

  const raw = error as {
    status?: number;
    details?: string;
    message?: string;
  };
  const status = Number(raw.status ?? 0);
  const details = String(raw.details ?? raw.message ?? "").toLowerCase();

  if (status === 401 || details.includes("forbidden") || details.includes("unauthorized")) {
    return {
      userMessage: "Mailverzending is geblokkeerd door de mailprovider. Controleer API-sleutel en domeininstellingen.",
      code: "MAIL_PROVIDER_AUTH_FAILED",
      status: 502
    } as const;
  }

  if (
    status === 400 &&
    (details.includes("from") ||
      details.includes("sender") ||
      details.includes("domain") ||
      details.includes("not allowed"))
  ) {
    return {
      userMessage: "Afzenderadres of domein wordt niet geaccepteerd door Mailgun. Controleer MAILGUN_FROM_EMAIL en MAILGUN_DOMAIN.",
      code: "MAIL_PROVIDER_SENDER_INVALID",
      status: 502
    } as const;
  }

  if (status === 429 || details.includes("rate")) {
    return {
      userMessage: "Mailprovider is tijdelijk overbelast. Probeer het over een paar minuten opnieuw.",
      code: "MAIL_PROVIDER_RATE_LIMITED",
      status: 503
    } as const;
  }

  if (status >= 500 && status < 600) {
    return {
      userMessage: "Mailprovider is tijdelijk niet bereikbaar. Probeer het later opnieuw of mail direct naar info@musicbybohem.nl.",
      code: "MAIL_PROVIDER_UNAVAILABLE",
      status: 503
    } as const;
  }

  return fallback;
}

function renderEmailHtml(input: {
  preheader: string;
  title: string;
  intro: string;
  body: string;
  footer: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImageUrl?: string;
  ctas?: Array<{ label: string; href: string }>;
  details?: Array<{ label: string; value: string }>;
}) {
  const detailsRows =
    input.details && input.details.length > 0
      ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border-collapse:separate;border-spacing:0 8px;">
        ${input.details
          .map(
            (item) => `
          <tr>
            <td style="padding:10px 12px;background:#f1e6d6;border:1px solid #e2cfb4;border-radius:10px 0 0 10px;color:#7a5c3d;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(item.label)}</td>
            <td style="padding:10px 12px;background:#fffdf9;border:1px solid #e2cfb4;border-left:0;border-radius:0 10px 10px 0;color:#1f2937;font-size:14px;text-align:right;font-weight:600;">${toHtmlParagraphs(item.value)}</td>
          </tr>
        `
          )
          .join("")}
      </table>
    `
      : "";

  const ctaRows =
    input.ctas && input.ctas.length > 0
      ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;border-collapse:collapse;">
        <tr>
          ${input.ctas
            .map(
              (cta) => `
            <td style="padding:6px 4px;">
              <a href="${escapeHtml(cta.href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#f28b0e;color:#111827;text-decoration:none;font-weight:700;font-size:14px;">
                ${escapeHtml(cta.label)}
              </a>
            </td>
          `
            )
            .join("")}
        </tr>
      </table>
    `
      : "";

  return `
<!doctype html>
<html lang="nl">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
    <style>
      a { color: #8f4f2b !important; }
      a:hover { color: #6f3f24 !important; }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f6efe6;color:#1f2937;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
    <span style="display:none;opacity:0;visibility:hidden;mso-hide:all;height:0;width:0;overflow:hidden;">${escapeHtml(input.preheader)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;background:#f6efe6;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffaf3;border:1px solid #e6d5bd;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(31,41,55,0.12);">
            <tr>
              <td style="padding:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(120deg,#2b2230 0%,#3b2e36 45%,#8f4f2b 100%);">
                  <tr>
                    <td style="padding:24px 24px 20px;">
                      <p style="margin:0 0 6px;color:#f3d7b0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Bohèm</p>
                      <p style="margin:0;color:#fff8ec;font-size:24px;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">${escapeHtml(input.bannerTitle)}</p>
                      <p style="margin:8px 0 0;color:#f8e8cf;font-size:14px;line-height:1.5;">${escapeHtml(input.bannerSubtitle)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${
              input.bannerImageUrl
                ? `
            <tr>
              <td style="padding:0;background:#1f1b21;">
                <img src="${escapeHtml(input.bannerImageUrl)}" alt="Bohèm sfeerbeeld" width="640" style="display:block;width:100%;height:auto;max-height:220px;object-fit:cover;border:0;" />
              </td>
            </tr>
            `
                : ""
            }
            <tr>
              <td style="padding:24px 24px 10px;">
                <h1 style="margin:0;color:#1f2937;font-size:30px;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">${escapeHtml(input.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 10px;color:#374151;font-size:16px;line-height:1.6;">${toHtmlParagraphs(input.intro)}</td>
            </tr>
            <tr>
              <td style="padding:0 24px 10px;color:#4b5563;font-size:15px;line-height:1.6;">${toHtmlParagraphs(input.body)}</td>
            </tr>
            <tr>
              <td style="padding:0 24px;">${detailsRows}</td>
            </tr>
            <tr>
              <td style="padding:8px 24px 10px;">${ctaRows}</td>
            </tr>
            <tr>
              <td style="padding:10px 24px 24px;color:#6b7280;font-size:13px;line-height:1.6;border-top:1px solid #e9ddcc;">
                ${toHtmlParagraphs(input.footer)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

async function sendContactMail(payload: {
  subject: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  const config = getMailgunConfig();
  if (!config.apiKey || !config.domain || !config.fromEmail || !config.toEmail) {
    throw new Error("MAILGUN_NOT_CONFIGURED");
  }

  const mailgun = new Mailgun(FormData);
  const client = mailgun.client({
    username: "api",
    key: config.apiKey,
    ...(config.region === "eu" ? { url: "https://api.eu.mailgun.net" } : {})
  });

  const liveContent = await getLiveSiteContent();
  const siteUrl = getSiteUrl();
  const showsUrl = `${siteUrl}/#shows`;
  const bannerImageUrl = `${siteUrl}${liveContent.hero.image.src.startsWith("/") ? liveContent.hero.image.src : `/${liveContent.hero.image.src}`}`;
  const musicUrl = liveContent.discography?.featuredSingle?.href?.trim() || `${siteUrl}/#discografie`;
  const ctas = [
    { label: "Nieuwe muziek", href: musicUrl },
    { label: "Nieuwe shows", href: showsUrl }
  ];
  const templates = liveContent.contact.emailTemplates;
  const fallbackTemplates = {
    admin: {
      subject: "Nieuwe website-aanvraag: {{subject}}",
      preheader: "Er is een nieuw bericht binnengekomen via het contactformulier.",
      title: "Nieuwe aanvraag via de website",
      intro: "Je hebt een nieuw bericht ontvangen van {{name}}.",
      footer: "Reageer direct op deze e-mail om {{name}} terug te mailen."
    },
    sender: {
      subject: "We hebben je bericht ontvangen — Bohèm",
      preheader: "Dank voor je bericht. We komen snel bij je terug.",
      title: "Dank voor je bericht, {{name}}",
      intro: "We hebben je aanvraag over \"{{subject}}\" goed ontvangen.",
      body: "We reageren meestal binnen 2 werkdagen. Hieronder vind je een kopie van je bericht.",
      footer: "Hartelijke groet,\nBohèm"
    }
  };

  const resolvedTemplates = {
    admin: { ...fallbackTemplates.admin, ...(templates?.admin ?? {}) },
    sender: { ...fallbackTemplates.sender, ...(templates?.sender ?? {}) }
  };

  const tokens: Record<string, string> = {
    subject: payload.subject,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    message: payload.message
  };

  const adminSubject = tokenReplace(resolvedTemplates.admin.subject, tokens).slice(0, 180);
  const senderSubject = tokenReplace(resolvedTemplates.sender.subject, tokens).slice(0, 180);

  const adminText = [
    tokenReplace(resolvedTemplates.admin.title, tokens),
    "",
    tokenReplace(resolvedTemplates.admin.intro, tokens),
    "",
    `Onderwerp: ${payload.subject}`,
    `Naam: ${payload.name}`,
    `E-mail: ${payload.email}`,
    `Telefoon: ${payload.phone}`,
    "",
    "Bericht:",
    payload.message,
    "",
    tokenReplace(resolvedTemplates.admin.footer, tokens)
  ].join("\n");

  const senderText = [
    tokenReplace(resolvedTemplates.sender.title, tokens),
    "",
    tokenReplace(resolvedTemplates.sender.intro, tokens),
    tokenReplace(resolvedTemplates.sender.body, tokens),
    "",
    "Jouw bericht:",
    payload.message,
    "",
    tokenReplace(resolvedTemplates.sender.footer, tokens)
  ].join("\n");

  const adminHtml = renderEmailHtml({
    preheader: tokenReplace(resolvedTemplates.admin.preheader, tokens),
    title: tokenReplace(resolvedTemplates.admin.title, tokens),
    intro: tokenReplace(resolvedTemplates.admin.intro, tokens),
    body: "Overzicht van de aanvraag:",
    footer: tokenReplace(resolvedTemplates.admin.footer, tokens),
    bannerTitle: "Nieuwe aanvraag ontvangen",
    bannerSubtitle: "Via het contactformulier op de website",
    bannerImageUrl,
    ctas,
    details: [
      { label: "Onderwerp", value: payload.subject },
      { label: "Naam", value: payload.name },
      { label: "E-mail", value: payload.email },
      { label: "Telefoon", value: payload.phone },
      { label: "Bericht", value: payload.message }
    ]
  });

  const senderHtml = renderEmailHtml({
    preheader: tokenReplace(resolvedTemplates.sender.preheader, tokens),
    title: tokenReplace(resolvedTemplates.sender.title, tokens),
    intro: tokenReplace(resolvedTemplates.sender.intro, tokens),
    body: tokenReplace(resolvedTemplates.sender.body, tokens),
    footer: tokenReplace(resolvedTemplates.sender.footer, tokens),
    bannerTitle: "Dank voor je bericht",
    bannerSubtitle: "We komen zo snel mogelijk bij je terug.",
    bannerImageUrl,
    ctas,
    details: [{ label: "Jouw bericht", value: payload.message }]
  });

  await client.messages.create(config.domain, {
    from: `${config.fromName} <${config.fromEmail}>`,
    to: [config.toEmail],
    subject: adminSubject,
    text: adminText,
    html: adminHtml,
    "h:Reply-To": payload.email
  });

  try {
    await client.messages.create(config.domain, {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: [payload.email],
      subject: senderSubject,
      text: senderText,
      html: senderHtml,
      "h:Reply-To": config.toEmail
    });
  } catch (error) {
    console.error("Sender confirmation mail failed:", error);
  }
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Ongeldige aanvraagbron.", code: "INVALID_ORIGIN" }, { status: 403 });
  }

  const { ip } = getRequestMeta(request);
  const limiter = await consumeRateLimit(`contact-submit:${ip}`, 8, 10 * 60 * 1000);
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

  try {
    await sendContactMail({ subject, name, email, phone, message });
  } catch (error) {
    if (error instanceof Error && error.message === "MAILGUN_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error: "Mailverzending is nog niet geconfigureerd. Vul de Mailgun-instellingen in de omgeving in.",
          code: "MAIL_NOT_CONFIGURED"
        },
        { status: 503 }
      );
    }

    const parsed = parseMailProviderError(error);
    console.error("Contact mail send failed:", error);
    return NextResponse.json(
      {
        error: parsed.userMessage,
        code: parsed.code
      },
      { status: parsed.status }
    );
  }

  return NextResponse.json({ ok: true, message: "Bericht ontvangen. We reageren zo snel mogelijk." }, { status: 200 });
}
