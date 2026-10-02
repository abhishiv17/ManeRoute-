// ManeRoute routine engine: a haircare routine built from plain, ordered rules.
// Like the route engine, every step records the rule that produced it and a plain-language reason,
// and nothing is a score or a promise. Products are named as types ("sulfate-free shampoo"), never brands.
import type { LengthBand, RuleHit, TargetStyle, TextureGroup } from "./types.ts";

export type Cadence = "daily" | "wash" | "weekly" | "monthly" | "phase";

export const CADENCE_LABELS: Record<Cadence, string> = {
  daily: "Every day",
  wash: "Wash days",
  weekly: "Once a week",
  monthly: "Once a month",
  phase: "This stage of the route",
};

/** What the user tells us by tapping. Texture is only asked when there is no YouCam scan. */
export type RoutineAnswers = {
  texture: TextureGroup | "unsure";
  scalp: "oily" | "balanced" | "dry" | "flaky";
  heat: "never" | "sometimes" | "daily";
  chemical: "none" | "colour" | "bleach" | "straightened";
  minutes: 2 | 5 | 15;
  active: "no" | "gym" | "swim";
};

export const DEFAULT_ANSWERS: RoutineAnswers = {
  texture: "unsure",
  scalp: "balanced",
  heat: "never",
  chemical: "none",
  minutes: 5,
  active: "no",
};

export type RoutineStep = {
  id: string;
  when: Cadence;
  title: string;
  detail: string;
  /** A product *type*, never a brand. */
  product?: string;
  why: RuleHit;
  /** Shown as a tickable item in "Today" (daily and wash-day steps) or "This week" (weekly). */
  track: boolean;
};

export type Direction = "grow" | "cut" | "keep";

export type RoutineInput = {
  answers: RoutineAnswers;
  /** Measured by YouCam Hair Type Detection, when the user did the scan. Wins over the answer. */
  measuredTexture?: TextureGroup | null;
  /** The latest measured length band. */
  band: LengthBand;
  target: Pick<TargetStyle, "name" | "targetLengthBand" | "maintenance" | "textureNeed" | "home">;
  direction: Direction;
};

export type Routine = {
  texture: TextureGroup | null;
  textureSource: "measured" | "answered" | "unknown";
  washesPerWeek: number;
  /** Suggested days between trims, used for the trim reminder. */
  trimEveryDays: number;
  steps: RoutineStep[];
};

const ORDER: LengthBand[] = ["above_ears", "ear_length", "short", "above_chest", "long"];
const idx = (b: LengthBand) => ORDER.indexOf(b);

const BASE_WASHES: Record<TextureGroup, number> = { straight: 3, wavy: 3, curly: 2, coily: 1 };

