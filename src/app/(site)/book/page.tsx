import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookCover from "@/components/home/BookCover";
import BuyButton from "@/components/BuyButton";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, book, site } from "@/lib/site";
import { bookSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: `${book.title} — poetry by ${site.author}`,
  description: `${book.title} is ${site.author}'s debut poetry collection, published by ${book.publisher} in ${book.published}. ISBN ${book.isbn}.`,
  alternates: { canonical: "/book" },
  openGraph: { type: "book", title: book.title, url: "/book", images: [{ url: book.cover.src, width: 531, height: 854, alt: book.cover.alt }] },
};

export default function BookPage() {
  const facts = [
    ["Author", site.author],
    ["Genre", book.genre],
    ["Publisher", book.publisher],
    ["Published", book.published],
    ["ISBN", book.isbn],
    ["Language", "English"],
  ];
  return (
    <>
      <div className="container-cpb pt-2 sm:pt-6">
        <Breadcrumbs items={[{ href: "/book", label: book.title }]} />
      </div>
      <section style={{ background: "var(--bookband)" }} className="mt-8">
        <div className="container-cpb flex flex-wrap items-center gap-12 py-16 sm:gap-16 sm:py-20">
          <div className="mx-auto flex min-w-0 flex-[0_1_380px] justify-center">
            <BookCover priority />
          </div>
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[18px]">
            <p className="eyebrow">my first published book</p>
            <h1 className="m-0 font-mono text-[clamp(36px,6vw,56px)] font-normal leading-[1.1]">{book.title}</h1>
            <p className="m-0 font-mono text-[15px]" style={{ color: "var(--tag-lt)" }}>{book.genre} · {book.publisher} · {book.published}</p>
            <p className="m-0 max-w-[540px] text-[18px] text-body">{book.blurb}</p>
            <div className="flex flex-wrap gap-3.5">
              <BuyButton placement="book-page" />
              <BuyButton placement="book-page" format="ebook" />
              <Link href="/shelf/long-stanzas" className="btn btn-ghost">Read more poems</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-cpb grid gap-14 py-20 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
        <div className="flex flex-col gap-5">
          <h2 className="h-section">From the back cover</h2>
          <blockquote className="m-0 border-l-2 pl-5 font-mono text-[19px] italic leading-[1.8]" style={{ borderColor: "var(--petal2)" }}>
            {book.backPoem.map((l) => <span key={l} className="block">{l}</span>)}
          </blockquote>
          <h3 className="mt-6 mb-0 font-mono text-[22px] font-normal">About the author</h3>
          <p className="m-0 text-body">
            {site.author} writes to capture and preserve moments, people, places and emotions in the language of poetry. For her, words are a way of holding on to what the heart cannot let go of, turning memories into verses that live forever. <em>{book.title}</em> is her first collection, born out of everything she has lived, felt and could not say aloud.
          </p>
          <dl className="m-0 mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[16px]">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-mono text-muted">{k}</dt>
                <dd className="m-0">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-8">
          <figure className="m-0">
            <Image src={book.backCover.src} alt={book.backCover.alt} width={536} height={842} sizes="(max-width: 700px) 90vw, 420px" className="h-auto w-full max-w-[420px] rounded-lg border border-card" loading="lazy" />
            <figcaption className="mt-3 text-[14px] text-muted">The back cover, with the poem and bio.</figcaption>
          </figure>
          <figure className="m-0">
            <Image src={book.certificate.src} alt={book.certificate.alt} width={1366} height={1472} sizes="(max-width: 700px) 90vw, 420px" className="h-auto w-full max-w-[420px] rounded-lg border border-card" loading="lazy" />
            <figcaption className="mt-3 text-[14px] text-muted">Certificate of publication, {book.publisher}.</figcaption>
          </figure>
        </div>
      </section>
      <JsonLd data={bookSchema(SITE_URL)} />
    </>
  );
}
