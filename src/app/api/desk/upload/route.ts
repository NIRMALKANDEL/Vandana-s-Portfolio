import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireDesk, sameOrigin } from "@/lib/desk-api";

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
