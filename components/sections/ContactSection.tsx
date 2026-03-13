"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from "react";

import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type ContactSectionProps = {
  contact: SiteContent["contact"];
};

type TurnstileInstance = {
  render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

type FieldType = SiteContent["contact"]["fields"][number];

function FormField({
  field,
  idPrefix,
  subjectOptions,
  value,
  onValueChange
}: {
  field: FieldType;
  idPrefix: string;
  subjectOptions: string[];
  value?: string;
  onValueChange?: (nextValue: string) => void;
}) {
  const fieldId = `${idPrefix}-${field.id}`;
  const isRequired = field.id === "subject" ? false : field.required;
  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onValueChange?.(event.target.value);
  };

  return (
    <div className="grid gap-2">
      <label htmlFor={fieldId} className="font-semibold">
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={fieldId}
          name={field.id}
          required={isRequired}
          rows={5}
          placeholder={field.placeholder}
          value={value}
          onChange={onChange}
          className="w-full rounded-[10px] border border-[rgba(36,27,23,0.2)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text-dark)]"
        />
      ) : field.type === "select" ? (
        <div className="relative">
          <select
            id={fieldId}
            name={field.id}
            required={isRequired}
            className="w-full appearance-none rounded-[10px] border border-[rgba(36,27,23,0.2)] bg-[var(--color-surface)] px-4 py-3 pr-12 text-[var(--color-text-dark)] transition-colors focus:border-[var(--color-accent-amber)] focus:outline-none"
            {...(typeof value === "string" ? { value, onChange } : { defaultValue: "" })}
          >
            <option value="">
              Onderwerp (optioneel)
            </option>
            {subjectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-accent-copper)]"
          >
            ▾
          </span>
        </div>
      ) : (
        <input
          id={fieldId}
          name={field.id}
          type={field.type}
          autoComplete={field.autoComplete}
          placeholder={field.placeholder}
          required={isRequired}
          value={value}
          onChange={onChange}
          className="w-full rounded-[10px] border border-[rgba(36,27,23,0.2)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text-dark)]"
        />
      )}
    </div>
  );
}

