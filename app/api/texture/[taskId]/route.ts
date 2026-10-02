import { NextResponse } from "next/server";
import { getHairType, isMockMode } from "@/lib/youcam/client";
import { handleError, isValidId, jsonError } from "@/lib/server/http";
import { engineError } from "@/lib/server/tasks";
import { mockReady } from "@/lib/server/mock";
import { normalizeHairType } from "@/lib/texture";
import type { HairTexture, TaskPoll } from "@/lib/types";

export const runtime = "nodejs";

// Side photos fail differently from the front photo, so give scan-specific advice.
const SCAN_MESSAGES = {
  error_face_angle_invalid:
    "The side photos need your head turned clearly to each side (about 45°), and the front photo needs you looking straight ahead.",
  error_mismatch_image_size: "The three scan photos came out different sizes. Please retake the side photos.",
};

// Polls a Hair Type Detection task and returns a normalized texture.
export async function GET(_req: Request, ctx: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await ctx.params;
  if (!isValidId(taskId)) return jsonError("bad_task_id", "Invalid task.", 400);
  try {
    if (isMockMode()) {
      if (!mockReady(taskId)) return NextResponse.json<TaskPoll<HairTexture>>({ status: "running" });
      return NextResponse.json({ status: "success", result: normalizeHairType({ mapping: "2a to 2b" }), simulated: true });
    }
    const d = (await getHairType(taskId))?.data;
    if (!d || d.task_status === "running") return NextResponse.json<TaskPoll<HairTexture>>({ status: "running" });
    if (d.task_status === "error") return NextResponse.json(engineError(d, SCAN_MESSAGES));
    const texture = normalizeHairType(d.results?.hair_type);
    if (!texture) {
      return NextResponse.json<TaskPoll<HairTexture>>({
        status: "error",
        code: "unrecognized_result",
        message: "We couldn't read a texture from these photos. You can continue without it.",
        retake: true,
      });
    }
    return NextResponse.json<TaskPoll<HairTexture>>({ status: "success", result: texture });
  } catch (e) {
    return handleError(e);
  }
}
