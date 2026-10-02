// "Finish the look": beard, fringe and colour, applied on top of a haircut try-on.
// Each option is a YouCam template (beard-style, hair-bang) or a colour (hair-color), with what to
// ask for in the chair. Template ids were listed from YouCam on 2 Oct 2026
// (GET /s2s/v2.0/task/template/beard-style and /hair-bang); thumbnails are kept in public/addons.
import type { Collection } from "./types.ts";

export type FinishKind = "beard" | "bangs" | "color";

export type FinishOption = {
  kind: FinishKind;
  /** YouCam template id (beard, bangs) or our colour id. */
  id: string;
  name: string;
  /** Hex colour sent to YouCam Hair Color (colour options only). */
  hex?: string;
  thumb?: string;
  ask: string;
  details: string[];
};

/** One finish applied to a look. */
export type Finish = { kind: FinishKind; id: string; name: string };

export const FINISH_LABELS: Record<FinishKind, string> = { beard: "Beard", bangs: "Fringe", color: "Colour" };

const beard = (id: string, name: string, ask: string, details: string[]): FinishOption => ({
  kind: "beard",
  id,
  name,
  thumb: `/addons/beard/${id}.jpg`,
  ask,
  details,
});

export const BEARDS: FinishOption[] = [
  beard("all_shaved", "Clean-shaven", "A full shave: everything off, with a hot towel if they offer it.", ["Shave with the grain first to avoid irritation", "Ask for the sideburns to be squared at the same height"]),
  beard("all_goatee", "Goatee", "A goatee: chin and moustache only, cheeks and neck shaved clean.", ["Keep it about 6–9 mm (#2–#3)", "Edges shaped to the width of your mouth", "Shave the cheeks and neck"]),
  beard("all_circle", "Circle beard", "A circle beard: a rounded goatee joined to the moustache, cheeks shaved.", ["About 6 mm (#2) all round", "Round the bottom at the chin", "Cheeks and neck shaved clean"]),
  beard("all_anchor", "Anchor", "An anchor beard: a pointed chin strip along the jaw with a separate moustache, no sideburns.", ["Chin strip shaped to a point", "Moustache trimmed separately, not joined", "Cheeks and sideburns shaved"]),
  beard("all_soul_patch", "Soul patch", "A soul patch: a small patch just under the lower lip, everything else shaved.", ["Keep it narrow: no wider than the gap under your lip", "About 3–6 mm"]),
  beard("all_mustache", "Moustache", "A full moustache, everything else shaved.", ["Trim the line just above the top lip", "Leave the ends natural or slightly tapered"]),
  beard("all_walrus", "Walrus moustache", "A heavy walrus moustache grown long over the lip, everything else shaved.", ["Needs several months of growth before the first shaping", "Ask only for the edges to be cleaned while it grows"]),
  beard("all_horse_shoe", "Horseshoe moustache", "A horseshoe moustache: a full moustache with bars running down to the jaw, chin and cheeks shaved.", ["Bars kept the same width as the moustache", "Chin shaved clean between the bars"]),
  beard("all_chin_curtain", "Chin curtain", "A chin curtain: a line of beard along the jaw from ear to ear, no moustache.", ["About 1–2 cm wide along the jawline", "Moustache and cheeks shaved"]),
  beard("all_mutton_chops", "Mutton chops", "Mutton chops: long, wide sideburns down to the jaw, chin shaved.", ["Sideburns grown wide and blended into the jaw", "Chin and moustache shaved, or a moustache left if you like"]),
  beard("all_garibaldi", "Garibaldi", "A Garibaldi: a full, wide beard with a rounded bottom, about 10–15 cm long.", ["Rounded at the bottom, wide at the jaw", "Moustache blended into the beard", "Needs several months of growth"]),
  beard("all_bandholz", "Bandholz", "A Bandholz: a full beard grown long and kept natural, shaped only at the edges.", ["Cheek line left natural", "Neckline cleaned about two fingers above the Adam's apple", "Several months of growth before shaping"]),
  beard("all_long_bandholz", "Long Bandholz", "A long Bandholz: a full beard grown well past the chin, shaped only at the edges.", ["Bottom kept full, not pointed", "Neckline and cheek line tidied only", "A long-term grow"]),
  beard("all_ducktail", "Ducktail", "A ducktail: a full beard, short at the sides and tapered to a point at the chin.", ["Sides about 1 cm, longer at the chin", "Taper the bottom to a point", "Neckline two fingers above the Adam's apple"]),
  beard("all_french_fork", "French fork", "A French fork: a long full beard split into two points at the chin.", ["Needs a long beard first (10 cm and more)", "Ask for the split to be shaped with scissors"]),
];

const bang = (id: string, name: string, ask: string, details: string[]): FinishOption => ({
  kind: "bangs",
  id,
  name,
  thumb: `/addons/bangs/${id}.jpg`,
  ask,
  details,
});

