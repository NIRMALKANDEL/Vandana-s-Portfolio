/**
 * The desk edits a page as a list of blocks — writing, picture, writing, picture… —
 * while the database keeps one plain-text body (what PostBody renders on the site).
 *
 *   body  ── parseBlocks ──▶  blocks  (shown as text boxes and picture cards)
 *   blocks ── joinBlocks ──▶  body    (saved)
 *
 * A picture is a line of its own: ![description](https://…)
 */

export type TextBlock = { kind: "text"; id: string; text: string };
export type ImageBlock = { kind: "image"; id: string; url: string; alt: string };
export type Block = TextBlock | ImageBlock;

const IMAGE_LINE = /^!\[([^\]\n]*)\]\((https:\/\/[^)\s]+)\)\s*$/;

let seq = 0;
export const blockId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

const text = (t: string): TextBlock => ({ kind: "text", id: blockId(), text: t });

/** Always starts and ends with a text block, and there is a text block between any two pictures. */
export function parseBlocks(body: string): Block[] {
  const out: Block[] = [];
  let buf: string[] = [];
  const pushText = () => {
    out.push(text(buf.join("\n").replace(/^\n+|\n+$/g, "")));
    buf = [];
  };
  for (const line of body.replace(/\r\n/g, "\n").split("\n")) {
    const m = line.trim().match(IMAGE_LINE);
    if (m) {
      pushText();
      out.push({ kind: "image", id: blockId(), alt: m[1].trim(), url: m[2] });
    } else buf.push(line);
  }
  pushText();
  return out;
}

/** Pictures get a blank line on each side so the site shows them as their own block. */
export function joinBlocks(blocks: Block[]): string {
  const parts: string[] = [];
  blocks.forEach((b) => {
    if (b.kind === "image") parts.push(`![${b.alt.replace(/[\[\]\n]/g, " ").trim()}](${b.url})`);
    else if (b.text.trim()) parts.push(b.text);
  });
  return parts.join("\n\n");
}

/** Put a picture where the cursor is (splitting that text box in two), or at the end. */
export function insertImage(blocks: Block[], at: { index: number; offset: number } | null, img: Omit<ImageBlock, "kind" | "id">): Block[] {
  const pic: ImageBlock = { kind: "image", id: blockId(), ...img };
  const i = at && blocks[at.index]?.kind === "text" ? at.index : blocks.length - 1;
  const target = blocks[i] as TextBlock;
  const offset = at && at.index === i ? Math.min(at.offset, target.text.length) : target.text.length;
  const before = target.text.slice(0, offset).replace(/\n+$/, "");
  const after = target.text.slice(offset).replace(/^\n+/, "");
  return [...blocks.slice(0, i), { ...target, text: before }, pic, text(after), ...blocks.slice(i + 1)];
}

/** Take a picture out and stitch the writing on either side back together. */
export function removeImage(blocks: Block[], id: string): Block[] {
  const i = blocks.findIndex((b) => b.id === id);
  if (i < 0) return blocks;
  const prev = blocks[i - 1] as TextBlock | undefined;
  const next = blocks[i + 1] as TextBlock | undefined;
  if (prev?.kind !== "text" || next?.kind !== "text") return blocks.filter((b) => b.id !== id);
  const joined = [prev.text, next.text].filter((t) => t.trim()).join("\n\n");
  return [...blocks.slice(0, i - 1), { ...prev, text: joined }, ...blocks.slice(i + 2)];
}

/**
 * Move a picture up or down past one paragraph (or stanza) of writing, or past
 * the neighbouring picture. Writing is never changed, only where the picture sits.
 */
export function moveImage(blocks: Block[], id: string, dir: -1 | 1): Block[] {
  type Unit = { kind: "para"; text: string } | ImageBlock;
  const units: Unit[] = [];
  blocks.forEach((b) => {
    if (b.kind === "image") units.push(b);
    else b.text.split(/\n{2,}/).filter((t) => t.trim()).forEach((t) => units.push({ kind: "para", text: t }));
  });
  const i = units.findIndex((u) => u.kind === "image" && u.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= units.length) return blocks;
  [units[i], units[j]] = [units[j], units[i]];

  const out: Block[] = [];
  let paras: string[] = [];
  const flush = () => { out.push(text(paras.join("\n\n"))); paras = []; };
  units.forEach((u) => {
    if (u.kind === "para") paras.push(u.text);
    else { flush(); out.push(u); }
  });
  flush();
  return out;
}

export const imageUrls = (body: string) =>
  body.split("\n").map((l) => l.trim().match(IMAGE_LINE)?.[2]).filter((u): u is string => Boolean(u));
