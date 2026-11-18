import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { getDb, hasDb } from "@/lib/mongo";
import { site } from "@/lib/site";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(500).optional(), // honeypot: real people leave it empty
  source: z.string().max(40).optional(),
});

// Basic per-IP limit: 5 messages / 10 minutes per server instance.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many messages. Please try again in a few minutes." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  const { name, email, message, website, source } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // bot: pretend it worked

  if (hasDb) {
    await (await getDb()).collection("messages").insertOne({ name, email, message, source, createdAt: new Date() }).catch((e) => console.error("[contact] save failed", e));
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) {
    if (process.env.NODE_ENV === "production") {
      console.error("[contact] RESEND_API_KEY / CONTACT_TO_EMAIL not set");
      return NextResponse.json({ error: "Messages can't be delivered right now. Please try again later." }, { status: 503 });
    }
    console.info("[contact] (dev, not emailed)", { name, email, source });
    return NextResponse.json({ ok: true, dev: true });
  }

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || `${site.name} <onboarding@resend.dev>`,
    to: to.split(",").map((s) => s.trim()),
    replyTo: email,
    subject: `A note from ${name} via ${site.name}`,
    text: `${message}\n\n— ${name} <${email}>\nSent from ${source || "the site"}`,
    html: `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#2E2A33">
<p style="white-space:pre-wrap">${esc(message)}</p>
<p style="color:#6B6470">— ${esc(name)} &lt;${esc(email)}&gt;<br/>Sent from ${esc(source || "the site")} on ${site.name}</p></div>`,
  });
  if (error) {
    console.error("[contact] resend error", error);
    return NextResponse.json({ error: "Couldn't send right now. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
