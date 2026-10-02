# Route rules

ManeRoute uses **fixed, ordered rules**, not an AI score. Every rule that fires is shown with its id and a plain sentence, and printed on the consultation card. Code: [`lib/rules.ts`](../lib/rules.ts). Tests: [`tests/rules.test.ts`](../tests/rules.test.ts).

## Inputs

- **Length** (YouCam Hair Length Detection): `lengthBand` ∈ above_ears < ear_length < short < above_chest < long, plus `atLeast` when YouCam said "…or longer".
- **Texture** (YouCam Hair Type Detection, optional): one of nine ranges from "Straight to Slight Wavy" to "Coily to Extremely Coily", grouped as straight / wavy / curly / coily.
- **Target** (catalog): `targetLengthBand`, `textureNeed` (any / straight / wavy / curly / coily), `textureSensitive`, `requiresStylistConfirmation`, `mayNeedChemical`, `maintenance`, `sideEffects`.
- **Shelf** the user browsed: barbershop, salon or all.
- **Preferences**: grow out yes/maybe/no, keep length, chemical yes/no/unsure, upkeep low/medium/high, non-negotiables.

## Length rules (first match sets the route)

| Id | Condition | Route |
| --- | --- | --- |
| **R0_capture** | No usable length result | `retake_required` |
| **R1_lower_bound** | Target is longer **and** YouCam only gave a lower bound | `stylist_confirmation_needed` |
| **R2_needs_length** | Target band is longer | `length_building` |
| **R3_shorter_target** | Target band is shorter | `cut_first` |
| **R4_same_band** | Same band | `can_discuss_now` |

Each route has one plain name, used on the route screen, the document, the copied text, saved plans and the journey (`ROUTE_HEADLINES` in `lib/rules.ts`):

| Route id | Shown as |
| --- | --- |
| `can_discuss_now` | Ready for your next appointment |
| `length_building` | Grow it out first |
| `cut_first` | Cut it shorter |
| `stylist_confirmation_needed` | Check with your stylist first |
| `retake_required` | Retake your photo |

## Texture rule (only when the texture scan was done)

| Id | Condition | Effect |
| --- | --- | --- |
| **R6_texture_match** | The user's texture group equals the look's `textureNeed` | Shown as a reason. **It settles the texture question, so R5 no longer forces a stylist check for texture.** |
| **R6_texture_ok** | The look adapts to any texture but is texture-sensitive | Shown as a reason ("expect it to sit a little differently") |
| **R6_texture_mismatch** | The texture differs by two or more groups, or by one for a texture-sensitive look | Upgrades `can_discuss_now` to `stylist_confirmation_needed`, or is added as a caution. The text says which way (straighter or curlier) and what it would take, and it flags a conflict when the user refused chemical treatment |

This is where YouCam analysis visibly changes the outcome. The same wavy target is *Ready for your next appointment* for wavy hair and *Check with your stylist first* for straight hair.

## Technique rule

| Id | Condition | Effect |
| --- | --- | --- |
| **R5_technique_texture** | The look depends on cutting technique, **or** it's texture-sensitive and the texture wasn't scanned | Upgrades `can_discuss_now` to `stylist_confirmation_needed`, otherwise a caution |

## Preference checks (never change the route)

| Id | Condition |
| --- | --- |
| **P1_no_grow_out** | Grow it out first, but the user won't grow out |
| **P2_keep_length** | Cut it shorter, but the user wants to keep length |
| **P3_maintenance** | The look needs more upkeep than the user wants |
| **P4_no_chemical** | The look may need a perm, the user refuses chemicals, and no scan confirmed a natural match |

## Previews chosen by the rules

- **Planning stage (Hairstyle VTO):** when the gap is two or more bands, the engine picks a look at the middle band **from the shelf the user browsed**. It never falls back to another shelf; if none fits, there's no planning stage. It prefers looks that keep the user's colour, add no fringe, and have no texture or technique dependence and the lowest upkeep.
- **Your cut, grown (Hair Extension VTO):** on length-building or length-uncertain routes to a medium target it uses `all_length_1`, and to a long target `all_length_2_`. It shows the user's own cut and colour longer, next to the target shape. **Only when the current hair is at least short.** Hair Extension lengthens the cut you already have, so from ear length or shorter it keeps the short top and adds long lengths underneath (a mullet), which misrepresents growing out. In that case the route sets `growOutSkipped`, the route screen shows a "Let it grow" stop that explains why, and the along-the-way cuts carry the route instead.

## Examples

| Length | Texture | Target | Result |
| --- | --- | --- | --- |
| ear length | not scanned | Grown-out waves (barbershop) | Grow it out first (R2), plus R5 caution; planning stage *Tousled waves* (*Mid-part bob* on the salon or all list); no grown-out preview (hair shorter than short), explained on screen |
| short | not scanned | Long straight with fringe (salon) | Grow it out first (R2); planning stage *Medium curved layers*; your cut grown to long (Hair Extension) |
| above chest | 2a–2b wavy | Loose waves | **Ready for your next appointment** (R4 + R6 match) |
| above chest | 1–2a straight, no chemicals | Loose waves | **Check with your stylist first** (R6 mismatch, with a chemical conflict note) |
| long | 4a–4b coily | Side-part straight | Check with your stylist first (R6 mismatch: needs heat or smoothing) |
| long | any | Crew cut, keep length ticked | Cut it shorter (R3) + P2 |
| short or longer | any | Long straight with fringe | Check with your stylist first (R1) |

## Questions generated for the card

Always included: "Is this target realistic from my current visible length?" and "What maintenance would this require between appointments?". Also added when they apply:
- Grow it out first: transition shape; what to change first.
- Cut it shorter: going shorter in stages.
- Keep-length ticked: preserving length.
- Texture mismatch: an adapted natural-texture version. Otherwise, for texture-sensitive looks, how texture affects the look.
- Template adds a fringe: whether a fringe suits the hairline.
- May need a perm: perm versus daily styling.

The user can untick any question and add their own before sharing.

## Limitations printed on every card
Length is a visible category from one photo. There are no growth timelines. Previews are references. Density and scalp aren't assessed. The card also says whether texture was scanned, and it adds the "or longer" note when relevant.
