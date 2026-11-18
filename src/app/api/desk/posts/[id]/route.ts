import { NextResponse } from "next/server";
import { z } from "zod";
import { deletePost, getPost, updatePost } from "@/lib/posts";
import { refreshPublicPages, requireDesk, sameOrigin, streak } from "@/lib/desk-api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const patch = z.object({
  title: z.string().max(200).optional(),
  category: z.enum(["micro-poetry", "long-stanzas", "short-stories", "longer-worlds", "after-hours", "articles"]).optional(),
  body: z.string().max(200_000).optional(),
  excerpt: z.string().max(300).optional(),
  featured: z.boolean().optional(),
  coverImage: z.string().url().nullable().optional(),
  status: z.enum(["draft", "scheduled", "published"]).optional(),
  publishAt: z.string().nullable().optional(),
});

export async function GET(_: Request, { params }: Ctx) {
  const { deny } = await requireDesk();
  if (deny) return deny;
  const post = await getPost((await params).id);
  return post ? NextResponse.json({ post }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { deny } = await requireDesk();
  if (deny) return deny;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const id = (await params).id;
  const before = await getPost(id);
  try {
    const post = await updatePost(id, parsed.data);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Refresh public pages whenever something public changed (or stopped being public).
    if (post.status !== "draft" || before?.status !== "draft") refreshPublicPages(post);
    const s = parsed.data.status ? await streak() : undefined;
    return NextResponse.json({ post, streak: s });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { deny } = await requireDesk();
  if (deny) return deny;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const id = (await params).id;
  const before = await getPost(id);
  const ok = await deletePost(id);
  if (before && before.status !== "draft") refreshPublicPages(before);
  return ok ? NextResponse.json({ ok: true, streak: await streak() }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
