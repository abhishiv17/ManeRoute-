import { NextResponse } from "next/server";
import { isMockMode, uploadImage } from "@/lib/youcam/client";
import { handleError, jsonError, rateLimited } from "@/lib/server/http";
import { readImageInfo } from "@/lib/server/image";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

// Receives the (already resized) capture and registers it with the YouCam File API.
// The photo is streamed through and never written to disk or kept in memory after this request.
export async function POST(req: Request) {
  if (rateLimited(req)) return jsonError("rate_limited", "Too many attempts. Please wait a while and try again.", 429);
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof Blob)) return jsonError("no_image", "No photo was attached.", 400, true);
    if (file.size > MAX_BYTES) return jsonError("too_large", "The photo must be under 10 MB.", 413, true);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const info = readImageInfo(bytes);
    if (!info) return jsonError("bad_format", "Please use a JPG or PNG photo.", 415, true);
    if (info.width < 320 || info.height < 320)
      return jsonError("too_small", "The photo is too small. It needs to be at least 320 px on each side.", 422, true);
    if (info.type !== "image/jpeg" || Math.max(info.width, info.height) > 1024)
      // Hairstyle VTO accepts JPG with the long side at most 1024 px; the client resizes to this.
      return jsonError("needs_resize", "The photo wasn't prepared correctly. Please pick it again.", 422, true);

    if (isMockMode()) return NextResponse.json({ fileId: "mock_file", simulated: true });

    const fileId = await uploadImage(bytes, info.type);
    return NextResponse.json({ fileId });
  } catch (e) {
    return handleError(e);
  }
}