export function ContactSection({ contact }: ContactSectionProps) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const turnstileEnabled = turnstileSiteKey.length > 0;
  const sectionRef = useRef<HTMLElement | null>(null);
  const desktopTurnstileRef = useRef<HTMLDivElement | null>(null);
  const mobileTurnstileRef = useRef<HTMLDivElement | null>(null);
  const desktopTurnstileResolverRef = useRef<((token: string) => void) | null>(null);
  const mobileTurnstileResolverRef = useRef<((token: string) => void) | null>(null);

  const [mobileStep, setMobileStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [turnstileActivated, setTurnstileActivated] = useState(false);
  const [turnstileScriptReady, setTurnstileScriptReady] = useState(false);
  const [desktopWidgetId, setDesktopWidgetId] = useState<string | null>(null);
  const [mobileWidgetId, setMobileWidgetId] = useState<string | null>(null);
  const [desktopWidgetVisible, setDesktopWidgetVisible] = useState(false);
  const [mobileWidgetVisible, setMobileWidgetVisible] = useState(false);
  const [mobileFormValues, setMobileFormValues] = useState({
    subject: "",
    name: "",
    email: "",
    phone: "",
    message: "",
    company_reference: ""
  });
  const subjectOptions = contact.subjectOptions ?? [];
  const canRenderDesktopTurnstile = turnstileEnabled && turnstileActivated && turnstileScriptReady;
  const canRenderMobileTurnstile = turnstileEnabled && turnstileActivated && turnstileScriptReady && mobileStep === 2;

  const stepOneFields = useMemo(
    () => contact.fields.filter((field) => field.id !== "message"),
    [contact.fields]
  );
  const messageField = useMemo(
    () => contact.fields.find((field) => field.id === "message"),
    [contact.fields]
  );
  const submittingLabel = (
    <span className="inline-flex items-center gap-2">
      <span className="send-lottie" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      Verzenden...
    </span>
  );
  const fieldLabelMap = useMemo(() => Object.fromEntries(contact.fields.map((field) => [field.id, field.label])), [contact.fields]);

  useEffect(() => {
    if (!turnstileEnabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setTurnstileActivated(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px" }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [turnstileEnabled]);

  useEffect(() => {
    if (!turnstileEnabled || !turnstileActivated) return;
    if (window.turnstile) {
      setTurnstileScriptReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');
    if (existing) {
      const onLoad = () => setTurnstileScriptReady(true);
      existing.addEventListener("load", onLoad);
      return () => existing.removeEventListener("load", onLoad);
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = "true";
    script.addEventListener("load", () => setTurnstileScriptReady(true), { once: true });
    document.head.appendChild(script);
  }, [turnstileEnabled, turnstileActivated]);

  useEffect(() => {
    if (!canRenderDesktopTurnstile || desktopWidgetId || !desktopTurnstileRef.current || !window.turnstile) return;
    const widgetId = window.turnstile.render(desktopTurnstileRef.current, {
      sitekey: turnstileSiteKey,
      theme: "dark",
      language: "nl",
      action: "contact_form_desktop",
      size: "flexible",
      execution: "execute",
      callback: (token: string) => {
        desktopTurnstileResolverRef.current?.(token);
        desktopTurnstileResolverRef.current = null;
      }
    });
    setDesktopWidgetId(widgetId);
    setDesktopWidgetVisible(true);
  }, [canRenderDesktopTurnstile, desktopWidgetId, turnstileSiteKey]);

  useEffect(() => {
    if (!canRenderMobileTurnstile || mobileWidgetId || !mobileTurnstileRef.current || !window.turnstile) return;
    const widgetId = window.turnstile.render(mobileTurnstileRef.current, {
      sitekey: turnstileSiteKey,
      theme: "dark",
      language: "nl",
      action: "contact_form_mobile",
      size: "flexible",
      execution: "execute",
      callback: (token: string) => {
        mobileTurnstileResolverRef.current?.(token);
        mobileTurnstileResolverRef.current = null;
      }
    });
    setMobileWidgetId(widgetId);
    setMobileWidgetVisible(true);
  }, [canRenderMobileTurnstile, mobileWidgetId, turnstileSiteKey]);

  const requestTurnstileToken = async (mode: "mobile" | "desktop") => {
    if (!turnstileEnabled) return "";
    const widgetId = mode === "mobile" ? mobileWidgetId : desktopWidgetId;
    const resolverRef = mode === "mobile" ? mobileTurnstileResolverRef : desktopTurnstileResolverRef;
    const turnstile = window.turnstile;

    if (!widgetId || !turnstile) {
      throw new Error("TURNSTILE_NOT_READY");
    }

    return await new Promise<string>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        resolverRef.current = null;
        reject(new Error("TURNSTILE_TIMEOUT"));
      }, 12000);

      resolverRef.current = (token: string) => {
        window.clearTimeout(timeout);
        resolve(token);
      };

      try {
        turnstile.reset(widgetId);
        turnstile.execute(widgetId);
      } catch {
        window.clearTimeout(timeout);
        resolverRef.current = null;
        reject(new Error("TURNSTILE_EXECUTE_FAILED"));
      }
    });
  };

  const resetTurnstileWidget = (mode: "mobile" | "desktop") => {
    if (!turnstileEnabled || !window.turnstile) return;
    const widgetId = mode === "mobile" ? mobileWidgetId : desktopWidgetId;
    if (!widgetId) return;
    try {
      window.turnstile.reset(widgetId);
    } catch {
      // Ignore reset errors; next submit will request a fresh token.
    }
  };

  const handleNextStep = (event: MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.form;
    if (!form) {
      setMobileStep(2);
      return;
    }

    const isStepOneValid = stepOneFields.every((field) => {
      const input = form.elements.namedItem(field.id) as HTMLInputElement | HTMLSelectElement | null;
      if (!input) return true;
      return input.reportValidity();
    });

    if (isStepOneValid) {
      setMobileStep(2);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    const mode = form.dataset.formMode ?? "desktop";
    let turnstileToken = "";
    if (turnstileEnabled) {
      try {
        turnstileToken = await requestTurnstileToken(mode === "mobile" ? "mobile" : "desktop");
      } catch {
        setSubmitError("Beveiligingscheck: kon niet worden geladen. Probeer het opnieuw.");
        resetTurnstileWidget(mode === "mobile" ? "mobile" : "desktop");
        setIsSubmitting(false);
        return;
      }
    }
    const payload =
      mode === "mobile"
        ? {
            subject: mobileFormValues.subject,
            name: mobileFormValues.name,
            email: mobileFormValues.email,
            phone: mobileFormValues.phone,
            message: mobileFormValues.message,
            company_reference: mobileFormValues.company_reference,
            turnstileToken
          }
        : {
            subject: String(formData.get("subject") ?? ""),
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            phone: String(formData.get("phone") ?? ""),
            message: String(formData.get("message") ?? ""),
            company_reference: String(formData.get("company_reference") ?? ""),
            turnstileToken
          };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: Record<string, string[]>;
      };

      if (!response.ok || !result.ok) {
        if (response.status === 422 && result.fieldErrors) {
          const firstFieldEntry = Object.entries(result.fieldErrors).find(([, errors]) => Array.isArray(errors) && errors.length > 0);
          if (firstFieldEntry) {
            const [fieldKey, errors] = firstFieldEntry;
            const label = fieldKey === "turnstile" ? "Beveiligingscheck" : (fieldLabelMap[fieldKey] ?? fieldKey);
            setSubmitError(`${label}: ${errors[0]}`);
          } else {
            setSubmitError(result.error ?? "Controleer je invoer en probeer opnieuw.");
          }
        } else {
          setSubmitError(result.error ?? "Er ging iets mis. Probeer het opnieuw.");
        }
        resetTurnstileWidget(mode === "mobile" ? "mobile" : "desktop");
        return;
      }

      form.reset();
      setMobileStep(1);
      setMobileFormValues({
        subject: "",
        name: "",
        email: "",
        phone: "",
        message: "",
        company_reference: ""
      });
      setSubmitSuccess("Bedankt, je bericht is verzonden. We reageren zo snel mogelijk.");
      resetTurnstileWidget(mode === "mobile" ? "mobile" : "desktop");
    } catch {
      setSubmitError("Er ging iets mis. Probeer het opnieuw.");
      resetTurnstileWidget(mode === "mobile" ? "mobile" : "desktop");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      aria-labelledby="contact-title"
      className="section-ambient section-ambient-contact bg-[linear-gradient(180deg,#231816_0%,#201613_54%,#1a1412_100%)] py-16"
    >
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Reveal>
          <h2 id="contact-title" className="mb-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
            {contact.title}
          </h2>
          <p className="mb-6 max-w-[64ch]">{contact.intro}</p>
          {contact.intakeHint ? <p className="mb-6 max-w-[64ch] text-sm text-[#d6be9f]">{contact.intakeHint}</p> : null}
        </Reveal>

        <Reveal delayMs={120}>
          <form className="grid max-w-[820px] gap-3 md:hidden" action="#" method="post" onSubmit={handleSubmit} data-form-mode="mobile">
            <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[#d6be9f]">
              <span>Stap {mobileStep} van 2</span>
              <span>{mobileStep === 1 ? "Contact" : "Bericht"}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[rgba(244,233,220,0.2)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent-amber)] transition-all duration-300"
                style={{ width: mobileStep === 1 ? "50%" : "100%" }}
              />
            </div>
            {mobileStep === 1 ? (
              <>
                {stepOneFields.map((field) => (
                  <FormField
                    key={`mobile-${field.id}`}
                    field={field}
                    idPrefix="mobile"
                    subjectOptions={subjectOptions}
                    value={mobileFormValues[field.id]}
                    onValueChange={(nextValue) =>
                      setMobileFormValues((prev) => ({ ...prev, [field.id]: nextValue }))
                    }
                  />
                ))}
                <button
                  type="button"
                  onClick={handleNextStep}
                  data-cta="contact_mobile_next"
                  className="cta-glow mt-2 inline-flex w-full items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-6 py-3 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
                >
                  Volgende stap
                </button>
              </>
            ) : (
              <>
                {messageField ? (
                  <FormField
                    field={messageField}
                    idPrefix="mobile"
                    subjectOptions={subjectOptions}
                    value={mobileFormValues.message}
                    onValueChange={(nextValue) => setMobileFormValues((prev) => ({ ...prev, message: nextValue }))}
                  />
                ) : null}
                {turnstileEnabled && canRenderMobileTurnstile ? (
                  <div className="mt-1 min-h-[74px]">
                    <div className="relative">
                      <div
                        ref={mobileTurnstileRef}
                        className="cf-turnstile"
                        aria-hidden={!mobileWidgetVisible}
                        style={{ opacity: mobileWidgetVisible ? 1 : 0, pointerEvents: mobileWidgetVisible ? "auto" : "none" }}
                      />
                      {!mobileWidgetVisible ? (
                        <p className="absolute inset-0 flex items-center text-xs text-[#d6be9f]">Beveiligingscheck wordt geladen...</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <div className="mt-2 grid gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileStep(1)}
                    className="inline-flex w-full items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-3 text-sm font-semibold transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                  >
                    Terug
                  </button>
                  <button
                    type="submit"
                    data-cta="contact_mobile_submit"
                    disabled={isSubmitting}
                    className="cta-glow inline-flex w-full items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-3 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
                  >
                    {isSubmitting ? submittingLabel : contact.ctaLabel}
                  </button>
                </div>
                {turnstileEnabled && !canRenderMobileTurnstile ? (
                  <div className="mt-1 min-h-[74px]">
                    <p className="text-xs text-[#d6be9f]">Beveiligingscheck wordt geladen...</p>
                  </div>
                ) : null}
              </>
            )}
          </form>

          <form className="hidden max-w-[820px] gap-3 md:grid md:grid-cols-2" action="#" method="post" onSubmit={handleSubmit} data-form-mode="desktop">
            <input
              type="text"
              name="company_reference"
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
              aria-hidden="true"
            />
            {contact.fields.map((field) => (
              <div key={field.id} className={`grid gap-2 ${field.id === "message" ? "md:col-span-2" : ""}`}>
                <FormField field={field} idPrefix="desktop" subjectOptions={subjectOptions} />
              </div>
            ))}
            {turnstileEnabled && canRenderDesktopTurnstile ? (
              <div className="mt-1 min-h-[74px] md:col-span-2">
                <div className="relative">
                  <div
                    ref={desktopTurnstileRef}
                    className="cf-turnstile"
                    aria-hidden={!desktopWidgetVisible}
                    style={{ opacity: desktopWidgetVisible ? 1 : 0, pointerEvents: desktopWidgetVisible ? "auto" : "none" }}
                  />
                  {!desktopWidgetVisible ? (
                    <p className="absolute inset-0 flex items-center text-xs text-[#d6be9f]">Beveiligingscheck wordt geladen...</p>
                  ) : null}
                </div>
              </div>
            ) : null}
            <button
              type="submit"
              data-cta="contact_desktop_submit"
              disabled={isSubmitting}
              className="cta-glow mt-4 inline-flex w-fit items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-6 py-3 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)] focus-visible:bg-[var(--color-accent-copper)] focus-visible:text-[var(--color-text-primary)] md:col-span-2"
            >
              {isSubmitting ? submittingLabel : contact.ctaLabel}
            </button>
            {turnstileEnabled && !canRenderDesktopTurnstile ? (
              <div className="mt-1 min-h-[74px] md:col-span-2">
                <p className="text-xs text-[#d6be9f]">Beveiligingscheck wordt geladen...</p>
              </div>
            ) : null}
          </form>

          {submitError ? (
            <p role="alert" className="mt-3 text-sm text-[#ffb4a8]">
              {submitError}
            </p>
          ) : null}
          {submitSuccess ? (
            <p aria-live="polite" className="mt-3 text-sm text-[#b6efb9]">
              <span aria-hidden="true" className="success-pop">✓</span>
              {submitSuccess}
            </p>
          ) : null}
        </Reveal>

        <Reveal delayMs={200}>
          <p className="mt-4 text-[#e8d5bd]">
            Of mail direct naar{" "}
            <a className="underline" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          </p>
          {contact.responseTimeText ? <p className="mt-2 text-sm text-[#d6be9f]">{contact.responseTimeText}</p> : null}
        </Reveal>
      </div>
    </section>
  );
}
