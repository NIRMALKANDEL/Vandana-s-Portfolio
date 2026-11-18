"use client";

import Image from "next/image";
import { useState } from "react";
import { book } from "@/lib/site";
import { Petal } from "../Flowers";

/**
 * The real cover. It opens all the way like a real book (hover, tap or Enter): the cover swings
 * over to the left showing its inside, the whole spread slides to stay centred, and the
 * back-cover poem sits on the right-hand page with nothing hidden behind the cover.
 */
export default function BookCover({ priority = false }: { priority?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      {/* The stage is two book-widths wide so the open spread always fits. */}
      <div className="book-stage">
        <button
          type="button"
          className={`book3d ${open ? "isopen" : ""}`}
          aria-pressed={open}
          aria-label={open ? "Close the book" : "Open the book to read the poem on the back"}
          onClick={() => setOpen((o) => !o)}
          data-testid="book-cover"
        >
          <span className="bbook">
            <span className="bpage">
              {book.backPoem.map((l) => (
                <span key={l}>{l}</span>
              ))}
              <span className="mt-3 text-[0.82em] not-italic text-muted">— from {book.title}</span>
            </span>
            <span className="bcover">
              <Image
                src={book.cover.src}
                alt={book.cover.alt}
                width={531}
                height={854}
                sizes="(max-width: 639px) 168px, 260px"
                priority={priority}
                className="bface h-full w-full object-cover"
              />
              <span className="bface binside" aria-hidden="true">
                <Petal size={30} />
                <span className="font-mono text-[0.78em] text-muted">{book.title}</span>
              </span>
            </span>
          </span>
        </button>
      </div>
      <p className="m-0 font-mono text-[13px] text-muted">{open ? "tap to close" : "hover or tap to open"}</p>
    </div>
  );
}
