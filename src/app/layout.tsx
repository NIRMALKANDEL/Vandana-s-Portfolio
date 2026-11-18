import type { Metadata, Viewport } from "next";
import "./globals.css";
import { courier, dmSans, script, serif } from "@/lib/fonts";
import Providers from "@/components/Providers";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, book, site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${site.name} · ${site.author}, poet and storyteller`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author, url: SITE_URL }],
  creator: site.author,
  keywords: ["Vandana Basnet", "poet", "poetry", "short stories", book.title, "BookLeaf Publishing", "commonplace book"],
  openGraph: { type: "website", siteName: site.name, locale: site.locale, url: "/", title: site.name, description: site.description },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
  alternates: { types: { "application/rss+xml": [{ url: "/feed.xml", title: `${site.name} journal` }] } },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
  appleWebApp: { capable: true, title: "Commonplace", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF6EF" },
    { media: "(prefers-color-scheme: dark)", color: "#2c2845" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${courier.variable} ${dmSans.variable} ${script.variable} ${serif.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              url: SITE_URL,
              name: site.name,
              description: site.description,
              inLanguage: "en",
              author: { "@id": `${SITE_URL}/#person` },
            },
            {
              "@context": "https://schema.org",
              "@type": "Person",
              "@id": `${SITE_URL}/#person`,
              name: site.author,
              url: `${SITE_URL}/about`,
              image: `${SITE_URL}${site.portrait.src}`,
              jobTitle: "Poet and writer",
              description: "Poet and storyteller, author of the poetry collection Things I Told the Sky (BookLeaf Publishing, 2025).",
              knowsAbout: ["Poetry", "Short stories", "Creative writing", "Storytelling"],
              ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
            },
          ]}
        />
      </body>
    </html>
  );
}
