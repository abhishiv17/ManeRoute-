// What to say in the chair: each cut in barber and stylist language, and the order to ask for
// the cuts on a route. Kept apart from the generated catalog so re-running the catalog script
// never wipes it. Lengths are starting points in centimetres (clipper guards in mm); the barber
// adapts them to the hair in front of them.
import type { LengthBand, TargetStyle } from "./types.ts";

export type BarberScript = {
  /** The one sentence to say in the chair. */
  ask: string;
  /** Lengths, technique and finish, to agree on before cutting. */
  details: string[];
  /** How it's worn day to day. */
  styling: string;
};

const S = (ask: string, details: string[], styling: string): BarberScript => ({ ask, details, styling });

const SCRIPTS: Record<string, BarberScript> = {
  // ---------- above the ears ----------
  "buzz-cut": S(
    "A buzz cut: one clipper length all over, about a #2 (6 mm).",
    ["Same guard everywhere, or one guard shorter on the sides for a tidier shape", "Neckline squared or natural, cleaned with a trimmer", "Edges lined up around the ears"],
    "Nothing to style. A re-buzz every 2–3 weeks keeps it sharp.",
  ),
  "soft-buzz-cut": S(
    "A soft buzz: about a #3–#4 (10–13 mm) on top, blended a guard shorter at the sides, with soft edges instead of a sharp line-up.",
    ["Tapered outline, not squared", "A little extra length at the front hairline so it isn't harsh"],
    "Towel-dry and go. Tidy every 3–4 weeks.",
  ),
  "crew-cut": S(
    "A classic crew cut: 2–3 cm (about 1 in) on top, slightly longer at the front, tapered short at the sides and back (#2 down to #1).",
    ["A taper, not a skin fade, unless you want it sharper", "Top scissor-cut so the front can be pushed up", "Tapered neckline"],
    "A pea-sized bit of matte paste pushed up at the front.",
  ),
  "textured-crew-cut": S(
    "A textured crew cut: 3–4 cm (1.5 in) on top, point-cut for texture, with a short taper at the sides (#2 blending to #1).",
    ["Texturise the top with point cutting, not a blunt line", "Front left slightly longer to push up or forward", "Sides tapered, not faded to skin"],
    "Matte clay worked through with your fingers.",
  ),
  "messy-tapered-fade": S(
    "A tapered fade with a messy top: 5–7 cm (2–3 in) on top, heavily texturised, faded at the sides from about a #2 down to a #0.5.",
    ["Pick the fade height: a low fade is softer, a mid fade is sharper", "Top point-cut or razor-cut for movement", "Blend the top into the fade, no disconnection"],
    "Sea-salt spray, then a little clay, scrunched. Refresh the fade every 2–3 weeks.",
  ),
  "taper-fade": S(
    "A taper fade: keep the length on top, and taper just the sideburns and neckline from about a #3 down to a #1.",
    ["Taper only at the temples and nape, not a full fade", "Top tidied and shaped, length kept", "Clean, natural neckline"],
    "Low maintenance. Tidy the taper every 3–4 weeks.",
  ),
  "textured-crop": S(
    "A textured crop: a short, choppy top of 4–6 cm (about 2 in) cut forward into a short fringe, with a mid fade at the sides.",
    ["Fringe cut straight, then point-cut so it breaks up", "Mid or high fade from about a #2 down", "Heavy texture through the top"],
    "Matte paste, fingers forward. Fade every 2–3 weeks.",
  ),
  "short-curly-top": S(
    "Keep the curls on top (5–8 cm, 2–3 in), cut dry curl by curl, with a short fade or taper at the sides.",
    ["Top cut dry so the curl pattern shows", "Sides faded from about a #2 down, height to suit your head shape", "Curls shaped round, not boxy"],
    "Curl cream or leave-in on damp hair. Don't brush the curls out.",
  ),
  "textured-comma": S(
    "A comma cut: 8–10 cm (3–4 in) at the front, curved down and in over one brow, with short tapered sides.",
    ["Front at least eyebrow length so it can curve", "Layers through the top so it falls in a curve", "Tapered sides around a #2–#3, no high fade"],
    "Blow-dry the front down and in with a round brush, then a little cream.",
  ),
  "side-swept-undercut": S(
    "A disconnected undercut: sides and back clippered short (#1–#2), top kept 8–12 cm (3–5 in) and swept to one side.",
    ["Disconnected: no blend between the sides and the top", "Parting on your natural side; a shaved hard part only if you want one", "Top lightly layered so it lies over"],
    "Blow-dry to the side, then pomade or cream.",
  ),
  "wavy-undercut": S(
    "An undercut with a wavy top: sides short (#1–#2), top kept 8–12 cm (3–5 in) and cut so the wave can form.",
    ["Top cut with light layers, ideally dry, to keep the wave", "Sides disconnected or softly blended: your choice", "Don't thin the top out"],
    "Sea-salt spray or curl cream, then air-dry.",
  ),
  combover: S(
    "A classic side part: 6–8 cm (2.5–3 in) on top, scissor-over-comb taper at the sides (#2–#3), parted on your natural side.",
    ["Find your natural parting first; a shaved hard part is optional", "Top layered so it combs over flat", "Classic taper, not a skin fade"],
    "Comb through with pomade, side to side.",
  ),
  pixie: S(
    "A soft pixie: short at the back and around the ears (2–4 cm), 5–7 cm (2–3 in) on top, point-cut for texture.",
    ["Tapered, scissor-cut nape", "Top point-cut so it's soft, not blunt", "Sideburns cut to a soft point"],
    "A little paste through the top. Trim every 4–6 weeks.",
  ),

  // ---------- ear length ----------
  "tousled-cut": S(
    "A loose, layered scissor cut around the ears: 7–10 cm (3–4 in) on top, covering the tops of the ears.",
    ["Scissors only, no clippers, so it stays soft", "Layers through the top for movement", "Neckline tidied but natural"],
    "Towel-dry, a little texture spray, scrunch.",
  ),
  "wispy-fringe-pixie": S(
    "An ear-length pixie with a wispy fringe: sides over the ears, and a long, thinned fringe you can see through.",
    ["Fringe point-cut or razor-cut, not blunt", "Length around the ears left soft", "Texture through the crown"],
    "Blow-dry the fringe flat, then a touch of light cream.",
  ),
  "bixie-cut": S(
    "A bixie: between a bob and a pixie, ear to cheekbone length, with layers through the crown.",
    ["Back and sides shorter, around the ear", "Crown layered for lift", "Soft, slightly longer front pieces"],
    "Rough-dry, then texture spray.",
  ),

  // ---------- short (to the jaw) ----------
  "full-afro": S(
    "Shape the afro into a full, round outline: trim evenly while it's picked out, and keep the length.",
    ["Shaped while picked out (or cut dry) so the round silhouette shows", "Only uneven or damaged ends removed", "Hairline edged up if you like a crisp outline"],
    "Moisturise, pick out from the roots, and sleep on satin.",
  ),
  "tousled-waves": S(
    "A grown-in wavy cut to the jaw: long layers, length kept at the jaw, ends point-cut so the waves separate.",
    ["Cut or checked dry so the wave sits right", "Light layers only; keep the weight in the ends", "Long enough around the ears to tuck"],
    "Sea-salt spray or curl cream on damp hair, then air-dry.",
  ),
  "short-bob": S(
    "A short bob at the jaw, one clean line, no layers.",
    ["Level all round, or a touch shorter at the back", "Cut on straightened hair for a crisp line", "Weight kept in the ends"],
    "Round-brush blow-dry. Trim every 6–8 weeks.",
  ),
  "bob-with-fringe": S(
    "A chin-length bob with a full, straight fringe to the eyebrows.",
    ["Fringe blunt at the brows, slightly longer at the edges", "Bob line level at the chin", "Check your cowlicks before cutting the fringe"],
    "Blow-dry the fringe flat first. Fringe trim every 3–4 weeks.",
  ),
  "blunt-bob": S(
    "A one-length blunt bob: one sharp line just below the jaw, no layers, no thinning.",
    ["Cut blunt with scissors, no thinning shears", "Level or a slight A-line: decide in the chair", "Best checked on straight, dry hair"],
    "Smooth blow-dry or a flat iron for the crisp edge.",
  ),
  "french-bob": S(
    "A French bob: cheekbone to jaw length, a soft brow-length fringe, and a slightly undone finish.",
    ["Length between the cheekbone and the jaw", "Fringe soft, not blunt", "A little texture in the ends so it isn't too neat"],
    "Air-dry or rough-dry with a little texture spray.",
  ),
  "choppy-bob": S(
    "A choppy bob at the jaw: point-cut or razor-cut ends for a piecey texture, with a textured fringe.",
    ["Ends texturised so they break up", "Light internal layers", "Fringe cut with texture, not blunt"],
    "Texture spray or paste; twist a few pieces.",
  ),
  "tousled-bob": S(
    "A tousled bob just below the jaw: soft layers and textured ends for an undone wave.",
    ["Light layers to release the wave", "Ends point-cut, not blunt", "Checked dry if your hair waves"],
    "Salt spray, scrunch, air-dry.",
  ),
  "slicked-back-bob": S(
    "A jaw-length, one-length bob cut so it can be slicked back off the face.",
    ["Long enough at the front to go back and tuck behind the ears", "No fringe", "Minimal layers so it lies flat"],
    "Gel or pomade combed back through damp hair.",
  ),
  "curly-bob": S(
    "A curly bob cut dry, curl by curl, to sit around the jaw.",
    ["Dry, curl-by-curl cut so length isn't lost when it springs up", "Rounded shape, no shelf at the back", "Expect it to sit shorter dry than it measures wet"],
    "Curl cream and gel on wet hair, then diffuse or air-dry.",
  ),
  "wavy-bob": S(
    "A wavy bob around the jaw: light layers and textured ends so the waves can form.",
    ["Cut or checked dry", "Weight kept at the ends; don't over-layer", "Jaw to just below"],
    "Mousse or wave spray, scrunch, diffuse.",
  ),
  "wavy-bob-with-fringe": S(
    "A wavy jaw-length bob with a soft fringe cut to sit with your wave.",
    ["Fringe cut longer than you want: it shrinks when it waves", "Light layers, textured ends", "Checked dry"],
    "Mousse, scrunch, and smooth the fringe with a little cream.",
  ),
  "mid-part-bob": S(
    "A centre-parted bob just above the shoulders, one length, clean ends.",
    ["Between the jaw and the shoulders, so it doesn't flip on them", "Centre parting", "Minimal layers"],
    "Straight blow-dry. Trim every 6–8 weeks.",
  ),
  "classic-straight-lob": S(
    "A classic lob: one length, 2–3 cm above the shoulders, clean ends.",
    ["Blunt or very lightly layered", "Line kept even all round", "Ends trimmed clean"],
    "Smooth blow-dry or flat iron.",
  ),
  "lob-with-fringe": S(
    "A shoulder-grazing lob with a fringe: curtain or full, decided in the chair.",
    ["Length at the shoulder", "A curtain fringe is the easiest to grow out", "Light layers at the ends"],
    "Round-brush the fringe; loose waves optional.",
  ),
  "wavy-lob": S(
    "A wavy lob grazing the shoulders: long layers and soft ends so the wave falls.",
    ["Light layers", "Length at the shoulders", "Checked dry"],
    "Salt spray or mousse, then scrunch.",
  ),
  "short-feather-cut": S(
    "A short feather cut: feathered layers around the face and crown, chin to jaw length, with a soft fringe.",
    ["Razor- or point-cut feathered layers", "Face-framing layers that flick away from the face", "Soft fringe"],
    "Round-brush blow-dry, flicking the ends out.",
  ),
  afro: S(
    "Shape the afro into a full round: trim evenly while it's picked out, and keep the length.",
    ["Shaped while picked out, or cut dry", "Even, round silhouette", "Only damaged ends removed"],
    "Moisturise, pick from the roots, satin at night.",
  ),

  // ---------- medium (collarbone and past the shoulders) ----------
  "grown-out-waves": S(
    "A grown-out wavy cut past the shoulders: long layers, length kept, only split ends removed.",
    ["Long, soft layers starting below the chin", "Ends dusted (0.5–1 cm), no length taken", "Face-framing pieces only if you want it off the face"],
    "Curl cream or salt spray, then air-dry or diffuse.",
  ),
  locs: S(
    "Book a loctician to start locs, and agree the method (comb coils, two-strand twists or interlocking) and the part size.",
    ["Not a cut: locs are started and maintained by a loc specialist", "Ask how long your hair needs to be to start", "Plan a retwist every 4–8 weeks"],
    "Residue-free shampoo, and dry them thoroughly after washing.",
  ),
  "soft-layered-medium-cut": S(
    "A collarbone-length cut with soft face-framing layers, ends flipped out, and a soft fringe.",
    ["Length at the collarbone", "Face framing starting at the cheekbone", "Curtain or wispy fringe"],
    "Round-brush blow-dry, flicking the ends outward.",
  ),
  "face-framing-shag": S(
    "A face-framing shag at the collarbone: choppy layers around the face and crown, with a curtain fringe to the cheekbone.",
    ["Lots of layers through the crown and around the face", "Ends kept lighter", "Curtain fringe at the cheekbone"],
    "Mousse, scrunch, then diffuse or air-dry.",
  ),
  "wavy-shag": S(
    "A wavy shag: shaggy layers through the crown, longer ends to the collarbone, and a fringe cut for your wave.",
    ["Cut or checked dry", "Heavy layers on top, lighter ends", "Fringe cut longer than the final length: it shrinks"],
    "Curl cream, scrunch, diffuse.",
  ),
  "wolf-cut": S(
    "A wolf cut: heavy, choppy layers on top and at the crown blending into longer ends past the shoulders, with a curtain fringe.",
    ["Short crown layers, long thinned ends", "Razor- or point-cut for the shaggy finish", "Curtain or wispy fringe"],
    "Texture spray, rough-dry, scrunch.",
  ),
  "hush-cut": S(
    "A hush cut: soft, airy layers throughout, face-framing from the cheekbone, and a wispy fringe, at the collarbone or below.",
    ["Lots of light, wispy layers", "Face framing from the cheekbone", "Fringe soft and see-through"],
    "Rough-dry with a little light cream.",
  ),
  "medium-curved-layers": S(
    "A medium cut below the shoulders with long layers and ends cut to curve under.",
    ["Long layers, mostly in the lower half", "Ends cut with a slight curve", "No fringe"],
    "Round-brush blow-dry, curling the ends under.",
  ),
  "shoulder-length-curtain-waves": S(
    "A shoulder-length cut with a centre part, a curtain fringe to the cheekbone, and long layers for loose waves.",
    ["Curtain fringe at the cheekbone", "Long layers", "Length around the shoulders"],
    "Waves with a wand, or air-dried with mousse.",
  ),
  "loose-waves": S(
    "Long layers past the shoulders so loose waves can fall, keeping the length.",
    ["Long layers starting below the chin", "Only the ends trimmed", "Checked dry if you wave naturally"],
    "Mousse or wave spray and a diffuser, or a large curling wand.",
  ),
  "gentle-waves": S(
    "Keep the length past the shoulders, with soft long layers that support a gentle wave.",
    ["Very light layers", "Even, healthy ends", "No heavy thinning"],
    "Air-dry with a light cream, or loose wand waves.",
  ),
  "defined-waves": S(
    "Long layers past the shoulders, placed to hold a defined wave pattern.",
    ["Cut or checked dry", "Layers where the wave turns", "Weight kept at the ends"],
    "Gel or mousse on wet hair, scrunch, diffuse.",
  ),
  "hollywood-waves": S(
    "A one-length or lightly layered cut past the shoulders with a deep side part, ready for sculpted vintage waves.",
    ["Mostly one length so the waves line up", "Deep side part", "Smooth, healthy ends"],
    "Set with a curling iron or rollers, brush out, pin the waves. Needs styling time.",
  ),

  // ---------- long ----------
  "c-curl-layers": S(
    "Long layers with the ends cut to curve inward (a C-curl cut), length kept long.",
    ["Long layers through the ends", "Ends cut so they turn inward", "Face-framing pieces optional"],
    "Round brush or curling iron, curling the ends in. A C-curl perm is optional.",
  ),
  "beachy-waves": S(
    "Keep it long, with long layers and textured ends for beachy texture.",
    ["Long layers", "Ends point-cut so they separate", "Only damaged ends trimmed"],
    "Salt spray, twist, air-dry.",
  ),
  "bouncy-curls": S(
    "A long curly cut, cut dry curl by curl, with layers for volume and bounce.",
    ["Dry, curl-by-curl cut", "Layers to avoid a triangle shape", "Expect shrinkage: it looks shorter dry"],
    "Curl cream and gel, then diffuse.",
  ),
  "straight-with-blunt-fringe": S(
    "Long one-length hair with a heavy blunt fringe to the eyebrows.",
    ["Length kept, ends cut blunt", "Fringe blunt at the brows", "Check your cowlicks before committing to the fringe"],
    "Smooth blow-dry or flat iron.",
  ),
  "long-straight-with-fringe": S(
    "Long, sleek length with a full fringe; very light long layers optional.",
    ["Length kept, ends trimmed only", "Full fringe to the brows, softened at the edges", "Light long layers if you want movement"],
    "Smooth blow-dry. Fringe trim every 3–4 weeks.",
  ),
  "side-part-straight": S(
    "Long, straight one-length hair with a side part and light face framing at the front.",
    ["Length kept; blunt or lightly layered ends", "Side part on your natural side", "Face framing at the cheekbone, optional"],
    "Smooth blow-dry or flat iron.",
  ),
  "long-soft-waves": S(
    "Long hair with soft long layers for a soft wave.",
    ["Long layers", "Healthy ends, trimmed only", "Light face framing"],
    "Loose wand waves, or a braid-out overnight.",
  ),
  "long-boho-waves": S(
    "Long hair with long layers and a middle part for relaxed boho waves.",
    ["Long layers", "Middle part", "Textured ends"],
    "Braid damp hair overnight, or salt spray.",
  ),
  "romantic-waves": S(
    "Long hair with long layers and face-framing pieces from the chin, for soft romantic waves.",
    ["Long layers", "Face framing from the chin", "Healthy ends"],
    "Large curling iron, brushed out softly.",
  ),
  "long-spiral-curls": S(
    "A long curly cut, cut dry curl by curl, to define spiral curls.",
    ["Dry, curl-by-curl cut", "Layers for shape; no thinning shears", "Expect shrinkage"],
    "Curl cream and gel, finger-coil, diffuse.",
  ),
  "hime-cut": S(
    "A hime cut: long length, a blunt fringe, and blunt side sections at the cheekbone to jaw.",
    ["Side sections cut blunt between the cheekbone and the jaw", "Blunt fringe at the brows", "Back kept long and one length"],
    "Flat iron for the sharp lines. Trim the sides and fringe every 4–6 weeks.",
  ),
};

