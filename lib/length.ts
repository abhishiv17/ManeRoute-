import type { HairBaseline, LengthBand, YouCamLengthTerm } from "./types";

// Maps every documented YouCam `hair_length.term` to our band plus a lower-bound flag.
// "X or longer" means YouCam could only confirm a minimum, so we keep that uncertainty.
const TERM_MAP: Record<YouCamLengthTerm, { band: LengthBand; atLeast: boolean }> = {
  "above the ears": { band: "above_ears", atLeast: false },
  "ear length": { band: "ear_length", atLeast: false },
  "ear length or longer": { band: "ear_length", atLeast: true },
  "short hair": { band: "short", atLeast: false },
  "short hair or longer": { band: "short", atLeast: true },
  "above chest": { band: "above_chest", atLeast: false },
  "above chest or longer": { band: "above_chest", atLeast: true },
  "long hair": { band: "long", atLeast: false },
};

/** Normalizes a raw YouCam term. Returns null for anything undocumented so the UI asks for a retake. */
export function normalizeLengthTerm(raw: unknown): HairBaseline | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase() as YouCamLengthTerm;
  const hit = TERM_MAP[key];
  if (!hit) return null;
  return { lengthBand: hit.band, atLeast: hit.atLeast, rawProviderValue: raw, captureQuality: "good" };
}
