// ManeRoute transition engine: plain, ordered rules. No scores, no percentages.
// Every rule that fires records a stable id and a plain-language sentence, shown to the user.
import type {
  Collection,
  GrowOutLength,
  HairBaseline,
  HairTexture,
  LengthBand,
  Preferences,
  RouteOptions,
  RuleHit,
  TargetStyle,
  TextureGroup,
  TransitionRoute,
} from "./types.ts";

const ORDER: LengthBand[] = ["above_ears", "ear_length", "short", "above_chest", "long"];
const LABEL: Record<LengthBand, string> = {
  above_ears: "above the ears",
  ear_length: "ear length",
  short: "short, above the shoulders",
  above_chest: "medium, around the collarbone",
  long: "long",
};
const LEVEL_RANK = { low: 0, medium: 1, high: 2 } as const;
const TEXTURE_RANK: Record<TextureGroup, number> = { straight: 0, wavy: 1, curly: 2, coily: 3 };

export const bandIndex = (b: LengthBand) => ORDER.indexOf(b);

const PREVIEW_NOTE = "Previews are references, not guarantees.";

const BASE_LIMITATIONS = [
  "Length comes from one photo and is a visible category, not a measurement.",
  "ManeRoute does not predict how fast hair grows or give timelines.",
  "Generated previews are planning references, not guaranteed results.",
  "Density and scalp are not assessed.",
];

