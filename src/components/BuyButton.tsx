"use client";

import { book } from "@/lib/site";
import { track } from "@/lib/analytics";

const FORMATS = {
  paperback: { href: book.buyUrl, label: "Paperback", store: "Flipkart", cls: "btn btn-primary" },
  ebook: { href: book.ebookUrl, label: "E-book", store: "BookLeaf eBooks", cls: "btn btn-ghost" },
};

/** Where to buy the book: the paperback (Flipkart) or the e-book (BookLeaf). Both open in a new tab. */
export default function BuyButton({ placement, format = "paperback", className }: { placement: string; format?: keyof typeof FORMATS; className?: string }) {
  const f = FORMATS[format];
  return (
    <a
      href={f.href}
      target="_blank"
      rel="noopener noreferrer"
      className={className || f.cls}
      onClick={() => track("book_link_click", { placement, format, isbn: book.isbn })}
    >
      {f.label}
      <span className="sr-only"> (opens {f.store} in a new tab)</span>
    </a>
  );
}
