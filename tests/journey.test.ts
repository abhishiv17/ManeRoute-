import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRoutine, DEFAULT_ANSWERS, type RoutineInput } from "../lib/routine.ts";
import {
  currentBand,
  dayKey,
  nextCheckIn,
  pace,
  progress,
  rouLine,
  streak,
  toggleTick,
  weekKey,
  type Journey,
} from "../lib/journey.ts";
import { buildIcs } from "../lib/ics.ts";
import type { LengthBand } from "../lib/types.ts";

const DAY = 86_400_000;
const T0 = new Date(2026, 9, 1, 10).getTime();

function journey(over: Partial<Journey> = {}): Journey {
  return {
    id: "j1",
    createdAt: T0,
    updatedAt: T0,
    status: "active",
    targetId: "t",
    targetName: "Long layers",
    targetBand: "long",
    routeKind: "length_building",
    routeHeadline: "Grow it out first",
    direction: "grow",
    milestones: [
      { id: "start", kind: "start", name: "Where you started", band: "ear_length" },
      { id: "s1", kind: "stage", name: "Shaggy bob", band: "short" },
      { id: "g", kind: "grow", name: "Your hair, grown", band: "above_chest" },
      { id: "target", kind: "target", name: "Long layers", band: "long" },
    ],
    checkins: [{ id: "c0", at: T0, kind: "measure", band: "ear_length" }],
    texture: null,
    prefs: { growOut: "yes", keepLength: false, chemical: "unsure", maintenance: "medium", nonNegotiables: "" },
    answers: null,
    checkEveryDays: 28,
    ticks: {},
    ...over,
  };
}
const measure = (id: string, days: number, band: LengthBand) => ({ id, at: T0 + days * DAY, kind: "measure" as const, band });

const input = (over: Partial<RoutineInput> = {}): RoutineInput => ({
  answers: DEFAULT_ANSWERS,
  band: "short",
  target: { name: "Wavy shag", targetLengthBand: "above_chest", maintenance: "medium", textureNeed: "wavy", home: "salon" },
  direction: "grow",
  ...over,
});
const ids = (r: ReturnType<typeof buildRoutine>) => r.steps.map((s) => s.id);

// ---------- routine ----------

test("every routine step explains itself with a rule id", () => {
  const r = buildRoutine(input({ answers: { ...DEFAULT_ANSWERS, heat: "daily", chemical: "bleach", scalp: "flaky", active: "gym" } }));
  for (const s of r.steps) {
    assert.match(s.why.rule, /^RT\d+/, s.id);
    assert.ok(s.why.text.length > 10, s.id);
  }
  assert.equal(new Set(ids(r)).size, r.steps.length, "step ids are unique");
});

test("a measured texture wins over the user's answer", () => {
  const r = buildRoutine(input({ answers: { ...DEFAULT_ANSWERS, texture: "straight" }, measuredTexture: "curly" }));
  assert.equal(r.texture, "curly");
  assert.equal(r.textureSource, "measured");
  assert.ok(ids(r).includes("refresh"), "curly hair gets the refresh step");
});

test("wash frequency follows texture and scalp", () => {
  const coily = buildRoutine(input({ answers: { ...DEFAULT_ANSWERS, texture: "coily" } }));
  const oilyStraight = buildRoutine(input({ answers: { ...DEFAULT_ANSWERS, texture: "straight", scalp: "oily" } }));
  assert.equal(coily.washesPerWeek, 1);
  assert.equal(oilyStraight.washesPerWeek, 5);
  assert.ok(oilyStraight.steps.find((s) => s.id === "clarify"), "oily scalp gets a monthly clarify");
});

test("chemical and heat answers add the matching care", () => {
  const r = buildRoutine(input({ answers: { ...DEFAULT_ANSWERS, chemical: "bleach", heat: "daily" } }));
  assert.ok(ids(r).includes("bond"));
  assert.ok(ids(r).includes("heat"));
  assert.ok(ids(r).includes("heatfree"), "daily heat on a grow-out route asks for heat-free days");
  assert.match(r.steps.find((s) => s.id === "wash")!.product!, /colour-safe/);
});

test("trim cadence depends on direction and length", () => {
  const buzz = buildRoutine(input({ band: "above_ears", direction: "keep", target: { name: "Buzz", targetLengthBand: "above_ears", maintenance: "low", textureNeed: "any", home: "barbershop" } }));
  const growing = buildRoutine(input({ band: "short", direction: "grow" }));
  assert.ok(buzz.trimEveryDays < 30);
  assert.ok(growing.trimEveryDays > 60);
  assert.ok(ids(growing).includes("awkward"), "short hair on a grow-out route gets awkward-phase help");
});

