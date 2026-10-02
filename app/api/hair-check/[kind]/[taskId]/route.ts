import { NextResponse } from "next/server";
import { getHairCheck, isMockMode, type HairCheckTaskKind } from "@/lib/youcam/client";
import { handleError, isValidId, jsonError } from "@/lib/server/http";
import { engineError } from "@/lib/server/tasks";
import { mockReady } from "@/lib/server/mock";
import { normalizeHairCheck, type HairReading } from "@/lib/hairCheck";
import type { TaskPoll } from "@/lib/types";

export const runtime = "nodejs";

const MESSAGES = {
  density: {
    error_face_angle_invalid: "Density needs the third photo: face the camera, then lower your head about halfway with your hairline in view.",
    error_pose: "Density needs the third photo: face the camera, then lower your head about halfway with your hairline in view.",
  },
  frizz: {
    error_face_angle_invalid: "Frizz needs the side photos turned clearly (about 45°) and the front photo straight on.",
  },
};

// Polls a hair density or frizz task. YouCam's own wording is kept; see lib/hairCheck.ts for the result shapes.
export async function GET(_req: Request, ctx: { params: Promise<{ kind: string; taskId: string }> }) {
  const { kind, taskId } = await ctx.params;
  if (kind !== "density" && kind !== "frizz") return jsonError("bad_kind", "Unknown hair check.", 400);
  if (!isValidId(taskId)) return jsonError("bad_task_id", "Invalid task.", 400);
  try {
    if (isMockMode()) {
      if (!mockReady(taskId)) return NextResponse.json<TaskPoll<HairReading>>({ status: "running" });
      const result = normalizeHairCheck(kind === "density" ? { hair_density: { term: "Medium Density" } } : { hair_frizziness: { term: "Slightly Frizzy" } }, kind);
      return NextResponse.json({ status: "success", result, simulated: true });
    }
    const d = (await getHairCheck(kind as HairCheckTaskKind, taskId))?.data;
    if (!d || d.task_status === "running") return NextResponse.json<TaskPoll<HairReading>>({ status: "running" });
    if (d.task_status === "error") return NextResponse.json(engineError(d, MESSAGES[kind]));
    const reading = normalizeHairCheck(d.results, kind);
    if (!reading) {
      return NextResponse.json<TaskPoll<HairReading>>({ status: "error", code: "unrecognized_result", message: "YouCam's answer couldn't be read.", retake: false });
    }
    return NextResponse.json<TaskPoll<HairReading>>({ status: "success", result: reading });
  } catch (e) {
    return handleError(e);
  }
}
