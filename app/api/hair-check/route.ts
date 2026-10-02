import { NextResponse } from "next/server";
import { isMockMode, startHairCheck } from "@/lib/youcam/client";
import { handleError, isValidId, jsonError, rateLimited } from "@/lib/server/http";
import { mockTaskId } from "@/lib/server/mock";

export const runtime = "nodejs";

// Starts YouCam Hair Density Detection (one front photo) or Hair Frizziness Detection
// (the three texture-scan photos: front, head turned right, head turned left).
export async function POST(req: Request) {
  if (rateLimited(req)) return jsonError("rate_limited", "Too many attempts. Please wait a while and try again.", 429);
  try {
    const { kind, fileIds } = await req.json().catch(() => ({}));
    if (kind !== "density" && kind !== "frizz") return jsonError("bad_kind", "Unknown hair check.", 400);
    const need = kind === "density" ? 1 : 3;
    if (!Array.isArray(fileIds) || fileIds.length !== need || !fileIds.every(isValidId))
      return jsonError("bad_file_ids", kind === "density" ? "Missing photo reference." : "The frizz check needs the three scan photos.", 400);
    if (isMockMode()) return NextResponse.json({ taskId: mockTaskId(kind) });
    const taskId = await startHairCheck(kind, fileIds);
    return NextResponse.json({ taskId });
  } catch (e) {
    return handleError(e);
  }
}
