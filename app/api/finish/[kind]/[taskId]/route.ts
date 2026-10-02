import { getFinishTask, type FinishTaskKind } from "@/lib/youcam/client";
import { pollImageTask } from "@/lib/server/tasks";
import { jsonError } from "@/lib/server/http";

export const runtime = "nodejs";

const KINDS: FinishTaskKind[] = ["beard", "bangs", "color"];

// Polls a beard, fringe or colour task and returns the image inline.
export async function GET(_req: Request, ctx: { params: Promise<{ kind: string; taskId: string }> }) {
  const { kind, taskId } = await ctx.params;
  if (!KINDS.includes(kind as FinishTaskKind)) return jsonError("bad_kind", "Unknown finish.", 400);
  return pollImageTask(taskId, (id) => getFinishTask(kind as FinishTaskKind, id));
}
