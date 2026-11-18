import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deskUser } from "./auth";
import type { Post } from "./types";
import { computeStreak } from "./utils";
import { publishedDates } from "./posts";

export async function requireDesk() {
  const user = await deskUser();
  if (!user) return { user: null, deny: NextResponse.json({ error: "Not signed in" }, { status: 401 }) } as const;
  return { user, deny: null } as const;
}

/** Same-origin check for state-changing requests (defence in depth on top of the session cookie). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export function refreshPublicPages(post?: Pick<Post, "slug" | "category"> | null) {
  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/shelf");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  if (post) {
    revalidatePath(`/journal/${post.slug}`);
    revalidatePath(`/shelf/${post.category}`);
  }
}

export async function streak() {
  return computeStreak(await publishedDates());
}
