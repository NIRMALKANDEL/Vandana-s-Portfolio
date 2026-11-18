import { site } from "@/lib/site";

/** Small line icons (generic shapes, not brand logos). */
export function LinkIcon({ kind }: { kind: "Substack" | "LinkedIn" | "RSS" | string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false };
  if (kind === "LinkedIn")
    return (
      <svg {...common}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
      </svg>
    );
  if (kind === "RSS")
    return (
      <svg {...common}>
        <path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" />
        <circle cx="6" cy="18" r="1.2" fill="currentColor" />
      </svg>
    );
  // Substack: an open letter, for her newsletter
  return (
    <svg {...common}>
      <path d="M4 9.5 12 4l8 5.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="m4 10 8 5.5 8-5.5" />
    </svg>
  );
}

const LABEL: Record<string, string> = { Substack: "Read on Substack", LinkedIn: "Connect on LinkedIn" };

/** Her profiles as soft pill buttons (contact section and footer). */
export default function ProfileLinks({ withRss = false, long = false }: { withRss?: boolean; long?: boolean }) {
  const links = [
    ...site.profiles.map((p) => ({ ...p, external: true })),
    ...(withRss ? [{ label: "RSS", href: "/feed.xml", external: false }] : []),
  ];
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
      {links.map((p) => (
        <li key={p.href}>
          <a
            href={p.href}
            {...(p.external ? { target: "_blank", rel: "noopener noreferrer me" } : {})}
            className="pill-link"
          >
            <LinkIcon kind={p.label} />
            {long ? LABEL[p.label] || p.label : p.label}
            {p.external && <span className="sr-only"> (opens in a new tab)</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}
