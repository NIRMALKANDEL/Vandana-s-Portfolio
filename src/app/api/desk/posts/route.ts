import { NextResponse } from "next/server";
import { createPost, listAllPosts } from "@/lib/posts";
import { requireDesk, sameOrigin, streak } from "@/lib/desk-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { deny } = await requireDesk();
  if (deny) return deny;
  const [posts, s] = await Promise.all([listAllPosts(), streak()]);
  return NextResponse.json({ posts, streak: s });
}

export async function POST(req: Request) {
  const { deny } = await requireDesk();
  if (deny) return deny;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const post = await createPost({ title: body.title, category: body.category, body: body.body });
  return NextResponse.json({ post }, { status: 201 });
}
