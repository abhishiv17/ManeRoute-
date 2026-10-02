import type { HairTexture, TextureGroup } from "./types.ts";

// YouCam Hair Type Detection returns one of nine ordered ranges (`hair_type.mapping` / `term`).
// We keep YouCam's wording and add a coarse group for the rules.
const RANGES: { mapping: string; term: string; group: TextureGroup }[] = [
  { mapping: "1 to 2a", term: "Straight to Slight Wavy", group: "straight" },
  { mapping: "2a to 2b", term: "Slight to Medium Wavy", group: "wavy" },
  { mapping: "2b to 2c", term: "Medium to Thick Wavy", group: "wavy" },
  { mapping: "2c to 3a", term: "Thick Wavy to Loose Curls", group: "wavy" },
  { mapping: "3a to 3b", term: "Loose to Medium Curls", group: "curly" },
  { mapping: "3b to 3c", term: "Medium to Tight Curls", group: "curly" },
  { mapping: "3c to 4a", term: "Tight Curls to Kinky Soft", group: "curly" },
  { mapping: "4a to 4b", term: "Kinky Soft to Coily", group: "coily" },
  { mapping: "4b to 4c", term: "Coily to Extremely Coily", group: "coily" },
];

export const TEXTURE_GROUP_LABELS: Record<TextureGroup, string> = {
  straight: "Straight",
  wavy: "Wavy",
  curly: "Curly",
  coily: "Coily",
};

/** Normalizes a YouCam `hair_type` object. Returns null for anything undocumented. */
export function normalizeHairType(raw: unknown): HairTexture | null {
  if (!raw || typeof raw !== "object") return null;
  const { mapping, term } = raw as { mapping?: unknown; term?: unknown };
  const i = RANGES.findIndex(
    (r) =>
      (typeof mapping === "string" && r.mapping === mapping.trim().toLowerCase()) ||
      (typeof term === "string" && r.term.toLowerCase() === term.trim().toLowerCase()),
  );
  if (i < 0) return null;
  return { group: RANGES[i].group, index: i, term: RANGES[i].term, mapping: RANGES[i].mapping };
}

export const TEXTURE_RANGES = RANGES;
