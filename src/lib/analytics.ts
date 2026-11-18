"use client";

export const CONSENT_KEY = "cpb-consent-v1";
export const CONSENT_EVENT = "cpb:consent";
export const OPEN_PREFS_EVENT = "cpb:open-consent";

export type Consent = { analytics: boolean; at: string };

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean) {
  const value: Consent = { analytics, at: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {}
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  if (!analytics) clearAnalyticsCookies();
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_PREFS_EVENT));
}

function clearAnalyticsCookies() {
  const host = location.hostname;
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name.startsWith("_ga") || name === "_gid") {
      for (const domain of ["", host, "." + host.replace(/^www\./, "")]) {
        document.cookie = `${name}=; Max-Age=0; path=/;${domain ? ` domain=${domain};` : ""}`;
      }
    }
  });
}

type Gtag = (...args: unknown[]) => void;

/**
 * Conversion events. Sent only when the visitor has accepted analytics
 * (gtag only exists after consent).
 *   contact_sent      – contact form delivered
 *   book_link_click   – "Buy the book" clicked
 *   post_read         – a reader got through most of a piece
 */
export function track(name: "contact_sent" | "book_link_click" | "post_read" | "share" | "pick_one" | "shelf_open", params: Record<string, unknown> = {}) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
  if (process.env.NODE_ENV !== "production") (window as unknown as { __cpbEvents?: unknown[] }).__cpbEvents?.push({ name, params });
}
