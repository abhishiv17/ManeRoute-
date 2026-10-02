// ManeRoute journeys: a route the user is actually walking.
// A journey keeps the milestones from the consultation (now → along the way → grown → target),
// every check-in (a new photo re-measured by YouCam Hair Length Detection, or a logged cut),
// and the routine ticks. Everything here is pure, so it is unit-tested and storage-agnostic.
import type { HairTexture, LengthBand, Preferences, RouteKind } from "./types.ts";
import type { Direction, RoutineAnswers } from "./routine.ts";

const ORDER: LengthBand[] = ["above_ears", "ear_length", "short", "above_chest", "long"];
const idx = (b: LengthBand) => ORDER.indexOf(b);
const DAY = 86_400_000;

export type MilestoneKind = "start" | "stage" | "grow" | "target";

export type Milestone = {
  id: string;
  kind: MilestoneKind;
  name: string;
  band: LengthBand;
  styleId?: string;
  /** Small preview picture (the YouCam try-on or the start photo). */
  image?: string;
  /** Set when the user logs that they got this cut / reached this point. */
  loggedAt?: number;
};

export type CheckIn = {
  id: string;
  at: number;
  /** measure: a new photo measured by YouCam. cut: the user logged a haircut. */
  kind: "measure" | "cut";
  photo?: string;
  band?: LengthBand;
  atLeast?: boolean;
  raw?: string;
  milestoneId?: string;
  note?: string;
  simulated?: boolean;
};

export type Journey = {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: "active" | "archived";
  targetId: string;
  targetName: string;
  targetBand: LengthBand;
  routeKind: RouteKind;
  routeHeadline: string;
  direction: Direction;
  milestones: Milestone[];
  checkins: CheckIn[];
  texture: HairTexture | null;
  prefs: Preferences;
  answers: RoutineAnswers | null;
  checkEveryDays: number;
  /** Routine ticks: day keys (YYYY-MM-DD) and week keys (W + Monday's day key) → step ids. */
  ticks: Record<string, string[]>;
};

export const directionOf = (from: LengthBand, to: LengthBand): Direction =>
  idx(to) > idx(from) ? "grow" : idx(to) < idx(from) ? "cut" : "keep";

export const measures = (j: Journey) => j.checkins.filter((c) => c.kind === "measure" && c.band).sort((a, b) => a.at - b.at);
export const cuts = (j: Journey) => j.checkins.filter((c) => c.kind === "cut").sort((a, b) => a.at - b.at);

/** The latest band YouCam measured (the start measurement counts). */
export function currentBand(j: Journey): LengthBand {
  const m = measures(j);
  return m.length ? m[m.length - 1].band! : j.milestones[0].band;
}

export type MilestoneState = "done" | "here" | "ahead";

export type Progress = {
  states: MilestoneState[];
  /** Index of the furthest milestone reached. */
  at: number;
  /** 0…1 along the road, for placing Rou. Counted in milestones, never in time. */
  fraction: number;
  arrived: boolean;
  next: Milestone | null;
  /** How each reached milestone was reached. */
  how: ("start" | "measured" | "logged" | null)[];
};

/**
 * A milestone is reached when the user logs it, or when a measurement has reached its band in the
 * direction of travel. Progress never goes backwards: reaching a later milestone completes earlier ones.
 */
export function progress(j: Journey): Progress {
  const band = currentBand(j);
  const startBand = j.milestones[0].band;
  const hasNewMeasure = measures(j).length > 1;
  const how: Progress["how"] = j.milestones.map((m, i) => {
    if (i === 0) return "start";
    if (m.loggedAt) return "logged";
    if (!hasNewMeasure) return null;
    if (j.direction === "grow" && idx(band) >= idx(m.band) && idx(m.band) > idx(startBand)) return "measured";
    if (j.direction === "cut" && idx(band) <= idx(m.band) && idx(m.band) < idx(startBand)) return "measured";
    return null;
  });
  let at = 0;
  how.forEach((h, i) => h && (at = i));
  const last = j.milestones.length - 1;
  const states: MilestoneState[] = j.milestones.map((_, i) => (i < at ? "done" : i === at ? "here" : "ahead"));
  const arrived = at === last;
  if (arrived) states[last] = "done";
  return { states, at, fraction: last ? at / last : 1, arrived, next: arrived ? null : j.milestones[at + 1], how };
}

