import type { SiteContent } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

type ContactSectionProps = {
  contact: SiteContent["contact"];
};

export function ContactSection({ contact }: ContactSectionProps) {
  return (
    <section id="contact" aria-labelledby="contact-title" className="bg-[linear-gradient(180deg,#211714_0%,#1a1412_100%)] py-16">
      <div className="mx-auto w-full max-w-[1120px] px-6">
        <Reveal>
          <h2 id="contact-title" className="mb-4 font-display text-4xl leading-tight sm:text-5xl">
            {contact.title}
          </h2>
          <p className="mb-6 max-w-[64ch]">{contact.intro}</p>
        </Reveal>

        <Reveal delayMs={120}>
          <form className="grid max-w-[640px] gap-3" action="#" method="post">
            {contact.fields.map((field) => (
              <div key={field.id} className="grid gap-2">
                <label htmlFor={field.id} className="font-semibold">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={field.id}
                    name={field.id}
                    required={field.required}
                    rows={5}
                    className="w-full rounded-[10px] border border-[rgba(36,27,23,0.2)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text-dark)]"
                  />
                ) : (
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    required={field.required}
                    className="w-full rounded-[10px] border border-[rgba(36,27,23,0.2)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text-dark)]"
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              className="inline-flex w-fit items-center justify-center rounded-full border border-transparent bg-[var(--color-accent-amber)] px-6 py-3 text-sm font-bold text-[var(--color-bg-deep)] transition-colors hover:bg-[var(--color-accent-copper)] hover:text-[var(--color-text-primary)] focus-visible:bg-[var(--color-accent-copper)] focus-visible:text-[var(--color-text-primary)]"
            >
              {contact.ctaLabel}
            </button>
          </form>
        </Reveal>

        <Reveal delayMs={200}>
          <p className="mt-4 text-[#e8d5bd]">
            Of mail direct naar <a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
