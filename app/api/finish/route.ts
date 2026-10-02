import { NextResponse } from "next/server";
import { isMockMode, startFinishTask } from "@/lib/youcam/client";
import { handleError, isValidId, jsonError, rateLimited } from "@/lib/server/http";
import { mockTaskId } from "@/lib/server/mock";
import { getFinishOption, type FinishKind } from "@/lib/addons";

export const runtime = "nodejs";

const KINDS: FinishKind[] = ["beard", "bangs", "color"];

// Starts a "finish the look" task (YouCam Beard Style, Bangs or Hair Color) on a try-on result.
// The client sends one of our option ids, never a raw template id or colour.
export async function POST(req: Request) {
  if (rateLimited(req)) return jsonError("rate_limited", "Too many attempts. Please wait a while and try again.", 429);
  try {
    const { kind, fileId, option } = await req.json().catch(() => ({}));
    if (!KINDS.includes(kind)) return jsonError("bad_kind", "Unknown finish.", 400);
    if (!isValidId(fileId)) return jsonError("bad_file_id", "Missing photo reference. Please try again.", 400);
    const opt = typeof option === "string" ? getFinishOption(kind, option) : undefined;
    if (!opt) return jsonError("unknown_option", "That option isn't available.", 400);
    if (isMockMode()) return NextResponse.json({ taskId: mockTaskId("finish") });
    const taskId = await startFinishTask(kind, fileId, kind === "color" ? { hex: opt.hex } : { templateId: opt.id });
    return NextResponse.json({ taskId });
  } catch (e) {
    return handleError(e);
  }
}
