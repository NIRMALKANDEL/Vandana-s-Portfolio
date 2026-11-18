import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ContactSection from "@/components/ContactSection";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact ${site.author}`,
  description: `Get in touch with ${site.author} for writing work, readings, collaborations, or to talk about a poem.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <div className="container-cpb pt-2 pb-8 sm:pt-6">
        <Breadcrumbs items={[{ href: "/contact", label: "Contact" }]} />
      </div>
      <ContactSection headingLevel={1} source="contact-page" />
    </>
  );
}
