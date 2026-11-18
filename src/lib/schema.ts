import { book, site } from "./site";
import type { Post } from "./types";
import { categoryById } from "./site";
import { wordCount } from "./utils";

export function bookSchema(base: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${base}/book#book`,
    name: book.title,
    author: { "@type": "Person", "@id": `${base}/#person`, name: site.author },
    bookFormat: "https://schema.org/Paperback",
    genre: book.genre,
    inLanguage: "en",
    isbn: book.isbn,
    datePublished: book.datePublished,
    publisher: { "@type": "Organization", name: book.publisher },
    image: `${base}${book.cover.src}`,
    url: `${base}/book`,
    description: book.blurb,
    offers: { "@type": "Offer", url: book.buyUrl, availability: "https://schema.org/InStock", priceCurrency: "INR" },
  };
}

export function blogPostingSchema(post: Post, base: string) {
  const url = `${base}/journal/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#post`,
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    datePublished: post.publishAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", "@id": `${base}/#person`, name: site.author, url: `${base}/about` },
    publisher: { "@type": "Person", "@id": `${base}/#person`, name: site.author },
    image: `${base}/og/${post.slug}`,
    articleSection: categoryById(post.category)?.title,
    genre: categoryById(post.category)?.title,
    wordCount: wordCount(post.body),
    inLanguage: "en",
    isPartOf: { "@id": `${base}/#website` },
  };
}
