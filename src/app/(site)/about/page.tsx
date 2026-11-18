import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { LavenderSprig, Petal } from "@/components/Flowers";
import ProfileLinks from "@/components/ProfileLinks";
import { book, categories, site } from "@/lib/site";

export const metadata: Metadata = {
  title: `About ${site.author}`,
  description: `${site.author} is a poet and storyteller, author of ${book.title} (${book.publisher}, 2025). About her writing, her book and her studies.`,
  alternates: { canonical: "/about" },
  openGraph: { type: "profile", title: `About ${site.author}`, url: "/about", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.name }] },
};

/** Three index cards pinned to the page, each with a strip of washi tape. */
const CARDS = [
  {
    title: "The writing",
    tilt: -1.6,
    tape: "var(--hp-rose)",
    body: (
      <>
        Micro poetry and long stanzas, short stories and longer worlds, pages written after hours and the odd article. I keep them all here, the way a commonplace book keeps the lines its owner couldn&apos;t bear to lose.
      </>
    ),
    link: { href: "/shelf", label: "Browse the shelf" },
  },
  {
    title: "The book",
    tilt: 1.2,
    tape: "var(--hp-lilac)",
    body: (
      <>
        <em>{book.title}</em> is my first collection, published by {book.publisher} in {book.published}. It was born out of everything I have lived, felt and could not say aloud.
      </>
    ),
    link: { href: "/book", label: "Open the book" },
  },
  {
    title: "Away from the page",
    tilt: -0.8,
    tape: "var(--hp-peach)",
    body: (
      <>
        I&apos;m in the second year of a B.Sc. in Food Science in Raipur, Chhattisgarh, with Psychology as an elective. Studying how people think and feel finds its way into the writing more often than you&apos;d expect.
      </>
    ),
    link: null,
  },
];

export default function AboutPage() {
  return (
    <div className="overflow-x-clip">
      <div className="container-cpb pt-2 sm:pt-6">
        <Breadcrumbs items={[{ href: "/about", label: "About" }]} />
      </div>

      {/* Portrait and introduction */}
      <section className="container-cpb mt-8 flex flex-wrap items-center gap-10 pb-16 sm:mt-12 sm:gap-16 sm:pb-24">
        <div className="about-portrait relative mx-auto flex min-w-0 flex-[0_1_340px] justify-center">
          <span className="about-portrait-glow" aria-hidden="true" />
          <span className="about-petal" style={{ top: 18, left: 8, "--r": "-25deg" } as CSSProperties} aria-hidden="true"><Petal size={26} fill="var(--hp-rose)" /></span>
          <span className="about-petal" style={{ bottom: 64, left: -6, "--r": "40deg" } as CSSProperties} aria-hidden="true"><Petal size={18} fill="var(--hp-lilac)" /></span>
          <span className="about-petal" style={{ top: 70, right: 4, "--r": "15deg" } as CSSProperties} aria-hidden="true"><Petal size={20} fill="var(--hp-peach)" /></span>
          {/* Photo slot: swap public/images/vandana.jpg for a higher-resolution portrait (about 4:5). */}
          <Image
            src={site.portrait.src}
            alt={site.portrait.alt}
            width={280}
            height={350}
            sizes="(max-width: 639px) 240px, 280px"
            priority
            className="relative h-[300px] w-[240px] object-cover sm:h-[350px] sm:w-[280px]"
            style={{ borderRadius: "999px 999px 18px 18px", border: "6px solid var(--paper)", boxShadow: "0 22px 44px -26px rgba(43,45,74,.55)" }}
          />
          <LavenderSprig width={90} height={120} className="absolute -bottom-3 right-2 sm:right-4" style={{ transformOrigin: "20px 120px" }} />
          <span className="about-tag">Raipur · reading, writing, wondering</span>
        </div>

        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4 sm:gap-5">
          <p className="eyebrow">the person behind the pages</p>
          <h1 className="m-0 font-mono text-[clamp(38px,6vw,60px)] font-normal leading-[1.08]">
            Hi, I&apos;m <span className="about-name">{site.authorFirst}</span>
          </h1>
          <p className="m-0 max-w-[600px] text-[18px] text-body">
            I am drawn to the quiet magic of writing, whether I am building worlds from scratch or observing the ones right in front of me. Through fiction, poetry and prose, I love exploring the nuances of people, places and fleeting moments.
          </p>
          <p className="m-0 max-w-[600px] text-[18px] text-body">
            For me, storytelling is both an act of imagination and a way of holding on to real life, beautifully. <em>{book.title}</em> is just the beginning.
          </p>
          <div className="mt-1"><ProfileLinks long /></div>
        </div>
      </section>

      {/* A few lines of hers, set like a page torn from the book */}
      <section className="about-quote" aria-label={`Lines from ${book.title}`}>
        <div className="container-cpb">
          <figure className="m-0 mx-auto max-w-[680px] text-center">
            <span className="about-quote-mark" aria-hidden="true">&ldquo;</span>
            <blockquote className="m-0">
              {book.backPoem.map((l) => (
                <span key={l} className="block">{l}</span>
              ))}
            </blockquote>
            <figcaption className="mt-5 font-mono text-[14px] text-muted">from <Link href="/book">{book.title}</Link></figcaption>
          </figure>
        </div>
      </section>

      {/* Index cards */}
      <section className="container-cpb py-16 sm:py-24" aria-labelledby="about-more">
        <p className="eyebrow mb-2">a little more</p>
        <h2 id="about-more" className="h-section mb-10 sm:mb-14">Three things to know</h2>
        <div className="grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          {CARDS.map((c) => (
            <article key={c.title} className="about-card" style={{ "--tilt": `${c.tilt}deg`, "--tape": c.tape } as CSSProperties}>
              <span className="about-card-tape" aria-hidden="true" />
              <h3 className="m-0 font-mono text-[24px] font-normal text-ink">{c.title}</h3>
              <p className="m-0 text-body">{c.body}</p>
              {c.link && <Link href={c.link.href} className="link-arrow mt-auto">{c.link.label} →</Link>}
            </article>
          ))}
        </div>
      </section>

      {/* Her shelves, as a row of small spines */}
      <section className="container-cpb pb-16 sm:pb-24" aria-labelledby="about-shelves">
        <div className="about-shelfrow">
          <div className="min-w-0 flex-[1_1_260px]">
            <p className="eyebrow mb-2">where to start</p>
            <h2 id="about-shelves" className="m-0 font-mono text-[clamp(26px,3.4vw,32px)] font-normal">Pick a shelf</h2>
          </div>
          <ul className="about-spines" aria-label="Shelves">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/shelf/${c.id}`}
                  className="about-spine"
                  style={{ "--c": c.book.cover, "--t": c.book.ink, "--gd": c.book.gilt, height: Math.round(c.book.height * 0.62) } as CSSProperties}
                >
                  <span>{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* A postcard to write back */}
      <section className="container-cpb pb-20 sm:pb-28">
        <div className="about-postcard">
          <div className="min-w-0 flex-[1_1_320px]">
            <p className="eyebrow mb-2">write back</p>
            <h2 className="m-0 font-mono text-[clamp(26px,3.4vw,34px)] font-normal">Writing work, readings, a chat about a poem?</h2>
            <p className="mt-3 mb-0 text-body">I&apos;m always glad to hear from readers and editors. Leave a note like a bookmark, and I&apos;ll write back.</p>
            <Link href="/contact" className="btn btn-primary mt-6">Leave a note</Link>
          </div>
          <div className="about-stamp" aria-hidden="true">
            <Petal size={40} fill="var(--paper)" />
          </div>
        </div>
      </section>
    </div>
  );
}