export function planRoute(
  baseline: HairBaseline | null,
  target: TargetStyle,
  prefs: Preferences,
  catalog: TargetStyle[],
  opts: RouteOptions = { collection: "all" },
): TransitionRoute {
  const reasons: RuleHit[] = [];
  const cautions: RuleHit[] = [];
  const texture = opts.texture ?? null;

  // R0: capture must be usable before anything else.
  if (!baseline || baseline.captureQuality === "needs_retake") {
    return {
      route: "retake_required",
      headline: "Let's retake the photo",
      explanation:
        "We could not read your current visible length from this photo, so we will not guess a route. A front-facing photo with hair down and shoulders visible works best.",
      reasons: [{ rule: "R0_capture", text: "The photo did not meet the capture requirements." }],
      cautions: [],
      stageStyleIds: [],
      questions: [],
      limitations: BASE_LIMITATIONS,
    };
  }

  const cur = bandIndex(baseline.lengthBand);
  const tgt = bandIndex(target.targetLengthBand);
  const diff = tgt - cur;
  let route: TransitionRoute["route"];

  // R1–R4: compare the visible length band with the target's band.
  if (diff > 0 && baseline.atLeast) {
    route = "stylist_confirmation_needed";
    reasons.push({
      rule: "R1_lower_bound",
      text: `Your hair is at least ${LABEL[baseline.lengthBand]}, maybe longer. This look needs ${LABEL[target.targetLengthBand]}, so ask your stylist whether you already have enough length.`,
    });
  } else if (diff > 0) {
    route = "length_building";
    reasons.push({
      rule: "R2_needs_length",
      text: `This look is ${LABEL[target.targetLengthBand]}; your hair is ${LABEL[baseline.lengthBand]} now.`,
    });
  } else if (diff < 0) {
    route = "cut_first";
    reasons.push({
      rule: "R3_shorter_target",
      text: `This look is ${LABEL[target.targetLengthBand]}; your hair is ${LABEL[baseline.lengthBand]} now, so it starts with a cut.`,
    });
  } else {
    route = "can_discuss_now";
    reasons.push({
      rule: "R4_same_band",
      text: `Your hair is already about the length this look needs (${LABEL[target.targetLengthBand]}).`,
    });
  }

  // R6: texture, when the user did the YouCam Hair Type scan. Runs before R5 because a
  // measured texture can settle what R5 would otherwise leave to the stylist.
  const textureCheck = texture ? checkTexture(texture, target, prefs) : null;
  if (textureCheck?.hit) {
    if (textureCheck.mismatch) {
      if (route === "can_discuss_now") {
        route = "stylist_confirmation_needed";
        reasons.push(textureCheck.hit);
      } else cautions.push(textureCheck.hit);
    } else reasons.push(textureCheck.hit);
  }

  // R5: technique always needs a professional check; texture only when it wasn't measured.
  const textureUnresolved = target.textureSensitive && !texture;
  if (target.requiresStylistConfirmation || textureUnresolved) {
    const text = target.requiresStylistConfirmation
      ? "This look depends on cutting technique and how your hair behaves, which a photo can't show."
      : "How this look sits depends on your natural texture, which hasn't been checked yet.";
    const hit = { rule: "R5_technique_texture", text };
    if (route === "can_discuss_now") {
      route = "stylist_confirmation_needed";
      reasons.push(hit);
    } else {
      cautions.push(hit);
    }
  }

  // R7: hair density, only when YouCam's wording clearly says fine or thick. A caution, never a route change.
  const density = opts.hair?.density;
  if (density?.grade === "low" && LAYERED.has(target.id)) {
    cautions.push({
      rule: "R7_density_fine",
      text: `Your hair reads as fine (“${density.term}”, YouCam Hair Density Detection). Lots of layers can make fine hair look thinner; ask for fewer, longer layers and fuller ends.`,
    });
  } else if (density?.grade === "high" && ONE_LENGTH.has(target.id)) {
    cautions.push({
      rule: "R7_density_thick",
      text: `Your hair reads as thick (“${density.term}”, YouCam Hair Density Detection). A one-length shape can puff out; ask for weight to be taken out from inside, not from the ends.`,
    });
  }

  // R8: frizz, only when YouCam clearly says frizz-prone, for looks with a sleek, straight finish.
  const frizz = opts.hair?.frizz;
  if (frizz?.grade === "high" && target.textureNeed === "straight") {
    cautions.push({
      rule: "R8_frizz",
      text: `Your hair reads as frizz-prone (“${frizz.term}”, YouCam Hair Frizziness Detection). A sleek finish like this takes smoothing products or heat most days.`,
    });
  }

  // Preference checks: these never change the route, they surface conflicts to discuss.
  if (route === "length_building" && prefs.growOut === "no") {
    cautions.push({
      rule: "P1_no_grow_out",
      text: "You said you don't want to grow your hair out, but this target needs more length. Ask about shorter alternatives with a similar feel.",
    });
  }
  if (route === "cut_first" && prefs.keepLength) {
    cautions.push({
      rule: "P2_keep_length",
      text: "You want to keep your length, but this target is shorter. Ask whether a longer version of the shape could work.",
    });
  }
  if (LEVEL_RANK[target.maintenance] > LEVEL_RANK[prefs.maintenance]) {
    cautions.push({
      rule: "P3_maintenance",
      text: `This style is ${target.maintenance} maintenance and you asked for ${prefs.maintenance}. Ask how to simplify upkeep.`,
    });
  }
  if (target.mayNeedChemical && prefs.chemical === "no" && !(textureCheck && !textureCheck.mismatch)) {
    cautions.push({
      rule: "P4_no_chemical",
      text: "You don't want chemical treatment, so the curl or wave would need to come from your natural texture or daily styling.",
    });
  }

  const stageStyleIds = pickStages(cur, tgt, target, catalog, opts.collection);
  const growOut = pickGrowOut(route, cur, tgt);
  const growOutSkipped = !growOut && pickGrowOut(route, bandIndex("short"), tgt) !== undefined;

  const limitations = [...BASE_LIMITATIONS];
  if (!texture) limitations.push("Hair texture was not scanned, so texture effects are the stylist's call.");
  else limitations.push(`Texture comes from YouCam Hair Type Detection (“${texture.term}”), a category from three photos.`);
  if (baseline.atLeast) limitations.push("YouCam reported a minimum length only (\"or longer\").");
  if (growOutSkipped) limitations.push(GROW_OUT_SKIPPED);

  return {
    route,
    headline: ROUTE_HEADLINES[route],
    explanation: `${EXPLAIN[route]} ${PREVIEW_NOTE}`,
    reasons,
    cautions,
    stageStyleIds,
    growOut,
    growOutSkipped,
    questions: buildQuestions(route, target, prefs, textureCheck?.mismatch ?? false),
    limitations,
  };
}

