import { NextResponse } from "next/server";
import { isMockMode, startHairstyle } from "@/lib/youcam/client";
import { handleError, isValidId, jsonError, rateLimited } from "@/lib/server/http";
import { mockTaskId } from "@/lib/server/mock";
import { getStyle } from "@/lib/catalog";

export const runtime = "nodejs";

// Starts a YouCam Hairstyle VTO (hair-transfer v2.1) task using the style's curated template.
// The client sends a catalog style id, never a raw template id.
export async function POST(req: Request) {
  if (rateLimited(req)) return jsonError("rate_limited", "Too many attempts. Please wait a while and try again.", 429);
  try {
    const { fileId, styleId } = await req.json().catch(() => ({}));
    if (!isValidId(fileId)) return jsonError("bad_file_id", "Missing photo reference. Please upload again.", 400, true);
    const style = typeof styleId === "string" ? getStyle(styleId) : undefined;
    if (!style) return jsonError("unknown_style", "That hairstyle isn't in the catalog.", 400);
    if (isMockMode()) return NextResponse.json({ taskId: mockTaskId("vto") });
    if (!style.templateId) return jsonError("style_not_ready", "This hairstyle preview isn't available yet.", 409);

    const taskId = await startHairstyle(fileId, style.templateId, Boolean(style.keepUserColor));
    return NextResponse.json({ taskId });
  } catch (e) {
    return handleError(e);
  }
}
