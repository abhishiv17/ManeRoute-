import { NextResponse } from "next/server";
import { getHairLength, isMockMode } from "@/lib/youcam/client";
import { mapEngineError } from "@/lib/youcam/errors";
import { handleError, isValidId, jsonError } from "@/lib/server/http";
import { MOCK_LENGTH_TERM, mockReady } from "@/lib/server/mock";
import { normalizeLengthTerm } from "@/lib/length";
import type { HairBaseline, TaskPoll } from "@/lib/types";

export const runtime = "nodejs";

// Polls one Hair Length Detection task and returns a normalized baseline.
export async function GET(_req: Request, ctx: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await ctx.params;
  if (!isValidId(taskId)) return jsonError("bad_task_id", "Invalid task.", 400);
  try {
    if (isMockMode()) {
      if (!mockReady(taskId)) return NextResponse.json<TaskPoll<HairBaseline>>({ status: "running" });
      const baseline = normalizeLengthTerm(MOCK_LENGTH_TERM)!;
      return NextResponse.json({ status: "success", result: baseline, simulated: true });
    }

    const raw = await getHairLength(taskId);
    const d = raw?.data;
    if (!d || d.task_status === "running") return NextResponse.json<TaskPoll<HairBaseline>>({ status: "running" });

    if (d.task_status === "error") {
      const m = mapEngineError(d.error, d.error_message);
      return NextResponse.json<TaskPoll<HairBaseline>>({
        status: "error",
        code: d.error || "task_error",
        message: m.message,
        retake: m.retake,
      });
    }

    const term = d.results?.hair_length?.term;
    const baseline = normalizeLengthTerm(term);
    if (!baseline) {
      return NextResponse.json<TaskPoll<HairBaseline>>({
        status: "error",
        code: "unrecognized_result",
        message: "We couldn't read a length category from this photo. Please try another photo.",
        retake: true,
      });
    }
    return NextResponse.json<TaskPoll<HairBaseline>>({ status: "success", result: baseline });
  } catch (e) {
    return handleError(e);
  }
}