/** R6: compare the measured texture with the texture the look's finish relies on. */
function checkTexture(
  t: HairTexture,
  target: TargetStyle,
  prefs: Preferences,
): { hit: RuleHit | null; mismatch: boolean } {
  const need = target.textureNeed;
  if (need === "any") {
    return target.textureSensitive
      ? {
          hit: { rule: "R6_texture_ok", text: `Your texture reads as “${t.term}”. This cut adapts to most textures; expect it to sit a little differently from the preview.` },
          mismatch: false,
        }
      : { hit: null, mismatch: false };
  }
  const gap = TEXTURE_RANK[t.group] - TEXTURE_RANK[need];
  if (gap === 0) {
    return {
      hit: { rule: "R6_texture_match", text: `Your natural texture (“${t.term}”) matches this look's ${need} finish, so it should sit close to the preview with everyday styling.` },
      mismatch: false,
    };
  }
  const chem = prefs.chemical === "no" ? " You don't want chemical treatment, so plan for a version adapted to your natural texture." : "";
  const text =
    gap < 0
      ? `Your texture reads as “${t.term}”, straighter than this look's ${need} finish. Matching the preview would take daily curling or a perm.${chem}`
      : `Your texture reads as “${t.term}”, curlier than this look's ${need} finish. Matching the preview would take heat styling or a smoothing treatment; your natural version will be fuller.${chem}`;
  // One step apart is close enough to discuss; two or more is a real mismatch.
  return { hit: { rule: "R6_texture_mismatch", text }, mismatch: Math.abs(gap) >= 2 || (Math.abs(gap) === 1 && target.textureSensitive) };
}

/**
 * Length-building to a medium or long target: also preview the user's own cut, grown out.
 * YouCam Hair Extension lengthens the cut you already have, so it only reads as "your hair,
 * grown" when there is already some length to extend. From ear length or shorter it keeps the
 * short top and adds long lengths underneath (a mullet), which misrepresents growing out,
 * so shorter starts get along-the-way cuts instead.
 */
export const GROW_OUT_SKIPPED =
  "No \"your hair, grown\" preview yet: YouCam Hair Extension lengthens the cut you have, and from shorter than short hair it keeps the short top and adds length underneath. The along-the-way cuts show the route instead.";

function pickGrowOut(route: TransitionRoute["route"], cur: number, tgt: number): GrowOutLength | undefined {
  if (route !== "length_building" && route !== "stylist_confirmation_needed") return undefined;
  if (cur < bandIndex("short")) return undefined;
  if (tgt === bandIndex("above_chest")) return "chest";
  if (tgt === bandIndex("long")) return "long";
  return undefined;
}

/**
 * Along-the-way cuts between now and the target: one stage for a two-band gap, two stages
 * (at roughly a third and two thirds of the way) for three bands or more. They must come
 * from the list the user browsed; if that list has nothing at a stage's length, that stage
 * is skipped rather than filled with a mismatched look.
 */
function pickStages(
  cur: number,
  tgt: number,
  target: TargetStyle,
  catalog: TargetStyle[],
  collection: Collection | "all",
): string[] {
  const gap = tgt - cur;
  const n = Math.abs(gap);
  if (n < 2) return [];
  const bands = n === 2 ? [cur + gap / 2] : [cur + Math.round(gap / 3), cur + Math.round((2 * gap) / 3)];
  const picked: string[] = [];
  for (const band of [...new Set(bands)]) {
    const id = pickAt(band, target, catalog, collection, picked);
    if (id) picked.push(id);
  }
  return picked;
}

