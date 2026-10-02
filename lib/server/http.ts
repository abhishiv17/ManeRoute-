import "server-only";
import { NextResponse } from "next/server";
import { YouCamError } from "@/lib/youcam/client";
import { mapHttpError } from "@/lib/youcam/errors";

export function jsonError(code: string, message: string, status = 400, retake = false) {
  return NextResponse.json({ error: { code, message, retake } }, { status });
}

export function handleError(e: unknown) {
  if (e instanceof YouCamError) {
    return jsonError(e.code, mapHttpError(e.code, e.message), e.httpStatus);
  }
  console.error("[maneroute] unexpected error", e instanceof Error ? e.message : e);
  return jsonError("internal_error", "Something went wrong on our side. Please try again.", 500);
}

/** YouCam ids are base64-ish strings; reject anything else before it reaches a URL. */
export function isValidId(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= 256 && /^[A-Za-z0-9+/=_-]+$/.test(v);
}

// Best-effort per-IP limit on paid task starts, so a public demo URL can't drain YouCam units.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_STARTS = Number(process.env.MAX_TASKS_PER_HOUR || 40);
const hits = new Map<string, number[]>();

export function rateLimited(req: Request): boolean {
  // Only needed for a public deployment; local development runs unrestricted.
  if (process.env.NODE_ENV !== "production") return false;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_STARTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}
