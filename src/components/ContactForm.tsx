"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

function validate(f: FormData): Errors {
  const e: Errors = {};
  const name = String(f.get("name") || "").trim();
  const email = String(f.get("email") || "").trim();
  const message = String(f.get("message") || "").trim();
  if (name.length < 2) e.name = "Please tell me your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "That email doesn't look quite right.";
  if (message.length < 10) e.message = "A few more words, please (10 characters or more).";
  return e;
}

export default function ContactForm({ source = "contact" }: { source?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = new FormData(form);
    const e = validate(data);
    setErrors(e);
    if (Object.keys(e).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(e)[0]}"]`)?.focus();
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(data), source }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setState("sent");
      form.reset();
      toast.success("Your note is on its way. Thank you!");
      track("contact_sent", { source });
      window.setTimeout(() => setState("idle"), 2600);
    } catch (err) {
      setState("idle");
      toast.error((err as Error).message || "Couldn't send right now. Please try again.");
    }
  }

  const field = (name: keyof Errors, label: string, el: React.ReactNode) => (
    <div className="field">
      <label htmlFor={`cf-${name}`}>{label}</label>
      {el}
      {errors[name] && <span id={`cf-${name}-err`} className="field-error" role="alert">{errors[name]}</span>}
    </div>
  );
  const aria = (name: keyof Errors) => ({ "aria-invalid": !!errors[name], "aria-describedby": errors[name] ? `cf-${name}-err` : undefined });

  const sent = state === "sent";
  return (
    <form onSubmit={onSubmit} noValidate className="relative flex min-w-0 flex-col gap-4 sm:gap-[18px]" data-testid="contact-form">
      {field("name", "Your name", <input id="cf-name" name="name" type="text" autoComplete="name" className="input" maxLength={100} {...aria("name")} />)}
      {field("email", "Email", <input id="cf-email" name="email" type="email" autoComplete="email" inputMode="email" className="input" maxLength={200} {...aria("email")} />)}
      {field("message", "Message", <textarea id="cf-message" name="message" rows={4} className="input" maxLength={5000} {...aria("message")} />)}
      {/* Honeypot: people never see or fill this */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="relative self-start">
        <button type="submit" className="btn btn-primary" disabled={state === "sending"} aria-live="polite">
          {state === "sending" ? "Sending…" : sent ? "Sent" : "Send"}
          <motion.svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            animate={sent ? { x: 60, y: -40, opacity: 0 } : { x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4 20-7z" />
          </motion.svg>
        </button>
        <AnimatePresence>
          {sent && (
            <motion.svg
              key="petal" width="18" height="18" viewBox="0 0 26 26" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0"
              initial={{ y: -10, opacity: 0, rotate: 0 }} animate={{ y: 70, opacity: [0, 1, 1, 0], rotate: 120 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: "easeIn" }}
            >
              <ellipse cx="13" cy="13" rx="6" ry="10" style={{ fill: "var(--petal)" }} />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
