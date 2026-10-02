import "server-only";

// Thin server-only wrapper around the YouCam S2S API.
// Docs: https://docs.perfectcorp.com/develop/quick_start_guide
// The API key is read from the environment here and never leaves the server.

const BASE = process.env.YOUCAM_API_BASE || "https://yce-api-01.makeupar.com";
const REQUEST_TIMEOUT_MS = 20_000;

export class YouCamError extends Error {
  constructor(
    public code: string,
    message: string,
    public httpStatus = 502,
  ) {
    super(message);
  }
}

function apiKey(): string {
  const key = process.env.YOUCAM_API_KEY?.trim();
  if (!key) throw new YouCamError("missing_api_key", "The server has no YouCam API key configured.", 500);
  return key;
}

export const isMockMode = () => process.env.YOUCAM_MOCK === "1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// GETs are idempotent, so a dropped connection is retried twice before giving up.
// POSTs (which start paid tasks) are never retried automatically.
async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const attempts = (init.method || "GET") === "GET" ? 3 : 1;
  for (let i = 1; ; i++) {
    try {
      return await callOnce<T>(path, init);
    } catch (e) {
      const transient = e instanceof YouCamError && (e.code === "provider_unreachable" || e.code === "provider_timeout");
      if (!transient || i >= attempts) throw e;
      await sleep(600 * i);
    }
  }
}

async function callOnce<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (e) {
    if (e instanceof YouCamError) throw e;
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new YouCamError(
      timedOut ? "provider_timeout" : "provider_unreachable",
      timedOut ? "YouCam took too long to respond." : "Could not reach YouCam.",
      504,
    );
  }

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const code: string = body?.error_code || `http_${res.status}`;
    // Log the provider error code only; never log headers or the key.
    console.warn(`[youcam] ${init.method || "GET"} ${path.split("?")[0].replace(/\/[^/]{24,}$/, "/:id")} -> ${res.status} ${code}`);
    throw new YouCamError(code, body?.error || `YouCam returned ${res.status}.`, res.status === 429 ? 429 : 502);
  }
  return body as T;
}

type FileResponse = {
  status: number;
  data: {
    files: {
      file_id: string;
      requests: { url: string; method: string; headers: Record<string, string> }[];
    }[];
  };
};

