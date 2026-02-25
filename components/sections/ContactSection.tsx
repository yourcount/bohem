"use client";

import { useMemo, useState, type MouseEvent } from "react";

import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

type ContactSectionProps = {
  contact: SiteContent["contact"];
};

type FieldType = SiteContent["contact"]["fields"][number];

function FormField({
  field,
  idPrefix,
  subjectOptions
}: {
  field: FieldType;
  idPrefix: string;
  subjectOptions: string[];
}) {
  const fieldId = `${idPrefix}-${field.id}`;

  return (
    <div className="grid gap-2">
      <label htmlFor={fieldId} className="font-semibold">
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={fieldId}
          name={field.id}
          required={field.required}
          rows={5}
          className="w-full rounded-[10px] border border-[rgba(36,27,23,0.2)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text-dark)]"
        />
      ) : field.type === "select" ? (
        <div className="relative">
          <select
            id={fieldId}
            name={field.id}
            required={field.required}
            className="w-full appearance-none rounded-[10px] border border-[rgba(36,27,23,0.2)] bg-[var(--color-surface)] px-4 py-3 pr-12 text-[var(--color-text-dark)] transition-colors focus:border-[var(--color-accent-amber)] focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              Kies een onderwerp
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
          required={field.required}
          className="w-full rounded-[10px] border border-[rgba(36,27,23,0.2)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text-dark)]"
        />
      )}
    </div>
  );
}

export function ContactSection({ contact }: ContactSectionProps) {
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);
  const subjectOptions = contact.subjectOptions ?? [];

  const stepOneFields = useMemo(
    () => contact.fields.filter((field) => field.id !== "message"),
    [contact.fields]
  );
  const messageField = useMemo(
    () => contact.fields.find((field) => field.id === "message"),
    [contact.fields]
  );

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

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="section-ambient section-ambient-contact bg-[linear-gradient(180deg,#221816_0%,#1d1513_55%,#1a1412_100%)] py-16"
    >
      <div className="mx-auto w-full max-w-[1120px] px-6">
        <Reveal>
          <h2 id="contact-title" className="mb-4 font-display text-4xl leading-tight sm:text-5xl">
            {contact.title}
          </h2>
          <p className="mb-6 max-w-[64ch]">{contact.intro}</p>
        </Reveal>

        <Reveal delayMs={120}>
          <form className="grid max-w-[820px] gap-3 md:hidden" action="#" method="post">
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
                  <FormField key={`mobile-${field.id}`} field={field} idPrefix="mobile" subjectOptions={subjectOptions} />
                ))}
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-6 py-3 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
                >
                  Volgende stap
                </button>
              </>
            ) : (
              <>
                {messageField ? <FormField field={messageField} idPrefix="mobile" subjectOptions={subjectOptions} /> : null}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileStep(1)}
                    className="inline-flex w-1/2 items-center justify-center rounded-full border border-[var(--color-line-muted)] px-5 py-3 text-sm font-semibold transition-colors hover:bg-[rgba(244,233,220,0.08)]"
                  >
                    Terug
                  </button>
                  <button
                    type="submit"
                    className="inline-flex w-1/2 items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-5 py-3 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)]"
                  >
                    {contact.ctaLabel}
                  </button>
                </div>
              </>
            )}
          </form>

          <form className="hidden max-w-[820px] gap-3 md:grid md:grid-cols-2" action="#" method="post">
            {contact.fields.map((field) => (
              <div key={field.id} className={`grid gap-2 ${field.id === "message" ? "md:col-span-2" : ""}`}>
                <FormField field={field} idPrefix="desktop" subjectOptions={subjectOptions} />
              </div>
            ))}
            <button
              type="submit"
              className="mt-4 inline-flex w-fit items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-6 py-3 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)] focus-visible:bg-[var(--color-accent-copper)] focus-visible:text-[var(--color-text-primary)] md:col-span-2"
            >
              {contact.ctaLabel}
            </button>
          </form>
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
