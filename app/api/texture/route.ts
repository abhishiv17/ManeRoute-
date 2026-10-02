import { NextResponse } from "next/server";
import { isMockMode, startHairType } from "@/lib/youcam/client";
import { handleError, isValidId, jsonError, rateLimited } from "@/lib/server/http";
import { mockTaskId } from "@/lib/server/mock";

export const runtime = "nodejs";

// Starts a YouCam Hair Type Detection task from the three texture-scan photos
// (front, head turned right, head turned left).
export async function POST(req: Request) {
  if (rateLimited(req)) return jsonError("rate_limited", "Too many attempts. Please wait a while and try again.", 429);
  try {
    const { fileIds } = await req.json().catch(() => ({}));
    if (!Array.isArray(fileIds) || fileIds.length !== 3 || !fileIds.every(isValidId))
      return jsonError("bad_file_ids", "The texture scan needs three photos.", 400, true);
    if (isMockMode()) return NextResponse.json({ taskId: mockTaskId("texture") });
    const taskId = await startHairType(fileIds as [string, string, string]);
    return NextResponse.json({ taskId });
  } catch (e) {
    return handleError(e);
  }
}
