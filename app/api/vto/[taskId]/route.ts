import { getHairstyle } from "@/lib/youcam/client";
import { pollImageTask } from "@/lib/server/tasks";

export const runtime = "nodejs";

// Polls a Hairstyle VTO task and returns the preview image inline.
export async function GET(_req: Request, ctx: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await ctx.params;
  return pollImageTask(taskId, getHairstyle);
}
