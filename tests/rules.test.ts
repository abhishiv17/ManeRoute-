import { test } from "node:test";
import assert from "node:assert/strict";
import { GROW_OUT_SKIPPED, planRoute, ROUTE_HEADLINES } from "../lib/rules.ts";
import { normalizeLengthTerm } from "../lib/length.ts";
import { normalizeHairType } from "../lib/texture.ts";
import { CATALOG, getStyle, stylesIn } from "../lib/catalog.ts";
import type { HairBaseline, HairTexture, Preferences } from "../lib/types.ts";

const prefs: Preferences = { growOut: "yes", keepLength: false, chemical: "unsure", maintenance: "high", nonNegotiables: "" };
const base = (term: string) => normalizeLengthTerm(term) as HairBaseline;
const tex = (mapping: string) => normalizeHairType({ mapping }) as HairTexture;
const style = (id: string) => {
  const s = getStyle(id);
  assert.ok(s, `missing style ${id}`);
  return s!;
};

test("normalizes every documented YouCam length term", () => {
  const terms = ["above the ears", "ear length", "ear length or longer", "short hair", "short hair or longer", "above chest", "above chest or longer", "long hair"];
  for (const t of terms) assert.ok(normalizeLengthTerm(t), t);
  assert.equal(base("short hair or longer").atLeast, true);
  assert.equal(base("long hair").lengthBand, "long");
  assert.equal(normalizeLengthTerm("mid back"), null);
  assert.equal(normalizeLengthTerm(undefined), null);
});

test("normalizes every documented YouCam hair type", () => {
  const maps = ["1 to 2a", "2a to 2b", "2b to 2c", "2c to 3a", "3a to 3b", "3b to 3c", "3c to 4a", "4a to 4b", "4b to 4c"];
  maps.forEach((m, i) => assert.equal(tex(m).index, i, m));
  assert.equal(tex("1 to 2a").group, "straight");
  assert.equal(tex("4b to 4c").group, "coily");
  assert.equal(normalizeHairType({ term: "Loose to Medium Curls" })?.group, "curly");
  assert.equal(normalizeHairType({ mapping: "5a" }), null);
  assert.equal(normalizeHairType(null), null);
});

test("R0: no usable baseline means retake", () => {
  assert.equal(planRoute(null, style("classic-straight-lob"), prefs, CATALOG).route, "retake_required");
});

test("R2: longer target builds length, with a planning stage and a grow-out preview", () => {
  const r = planRoute(base("above the ears"), style("long-straight-with-fringe"), prefs, CATALOG, { collection: "salon" });
  assert.equal(r.route, "length_building");
  // Four bands apart: two along-the-way cuts, and no Hair Extension preview from very short hair.
  assert.deepEqual(r.stageStyleIds.map((id) => getStyle(id)!.targetLengthBand), ["ear_length", "above_chest"]);
  assert.equal(r.growOut, undefined);
});

test("R1: lower-bound result below target goes to a stylist", () => {
  const r = planRoute(base("short hair or longer"), style("long-straight-with-fringe"), prefs, CATALOG);
  assert.equal(r.route, "stylist_confirmation_needed");
  assert.equal(r.reasons[0].rule, "R1_lower_bound");
});

test("R3: shorter target is cut-first, keep-length raises a caution, no grow-out preview", () => {
  const r = planRoute(base("long hair"), style("crew-cut"), { ...prefs, keepLength: true }, CATALOG);
  assert.equal(r.route, "cut_first");
  assert.ok(r.cautions.some((c) => c.rule === "P2_keep_length"));
  assert.equal(r.growOut, undefined);
});

test("R4: same band with a simple style can be discussed now", () => {
  const r = planRoute(base("short hair"), style("classic-straight-lob"), prefs, CATALOG);
  assert.equal(r.route, "can_discuss_now");
  assert.deepEqual(r.stageStyleIds, []);
});

test("R5: texture-sensitive look without a texture scan needs confirmation", () => {
  const r = planRoute(base("above chest"), style("loose-waves"), prefs, CATALOG);
  assert.equal(r.route, "stylist_confirmation_needed");
  assert.ok(r.reasons.some((x) => x.rule === "R5_technique_texture"));
});

test("R6: a measured texture that matches resolves the texture question", () => {
  const r = planRoute(base("above chest"), style("loose-waves"), prefs, CATALOG, { collection: "salon", texture: tex("2a to 2b") });
  assert.equal(r.route, "can_discuss_now");
  assert.ok(r.reasons.some((x) => x.rule === "R6_texture_match"));
  assert.ok(!r.reasons.some((x) => x.rule === "R5_technique_texture"));
});