test("no product is a brand: products are plain types", () => {
  const r = buildRoutine(input({ answers: { ...DEFAULT_ANSWERS, chemical: "colour", heat: "sometimes", active: "swim" } }));
  for (const s of r.steps) if (s.product) assert.match(s.product, /^[a-z0-9 ,+\-]+$/, s.product);
});

// ---------- journey ----------

test("a new journey sits at the start", () => {
  const p = progress(journey());
  assert.equal(p.at, 0);
  assert.equal(p.next?.id, "s1");
  assert.equal(p.arrived, false);
});

test("a new measurement moves the journey along, and never backwards", () => {
  const j = journey({ checkins: [measure("c0", 0, "ear_length"), measure("c1", 60, "above_chest")] });
  const p = progress(j);
  assert.equal(p.at, 2, "reaching medium completes the stage and the grown point");
  assert.deepEqual(p.states, ["done", "done", "here", "ahead"]);
  assert.equal(currentBand(j), "above_chest");
});

test("logging the target cut arrives", () => {
  const j = journey();
  j.milestones[3].loggedAt = T0 + DAY;
  const p = progress(j);
  assert.equal(p.arrived, true);
  assert.equal(p.fraction, 1);
  assert.equal(rouLine(j).mood, "cheer");
});

test("cut routes are reached by measuring shorter", () => {
  const j = journey({
    direction: "cut",
    milestones: [
      { id: "start", kind: "start", name: "Start", band: "long" },
      { id: "target", kind: "target", name: "Pixie", band: "above_ears" },
    ],
    checkins: [measure("c0", 0, "long"), measure("c1", 2, "above_ears")],
  });
  assert.equal(progress(j).arrived, true);
});

test("pace is the user's own observed pace, and only when the band changed", () => {
  assert.equal(pace(journey()), null);
  assert.equal(pace(journey({ checkins: [measure("c0", 0, "ear_length"), measure("c1", 28, "ear_length")] })), null);
  const p = pace(journey({ checkins: [measure("c0", 0, "ear_length"), measure("c1", 63, "short")] }));
  assert.deepEqual(p, { bands: 1, weeks: 9, text: "1 band longer in 9 weeks" });
});

test("check-ins are due every N days from the last measurement", () => {
  const j = journey({ checkins: [measure("c0", 0, "ear_length"), measure("c1", 10, "ear_length")] });
  assert.equal(nextCheckIn(j, T0 + 10 * DAY).inDays, 28);
  assert.equal(nextCheckIn(j, T0 + 40 * DAY).overdue, true);
});

test("streak counts complete days and forgives an unfinished today", () => {
  let ticks: Journey["ticks"] = {};
  for (let d = 0; d < 3; d++) {
    const k = dayKey(T0 + d * DAY);
    ticks = toggleTick(toggleTick(ticks, k, "style"), k, "night");
  }
  assert.equal(streak(ticks, ["style", "night"], T0 + 2 * DAY), 3);
  assert.equal(streak(ticks, ["style", "night"], T0 + 3 * DAY), 3, "today not done yet");
  assert.equal(streak(ticks, ["style", "night"], T0 + 5 * DAY), 0, "a missed day breaks it");
  assert.equal(streak(toggleTick(ticks, dayKey(T0 + DAY), "night"), ["style", "night"], T0 + 2 * DAY), 1);
});

test("week keys start on Monday", () => {
  // 1 Oct 2026 is a Thursday; its week starts Monday 28 Sep.
  assert.equal(weekKey(T0), "W2026-09-28");
});

// ---------- calendar ----------

test("calendar files are valid all-day events with CRLF lines", () => {
  const ics = buildIcs([{ uid: "a", title: "Check in, ManeRoute", description: "New photo; same light", date: new Date(2026, 9, 29), rrule: "FREQ=WEEKLY;INTERVAL=4" }]);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.match(ics, /DTSTART;VALUE=DATE:20261029\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20261030\r\n/);
  assert.match(ics, /SUMMARY:Check in\\, ManeRoute/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;INTERVAL=4/);
  for (const line of ics.split("\r\n")) assert.ok(line.length <= 75, line);
});

test("styling follows the hair you have today, then the destination's texture", () => {
  const growingShort = buildRoutine(input({ band: "ear_length", answers: { ...DEFAULT_ANSWERS, texture: "wavy" } }));
  assert.match(growingShort.steps.find((s) => s.id === "style")!.title, /shape/i);
  const wavyThere = buildRoutine(input({ band: "above_chest", answers: { ...DEFAULT_ANSWERS, texture: "wavy" } }));
  assert.equal(wavyThere.steps.find((s) => s.id === "style")!.product, "light mousse or wave cream");
  const straightThere = buildRoutine(input({ band: "above_chest", answers: { ...DEFAULT_ANSWERS, texture: "straight" } }));
  assert.equal(straightThere.steps.find((s) => s.id === "style")!.product, "sea salt or texture spray");
});
