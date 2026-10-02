// Generator for lib/catalog.ts from YouCam's hair-transfer v2.1 template list
// (scripts/templates.json, from `npm run templates -- --json`) plus the curated table below.
// Re-run after editing the table: node scripts/build-catalog.mjs
//
// Curation rules: haircuts only. Colour-only looks (rainbow, neon, balayage, highlights),
// updos, buns, braids, ponytails, accessories and tied-back looks are left out, because they
// are styling, not a cut to plan with a barber or stylist.
//
// Collections are browsing shelves the user picks ("barbershop", "salon"). They are never
// inferred from the user's photo. Unisex cuts (flag U) sit on both shelves.
// Example pictures live in public/styles/<collection>/<templateId>.jpg: each shelf shows every
// cut on the same example model, so switching shelves never mixes presentations.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const templates = JSON.parse(readFileSync("scripts/templates.json", "utf8"));
const byId = Object.fromEntries(templates.map((t) => [t.id, t]));

// [templateId, name, homeShelf, band, maintenance, commitment, flags, textureNeed, description]
// band: 0 above_ears, 1 ear_length, 2 short, 3 above_chest, 4 long
// flags: U unisex (both shelves), T texture-sensitive, S needs stylist check (technique),
//        C may need chemical treatment, F the template adds a fringe
// textureNeed: any | straight | wavy | curly | coily  (what the preview's texture relies on)
const B = ["above_ears", "ear_length", "short", "above_chest", "long"];
const L = { l: "low", m: "medium", h: "high" };
const TABLE = [
  // ---------- Barbershop shelf ----------
  ["all_buzz_cut", "Buzz cut", "barbershop", 0, "l", "l", "U", "any", "Clipper cut all over, one short length."],
  ["female_buzz_cut", "Soft buzz cut", "barbershop", 0, "l", "l", "U", "any", "Very short all over with a softer outline."],
  ["all_crewcut", "Crew cut", "barbershop", 0, "l", "l", "U", "any", "Short, tapered sides with a little length on top."],
  ["female_crewcut", "Textured crew cut", "barbershop", 0, "l", "l", "U", "any", "Neat crew cut with light texture on top."],
  ["all_messy_tapered_fade", "Messy tapered fade", "barbershop", 0, "m", "l", "UT", "any", "Faded sides with a loose, messy top."],
  ["male_gray_taper_fade", "Taper fade", "barbershop", 0, "m", "l", "", "any", "Gradual taper at the sides and back."],
  ["male_textured_crop", "Textured crop", "barbershop", 0, "m", "l", "UTF", "any", "Short, choppy top with a fringe that falls forward."],
  ["male_short_curly", "Short curly top", "barbershop", 0, "m", "l", "TC", "curly", "Short sides with defined curls on top."],
  ["male_textured_comma", "Textured comma", "barbershop", 0, "m", "m", "TSF", "wavy", "Short sides with a curved comma fringe."],
  ["all_side_swept_undercut", "Side-swept undercut", "barbershop", 0, "m", "m", "US", "any", "Disconnected short sides, longer top swept over."],
  ["male_wavy_undercut", "Wavy undercut", "barbershop", 0, "m", "m", "TC", "wavy", "Short sides with a wavy, longer top."],
  ["female_combover", "Combover", "barbershop", 0, "m", "l", "", "any", "Short sides with the top combed to one side."],
  ["male_tousled_cut", "Tousled cut", "barbershop", 1, "l", "m", "UT", "any", "Loose, layered cut sitting around the ears."],
  ["male_afro", "Full afro", "barbershop", 2, "m", "m", "TS", "coily", "Full, rounded afro with a shaped outline."],
  ["all_tousled_waves", "Tousled waves", "barbershop", 2, "m", "m", "UTC", "wavy", "Wavy, grown-in cut reaching the jaw."],
  ["all_hippie_wave", "Grown-out waves", "barbershop", 3, "m", "h", "UTC", "wavy", "Grown-out waves falling past the shoulders."],
  ["all_dreadlocks", "Locs", "barbershop", 3, "m", "h", "UTS", "any", "Locs: a long-term commitment started and maintained by a specialist."],
  // ---------- Salon shelf ----------
  ["all_pixie", "Pixie", "salon", 0, "m", "m", "U", "any", "Short, soft pixie with texture on top."],
  ["all_wispy_fringe_pixie", "Wispy fringe pixie", "salon", 1, "m", "m", "TSF", "any", "Ear-length pixie with a soft, wispy fringe."],
  ["all_bixie_cut", "Bixie cut", "salon", 1, "m", "m", "US", "any", "Between a bob and a pixie, around the ears."],
  ["all_short_bob", "Short bob", "salon", 2, "m", "m", "", "straight", "Jaw-length bob with a clean line."],
  ["all_bobcut", "Bob with fringe", "salon", 2, "m", "m", "SF", "straight", "Chin-length bob with a full fringe."],
  ["female_blunt_bob", "Blunt bob", "salon", 2, "m", "m", "", "straight", "One-length bob with a sharp, blunt edge."],
  ["all_french_bob", "French bob", "salon", 2, "m", "m", "SF", "any", "Short, slightly tousled bob with a fringe."],
  ["female_choppy_bob", "Choppy bob", "salon", 2, "l", "m", "TF", "any", "Textured, piecey bob."],
  ["all_tousled_bob", "Tousled bob", "salon", 2, "m", "m", "UT", "wavy", "Loose, undone bob."],
  ["female_slicked_back_bob", "Slicked-back bob", "salon", 2, "h", "m", "", "any", "Bob styled back off the face."],
  ["female_bobcut_curly", "Curly bob", "salon", 2, "m", "m", "TC", "curly", "Bob-length curls."],
  ["female_bobcut_wavy", "Wavy bob", "salon", 2, "m", "m", "TC", "wavy", "Bob with soft waves."],
  ["all_wavy_bob_with_bangs", "Wavy bob with fringe", "salon", 2, "m", "m", "TSCF", "wavy", "Wavy bob with a fringe."],
  ["all_modern_mid_part_bob", "Mid-part bob", "salon", 2, "l", "m", "U", "straight", "Centre-parted bob just above the shoulders."],
  ["female_medium_straight", "Classic straight lob", "salon", 2, "l", "m", "U", "straight", "Clean, one-length cut sitting just above the shoulders."],
  ["female_fresh_fringe_lob", "Lob with fringe", "salon", 2, "m", "m", "SF", "any", "Shoulder-grazing lob with a fresh fringe."],
  ["female_modern_wavy_lob", "Wavy lob", "salon", 2, "m", "m", "TC", "wavy", "Shoulder-grazing lob with loose waves."],
  ["all_short_feather_cut", "Short feather cut", "salon", 2, "m", "m", "SF", "any", "Short, feathered layers."],
  ["female_afro", "Afro", "salon", 2, "m", "m", "TS", "coily", "Full, rounded afro shape."],
  ["all_soft_flipped_layers", "Soft layered medium cut", "salon", 3, "m", "m", "F", "any", "Collarbone length with flipped, face-framing layers."],
  ["all_face_framing_shag_cut", "Face-framing shag", "salon", 3, "m", "m", "UTSF", "wavy", "Choppy shag layers around the face."],
  ["all_wavy_shag", "Wavy shag", "salon", 3, "m", "m", "UTSCF", "wavy", "Shag layers with waves."],
  ["all_wolf_cut", "Wolf cut", "salon", 3, "m", "m", "UTSF", "any", "Heavy layers on top blending into longer ends."],
  ["all_hush_cut", "Hush cut", "salon", 3, "l", "m", "USF", "any", "Soft, airy layers with face framing."],
  ["all_medium_curve_hair", "Medium curved layers", "salon", 3, "m", "m", "U", "any", "Medium length with curved-under ends."],
  ["all_curtain_wavy", "Shoulder-length curtain waves", "salon", 3, "h", "m", "UTSC", "wavy", "Centre-parted, loose waves around the shoulders."],
  ["all_loose_waves", "Loose waves", "salon", 3, "h", "m", "UTC", "wavy", "Loose, voluminous waves past the shoulders."],
  ["all_gentle_waves", "Gentle waves", "salon", 3, "m", "m", "TC", "wavy", "Soft, subtle waves."],
  ["all_defined_waves", "Defined waves", "salon", 3, "h", "m", "TC", "wavy", "Structured, defined waves."],
  ["all_classic_hollywood_waves", "Hollywood waves", "salon", 3, "h", "m", "SC", "wavy", "Glossy, sculpted vintage waves."],
  ["female_dark_c_curl_layers", "C-curl layers", "salon", 4, "m", "m", "C", "any", "Long layers with ends curled in a C shape."],
  ["all_beachy", "Beachy waves", "salon", 4, "m", "m", "TC", "wavy", "Long, relaxed, beach-style texture."],
  ["female_bouncy_curls", "Bouncy curls", "salon", 4, "h", "m", "TC", "curly", "Long, voluminous, bouncy curls."],
  ["female_blunt_fringe_straight", "Straight with blunt fringe", "salon", 4, "m", "h", "SF", "straight", "Long, straight hair with a blunt fringe."],
  ["female_long_straight", "Long straight with fringe", "salon", 4, "m", "h", "F", "straight", "Long, sleek length with a full fringe."],
  ["female_side_part_straight", "Side-part straight", "salon", 4, "m", "h", "U", "straight", "Long, straight hair with a side part."],
  ["female_long_wavy", "Long soft waves", "salon", 4, "m", "h", "UTC", "wavy", "Long hair with soft waves."],
  ["female_long_boho_waves", "Long boho waves", "salon", 4, "m", "h", "UTC", "wavy", "Long, relaxed boho waves."],
  ["all_romantic_waves", "Romantic waves", "salon", 4, "h", "h", "TC", "wavy", "Long, soft romantic waves."],
  ["female_long_spiral_curls", "Long spiral curls", "salon", 4, "h", "h", "UTC", "curly", "Long, defined spiral curls."],
  ["all_hime_cut", "Hime cut", "salon", 4, "m", "h", "SF", "straight", "Long hair with blunt cheek-length side sections."],
];