const BANG_SCRIPTS: Record<string, { ask: string; details: string[] }> = {
  wispy_bangs: { ask: "A wispy fringe: long and see-through, point-cut so it breaks up.", details: ["Start longer than you want; it can always go shorter", "Thinned, not blunt"] },
  wispy_bangs_2: { ask: "A soft, wispy fringe sitting just at the brows.", details: ["Point-cut so you can see the forehead through it", "Blended into the sides"] },
  sleek_bangs: { ask: "A sleek, straight fringe to the brows.", details: ["Cut on dry, straightened hair", "Check your cowlicks first"] },
  mini_fringe: { ask: "A mini fringe: short and straight, well above the brows.", details: ["A bold look: start a little longer and take it up", "Trim every 2–3 weeks to keep it short"] },
  split_mini_fringe: { ask: "A short, centre-split fringe above the brows.", details: ["Parted in the middle", "Point-cut so the halves fall apart naturally"] },
  split_bangs: { ask: "A centre-parted fringe that falls to both sides (curtain style).", details: ["Longest at the cheekbones, shortest in the middle", "The easiest fringe to grow out"] },
  blunt_bangs: { ask: "A full, blunt fringe cut straight across at the brows.", details: ["Cut blunt, no thinning", "Check your cowlicks first", "Fringe trims every 3–4 weeks"] },
  thin_bangs: { ask: "A thin, light fringe: just a few pieces across the forehead.", details: ["Taken from a small section at the front", "Easy to sweep aside on off days"] },
  right_side_swept: { ask: "A side-swept fringe falling to the right.", details: ["Longest at the cheekbone, shortest over the left brow", "Blended into the side layers"] },
  left_side_swept: { ask: "A side-swept fringe falling to the left.", details: ["Longest at the cheekbone, shortest over the right brow", "Blended into the side layers"] },
};
const BANG_NAMES: Record<string, string> = {
  wispy_bangs: "Wispy",
  wispy_bangs_2: "Soft wispy",
  sleek_bangs: "Sleek",
  mini_fringe: "Mini",
  split_mini_fringe: "Split mini",
  split_bangs: "Curtain",
  blunt_bangs: "Blunt",
  thin_bangs: "Thin",
  right_side_swept: "Swept right",
  left_side_swept: "Swept left",
};

export const BANGS: FinishOption[] = (["male", "female"] as const).flatMap((g) =>
  Object.keys(BANG_SCRIPTS).map((k) => bang(`${g}_${k}`, `${BANG_NAMES[k]} fringe`, BANG_SCRIPTS[k].ask, BANG_SCRIPTS[k].details)),
);

/** The fringe templates for a list: YouCam's male set for Men's, the female set otherwise. */
export function bangsFor(shelf: Collection | "all"): FinishOption[] {
  const prefix = shelf === "barbershop" ? "male_" : "female_";
  return BANGS.filter((b) => b.id.startsWith(prefix));
}

const colour = (id: string, name: string, hex: string, ask: string, details: string[]): FinishOption => ({ kind: "color", id, name, hex, ask, details });

export const COLOURS: FinishOption[] = [
  colour("soft-black", "Soft black", "#1f1a17", "All-over colour in a soft black (not blue-black).", ["A dark shade can usually go on without lightening", "Ask for a gloss to keep it from looking flat"]),
  colour("dark-brown", "Dark brown", "#3a2a20", "All-over colour in a rich dark brown.", ["Close to most natural dark hair: low upkeep", "Ask for a gloss every 6–8 weeks to keep the shine"]),
  colour("chestnut", "Chestnut", "#5c3a26", "All-over colour in a warm chestnut brown.", ["Warm tones fade: ask about a colour-depositing conditioner", "Lighter than your hair now may need pre-lightening"]),
  colour("caramel", "Caramel", "#8a5c36", "All-over colour in a caramel brown.", ["Dark hair will need lightening first", "Ask for the roots to be blended so regrowth is softer"]),
  colour("honey-blonde", "Honey blonde", "#b8894e", "A warm honey blonde.", ["Dark hair needs lightening, often over more than one visit", "Plan a bond-building treatment and a toner"]),
  colour("ash-blonde", "Ash blonde", "#a89a80", "A cool ash blonde.", ["Needs lightening and a toner to keep it from turning brassy", "A purple shampoo once a week helps"]),
  colour("copper", "Copper", "#a14b28", "A bright copper.", ["Copper fades fastest of all: ask about a refresh glaze", "Usually needs some lightening on dark hair"]),
  colour("burgundy", "Burgundy", "#5d1f2d", "A deep burgundy.", ["Shows best on dark hair without much lightening", "Wash in cool water to slow the fade"]),
  colour("silver", "Silver", "#b9b9bb", "A silver or grey colour.", ["Needs the hair lifted to very pale blonde first: a big, high-upkeep change", "Expect several visits and a toner"]),
];

const ALL = [...BEARDS, ...BANGS, ...COLOURS];

export function getFinishOption(kind: FinishKind, id: string): FinishOption | undefined {
  return ALL.find((o) => o.kind === kind && o.id === id);
}

/** Replaces a finish of the same kind, or adds it. One beard, one fringe and one colour at most. */
export function withFinish(list: Finish[], f: Finish): Finish[] {
  return list.some((x) => x.kind === f.kind) ? list.map((x) => (x.kind === f.kind ? f : x)) : [...list, f];
}

/** What to ask for, for each finish, in the order they were applied. */
export function finishSteps(list: Finish[]): { when: string; title: string; ask: string; details: string[] }[] {
  const WHEN: Record<FinishKind, string> = {
    beard: "Beard · at any visit",
    bangs: "Fringe · at your next appointment",
    color: "Colour · at a colour appointment",
  };
  return list
    .map((f) => ({ f, o: getFinishOption(f.kind, f.id) }))
    .filter((x): x is { f: Finish; o: FinishOption } => Boolean(x.o))
    .map(({ f, o }) => ({ when: WHEN[f.kind], title: o.name, ask: o.ask, details: o.details }));
}