/** The barber script for a catalog cut, or a plain fallback built from its description. */
export function scriptFor(style: TargetStyle): BarberScript {
  return SCRIPTS[style.id] ?? S(`${style.name}: ${style.description}`, [], "Ask your stylist how to style it day to day.");
}

export function hasScript(id: string): boolean {
  return id in SCRIPTS;
}

const ORDER: LengthBand[] = ["above_ears", "ear_length", "short", "above_chest", "long"];
const BAND_WORDS: Record<LengthBand, string> = {
  above_ears: "above the ears",
  ear_length: "ear length",
  short: "short (to the jaw)",
  above_chest: "medium (past the shoulders)",
  long: "long",
};

export type ChairStep = {
  /** When to ask for it: "Your next appointment", "Once it reaches …". */
  when: string;
  /** What it is: a catalog cut name, or "Grow-out trims". */
  title: string;
  ask: string;
  details: string[];
  styling?: string;
  /** The catalog cut this step asks for, when there is one. */
  styleId?: string;
};

const GROW_TRIM: Omit<ChairStep, "when"> = {
  title: "Grow-out trims",
  ask: "A tidy-up only: dust the ends (about 0.5–1 cm), keep the length everywhere, and neaten the neckline and around the ears.",
  details: ["Ask them not to take length from the parts you're growing", "Every 6–8 weeks keeps it neat while it grows"],
};

/**
 * The order of cuts to ask for, from the next appointment to the destination. It follows the
 * length bands, not the clock: a later step is asked for once a check-in reaches its length.
 */
export function chairPlan(current: LengthBand, target: TargetStyle, stages: TargetStyle[]): ChairStep[] {
  const cur = ORDER.indexOf(current);
  const tgt = ORDER.indexOf(target.targetLengthBand);
  const step = (when: string, s: TargetStyle): ChairStep => ({ when, title: s.name, styleId: s.id, ...scriptFor(s) });

  if (tgt <= cur) {
    const first = step("Your next appointment", target);
    if (cur - tgt >= 2) {
      first.details = [...first.details, "A big change: you can take it down over two visits to check the shape on the way"];
    }
    return [first];
  }
  const steps: ChairStep[] = stages.length
    ? stages.map((s, i) => step(i === 0 ? "Your next appointment" : `Once it reaches ${BAND_WORDS[s.targetLengthBand]}`, s))
    : [{ when: "Until it's long enough", ...GROW_TRIM }];
  steps.push(step(`Once it reaches ${BAND_WORDS[target.targetLengthBand]}`, target));
  return steps;
}
