import { test } from "node:test";
import assert from "node:assert/strict";
import { BANGS, bangsFor, BEARDS, COLOURS, finishSteps, getFinishOption, withFinish } from "../lib/addons.ts";
import { normalizeHairCheck } from "../lib/hairCheck.ts";
import { planRoute } from "../lib/rules.ts";
import { buildRoutine, DEFAULT_ANSWERS } from "../lib/routine.ts";
import { normalizeLengthTerm } from "../lib/length.ts";
import { CATALOG, getStyle } from "../lib/catalog.ts";
import type { HairBaseline, Preferences } from "../lib/types.ts";

const prefs: Preferences = { growOut: "yes", keepLength: false, chemical: "unsure", maintenance: "high", nonNegotiables: "" };
const base = (t: string) => normalizeLengthTerm(t) as HairBaseline;

test("every beard, fringe and colour has barber wording and a picture or a colour", () => {
  assert.equal(BEARDS.length, 15);
  assert.equal(BANGS.length, 20);
  for (const o of [...BEARDS, ...BANGS, ...COLOURS]) {
    assert.ok(o.ask.length > 15, o.id);
    assert.ok(o.details.length >= 1, o.id);
    assert.ok(o.kind === "color" ? /^#[0-9a-f]{6}$/i.test(o.hex ?? "") : o.thumb?.startsWith("/addons/"), o.id);
  }
});

test("fringes follow the list: YouCam's male set for Men's, the female set otherwise", () => {
  assert.ok(bangsFor("barbershop").every((b) => b.id.startsWith("male_")));
  assert.ok(bangsFor("salon").every((b) => b.id.startsWith("female_")));
  assert.equal(bangsFor("all").length, 10);
});

test("one finish of each kind: picking another beard replaces the first", () => {
  let list = withFinish([], { kind: "beard", id: "all_goatee", name: "Goatee" });
  list = withFinish(list, { kind: "color", id: "copper", name: "Copper" });
  list = withFinish(list, { kind: "beard", id: "all_circle", name: "Circle beard" });
  assert.deepEqual(list.map((f) => f.id), ["all_circle", "copper"]);
  const steps = finishSteps(list);
  assert.match(steps[0].when, /^Beard/);
  assert.match(steps[1].when, /^Colour/);
  assert.equal(getFinishOption("beard", "nope"), undefined);
});

test("hair checks read YouCam's documented results (spec shapes)", () => {
  assert.deepEqual(normalizeHairCheck({ timed: 1.2, hair_density: { term: "Extremely Low Density", mapping: "0.8" } }, "density"), { term: "Extremely Low Density", grade: "low" });
  assert.equal(normalizeHairCheck({ hair_density: { term: "Medium Density" } }, "density")?.grade, "medium");
  assert.equal(normalizeHairCheck({ hair_density: { term: "High Density" } }, "density")?.grade, "high");
  assert.equal(normalizeHairCheck({ hair_frizziness: { term: "Not Frizzy", mapping: 0 } }, "frizz")?.grade, "low");
  assert.equal(normalizeHairCheck({ hair_frizziness: { term: "Slightly Frizzy", mapping: 1 } }, "frizz")?.grade, "medium");
  assert.equal(normalizeHairCheck({ hair_frizziness: { term: "Frizzy", mapping: 2 } }, "frizz")?.grade, "high");
  assert.equal(normalizeHairCheck({ hair_frizziness: { term: "Extreme Frizzy", mapping: 3 } }, "frizz")?.grade, "high");
});

test("hair checks keep YouCam's wording and only grade clear words", () => {
  assert.deepEqual(normalizeHairCheck({ hair_density: { term: "Low density" } }, "density"), { term: "Low density", grade: "low" });
  assert.equal(normalizeHairCheck({ result: "Thick" }, "density")?.grade, "high");
  assert.equal(normalizeHairCheck({ hair_frizziness: { level: "Severe frizz" } }, "frizz")?.grade, "high");
  assert.equal(normalizeHairCheck({ frizz: "Slight" }, "frizz")?.grade, "low");
  // A bare number has no direction we can trust.
  assert.deepEqual(normalizeHairCheck({ grade: 3 }, "density"), { term: "Grade 3", grade: null });
  assert.equal(normalizeHairCheck({ term: "Type B" }, "frizz")?.grade, null);
  assert.equal(normalizeHairCheck(null, "frizz"), null);
});

test("R7: fine hair is cautioned on layered cuts, thick hair on one-length cuts; unclear readings do nothing", () => {
  const fine = { density: { term: "Low", grade: "low" as const } };
  const thick = { density: { term: "High", grade: "high" as const } };
  const r1 = planRoute(base("above chest"), getStyle("wolf-cut")!, prefs, CATALOG, { collection: "all", hair: fine });
  assert.ok(r1.cautions.some((c) => c.rule === "R7_density_fine"));
  const r2 = planRoute(base("short hair"), getStyle("blunt-bob")!, prefs, CATALOG, { collection: "all", hair: thick });
  assert.ok(r2.cautions.some((c) => c.rule === "R7_density_thick"));
  const r3 = planRoute(base("above chest"), getStyle("wolf-cut")!, prefs, CATALOG, { collection: "all", hair: { density: { term: "Grade 2", grade: null } } });
  assert.ok(!r3.cautions.some((c) => c.rule.startsWith("R7")));
  // Never changes the route itself.
  assert.equal(r1.route, planRoute(base("above chest"), getStyle("wolf-cut")!, prefs, CATALOG).route);
});

test("R8: frizz-prone hair is cautioned only on sleek straight looks", () => {
  const frizz = { frizz: { term: "Severe", grade: "high" as const } };
  const sleek = planRoute(base("long hair"), getStyle("side-part-straight")!, prefs, CATALOG, { collection: "all", hair: frizz });
  assert.ok(sleek.cautions.some((c) => c.rule === "R8_frizz"));
  const waves = planRoute(base("long hair"), getStyle("beachy-waves")!, prefs, CATALOG, { collection: "all", hair: frizz });
  assert.ok(!waves.cautions.some((c) => c.rule === "R8_frizz"));
});

test("RT16 and RT17: routine steps follow clear frizz and density readings", () => {
  const target = getStyle("grown-out-waves")!;
  const input = { answers: DEFAULT_ANSWERS, band: "short" as const, target, direction: "grow" as const };
  const plain = buildRoutine(input).steps.map((s) => s.id);
  assert.ok(!plain.includes("frizz") && !plain.includes("lift"));
  const withChecks = buildRoutine({ ...input, hair: { frizz: { term: "High", grade: "high" }, density: { term: "Low", grade: "low" } } });
  const ids = withChecks.steps.map((s) => s.id);
  assert.ok(ids.includes("frizz") && ids.includes("lift"));
  assert.ok(withChecks.steps.find((s) => s.id === "frizz")!.why.text.includes("High"));
});
