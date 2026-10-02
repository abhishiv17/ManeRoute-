import { NextResponse } from "next/server";
import { isMockMode, startHairExtension } from "@/lib/youcam/client";
import { handleError, isValidId, jsonError, rateLimited } from "@/lib/server/http";
import { mockTaskId } from "@/lib/server/mock";

export const runtime = "nodejs";

// Starts a YouCam Hair Extension task: the user's own cut and colour, grown to a longer length.
export async function POST(req: Request) {
  if (rateLimited(req)) return jsonError("rate_limited", "Too many attempts. Please wait a while and try again.", 429);
  try {
    const { fileId, length } = await req.json().catch(() => ({}));
    if (!isValidId(fileId)) return jsonError("bad_file_id", "Missing photo reference. Please upload again.", 400, true);
    if (length !== "chest" && length !== "long") return jsonError("bad_length", "Unknown grow-out length.", 400);
    if (isMockMode()) return NextResponse.json({ taskId: mockTaskId("ext") });
    const taskId = await startHairExtension(fileId, length);
    return NextResponse.json({ taskId });
  } catch (e) {
    return handleError(e);
  }
}
