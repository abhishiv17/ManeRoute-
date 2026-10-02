import { test } from "node:test";
import assert from "node:assert/strict";
import { chairPlan, hasScript, scriptFor } from "../lib/barber.ts";
import { CATALOG, getStyle } from "../lib/catalog.ts";

const style = (id: string) => {
  const s = getStyle(id);
  assert.ok(s, `missing style ${id}`);
  return s!;
};

test("every catalog cut has a barber script with details and styling", () => {
  for (const s of CATALOG) {
    assert.ok(hasScript(s.id), `no script for ${s.id}`);
    const b = scriptFor(s);
    assert.ok(b.ask.length > 20, s.id);
    assert.ok(b.details.length >= 2, s.id);
    assert.ok(b.styling.length > 0, s.id);
  }
});

test("scripts never promise a growth time", () => {
  for (const s of CATALOG) {
    const b = scriptFor(s);
    const text = [b.ask, ...b.details, b.styling].join(" ");
    assert.doesNotMatch(text, /\b(grow|grows) in \d|\d+ (months?|weeks?) to grow/i, s.id);
  }
});

test("same length or shorter: one step, at the next appointment", () => {
  const plan = chairPlan("long", style("crew-cut"), []);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].when, "Your next appointment");
  assert.equal(plan[0].styleId, "crew-cut");
  assert.ok(plan[0].details.some((d) => /two visits/.test(d)));
  assert.equal(chairPlan("short", style("short-bob"), [])[0].details.some((d) => /two visits/.test(d)), false);
});

test("growing: the along-the-way cut first, the destination once it's long enough", () => {
  const plan = chairPlan("ear_length", style("grown-out-waves"), [style("tousled-waves")]);
  assert.deepEqual(plan.map((p) => p.styleId), ["tousled-waves", "grown-out-waves"]);
  assert.equal(plan[0].when, "Your next appointment");
  assert.match(plan[1].when, /^Once it reaches medium/);
});

test("growing without a stage: grow-out trims, then the destination", () => {
  const plan = chairPlan("short", style("grown-out-waves"), []);
  assert.equal(plan[0].title, "Grow-out trims");
  assert.equal(plan[0].styleId, undefined);
  assert.equal(plan[1].styleId, "grown-out-waves");
});
