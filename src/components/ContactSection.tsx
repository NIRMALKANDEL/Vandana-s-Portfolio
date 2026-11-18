import ContactForm from "./ContactForm";
import { site } from "@/lib/site";
import ProfileLinks from "./ProfileLinks";
import { Petal } from "./Flowers";

export default function ContactSection({ headingLevel = 2, source = "home" }: { headingLevel?: 1 | 2; source?: string }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <section id="contact" aria-labelledby="contact-title" className="contactx">
      <span className="contactx-petal is-a" aria-hidden="true"><Petal size={22} /></span>
      <span className="contactx-petal is-b" aria-hidden="true"><Petal size={16} /></span>
      <div className="container-cpb contactx-grid">
        <div className="contactx-intro">
          <p className="eyebrow">write to me</p>
          <H id="contact-title" className="contactx-h">To reach out</H>
          <p className="m-0 text-body">Leave a note like a bookmark: to work together, talk stories, or simply share a hello.</p>
          {site.email && (
            <a href={`mailto:${site.email}`} className="contactx-mail">{site.email}</a>
          )}
          <div className="contactx-elsewhere">
            <p className="m-0 font-mono text-[13px] uppercase tracking-[0.12em] text-muted">Or find me elsewhere</p>
            <ProfileLinks long />
          </div>
        </div>
        <div className="contactx-card">
          <p className="contactx-card-h">Send a note</p>
          <ContactForm source={source} />
        </div>
      </div>
    </section>
  );
}
