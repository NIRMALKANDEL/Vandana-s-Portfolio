"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Petal } from "../Flowers";
import ThemeToggle from "../ThemeToggle";
import PwaRegister from "./PwaRegister";

const MESSAGES: Record<string, string> = {
  AccessDenied: "That Google account can't open this desk. Only Vandana's account can sign in.",
  OAuthSignin: "Couldn't reach Google. Please try again.",
  OAuthCallback: "Google sign-in didn't finish. Please try again.",
  Callback: "Google sign-in didn't finish. Please try again.",
  Configuration: "Sign-in isn't configured on the server yet.",
};

export default function DeskSignIn({ error, configured }: { error?: string; configured: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col px-5 py-5">
      <PwaRegister />
      <div className="flex items-center justify-between">
        <Link href="/" className="flex min-h-[44px] items-center gap-2 font-mono font-bold no-underline"><Petal size={22} /> The Commonplace Book</Link>
        <ThemeToggle />
      </div>
      <div className="m-auto flex w-full max-w-[420px] flex-col items-center gap-5 py-16 text-center">
        <Petal size={56} />
        <h1 className="m-0 font-mono text-[34px] font-normal">The writing desk</h1>
        <p className="m-0 text-body">A quiet place to write, save and publish. Only Vandana can sign in here, with her Google account.</p>
        {error && (
          <p role="alert" className="m-0 w-full rounded-xl border p-4 text-[15px]" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            {MESSAGES[error] || "Sign-in didn't work. Please try again."}
          </p>
        )}
        {!configured && (
          <p className="m-0 w-full rounded-xl border border-dashed border-line p-4 text-[14px] text-muted">
            Google sign-in needs NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and DESK_ALLOWED_EMAIL. See the README.
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={busy || !configured}
          onClick={() => { setBusy(true); signIn("google", { callbackUrl: "/desk" }); }}
          data-testid="google-signin"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          {busy ? "Opening Google…" : "Sign in with Google"}
        </button>
        <p className="m-0 text-[14px] text-muted">
          Next time, open <strong className="font-mono font-normal text-ink">thecommonplacebook.in/write</strong> or tap <em>Writing desk</em> at the bottom of any page.
          On a phone, sign in once and choose <em>Add to Home Screen</em>.
        </p>
        <Link href="/" className="link-arrow text-[15px]">← Back to the site</Link>
      </div>
    </div>
  );
}
