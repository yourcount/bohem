"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";

type ConsentCategory = "necessary" | "preferences" | "statistics" | "marketing" | "externalMedia";

type ConsentMap = Record<ConsentCategory, boolean>;

type StoredConsent = {
  version: string;
  decidedAt: string;
  categories: ConsentMap;
};

type CookieConsentContextValue = {
  isReady: boolean;
  hasDecision: boolean;
  consent: ConsentMap;
  hasConsentFor: (category: Exclude<ConsentCategory, "necessary">) => boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (next: Partial<ConsentMap>) => void;
  openPreferences: () => void;
};

const CONSENT_VERSION = "2026-03-05";
const LOCAL_STORAGE_KEY = "bohem_cookie_consent_v1";
const COOKIE_KEY = "bohem_cookie_consent_v1";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const DEFAULT_CONSENT: ConsentMap = {
  necessary: true,
  preferences: false,
  statistics: false,
  marketing: false,
  externalMedia: false
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function parseCookiePayload(raw: string | null | undefined): StoredConsent | null {
  if (!raw) return null;
  const direct = parseStoredConsent(raw);
  if (direct) return direct;
  try {
    return parseStoredConsent(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

function getInitialConsentSnapshot(initialCookieValue?: string | null) {
  const fromProvidedCookie = parseCookiePayload(initialCookieValue);

  if (typeof window === "undefined") {
    return {
      hasDecision: Boolean(fromProvidedCookie),
      consent: fromProvidedCookie?.categories ?? DEFAULT_CONSENT
    };
  }

  const fromLocalStorage = parseStoredConsent(window.localStorage.getItem(LOCAL_STORAGE_KEY));
  const fromCookie = readConsentFromCookie() ?? fromProvidedCookie;
  const restored = fromLocalStorage ?? fromCookie;

  if (restored) {
    return {
      hasDecision: true,
      consent: restored.categories
    };
  }

  return {
    hasDecision: false,
    consent: DEFAULT_CONSENT
  };
}

function parseStoredConsent(raw: string | null): StoredConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (!parsed.categories || typeof parsed.categories !== "object") return null;
    return {
      version: CONSENT_VERSION,
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : new Date().toISOString(),
      categories: {
        necessary: true,
        preferences: Boolean(parsed.categories.preferences),
        statistics: Boolean(parsed.categories.statistics),
        marketing: Boolean(parsed.categories.marketing),
        externalMedia: Boolean(parsed.categories.externalMedia)
      }
    };
  } catch {
    return null;
  }
}

function readConsentFromCookie(): StoredConsent | null {
  if (typeof document === "undefined") return null;
  const cookieValue = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${COOKIE_KEY}=`))
    ?.slice(COOKIE_KEY.length + 1);
  if (!cookieValue) return null;
  try {
    return parseStoredConsent(decodeURIComponent(cookieValue));
  } catch {
    return null;
  }
}

function persistConsent(next: StoredConsent) {
  if (typeof window === "undefined") return;
  const encoded = JSON.stringify(next);
  window.localStorage.setItem(LOCAL_STORAGE_KEY, encoded);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(encoded)}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

export function CookieConsentProvider({
  children,
  initialCookieValue
}: {
  children: React.ReactNode;
  initialCookieValue?: string | null;
}) {
  const isReady = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const [initialSnapshot] = useState(() => getInitialConsentSnapshot(initialCookieValue));
  const [hasDecision, setHasDecision] = useState(initialSnapshot.hasDecision);
  const [consent, setConsent] = useState<ConsentMap>(initialSnapshot.consent);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentMap>(() =>
    initialSnapshot.hasDecision
      ? initialSnapshot.consent
      : {
          ...DEFAULT_CONSENT,
          externalMedia: true
        }
  );

  useEffect(() => {
    const open = () => {
      setDraft(consent);
      setIsPanelOpen(true);
      setIsDetailsOpen(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("bohem:open-cookie-settings", open as EventListener);
      return () => window.removeEventListener("bohem:open-cookie-settings", open as EventListener);
    }
  }, [consent]);

  const save = (nextConsent: ConsentMap) => {
    const payload: StoredConsent = {
      version: CONSENT_VERSION,
      decidedAt: new Date().toISOString(),
      categories: {
        ...nextConsent,
        necessary: true
      }
    };
    persistConsent(payload);
    setConsent(payload.categories);
    setDraft(payload.categories);
    setHasDecision(true);
    setIsPanelOpen(false);
    setIsDetailsOpen(false);
  };

  const value: CookieConsentContextValue = {
    isReady,
    hasDecision,
    consent,
    hasConsentFor: (category) => Boolean(consent[category]),
    acceptAll: () =>
      save({
        necessary: true,
        preferences: true,
        statistics: true,
        marketing: true,
        externalMedia: true
      }),
    rejectAll: () =>
      save({
        necessary: true,
        preferences: false,
        statistics: false,
        marketing: false,
        externalMedia: false
      }),
    savePreferences: (next) =>
      save({
        ...consent,
        ...next,
        necessary: true
      }),
    openPreferences: () => {
      setDraft(consent);
      setIsPanelOpen(true);
      setIsDetailsOpen(true);
    }
  };

  const shouldShowBanner = !hasDecision || isPanelOpen;

  return (
    <CookieConsentContext.Provider value={value}>
      {children}

      {isReady && !shouldShowBanner ? (
        <button
          type="button"
          onClick={() => value.openPreferences()}
          className="cookie-manage-btn"
          aria-label="Cookie-instellingen openen"
          title="Cookie-instellingen"
        >
          <span aria-hidden="true" className="cookie-manage-icon">◍</span>
        </button>
      ) : null}

      {isReady && shouldShowBanner ? (
        <aside className="cookie-banner" role="dialog" aria-modal="true" aria-label="Cookievoorkeuren">
          <div className="cookie-banner-inner">
            <h2 className="cookie-title">Cookies op deze website</h2>
            <p className="cookie-copy">
              We gebruiken alleen noodzakelijke cookies zonder toestemming. Voor externe media (zoals Spotify), statistieken en marketing vragen we
              eerst je toestemming. Je keuze geldt 6 maanden en je kunt deze altijd aanpassen.
            </p>

            {isDetailsOpen ? (
              <div className="cookie-categories">
                <label className="cookie-row">
                  <span>
                    <strong>Noodzakelijk</strong>
                    <small>Altijd actief voor basisfunctionaliteit en beveiliging.</small>
                  </span>
                  <input type="checkbox" checked disabled aria-label="Noodzakelijke cookies altijd actief" />
                </label>

                <label className="cookie-row">
                  <span>
                    <strong>Voorkeuren</strong>
                    <small>Onthoudt interface-instellingen.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft.preferences}
                    onChange={(event) => setDraft((prev) => ({ ...prev, preferences: event.target.checked }))}
                    aria-label="Voorkeurencookies toestaan"
                  />
                </label>

                <label className="cookie-row">
                  <span>
                    <strong>Statistieken</strong>
                    <small>Helpt ons de website te verbeteren met geanonimiseerde data.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft.statistics}
                    onChange={(event) => setDraft((prev) => ({ ...prev, statistics: event.target.checked }))}
                    aria-label="Statistiekcookies toestaan"
                  />
                </label>

                <label className="cookie-row">
                  <span>
                    <strong>Marketing</strong>
                    <small>Voor externe campagnes en tracking.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft.marketing}
                    onChange={(event) => setDraft((prev) => ({ ...prev, marketing: event.target.checked }))}
                    aria-label="Marketingcookies toestaan"
                  />
                </label>

                <label className="cookie-row">
                  <span>
                    <strong>Externe media</strong>
                    <small>Nodig om Spotify-embeds te laden.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft.externalMedia}
                    onChange={(event) => setDraft((prev) => ({ ...prev, externalMedia: event.target.checked }))}
                    aria-label="Externe media cookies toestaan"
                  />
                </label>
              </div>
            ) : null}

            <div className="cookie-actions">
              <button type="button" className="cookie-btn cookie-btn-secondary" onClick={() => value.rejectAll()}>
                Alles weigeren
              </button>
              <button type="button" className="cookie-btn cookie-btn-secondary" onClick={() => value.acceptAll()}>
                Alles accepteren
              </button>
              {!isDetailsOpen ? (
                <button type="button" className="cookie-btn cookie-btn-secondary" onClick={() => setIsDetailsOpen(true)}>
                  Instellingen aanpassen
                </button>
              ) : null}
              <button
                type="button"
                className="cookie-btn cookie-btn-primary"
                onClick={() =>
                  value.savePreferences({
                    preferences: draft.preferences,
                    statistics: draft.statistics,
                    marketing: draft.marketing,
                    externalMedia: draft.externalMedia
                  })
                }
              >
                Voorkeuren opslaan
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent moet binnen CookieConsentProvider gebruikt worden.");
  }
  return context;
}
