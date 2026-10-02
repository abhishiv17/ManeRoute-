import { NextResponse } from "next/server";
import { isMockMode, startHairLength } from "@/lib/youcam/client";
import { handleError, isValidId, jsonError, rateLimited } from "@/lib/server/http";
import { mockTaskId } from "@/lib/server/mock";

export const runtime = "nodejs";

// Starts a YouCam Hair Length Detection task for an uploaded file.
export async function POST(req: Request) {
  if (rateLimited(req)) return jsonError("rate_limited", "Too many attempts. Please wait a while and try again.", 429);
  try {
    const { fileId } = await req.json().catch(() => ({}));
    if (!isValidId(fileId)) return jsonError("bad_file_id", "Missing photo reference. Please upload again.", 400, true);
    if (isMockMode()) return NextResponse.json({ taskId: mockTaskId("length") });
    const taskId = await startHairLength(fileId);
    return NextResponse.json({ taskId });
  } catch (e) {
    return handleError(e);
  }
}
