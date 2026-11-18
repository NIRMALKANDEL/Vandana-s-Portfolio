import ContactForm from "./ContactForm";
import { site } from "@/lib/site";
import ProfileLinks from "./ProfileLinks";

export default function ContactSection({ headingLevel = 2, source = "home" }: { headingLevel?: 1 | 2; source?: string }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <section id="contact" aria-labelledby="contact-title" style={{ background: "var(--strip)" }}>
      <div className="container-cpb flex flex-wrap gap-6 py-12 sm:gap-12 sm:py-24">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3 sm:gap-[18px]">
          <H id="contact-title" className="h-section">To reach out</H>
          <p className="m-0 text-body">Leave a note like a bookmark: to work together, talk stories, or simply share a hello.</p>
          {site.email && (
            <a href={`mailto:${site.email}`} className="font-mono text-[18px] break-all">{site.email}</a>
          )}
          <div className="mt-2 flex flex-col gap-2.5">
            <p className="m-0 font-mono text-[13px] uppercase tracking-[0.12em] text-muted">Or find me elsewhere</p>
            <ProfileLinks long />
          </div>
        </div>
        <ContactForm source={source} />
      </div>
    </section>
  );
}
