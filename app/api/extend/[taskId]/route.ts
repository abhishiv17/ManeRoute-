import { getHairExtension } from "@/lib/youcam/client";
import { pollImageTask } from "@/lib/server/tasks";

export const runtime = "nodejs";

// Polls a Hair Extension task and returns the grown-out preview inline.
export async function GET(_req: Request, ctx: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await ctx.params;
  return pollImageTask(taskId, getHairExtension);
}