export type Pace = { bands: number; weeks: number; text: string };

/** The user's own observed pace between their first and latest measurement. Never a prediction. */
export function pace(j: Journey): Pace | null {
  const m = measures(j);
  if (m.length < 2) return null;
  const first = m[0];
  const last = m[m.length - 1];
  const bands = idx(last.band!) - idx(first.band!);
  const weeks = Math.max(1, Math.round((last.at - first.at) / (7 * DAY)));
  if (bands === 0) return null;
  const n = Math.abs(bands);
  return {
    bands,
    weeks,
    text: `${n} band${n > 1 ? "s" : ""} ${bands > 0 ? "longer" : "shorter"} in ${weeks} week${weeks > 1 ? "s" : ""}`,
  };
}

export type Due = { date: number; inDays: number; overdue: boolean };

const dueFrom = (from: number, every: number, now: number): Due => {
  const date = from + every * DAY;
  const inDays = Math.ceil((startOfDay(date) - startOfDay(now)) / DAY);
  return { date, inDays, overdue: inDays < 0 };
};

export function nextCheckIn(j: Journey, now = Date.now()): Due {
  const m = measures(j);
  return dueFrom(m.length ? m[m.length - 1].at : j.createdAt, j.checkEveryDays, now);
}

export function nextTrim(j: Journey, trimEveryDays: number, now = Date.now()): Due {
  const c = cuts(j);
  return dueFrom(c.length ? c[c.length - 1].at : j.createdAt, trimEveryDays, now);
}

// ---------- routine ticks ----------

export function dayKey(t: number | Date = Date.now()): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function weekKey(t: number | Date = Date.now()): string {
  const d = new Date(t);
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return `W${dayKey(monday)}`;
}

export const WASH_DAY = "__washday";

export function toggleTick(ticks: Journey["ticks"], key: string, stepId: string): Journey["ticks"] {
  const cur = ticks[key] ?? [];
  const next = cur.includes(stepId) ? cur.filter((s) => s !== stepId) : [...cur, stepId];
  return { ...ticks, [key]: next };
}

/**
 * Consecutive days on which every daily step was ticked. Today counts once it is complete;
 * an unfinished today doesn't break a streak that ran until yesterday.
 */
export function streak(ticks: Journey["ticks"], dailyIds: string[], now = Date.now()): number {
  if (!dailyIds.length) return 0;
  const complete = (k: string) => dailyIds.every((id) => ticks[k]?.includes(id));
  let n = 0;
  let t = startOfDay(now);
  if (!complete(dayKey(t))) t -= DAY;
  while (complete(dayKey(t))) {
    n += 1;
    t -= DAY;
  }
  return n;
}

function startOfDay(t: number) {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// ---------- Rou's line for the dashboard ----------

export type RouLine = { mood: "happy" | "cheer" | "wow" | "think" | "wave"; text: string };

export function rouLine(j: Journey, now = Date.now()): RouLine {
  const p = progress(j);
  const m = measures(j);
  const due = nextCheckIn(j, now);
  if (p.arrived) return { mood: "cheer", text: `You made it: ${j.targetName}. Keep the routine going so it stays this way.` };
  if (m.length >= 2 && m[m.length - 1].band !== m[m.length - 2].band && now - m[m.length - 1].at < 3 * DAY) {
    return { mood: "wow", text: `New band! YouCam now reads ${bandName(m[m.length - 1].band!)}.` };
  }
  if (due.inDays <= 0) return { mood: "think", text: "Check-in time. A new photo shows how far you've come." };
  if (m.length < 2) return { mood: "wave", text: `First stop: ${p.next?.name}. Check in every ${Math.round(j.checkEveryDays / 7)} weeks and I'll move along the road.` };
  return { mood: "happy", text: `Next stop: ${p.next?.name}. Next check-in in ${due.inDays} day${due.inDays === 1 ? "" : "s"}.` };
}

export const BAND_SHORT: Record<LengthBand, string> = {
  above_ears: "Above ears",
  ear_length: "Ear length",
  short: "Short",
  above_chest: "Medium",
  long: "Long",
};

const bandName = (b: LengthBand) => BAND_SHORT[b].toLowerCase();