function pickAt(
  band: number,
  target: TargetStyle,
  catalog: TargetStyle[],
  collection: Collection | "all",
  exclude: string[],
): string | undefined {
  const shelves: Collection[] = collection === "all" ? target.collections : [collection];
  const candidates = catalog.filter(
    (s) =>
      s.id !== target.id &&
      !exclude.includes(s.id) &&
      bandIndex(s.targetLengthBand) === band &&
      s.templateId &&
      s.collections.some((c) => shelves.includes(c)),
  );
  // Prefer the simplest, most predictable look: typical for the chosen list, keeps the user's
  // colour, adds no fringe, no texture or technique dependence, lowest upkeep.
  const score = (s: TargetStyle) => [
    Number(collection !== "all" && s.home !== collection),
    Number(!s.keepUserColor),
    s.sideEffects.length,
    Number(s.textureSensitive),
    Number(s.requiresStylistConfirmation),
    LEVEL_RANK[s.maintenance],
  ];
  candidates.sort((a, b) => {
    const x = score(a);
    const y = score(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return 0;
  });
  return candidates[0]?.id;
}

// Cuts whose shape depends on many layers (fine hair can look thin) and one-length shapes (thick hair can puff out).
const LAYERED = new Set(["wolf-cut", "face-framing-shag", "wavy-shag", "hush-cut", "short-feather-cut", "choppy-bob", "soft-layered-medium-cut", "c-curl-layers", "medium-curved-layers", "tousled-bob"]);
const ONE_LENGTH = new Set(["blunt-bob", "short-bob", "classic-straight-lob", "mid-part-bob", "slicked-back-bob", "straight-with-blunt-fringe", "hime-cut", "bob-with-fringe"]);

/** The one name for each route, used on every screen, the document, saved plans and journeys. */
export const ROUTE_HEADLINES: Record<TransitionRoute["route"], string> = {
  can_discuss_now: "Ready for your next appointment",
  length_building: "Grow it out first",
  cut_first: "Cut it shorter",
  stylist_confirmation_needed: "Check with your stylist first",
  retake_required: "Retake your photo",
};

const EXPLAIN: Record<TransitionRoute["route"], string> = {
  can_discuss_now: "You already have the length for this look. Show your stylist the card at your next visit.",
  length_building: "This look needs more length than you have now. Ask for a shape that looks good while it grows.",
  cut_first: "This look is shorter than your hair now. Agree on the shape before anything is cut, maybe in stages.",
  stylist_confirmation_needed: "Part of this look can't be judged from a photo. Treat the previews as a starting point.",
  retake_required: "We couldn't read your hair from this photo, so we won't guess.",
};

function buildQuestions(
  route: TransitionRoute["route"],
  target: TargetStyle,
  prefs: Preferences,
  textureMismatch: boolean,
): string[] {
  const q: string[] = ["Is this realistic from my hair now?"];
  if (route === "length_building") {
    q.push("What shape looks good while I grow it?");
    q.push("What should we change at this first appointment?");
  }
  if (route === "cut_first") {
    q.push("Can we go shorter in stages?");
  }
  if (prefs.keepLength) q.push("How do I keep as much length as possible?");
  if (textureMismatch) q.push("How would this look adapted to my natural texture, without daily styling?");
  else if (target.textureSensitive || target.requiresStylistConfirmation) {
    q.push("How will my natural texture affect this look?");
  }
  if (target.sideEffects.includes("adds a fringe")) q.push("Would a fringe work with my hairline and cowlicks?");
  if (prefs.chemical !== "no" && target.mayNeedChemical) {
    q.push("Would this need a perm or can it be styled day to day?");
  }
  q.push("How often would I need a trim?");
  return q;
}