/** Registers a file with the YouCam File API, then uploads the bytes to the presigned URL. */
export async function uploadImage(bytes: Uint8Array, contentType: "image/jpeg" | "image/png"): Promise<string> {
  const ext = contentType === "image/png" ? "png" : "jpg";
  const reg = await call<FileResponse>("/s2s/v2.0/file", {
    method: "POST",
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: `capture.${ext}`, file_size: bytes.byteLength }],
    }),
  });
  const file = reg?.data?.files?.[0];
  const req = file?.requests?.[0];
  if (!file?.file_id || !req?.url) throw new YouCamError("bad_file_response", "YouCam did not return an upload URL.");

  let put: Response;
  try {
    put = await fetch(req.url, {
      method: req.method || "PUT",
      headers: req.headers,
      body: new Blob([bytes as BlobPart], { type: contentType }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new YouCamError("upload_failed", "Uploading the photo to YouCam failed.", 504);
  }
  if (!put.ok) throw new YouCamError("upload_failed", `Photo upload was rejected (${put.status}).`);
  return file.file_id;
}

type RunResponse = { status: number; data: { task_id: string } };

export type RawTaskStatus = {
  status: number;
  data: {
    task_status: "running" | "success" | "error";
    error?: string | null;
    error_message?: string;
    results?: any;
  };
};

export async function startHairLength(fileId: string): Promise<string> {
  const r = await call<RunResponse>("/s2s/v2.0/task/hair-length-detection", {
    method: "POST",
    body: JSON.stringify({ src_file_id: fileId }),
  });
  if (!r?.data?.task_id) throw new YouCamError("bad_task_response", "YouCam did not return a task id.");
  return r.data.task_id;
}

export function getHairLength(taskId: string) {
  return call<RawTaskStatus>(`/s2s/v2.0/task/hair-length-detection/${encodeURIComponent(taskId)}`);
}

export async function startHairstyle(fileId: string, templateId: string, keepUserColor: boolean): Promise<string> {
  const body: Record<string, string> = { src_file_id: fileId, template_id: templateId };
  // hair_color "src" keeps the user's colour; only honoured by templates with keep_users_color.
  if (keepUserColor) body.hair_color = "src";
  const r = await call<RunResponse>("/s2s/v2.1/task/hair-transfer", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!r?.data?.task_id) throw new YouCamError("bad_task_response", "YouCam did not return a task id.");
  return r.data.task_id;
}

export function getHairstyle(taskId: string) {
  return call<RawTaskStatus>(`/s2s/v2.1/task/hair-transfer/${encodeURIComponent(taskId)}`);
}

/**
 * AI Hair Type Detection v1.0. Needs three photos of the same size, in the order
 * front face, right face (head turned about 45°), left face.
 */
export async function startHairType(fileIds: [string, string, string]): Promise<string> {
  const r = await call<RunResponse>("/s2s/v2.0/task/hair-type-detection", {
    method: "POST",
    body: JSON.stringify({ src_file_ids: fileIds }),
  });
  if (!r?.data?.task_id) throw new YouCamError("bad_task_response", "YouCam did not return a task id.");
  return r.data.task_id;
}

export function getHairType(taskId: string) {
  return call<RawTaskStatus>(`/s2s/v2.0/task/hair-type-detection/${encodeURIComponent(taskId)}`);
}

// AI Hair Extension VTO v1.0 templates, checked on 28 Sep 2026 (GET /s2s/v2.0/task/template/hair-ext):
// all_length_1 reaches the collarbone/chest, all_length_2_ falls clearly below the chest.
export const HAIR_EXTENSION_TEMPLATES = { chest: "all_length_1", long: "all_length_2_" } as const;

/** Extends the user's own cut and colour to a longer length. */
export async function startHairExtension(fileId: string, length: keyof typeof HAIR_EXTENSION_TEMPLATES): Promise<string> {
  const r = await call<RunResponse>("/s2s/v2.0/task/hair-ext", {
    method: "POST",
    body: JSON.stringify({ src_file_id: fileId, template_id: HAIR_EXTENSION_TEMPLATES[length] }),
  });
  if (!r?.data?.task_id) throw new YouCamError("bad_task_response", "YouCam did not return a task id.");
  return r.data.task_id;
}

export function getHairExtension(taskId: string) {
  return call<RawTaskStatus>(`/s2s/v2.0/task/hair-ext/${encodeURIComponent(taskId)}`);
}

export type Template = { id: string; title?: string; thumb?: string; category_name?: string; keep_users_color?: boolean };

export async function listHairTemplates(): Promise<Template[]> {
  const out: Template[] = [];
  let token: string | undefined;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ page_size: "20" });
    if (token) qs.set("starting_token", token);
    const r = await call<{ data: { templates: Template[]; next_token?: string } }>(
      `/s2s/v2.1/task/template/hair-transfer?${qs}`,
    );
    out.push(...(r?.data?.templates || []));
    token = r?.data?.next_token;
    if (!token) break;
  }
  return out;
}

/** Downloads a result image server-side so the client gets bytes it can draw on a canvas. */
export async function fetchResultImage(url: string): Promise<{ bytes: ArrayBuffer; type: string }> {
  const u = new URL(url);
  if (u.protocol !== "https:") throw new YouCamError("bad_result_url", "Unexpected result URL.");
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(u, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
      if (!res.ok) throw new YouCamError("result_download_failed", "Could not download the preview image.");
      return { bytes: await res.arrayBuffer(), type: res.headers.get("content-type") || "image/jpeg" };
    } catch (e) {
      if (i >= 3) throw e instanceof YouCamError ? e : new YouCamError("result_download_failed", "Could not download the preview image.");
      await sleep(600 * i);
    }
  }
}
