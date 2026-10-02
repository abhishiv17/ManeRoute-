import type { GrowOutLength, HairBaseline, HairTexture, TaskPoll } from "@/lib/types";

// Browser-side calls to ManeRoute's own server routes. The YouCam key never reaches the client.

export type ApiFailure = { code: string; message: string; retake: boolean };

export class ApiError extends Error {
  constructor(public failure: ApiFailure) {
    super(failure.message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, cache: "no-store" });
  } catch {
    throw new ApiError({ code: "network", message: "You seem to be offline. Check your connection and try again.", retake: false });
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = body?.error;
    throw new ApiError({
      code: e?.code || `http_${res.status}`,
      message: e?.message || "Something went wrong. Please try again.",
      retake: Boolean(e?.retake),
    });
  }
  return body as T;
}

export const uploadPhoto = (blob: Blob) => {
  const fd = new FormData();
  fd.append("image", blob, "capture.jpg");
  return request<{ fileId: string; simulated?: boolean }>("/api/photo", { method: "POST", body: fd });
};

export const startLength = (fileId: string) =>
  request<{ taskId: string }>("/api/length", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileId }),
  });

export const startVto = (fileId: string, styleId: string) =>
  request<{ taskId: string }>("/api/vto", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileId, styleId }),
  });

export type PollOutcome<T> =
  | { kind: "success"; result: T; simulated?: boolean }
  | { kind: "error"; failure: ApiFailure }
  | { kind: "timeout" }
  | { kind: "aborted" };

/** Polls one of our task routes until success, error, timeout or abort. */
export async function pollTask<T>(
  url: string,
  opts: { timeoutMs: number; intervalMs?: number; signal?: AbortSignal },
): Promise<PollOutcome<T>> {
  const interval = opts.intervalMs ?? 3000;
  const deadline = Date.now() + opts.timeoutMs;
  let transientFailures = 0;

  while (Date.now() < deadline) {
    if (opts.signal?.aborted) return { kind: "aborted" };
    try {
      const r = await request<TaskPoll<T> & { simulated?: boolean }>(url, { signal: opts.signal });
      transientFailures = 0;
      if (r.status === "success") return { kind: "success", result: r.result, simulated: r.simulated };
      if (r.status === "error") return { kind: "error", failure: { code: r.code, message: r.message, retake: r.retake } };
    } catch (e) {
      if (opts.signal?.aborted) return { kind: "aborted" };
      // Tolerate a few blips (e.g. a dropped mobile connection) before giving up.
      if (e instanceof ApiError && e.failure.code !== "network" && !e.failure.code.startsWith("http_5") && e.failure.code !== "provider_timeout" && e.failure.code !== "provider_unreachable" && e.failure.code !== "result_download_failed") {
        return { kind: "error", failure: e.failure };
      }
      if (++transientFailures >= 4) {
        return { kind: "error", failure: e instanceof ApiError ? e.failure : { code: "unknown", message: "Something went wrong.", retake: false } };
      }
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return { kind: "timeout" };
}

export const pollLength = (taskId: string, signal?: AbortSignal) =>
  pollTask<HairBaseline>(`/api/length/${encodeURIComponent(taskId)}`, { timeoutMs: 90_000, intervalMs: 2500, signal });

export const pollVto = (taskId: string, signal?: AbortSignal) =>
  pollTask<{ image: string | null; simulated?: boolean }>(`/api/vto/${encodeURIComponent(taskId)}`, {
    timeoutMs: 180_000,
    intervalMs: 3500,
    signal,
  });

export const startTexture = (fileIds: [string, string, string]) =>
  request<{ taskId: string }>("/api/texture", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileIds }),
  });

export const pollTexture = (taskId: string, signal?: AbortSignal) =>
  pollTask<HairTexture>(`/api/texture/${encodeURIComponent(taskId)}`, { timeoutMs: 90_000, intervalMs: 2500, signal });

export const startExtend = (fileId: string, length: GrowOutLength) =>
  request<{ taskId: string }>("/api/extend", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileId, length }),
  });

export const pollExtend = (taskId: string, signal?: AbortSignal) =>
  pollTask<{ image: string | null; simulated?: boolean }>(`/api/extend/${encodeURIComponent(taskId)}`, {
    timeoutMs: 180_000,
    intervalMs: 3500,
    signal,
  });