export function buildRoutine(input: RoutineInput): Routine {
  const { answers: a, band, target, direction } = input;
  const texture: TextureGroup | null = input.measuredTexture ?? (a.texture === "unsure" ? null : a.texture);
  const textureSource = input.measuredTexture ? "measured" : texture ? "answered" : "unknown";
  const curlyish = texture === "curly" || texture === "coily";
  const textured = curlyish || texture === "wavy";
  const longish = idx(band) >= idx("short");
  const veryShort = idx(band) <= idx("ear_length");
  const chemical = a.chemical !== "none";
  const steps: RoutineStep[] = [];
  const add = (s: RoutineStep) => steps.push(s);
  const texWord = texture ? `${texture} hair${textureSource === "measured" ? " (YouCam scan)" : ""}` : "your hair";

  // RT1: how often to wash, from texture, then scalp, then length.
  let washes = texture ? BASE_WASHES[texture] : 3;
  const washWhy: string[] = [texture ? `${cap(texWord)} usually needs about ${BASE_WASHES[texture]} wash${BASE_WASHES[texture] > 1 ? "es" : ""} a week` : "Most hair does well with about 3 washes a week"];
  if (a.scalp === "oily") {
    washes += 2;
    washWhy.push("an oily scalp needs more");
  } else if (a.scalp === "dry") {
    washes -= 1;
    washWhy.push("a dry scalp needs fewer");
  }
  if (veryShort && !curlyish) {
    washes += 1;
    washWhy.push("very short hair gets oily at the root faster");
  }
  washes = Math.max(1, Math.min(7, washes));

  // RT2: shampoo type.
  const shampoo =
    a.scalp === "flaky"
      ? "anti-dandruff shampoo"
      : chemical
        ? "sulfate-free, colour-safe shampoo"
        : curlyish
          ? "sulfate-free, moisturising shampoo"
          : a.scalp === "oily"
            ? "gentle balancing shampoo"
            : "gentle shampoo";
  add({
    id: "wash",
    when: "wash",
    title: washes >= 7 ? "Wash every day" : `Wash ${washes}× a week`,
    detail: "Shampoo the scalp, not the lengths: the rinse cleans the rest. Lukewarm water.",
    product: shampoo,
    why: {
      rule: "RT1_wash",
      text:
        washWhy.join(", ") +
        "." +
        (a.scalp === "flaky" ? " Anti-dandruff shampoo works best left on the scalp for a few minutes." : "") +
        (chemical ? " Colour and chemical treatments fade faster with harsh sulfates." : ""),
    },
    track: true,
  });

  // RT3: conditioner.
  add({
    id: "condition",
    when: "wash",
    title: veryShort && !textured ? "Light conditioner" : "Condition every wash",
    detail: veryShort && !textured
      ? "A little on the ends, rinse well. Optional on very short cuts."
      : "Mid-lengths to ends. Leave it on for 2–3 minutes before rinsing.",
    product: curlyish ? "rich, moisturising conditioner" : "lightweight conditioner",
    why: { rule: "RT3_condition", text: "Shampoo lifts oil from the lengths too; conditioner puts slip and softness back where hair is oldest." },
    track: true,
  });

  // RT4: leave-in and detangling for textured or longer hair.
  if (textured || longish) {
    add({
      id: "detangle",
      when: "wash",
      title: curlyish ? "Detangle while it's conditioned" : "Leave-in, then detangle",
      detail: curlyish
        ? "Use fingers or a wide-tooth comb on wet, conditioned hair, working from the ends up. Never brush curls dry."
        : "Spray or smooth leave-in through the ends, then comb from the ends upwards.",
      product: "leave-in conditioner",
      why: {
        rule: "RT4_detangle",
        text: curlyish
          ? `${cap(texWord)} tangles and breaks most when dry; conditioner gives the slip to undo knots without snapping.`
          : "Longer and wavy hair breaks at the ends when combed from the root; starting at the ends avoids pulling.",
      },
      track: true,
    });
  }

  // RT5: daily styling, matched to the target look and the time the user has.
  add(styleStep(target, texture, a.minutes, band, direction));

  // RT6: refresh between washes for curls.
  if (curlyish) {
    add({
      id: "refresh",
      when: "daily",
      title: "Refresh on non-wash days",
      detail: "Mist with water, scrunch a little leave-in through the ends, let it dry. Skip shampoo.",
      product: "water spray bottle + leave-in",
      why: { rule: "RT6_refresh", text: `${cap(texWord)} looks best with fewer washes; a refresh brings the curl back without stripping it.` },
      track: true,
    });
  }

  // RT7: heat.
  if (a.heat !== "never") {
    add({
      id: "heat",
      when: a.heat === "daily" ? "daily" : "wash",
      title: "Heat protectant before any heat",
      detail: "On damp or dry hair before the dryer, straightener or curler. Use the lowest setting that works.",
      product: "heat protectant spray",
      why: { rule: "RT7_heat", text: "Heat dries the ends out, and dry ends split; a protectant and lower heat reduce it." },
      track: true,
    });
    if (a.heat === "daily" && direction === "grow") {
      add({
        id: "heatfree",
        when: "weekly",
        title: "Two heat-free days",
        detail: "Air-dry, or try a no-heat style (braid, twist, bun) two days this week.",
        why: { rule: "RT7b_heat_free", text: "You're growing it out, so fewer split ends means fewer centimetres lost at each trim." },
        track: true,
      });
    }
  }

  // RT8: weekly treatment.
  const needsMask = curlyish || a.chemical === "bleach" || a.chemical === "straightened" || (longish && direction === "grow");
  add({
    id: "mask",
    when: needsMask ? "weekly" : "monthly",
    title: needsMask ? "Hair mask once a week" : "Hair mask once a month",
    detail: "Instead of conditioner on one wash day: 5–10 minutes on the lengths, then rinse.",
    product: "deep-conditioning mask",
    why: {
      rule: "RT8_mask",
      text: needsMask
        ? [curlyish && "curly and coily hair loses moisture fastest", a.chemical === "bleach" && "bleached hair is more porous", a.chemical === "straightened" && "chemically straightened hair is more fragile", longish && direction === "grow" && "the ends you're growing are getting older"]
            .filter(Boolean)
            .join("; ")
            .replace(/^./, (c) => c.toUpperCase()) + "."
        : "An occasional treatment keeps the ends soft; more often isn't needed for your hair.",
    },
    track: needsMask,
  });

  // RT9: bond repair for bleach or relaxers.
  if (a.chemical === "bleach" || a.chemical === "straightened") {
    add({
      id: "bond",
      when: "weekly",
      title: "Bond-building treatment",
      detail: "Follow the instructions on the pack; most go on before shampoo.",
      product: "bond-building treatment",
      why: { rule: "RT9_bond", text: "Bleach and chemical straighteners break bonds inside the hair; these treatments are made for exactly that." },
      track: true,
    });
  }

  // RT10: clarify when products or oil build up.
  if (a.scalp === "oily" || target.maintenance === "high") {
    add({
      id: "clarify",
      when: "monthly",
      title: "Clarifying wash",
      detail: chemical ? "Once a month at most, and follow with a mask: clarifiers can fade colour." : "Swap your usual shampoo for a clarifying one, once.",
      product: "clarifying shampoo",
      why: { rule: "RT10_clarify", text: a.scalp === "oily" ? "Oil and product build up on an oily scalp and weigh the roots down." : "This look uses more styling product, which builds up over weeks." },
      track: false,
    });
  }

  // RT11: night care.
  if (curlyish || (longish && direction === "grow")) {
    add({
      id: "night",
      when: "daily",
      title: "Protect it overnight",
      detail: curlyish ? "Satin bonnet or pillowcase; loosely gather curls on top of your head." : "Satin pillowcase, or a loose braid. No tight elastics.",
      product: "satin pillowcase or bonnet",
      why: { rule: "RT11_night", text: "Cotton pulls moisture and rubs the ends; smoother fabric means less friction and frizz." },
      track: true,
    });
  }

  // RT12: active life.
  if (a.active === "gym") {
    add({
      id: "sweat",
      when: "daily",
      title: "After a workout: rinse, don't shampoo",
      detail: "Rinse with water (and conditioner on the ends) on workout days that aren't wash days.",
      why: { rule: "RT12_sweat", text: "Sweat dries salty on the scalp; a rinse clears it without adding extra shampoo washes." },
      track: false,
    });
  } else if (a.active === "swim") {
    add({
      id: "swim",
      when: "weekly",
      title: "Before the pool: wet it and seal it",
      detail: "Soak hair with clean water and add leave-in before swimming, rinse straight after.",
      product: "leave-in conditioner + swim cap",
      why: { rule: "RT12_swim", text: "Hair that's already full of clean water absorbs less chlorinated water." },
      track: true,
    });
  }

  // RT13: scalp care notes.
  if (a.scalp === "flaky") {
    add({
      id: "flakes",
      when: "phase",
      title: "If flakes or itching last more than a month",
      detail: "Ask a pharmacist or doctor. ManeRoute doesn't assess scalps.",
      why: { rule: "RT13_scalp", text: "Some flaking needs a treatment a shampoo can't give; that's a question for a professional." },
      track: false,
    });
  }

  // RT14: trims, from where the user is on the route.
  const trimEveryDays = trimDays(band, direction);
  add({
    id: "trim",
    when: "phase",
    title: direction === "grow" ? `Dust the ends every ${Math.round(trimEveryDays / 7)} weeks` : `Trim every ${Math.round(trimEveryDays / 7)} weeks`,
    detail:
      direction === "grow"
        ? veryShort && target.home === "barbershop"
          ? "Ask for the neckline and around the ears to be tidied while the top grows. Say “keep the length on top”."
          : "Ask for “shape only, keep the length”: a few millimetres off the ends, not a cut."
        : "Book it before the shape grows out. Bring your ManeRoute card.",
    why: {
      rule: "RT14_trim",
      text:
        direction === "grow"
          ? "Growing hair still needs the split ends gone, or they travel up and you lose more later."
          : `A ${shortBandName(band)} shape loses its outline in about ${Math.round(trimEveryDays / 7)} weeks.`,
    },
    track: false,
  });

  // RT15: the awkward phase of a grow-out.
  if (direction === "grow" && (band === "ear_length" || band === "short")) {
    add({
      id: "awkward",
      when: "phase",
      title: "Getting through the in-between",
      detail: curlyish
        ? "Define curls with a cream so the shape reads as intentional; pin the sides back on bad days."
        : "Tuck behind the ears, try a side part, use a headband or clips on bad days, and ask for the back to be shaped so it grows evenly.",
      why: { rule: "RT15_awkward", text: `${shortBandName(band)} is the stage most people give up at on the way to ${target.name}. It passes.` },
      track: false,
    });
  }

  return { texture, textureSource, washesPerWeek: washes, trimEveryDays, steps };
}

