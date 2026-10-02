// YouCam Hair Density Detection and Hair Frizziness Detection.
// Per YouCam's API spec (OpenAPI, read 2 Oct 2026):
//   density → results.hair_density.term: Extremely Low / Low / Medium / High Density
//   frizz   → results.hair_frizziness.term: Not Frizzy / Slightly Frizzy / Frizzy / Extreme Frizzy
// ManeRoute keeps YouCam's own wording and maps those four grades to low / medium / high. Any
// other shape is read defensively and only acted on when its wording is clear; a bare number is
// never turned into a direction.

export type HairCheckKind = "density" | "frizz";
export type Grade = "low" | "medium" | "high";
export type HairReading = { term: string; grade: Grade | null };

const WORDS: Record<HairCheckKind, Record<Grade, RegExp>> = {
  density: {
    low: /\b(low|thin|sparse|fine|light|less)\b/i,
    medium: /\b(medium|moderate|normal|average)\b/i,
    high: /\b(high|thick|dense|heavy|full)\b/i,
  },
  frizz: {
    low: /\b(none|no|low|slight|slightly|mild|smooth|minimal)\b/i,
    medium: /\b(medium|moderate)\b/i,
    high: /\b(high|heavy|severe|very|strong)\b/i,
  },
};

/** Finds the first descriptive string (term, level, grade…) or number in a YouCam results object. */
function findValue(v: unknown, depth = 0): string | number | null {
  if (depth > 4 || v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return v;
  if (Array.isArray(v)) {
    for (const x of v) {
      const r = findValue(x, depth + 1);
      if (r !== null) return r;
    }
    return null;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["term", "level", "grade", "label", "result", "class", "category", "name", "value"]) {
      if (k in o) {
        const r = findValue(o[k], depth + 1);
        if (r !== null) return r;
      }
    }
    let num: number | null = null;
    for (const k of Object.keys(o)) {
      const r = findValue(o[k], depth + 1);
      if (typeof r === "string") return r;
      if (r !== null && num === null) num = r;
    }
    if (num !== null) return num;
  }
  return null;
}

const KNOWN: Record<HairCheckKind, { key: string; terms: Record<string, Grade> }> = {
  density: {
    key: "hair_density",
    terms: { "extremely low density": "low", "low density": "low", "medium density": "medium", "high density": "high" },
  },
  frizz: {
    key: "hair_frizziness",
    terms: { "not frizzy": "low", "slightly frizzy": "medium", frizzy: "high", "extreme frizzy": "high" },
  },
};

export function normalizeHairCheck(results: unknown, kind: HairCheckKind): HairReading | null {
  const k = KNOWN[kind];
  const direct = (results as Record<string, { term?: unknown }> | null)?.[k.key]?.term;
  if (typeof direct === "string" && direct.trim()) {
    const term = direct.trim();
    return { term, grade: k.terms[term.toLowerCase()] ?? gradeFromWords(term, kind) };
  }
  const v = findValue(results);
  if (v === null) return null;
  if (typeof v === "number") return { term: `Grade ${v}`, grade: null };
  return { term: v, grade: KNOWN[kind].terms[v.toLowerCase()] ?? gradeFromWords(v, kind) };
}

function gradeFromWords(v: string, kind: HairCheckKind): Grade | null {
  const w = WORDS[kind];
  // Only a clear one-sided word counts; mixed or unknown wording grades nothing.
  return w.high.test(v) && !w.low.test(v) ? "high" : w.low.test(v) && !w.high.test(v) ? "low" : w.medium.test(v) ? "medium" : null;
}

export const HAIR_CHECK_LABELS: Record<HairCheckKind, string> = { density: "Density", frizz: "Frizz" };
