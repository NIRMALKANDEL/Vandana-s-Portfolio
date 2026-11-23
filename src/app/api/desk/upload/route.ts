import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireDesk, sameOrigin } from "@/lib/desk-api";
import { listAllPosts } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns a short-lived signature so the desk can upload an image straight to Cloudinary. */
export async function POST(req: Request) {
  const { deny } = await requireDesk();
  if (deny) return deny;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ error: "Image uploads aren't set up yet (Cloudinary keys missing)." }, { status: 503 });
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "commonplace";
  const params = { timestamp, folder, allowed_formats: "jpg,jpeg,png,webp,heic,avif" };
  const signature = cloudinary.utils.api_sign_request(params, apiSecret);
  return NextResponse.json({ ...params, signature, apiKey, cloudName });
}

/**
 * Deletes a picture from Cloudinary after Vandana removes it from a page.
 * Only touches files in our own folder, and never one that any page still uses.
 */
export async function DELETE(req: Request) {
  const { deny } = await requireDesk();
  if (deny) return deny;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ ok: false, skipped: "not configured" });

  const { url } = (await req.json().catch(() => ({}))) as { url?: unknown };
  const publicId = typeof url === "string" ? cloudinaryPublicId(url, cloudName) : null;
  if (!publicId || !publicId.startsWith("commonplace/")) return NextResponse.json({ error: "Not one of the desk's pictures" }, { status: 400 });

  const stillUsed = (await listAllPosts()).some((p) => p.body.includes(publicId) || p.coverImage?.includes(publicId));
  if (stillUsed) return NextResponse.json({ ok: true, kept: "still used on a page" });

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  const result = await cloudinary.uploader.destroy(publicId, { invalidate: true }).catch((e: Error) => ({ result: e.message }));
  return NextResponse.json({ ok: result.result === "ok" || result.result === "not found", result: result.result });
}

/** https://res.cloudinary.com/<cloud>/image/upload/[transforms/][v123/]commonplace/name.jpg → commonplace/name */
function cloudinaryPublicId(raw: string, cloudName: string) {
  try {
    const u = new URL(raw);
    if (u.hostname !== "res.cloudinary.com") return null;
    const m = u.pathname.match(new RegExp(`^/${cloudName}/image/upload/(.+)$`));
    if (!m) return null;
    const parts = m[1].split("/");
    const start = parts.findIndex((p) => p === "commonplace");
    if (start < 0) return null;
    return decodeURIComponent(parts.slice(start).join("/")).replace(/\.[a-z0-9]+$/i, "");
  } catch {
    return null;
  }
}
