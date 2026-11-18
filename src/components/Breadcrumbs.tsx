import Link from "next/link";
import JsonLd from "./JsonLd";
import { SITE_URL } from "@/lib/site";

export type Crumb = { href: string; label: string };

/** Visible breadcrumb trail + BreadcrumbList schema. The last crumb is the current page. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ href: "/", label: "Home" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="font-mono text-[14px] text-muted">
        <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 p-0">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.href + i} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-ink">{c.label}</span>
                ) : (
                  <>
                    <Link href={c.href} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center no-underline hover:underline">{c.label}</Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: SITE_URL + c.href })),
        }}
      />
    </>
  );
}