test("R6: straight hair choosing a wavy look is flagged, with a chemical conflict note", () => {
  const r = planRoute(base("above chest"), style("loose-waves"), { ...prefs, chemical: "no" }, CATALOG, { collection: "salon", texture: tex("1 to 2a") });
  assert.equal(r.route, "stylist_confirmation_needed");
  const hit = r.reasons.find((x) => x.rule === "R6_texture_mismatch");
  assert.ok(hit);
  assert.match(hit!.text, /don't want chemical treatment/);
});

test("R6: coily hair choosing a sleek straight look is flagged", () => {
  const r = planRoute(base("long hair"), style("side-part-straight"), prefs, CATALOG, { collection: "salon", texture: tex("4a to 4b") });
  assert.ok(r.reasons.some((x) => x.rule === "R6_texture_mismatch"));
  assert.equal(r.route, "stylist_confirmation_needed");
});

test("preferences flag conflicts without changing the route", () => {
  const r = planRoute(base("ear length"), style("shoulder-length-curtain-waves"), { ...prefs, growOut: "no", maintenance: "low", chemical: "no" }, CATALOG);
  assert.equal(r.route, "length_building");
  const rules = r.cautions.map((c) => c.rule);
  for (const id of ["P1_no_grow_out", "P3_maintenance", "P4_no_chemical", "R5_technique_texture"]) assert.ok(rules.includes(id), id);
});

test("planning stage never leaves the shelf the user browsed", () => {
  for (const shelf of ["barbershop", "salon"] as const) {
    for (const s of stylesIn(shelf)) {
      for (const t of ["above the ears", "ear length", "long hair"]) {
        const r = planRoute(base(t), s, prefs, CATALOG, { collection: shelf });
        for (const id of r.stageStyleIds) assert.ok(getStyle(id)!.collections.includes(shelf), `${s.id} from ${t}`);
      }
    }
  }
});

test("barbershop shelf covers every length", () => {
  const bands = new Set<string>(stylesIn("barbershop").map((s) => s.targetLengthBand));
  for (const b of ["above_ears", "ear_length", "short", "above_chest", "long"]) assert.ok(bands.has(b), b);
});

test("catalog is well formed and never labels styles by gender", () => {
  assert.ok(CATALOG.length >= 50);
  for (const s of CATALOG) {
    assert.ok(s.templateId && s.collections.length, s.id);
    assert.doesNotMatch(s.name, /\b(men|women|male|female|man|woman)\b/i, s.id);
    for (const c of s.collections) assert.ok(s.thumbs[c], `${s.id} missing ${c} picture`);
  }
});

test("no output contains invented percentages", () => {
  for (const t of ["above the ears", "short hair or longer", "long hair"])
    for (const s of CATALOG)
      for (const texture of [null, tex("1 to 2a"), tex("4a to 4b")]) {
        const r = planRoute(base(t), s, prefs, CATALOG, { collection: "all", texture });
        assert.doesNotMatch(JSON.stringify(r), /\d+\s?%/);
      }
});

test("planning stage prefers cuts typical for the chosen list", () => {
  const r = planRoute(base("ear length"), style("grown-out-waves"), prefs, CATALOG, { collection: "barbershop" });
  assert.equal(getStyle(r.stageStyleIds[0])!.home, "barbershop");
});

test("your-hair-grown preview only when there is length to extend", () => {
  const fromShort = planRoute(base("short hair"), style("long-straight-with-fringe"), prefs, CATALOG, { collection: "salon" });
  assert.equal(fromShort.growOut, "long");
  assert.equal(fromShort.growOutSkipped, false);
  for (const t of ["above the ears", "ear length"]) {
    const r = planRoute(base(t), style("long-straight-with-fringe"), prefs, CATALOG, { collection: "salon" });
    assert.equal(r.growOut, undefined, t);
    // The skipped preview is explained, never silently missing.
    assert.equal(r.growOutSkipped, true, t);
    assert.ok(r.limitations.includes(GROW_OUT_SKIPPED), t);
  }
  // Routes that never use a grow-out preview don't claim one was skipped.
  assert.equal(planRoute(base("long hair"), style("crew-cut"), prefs, CATALOG).growOutSkipped, false);
});

test("every route uses the same plain headline everywhere", () => {
  for (const [start, target] of [["ear length", "grown-out-waves"], ["long hair", "crew-cut"], ["short hair or longer", "long-straight-with-fringe"]]) {
    const r = planRoute(base(start), style(target), prefs, CATALOG);
    assert.equal(r.headline, ROUTE_HEADLINES[r.route]);
  }
  assert.equal(ROUTE_HEADLINES.length_building, "Grow it out first");
});

test("a two-band gap gets one stage between now and the target", () => {
  const r = planRoute(base("ear length"), style("grown-out-waves"), prefs, CATALOG, { collection: "barbershop" });
  assert.equal(r.stageStyleIds.length, 1);
  assert.equal(getStyle(r.stageStyleIds[0])!.targetLengthBand, "short");
});
