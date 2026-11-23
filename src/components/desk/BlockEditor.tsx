"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { type Block, type ImageBlock, insertImage, joinBlocks, moveImage, parseBlocks, removeImage } from "./blocks";

export type BlockEditorHandle = {
  /** Adds a picture where the cursor last was (or at the end). */
  addImage: (img: { url: string; alt: string }) => void;
  /** Bold / italic / quote on the selected words of the box last typed in. */
  format: (kind: "bold" | "italic" | "quote") => void;
  focusEnd: () => void;
};

type Props = {
  body: string;
  verse: boolean;
  onChange: (body: string) => void;
  /** Called after a picture is taken out; `undo` puts it back exactly where it was. */
  onImageRemoved: (url: string, undo: () => void) => void;
  onFiles: (files: File[]) => void;
};

const thumb = (url: string) => (url.includes("/upload/") ? url.replace("/upload/", "/upload/f_auto,q_auto,w_900/") : url);

function grow(t: HTMLTextAreaElement | null, min: number) {
  if (!t) return;
  t.style.height = "auto";
  t.style.height = `${Math.max(t.scrollHeight, min)}px`;
}

const BlockEditor = forwardRef<BlockEditorHandle, Props>(function BlockEditor({ body, verse, onChange, onImageRemoved, onFiles }, ref) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(body));
  const [dragging, setDragging] = useState(false);
  const boxes = useRef(new Map<string, HTMLTextAreaElement>());
  const caret = useRef<{ index: number; offset: number; end: number } | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const commit = useCallback((next: Block[]) => {
    setBlocks(next);
    onChange(joinBlocks(next));
  }, [onChange]);

  const textClass = verse ? "font-mono text-[19px] leading-[1.85]" : "font-sans text-[18px] leading-[1.8]";
  const minFor = (i: number) => (i === 0 ? 320 : blocks.length - 1 === i ? 160 : 56);

  // Keep every box as tall as its text.
  useLayoutEffect(() => {
    blocks.forEach((b, i) => b.kind === "text" && grow(boxes.current.get(b.id) || null, minFor(i)));
  });

  const remember = (index: number, t: HTMLTextAreaElement) => {
    caret.current = { index, offset: t.selectionStart, end: t.selectionEnd };
  };

  const setText = (id: string, value: string) => commit(blocksRef.current.map((b) => (b.id === id && b.kind === "text" ? { ...b, text: value } : b)));

  const select = (id: string, start: number, end = start) =>
    requestAnimationFrame(() => {
      const t = boxes.current.get(id);
      if (!t) return;
      t.focus();
      t.setSelectionRange(start, end);
    });

  useImperativeHandle(ref, () => ({
    addImage(img) {
      const at = caret.current ? { index: caret.current.index, offset: caret.current.offset } : null;
      const next = insertImage(blocksRef.current, at, img);
      commit(next);
      // Carry on writing just below the new picture.
      const pic = next.findIndex((b) => b.kind === "image" && b.url === img.url);
      const after = next[pic + 1];
      if (after) { caret.current = { index: pic + 1, offset: 0, end: 0 }; select(after.id, 0); }
    },
    format(kind) {
      const c = caret.current;
      const b = c ? blocksRef.current[c.index] : null;
      if (!c || !b || b.kind !== "text") return;
      const { offset: s, end: e } = c;
      const v = b.text;
      if (kind === "quote") {
        const ls = v.lastIndexOf("\n", s - 1) + 1;
        const le = v.indexOf("\n", e) === -1 ? v.length : v.indexOf("\n", e);
        const chunk = v.slice(ls, le).split("\n");
        const quoted = chunk.every((l) => l.startsWith(">"));
        const out = chunk.map((l) => (quoted ? l.replace(/^>\s?/, "") : `> ${l}`)).join("\n");
        setText(b.id, v.slice(0, ls) + out + v.slice(le));
        select(b.id, ls, ls + out.length);
        return;
      }
      const mark = kind === "bold" ? "**" : "*";
      const picked = v.slice(s, e);
      if (picked.startsWith(mark) && picked.endsWith(mark) && picked.length >= mark.length * 2) {
        const plain = picked.slice(mark.length, -mark.length);
        setText(b.id, v.slice(0, s) + plain + v.slice(e));
        select(b.id, s, s + plain.length);
      } else {
        setText(b.id, `${v.slice(0, s)}${mark}${picked}${mark}${v.slice(e)}`);
        select(b.id, s + mark.length, e + mark.length);
      }
    },
    focusEnd() {
      const last = blocksRef.current[blocksRef.current.length - 1];
      if (last?.kind === "text") select(last.id, last.text.length);
    },
  }));

  const remove = (img: ImageBlock) => {
    const before = blocksRef.current;
    commit(removeImage(before, img.id));
    caret.current = null;
    onImageRemoved(img.url, () => commit(before));
  };

  const move = (img: ImageBlock, dir: -1 | 1) => {
    const next = moveImage(blocksRef.current, img.id, dir);
    if (next === blocksRef.current) return;
    commit(next);
    requestAnimationFrame(() => document.getElementById(`img-${img.id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  // Paste a screenshot / photo straight into the page.
  const onPaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) { e.preventDefault(); onFiles(files); }
  };

  useEffect(() => {
    const end = () => setDragging(false);
    window.addEventListener("dragend", end);
    window.addEventListener("drop", end);
    return () => { window.removeEventListener("dragend", end); window.removeEventListener("drop", end); };
  }, []);

  const images = blocks.filter((b): b is ImageBlock => b.kind === "image");

  return (
    <div
      className={`desk-editor ${dragging ? "is-dragging" : ""}`}
      onDragOver={(e) => { if (Array.from(e.dataTransfer.types).includes("Files")) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
      onDrop={(e) => {
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
        if (!files.length) return;
        e.preventDefault();
        setDragging(false);
        onFiles(files);
      }}
    >
      {blocks.map((b, i) =>
        b.kind === "text" ? (
          <div key={b.id}>
            {i === 0 && <label htmlFor="desk-body" className="sr-only">Writing</label>}
            <textarea
              id={i === 0 ? "desk-body" : undefined}
              data-testid={i === 0 ? "desk-body" : undefined}
              aria-label={i === 0 ? undefined : "Writing (continued)"}
              ref={(el) => { if (el) boxes.current.set(b.id, el); else boxes.current.delete(b.id); }}
              value={b.text}
              onChange={(e) => { setText(b.id, e.target.value); remember(i, e.target); }}
              onSelect={(e) => remember(i, e.currentTarget)}
              onFocus={(e) => remember(i, e.currentTarget)}
              onPaste={onPaste}
              placeholder={i === 0 ? (verse ? "Begin the first line…" : "Begin here…") : i === blocks.length - 1 ? "Keep writing…" : ""}
              spellCheck
              rows={1}
              className={`block w-full resize-none overflow-hidden border-0 bg-transparent text-ink outline-none placeholder:text-muted focus-visible:outline-none ${textClass}`}
            />
          </div>
        ) : (
          <figure key={b.id} id={`img-${b.id}`} className="desk-figure" aria-label={`Picture ${images.indexOf(b) + 1} of ${images.length}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb(b.url)} alt={b.alt} loading="lazy" decoding="async" />
            <figcaption className="desk-figure-bar">
              <label className="sr-only" htmlFor={`alt-${b.id}`}>Describe this picture</label>
              <input
                id={`alt-${b.id}`}
                className="desk-figure-alt"
                value={b.alt}
                maxLength={140}
                placeholder="Describe this picture (for readers who can't see it)"
                onChange={(e) => commit(blocksRef.current.map((x) => (x.id === b.id ? { ...x, alt: e.target.value } : x)))}
              />
              <div className="flex items-center gap-1.5">
                <button type="button" className="desk-chip" onClick={() => move(b, -1)} aria-label="Move picture up" title="Move up">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                </button>
                <button type="button" className="desk-chip" onClick={() => move(b, 1)} aria-label="Move picture down" title="Move down">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
                </button>
                <button type="button" className="desk-chip is-danger" onClick={() => remove(b)} data-testid="remove-image">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                  Remove
                </button>
              </div>
            </figcaption>
          </figure>
        ),
      )}
      {dragging && <div className="desk-drop" aria-hidden="true">Drop the picture to add it here</div>}
    </div>
  );
});

export default BlockEditor;
