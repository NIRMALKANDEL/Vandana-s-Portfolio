import { Fragment, type ReactNode } from "react";

/**
 * Renders what Vandana types in the desk, without HTML injection:
 * blank line = new stanza/paragraph, single line breaks kept,
 * *italic*, **bold**, "> " quote lines, and ![alt](https://…) images.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    out.push(t.startsWith("**") ? <strong key={`${key}-${i++}`}>{t.slice(2, -2)}</strong> : <em key={`${key}-${i++}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const IMG = /^!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)$/;

function lines(block: string, key: string, verse = false) {
  const ls = block.split("\n");
  if (verse) {
    // One span per line, with a hanging indent if a long line has to wrap on a small screen.
    return ls.map((l, i) => (
      <span key={`${key}-l${i}`} className="vl">{inline(l, `${key}-l${i}`)}</span>
    ));
  }
  return ls.map((l, i) => (
    <Fragment key={`${key}-l${i}`}>
      {inline(l, `${key}-l${i}`)}
      {i < ls.length - 1 && <br />}
    </Fragment>
  ));
}

export default function PostBody({ body, verse }: { body: string; verse: boolean }) {
  const blocks = body.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.replace(/^\n+|\n+$/g, "")).filter(Boolean);
  return (
    <div className={verse ? "verse" : "prose-cpb"} data-testid="post-body">
      {blocks.map((b, i) => {
        const img = b.trim().match(IMG);
        if (img) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img[2].replace("/upload/", "/upload/f_auto,q_auto,w_1200/")} alt={img[1]} loading="lazy" decoding="async" className="my-6 block" />
          );
        }
        if (b.split("\n").every((l) => l.startsWith(">"))) {
          return <blockquote key={i}>{lines(b.split("\n").map((l) => l.replace(/^>\s?/, "")).join("\n"), `q${i}`)}</blockquote>;
        }
        return (
          <p key={i} className={verse ? "stanza" : undefined} style={verse ? { animation: `rise 700ms ease-out ${100 + i * 150}ms both` } : undefined}>
            {lines(b, `p${i}`, verse)}
          </p>
        );
      })}
    </div>
  );
}
