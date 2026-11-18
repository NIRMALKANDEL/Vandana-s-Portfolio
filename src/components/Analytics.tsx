"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, type Consent } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** Loads Google Analytics 4 only after the visitor accepts analytics cookies. */
export default function Analytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (window as unknown as { __cpbEvents?: unknown[] }).__cpbEvents ??= [];
    setAllowed(!!readConsent()?.analytics);
    const on = (e: Event) => {
      const c = (e as CustomEvent<Consent>).detail;
      setAllowed(c.analytics);
      const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
      if (gtag) gtag("consent", "update", { analytics_storage: c.analytics ? "granted" : "denied" });
    };
    window.addEventListener(CONSENT_EVENT, on);
    return () => window.removeEventListener(CONSENT_EVENT, on);
  }, []);

  if (!GA_ID || !allowed) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