const out = [];
const missing = [];
for (const [tid, name, home, band, m, c, flags, textureNeed, desc] of TABLE) {
  const t = byId[tid];
  if (!t) throw new Error("unknown template " + tid);
  const collections = flags.includes("U") ? ["barbershop", "salon"] : [home];
  const thumbs = {};
  for (const col of collections) {
    const p = `public/styles/${col}/${tid}.jpg`;
    if (existsSync(p)) thumbs[col] = `/styles/${col}/${tid}.jpg`;
    else missing.push({ collection: col, templateId: tid, id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") });
  }
  const sideEffects = [];
  if (flags.includes("F")) sideEffects.push("adds a fringe");
  if (!t.keep_users_color) sideEffects.push("changes hair colour");
  out.push({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name,
    description: desc,
    templateId: tid,
    collections,
    home,
    thumbs,
    keepUserColor: Boolean(t.keep_users_color),
    // Every length band was checked by eye against the example pictures in public/styles.
    targetLengthBand: B[band],
    maintenance: L[m],
    commitment: L[c],
    textureSensitive: flags.includes("T"),
    requiresStylistConfirmation: flags.includes("S"),
    mayNeedChemical: flags.includes("C"),
    textureNeed,
    sideEffects,
  });
}
if (new Set(out.map((s) => s.id)).size !== out.length) throw new Error("duplicate ids");

const src = `// GENERATED by scripts/build-catalog.mjs from YouCam's hair-transfer v2.1 template list.
// Edit the table in that script and re-run it; do not edit this file by hand.
import type { Collection, TargetStyle } from "./types.ts";
import { routeHintsFor } from "./hints.ts";

type Row = Omit<TargetStyle, "routeHints">;

const ROWS: Row[] = ${JSON.stringify(out, null, 2)};

export const CATALOG: TargetStyle[] = ROWS.map((r) => ({ ...r, routeHints: routeHintsFor(r) }));

export function getStyle(id: string): TargetStyle | undefined {
  return CATALOG.find((s) => s.id === id);
}

export function stylesIn(collection: Collection | "all"): TargetStyle[] {
  return collection === "all" ? CATALOG : CATALOG.filter((s) => s.collections.includes(collection));
}

/** Example picture for a style on the shelf being browsed (falls back to its first shelf). */
export function thumbFor(s: TargetStyle, collection: Collection | "all"): string | undefined {
  if (collection !== "all" && s.thumbs[collection]) return s.thumbs[collection];
  return s.thumbs[s.collections[0]] ?? Object.values(s.thumbs)[0];
}
`;
writeFileSync("lib/catalog.ts", src);
writeFileSync("scripts/missing-thumbs.json", JSON.stringify(missing, null, 2));
const count = (c) => out.filter((s) => s.collections.includes(c)).length;
console.log(`catalog: ${out.length} cuts · barbershop shelf ${count("barbershop")} · salon shelf ${count("salon")} · missing pictures ${missing.length}`);
