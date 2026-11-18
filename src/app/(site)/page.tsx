import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Typewriter from "@/components/home/Typewriter";
import Shelf from "@/components/home/Shelf";
import BookCover from "@/components/home/BookCover";
import BuyButton from "@/components/BuyButton";
import Reveal from "@/components/Reveal";
import ContactSection from "@/components/ContactSection";
import BioText from "@/components/BioText";
import JsonLd from "@/components/JsonLd";
import { LavenderSprig } from "@/components/Flowers";
import { HeroPetals, InkName } from "@/components/home/HeroArt";
import { EmptyState, PostcardGrid, WorkCard } from "@/components/Cards";
import { categoryCounts, listPublicPosts, selectedWriting, shelfPicks } from "@/lib/posts";
import { SITE_URL, book, site } from "@/lib/site";
import { bookSchema } from "@/lib/schema";

export const revalidate = 300;

const RIBBON = ["Poetry", "Fiction", "Storytelling", "Short stories", "Published author"];


export const metadata: Metadata = {
  title: { absolute: `${site.name} · ${site.author}, poet and storyteller` },
  description: site.description,
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [counts, selected, posts, picks] = await Promise.all([categoryCounts(), selectedWriting(), listPublicPosts(), shelfPicks()]);
  const latest = posts.slice(0, 4);

  return (
    <>
      {/* Hero: petals fall and press into place, her name is drawn in ink, then the typewriter */}
      <section id="top" className="hero-sky relative overflow-hidden">
        <HeroPetals />
        <div className="container-cpb relative flex min-h-[min(78svh,600px)] flex-col items-center justify-center gap-3 py-12 text-center sm:min-h-[min(86svh,760px)] sm:gap-4 sm:py-24">
          <h1 className="m-0 w-full max-w-[720px] font-normal">
            <span className="sr-only">{site.name}, a living archive by {site.author}: poems, stories and imagined worlds</span>
            <InkName name={site.name} />
          </h1>
          <p className="eyebrow hero-kick m-0">a living archive</p>
          <p className="hero-by m-0">By {site.author}</p>
          <Typewriter />
          <p className="hero-fade m-0 mt-2 max-w-[540px] text-[17px] text-body sm:text-[19px]">
            Through poetry and stories, I sometimes write to capture people and moments, and at other times, to create them.
          </p>
          <div className="hero-fade mt-3 flex flex-wrap justify-center gap-3.5">
            <Link href="/journal" className="btn btn-primary">Read the latest</Link>
            <Link href="/book" className="btn btn-ghost">About the book</Link>
          </div>
        </div>
      </section>

      {/* Ribbon: a slow, endless marquee (pauses on hover, still for reduced motion) */}
      <section aria-label="What I write" className="ribbon" style={{ background: "var(--strip)", color: "var(--strip-text)" }}>
        <div className="ribbon-track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="ribbon-list" aria-hidden={copy === 1 ? true : undefined}>
              {[...RIBBON, ...RIBBON].map((s, i) => (
                <li key={i}>
                  <span>{s}</span>
                  <span className="ribbon-dot" aria-hidden="true" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* Shelf */}
      <section id="shelf" className="container-cpb pt-12 pb-10 sm:pt-24 sm:pb-[72px]">
        <Shelf counts={counts} picks={picks} />
      </section>

      {/* Book */}
      <section id="book" style={{ background: "var(--bookband)" }} aria-labelledby="book-title">
        <Reveal className="container-cpb flex flex-wrap items-center gap-6 py-12 sm:gap-16 sm:py-24">
          <div className="mx-auto flex min-w-0 flex-none justify-center">
            <BookCover />
          </div>
          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3 sm:gap-[18px]">
            <p className="eyebrow">my first published book</p>
            <h2 id="book-title" className="h-section">{book.title}</h2>
            <p className="m-0 font-mono text-[15px]" style={{ color: "var(--tag-lt)" }}>{book.genre} · {book.publisher} · {book.published}</p>
            <p className="m-0 max-w-[520px] text-body">{book.blurb}</p>
            <p className="m-0 text-[14px] text-muted">ISBN {book.isbn}</p>
            <div className="book-actions">
              <BuyButton placement="home" className="btn btn-primary btn-sm" />
              <Link href="/book" className="btn btn-ghost btn-sm">About the book</Link>
              <BuyButton placement="home" format="ebook" className="btn btn-ghost btn-sm" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Selected writing */}
      <Reveal as="section" id="work" className="container-cpb py-12 sm:py-24">
        <h2 className="h-section mb-6 sm:mb-10">A few pages I&apos;d hand you first</h2>
        <div className="m-rail grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
          {selected.map((s) => (
            <WorkCard key={s.cat} post={s.post} cat={s.cat} />
          ))}
        </div>
      </Reveal>

      {/* Journal */}
      <section id="journal" style={{ background: "var(--jband)" }} className="overflow-x-clip">
        <Reveal className="container-cpb py-12 sm:py-24">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 sm:mb-10">
            <h2 className="h-section">Postcards from the week</h2>
            <Link href="/journal" className="link-arrow">All entries →</Link>
          </div>
          {latest.length ? (
            <PostcardGrid posts={latest} />
          ) : (
            <EmptyState title="The first postcard is being written">New pages arrive here as soon as they&apos;re published.</EmptyState>
          )}
        </Reveal>
      </section>

      {/* About */}
      <Reveal as="section" id="about" className="container-cpb flex flex-wrap items-center gap-6 py-12 sm:gap-16 sm:py-24">
        <div className="relative mx-auto flex min-w-0 flex-[0_1_320px] justify-center">
          <Image
            src={site.portrait.src}
            alt={site.portrait.alt}
            width={260}
            height={320}
            sizes="260px"
            className="h-[220px] w-[180px] object-cover sm:h-[320px] sm:w-[260px]"
            style={{ borderRadius: "999px 999px 16px 16px", background: "var(--tint-long-stanzas)" }}
          />
          <LavenderSprig width={70} height={94} className="absolute -bottom-2.5 right-[calc(50%-130px)] sm:right-0" style={{ transformOrigin: "20px 120px", animationDuration: "8s" }} />
        </div>
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3 text-center sm:gap-[18px] sm:text-left">
          <h2 className="h-section">Hi, I&apos;m {site.authorFirst}</h2>
          <BioText className="mx-auto sm:mx-0">
            I am drawn to the quiet magic of writing, whether I am building worlds from scratch or observing the ones right in front of me. Through fiction, poetry and prose, I love exploring the nuances of people, places and fleeting moments. For me, storytelling is both an act of imagination and a way of holding on to real life, beautifully. <em>{book.title}</em> is just the beginning.
          </BioText>
          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:justify-start">
            <Link href="/about" className="btn btn-ghost">More about me</Link>
            <span className="flex items-center gap-2 text-[14px] text-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6" /><path d="M8.5 14 7 22l5-3 5 3-1.5-8" /></svg>
              Published by BookLeaf, 2025
            </span>
          </div>
        </div>
      </Reveal>

      <ContactSection source="home" />

      <JsonLd data={bookSchema(SITE_URL)} />
    </>
  );
}