function styleStep(
  target: RoutineInput["target"],
  texture: TextureGroup | null,
  minutes: RoutineAnswers["minutes"],
  band: LengthBand,
  direction: Direction,
): RoutineStep {
  // Style the hair you have today; the destination only decides the finish once there's length for it.
  const short = idx(band) <= idx("ear_length");
  const wantsCurl = target.textureNeed === "curly" || target.textureNeed === "coily";
  const wantsWave = target.textureNeed === "wavy";
  const curly = texture === "curly" || texture === "coily";
  const why = (text: string): RoutineStep["why"] => ({ rule: "RT5_style", text });

  if (curly) {
    return {
      id: "style",
      when: "wash",
      title: "Define on soaking-wet hair",
      detail: "Rake or scrunch in a curl cream or gel while hair is dripping, then air-dry or diffuse. Don't touch it until it's dry.",
      product: "curl cream or gel",
      why: why("Curls hold their shape best when product goes on wet and the curl is left to set."),
      track: true,
    };
  }
  if (short) {
    return {
      id: "style",
      when: "daily",
      title: minutes <= 2 ? "Two-minute shape" : "Shape and set",
      detail:
        minutes <= 2
          ? "Towel-dry, rub a pea-sized amount between your palms, push into shape with your fingers."
          : "Blow-dry in the direction you want it to sit, then a little product with your fingertips.",
      product: direction === "grow" ? "light styling cream" : "matte paste or clay",
      why: why(
        direction === "grow"
          ? `Your hair is ${shortBandName(band).toLowerCase()} today; a light cream gives it shape while it grows, without weighing it down.`
          : `Short cuts like ${target.name} get their shape from a small amount of product, not from time.`,
      ),
      track: true,
    };
  }
  if ((wantsWave || wantsCurl) && texture === "straight") {
    return {
      id: "style",
      when: "daily",
      title: minutes >= 15 ? `Style in the ${wantsCurl ? "curl" : "wave"}` : "Add some movement",
      detail:
        minutes >= 15
          ? "Texture spray on damp hair, then twist sections and dry, or use a large curling iron on a few pieces."
          : "Texture spray on damp hair and scrunch. It won't match the preview fully without heat or a perm.",
      product: "sea salt or texture spray",
      why: why(`The ${wantsCurl ? "curl" : "wave"} in ${target.name} isn't in straight hair naturally, so it has to be styled in.`),
      track: true,
    };
  }
  if (wantsWave || wantsCurl) {
    return {
      id: "style",
      when: "wash",
      title: "Scrunch and let it dry",
      detail: "On damp hair, scrunch in a little mousse or wave cream, then air-dry or diffuse on low. Hands off while it dries.",
      product: "light mousse or wave cream",
      why: why(
        texture === "wavy"
          ? `${target.name} uses the wave you already have; scrunching on damp hair brings it out.`
          : `${target.name} relies on wave. Scrunching on damp hair brings out any natural movement (the texture scan would tell you how much).`,
      ),
      track: true,
    };
  }
  return {
    id: "style",
    when: "daily",
    title: minutes >= 15 ? "Smooth and finish" : "Quick finish",
    detail:
      minutes >= 15
        ? "Rough-dry to 80%, then dry with a brush for shape; one drop of oil on the ends."
        : "Comb into shape while damp and let it air-dry; one drop of oil on the ends.",
    product: "lightweight hair oil or serum",
    why: why(`${target.name} is mostly about the cut; a light finish keeps the ends from looking dry.`),
    track: true,
  };
}

function trimDays(band: LengthBand, direction: Direction): number {
  if (direction === "grow") return band === "above_ears" || band === "ear_length" ? 42 : 77;
  return { above_ears: 25, ear_length: 38, short: 49, above_chest: 70, long: 84 }[band];
}

function shortBandName(b: LengthBand) {
  return { above_ears: "Above-the-ears", ear_length: "Ear-length", short: "Short", above_chest: "Medium", long: "Long" }[b];
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
