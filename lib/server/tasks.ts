import "server-only";
import { NextResponse } from "next/server";
import { fetchResultImage, isMockMode, type RawTaskStatus } from "@/lib/youcam/client";
import { mapEngineError } from "@/lib/youcam/errors";
import { handleError, isValidId, jsonError } from "@/lib/server/http";
import { mockReady } from "@/lib/server/mock";
import type { TaskPoll } from "@/lib/types";

export type ImageResult = { image: string | null; simulated?: boolean };

/**
 * Shared GET handler for YouCam tasks whose result is an image (Hairstyle VTO, Hair Extension).
 * On success the image is downloaded server-side and returned inline, so the browser can draw
 * it on the consultation card without CORS issues and never sees the short-lived YouCam URL.
 */
export async function pollImageTask(taskId: string, get: (id: string) => Promise<RawTaskStatus>) {
  if (!isValidId(taskId)) return jsonError("bad_task_id", "Invalid task.", 400);
  try {
    if (isMockMode()) {
      if (!mockReady(taskId)) return NextResponse.json<TaskPoll<ImageResult>>({ status: "running" });
      return NextResponse.json<TaskPoll<ImageResult>>({ status: "success", result: { image: null, simulated: true } });
    }
    const d = (await get(taskId))?.data;
    if (!d || d.task_status === "running") return NextResponse.json<TaskPoll<ImageResult>>({ status: "running" });
    if (d.task_status === "error") return NextResponse.json(engineError(d));

    const url: string | undefined = d.results?.url;
    if (!url) {
      return NextResponse.json<TaskPoll<ImageResult>>({
        status: "error",
        code: "no_result_url",
        message: "YouCam finished but returned no image. Please try again.",
        retake: false,
      });
    }
    const img = await fetchResultImage(url);
    const dataUrl = `data:${img.type};base64,${Buffer.from(img.bytes).toString("base64")}`;
    return NextResponse.json<TaskPoll<ImageResult>>({ status: "success", result: { image: dataUrl } });
  } catch (e) {
    return handleError(e);
  }
}

export function engineError(d: RawTaskStatus["data"], override?: Partial<Record<string, string>>): TaskPoll<never> {
  const m = mapEngineError(d.error, d.error_message);
  return {
    status: "error",
    code: d.error || "task_error",
    message: (d.error && override?.[d.error]) || m.message,
    retake: m.retake,
  };
}
