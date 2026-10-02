# Honest critique (28 Sep 2026)

A code-and-product review of ManeRoute as it stands, judged against the four hackathon criteria: Technological Implementation, Design, Potential Impact, and Quality of the Idea. Most severe first.

## 1. Why men are shown women's hairstyles

**Short answer: it's mostly how I built the picker. Your setup is fine, and YouCam's API works well on men.** YouCam's *template library* does skew heavily female, and my design didn't compensate for that.

| Cause | Whose | Evidence |
| --- | --- | --- |
| YouCam's template library is 85% "Female": 99 of 116 templates, against 17 "Male" | YouCam | `scripts/templates.json`, `category_name` counts |
| Templates carry a whole look, not just a cut. Some add a fringe, earrings or a colour change. On a masculine face, a feminine template produces a feminine result | YouCam (by design) | An earlier planning-stage preview added earrings |
| The picker opens on **All cuts**, sorted by how close each length is to yours, so for most people salon styles appear first | Mine | `components/ManeRoute.tsx:585` (`useState("all")`) |
| I generated the 38 new pictures with **salon cuts on a woman and barbershop cuts on a man**, so "Salon" visually reads as "women's". The text says we don't infer gender, but the pictures do | Mine | `scratchpad/thumbs.mjs` used one model per collection |
| Barbershop has **no long styles, only 1 ear-length and 2 short**, so anyone in that collection who wants length gets pushed into salon looks | Mine (limited by YouCam's male templates) | Catalog counts: barbershop above_ears 12, ear 1, short 2, above_chest 2, long 0 |
| The planning stage only *prefers* the user's collection and falls back to any collection, so a barbershop route can get a salon in-between preview | Mine | `lib/rules.ts:158–167` (`collection` is a sort key, not a filter) |
| A style belongs to exactly one collection, although many YouCam cuts are unisex (pixie, shag, wolf cut, mid-part bob, curtain waves, long straight) | Mine | `TargetStyle.collection` is a single value |

### Fix (planned; timing depends on the submission window, see 2.2)
1. **Ask before showing styles:** "Which cuts do you want to see?" with *Barbershop · Salon · Both*, no default, and changeable at any time. It's still the user's choice, never inferred.
2. **Tags instead of one collection:** unisex cuts appear in both collections, which fills barbershop's gaps at ear, short, medium and long lengths.
3. **Example pictures on two models.** Unisex cuts get a picture on each model (about 30 more YouCam runs, ~60 units), and the picker shows the one that matches the chosen collection.
4. **The planning stage must stay in the chosen collection.** If none fits, show no planning preview rather than a mismatched one.
5. **Flag template side effects** ("this template also adds a fringe / changes colour") on the style card, not only after the preview.

### Status: fixed on 28 Sep 2026 (late)
- ✅ Shelf chooser before any styles (Barbershop / Salon / Both, no default, remembered on the device only).
- ✅ Shelves are tags: 25 unisex cuts are on both shelves. The Barbershop shelf now has 33 cuts across **every** length band (it had 17 with no long styles).
- ✅ 27 new example pictures on the second model (54 units), so each shelf shows one consistent model.
- ✅ The planning stage is strictly on the browsed shelf (tested for every cut × length).
- ✅ Template side effects ("adds a fringe", "changes hair colour") are shown on the style card and route.

## 2. Other weaknesses a judge would notice

| # | Issue | Criterion hit | Severity | Fix |
| --- | --- | --- | --- | --- |
| 2.1 | **Not deployed, no repo.** Judges need a live URL and a repo, and the camera needs HTTPS on phones | All (stage-one pass/fail) | Blocker | GitHub + Vercel (your accounts, see MANUAL_TASKS T3–T4) |
| 2.2 | **Submission window:** everything so far predates 29 Sep. Significant work must happen and be logged inside the window | Eligibility | Blocker | Do fixes 1 and 2.3 from 29 Sep onward and log them in CHANGELOG |
| 2.3 | **Only two YouCam APIs, and the texture/technique rules are my guesses.** `textureSensitive` and `mayNeedChemical` are hand-set catalog flags, not measurements | Tech implementation, Idea | High | Add **Hair Type Detection** so R5 uses the user's real texture (e.g. a curly-textured user choosing a straight look gets a real caution). It's the strongest "YouCam analysis changes the route" story |
| 2.4 | **No real user evidence.** The research is desk research only | Impact | High | 3–5 short interviews plus one barber or stylist reacting to the card (MANUAL_TASKS T6). Quotes in the video are very persuasive |
| 2.5 | **The route mostly depends on one categorical length.** Many photos return "…or longer", which pushes lots of routes to "stylist confirmation" | Impact, Design | Medium | Show why clearly (already done), and suggest a retake with hair brought forward over the shoulders, which often resolves "or longer" |
| 2.6 | **The planning stage is a different template, not a grown-out version of the target**, so it can look like a different style rather than a step toward the goal | Idea, Design | Medium | Prefer same-family intermediates (bob → lob → layered), or use **Hair Extension VTO** for length-building, which shows *your* style longer |
| 2.7 | **The card is one-way.** The stylist can't respond, and nothing persists | Impact | Medium | A stylist link with notes would need storage; worth it only after 2.1–2.4 |
| 2.8 | **Test coverage is thin:** 11 unit tests on rules, none on API routes or error mapping. The Playwright flow script lives outside the repo | Tech implementation | Medium | Move the e2e script into `tests/e2e`, add route-handler tests with a mocked YouCam, and add a CI workflow |
| 2.9 | **Band labels come from one render on one model.** A "short" cut on a long-haired model can read longer or shorter than intended | Accuracy | Low–Medium | The second-model pictures from fix 1.3 double-check this |
| 2.10 | **Accessibility isn't audited:** no screen-reader or keyboard pass, and colour contrast of pills is unverified | Design | Low–Medium | Lighthouse/axe pass and fix |
| 2.11 | **The rate limit is in memory**, so it resets on every serverless instance | Robustness | Low | Fine for judging; Vercel KV if abused |
| 2.12 | **YouCam retention:** files stay up to 30 days on YouCam and we can't delete them | Privacy | Low (disclosed) | Already disclosed. Ask YouCam whether a deletion endpoint exists |

### Status of section 2 (28 Sep 2026, late)
- 2.3 ✅ **Hair Type Detection added** with a guided 3-angle scan. Rule R6 now uses the measured texture, and a matching texture resolves R5.
- 2.6 ✅ **Hair Extension VTO added**: "your cut, grown" sits next to the target on length-building routes.
- 2.8 ✅ Error-mapping tests (19 unit tests in total), a real-browser e2e script in the repo, and a CI workflow.
- 2.10 🟡 Accessibility improved (labelled controls, keyboard-usable slider, dialog roles, progressbar). A full axe/Lighthouse audit is still to do.
- 2.1, 2.2, 2.4 ⏳ Still need AbhiShiv: repo, deploy, in-window work log, interviews.
- New: **Rou the mascot**, **before-and-after slider**, **editable card** (pick and add questions, note to stylist), **My plans** (saved on device), **home page**, **404 page**.

## 3. What's genuinely strong (keep it)
- Both required APIs work end to end, with real error mapping, retake guidance, and "keep waiting" that doesn't spend extra units.
- The rule engine is transparent: rule ids, plain sentences and no fake percentages. That's exactly what the brief asked for.
- It keeps uncertainty ("or longer") instead of hiding it.
- It's privacy-first by construction: no database, no stored photos, and the key is server-only (verified absent from client bundles).
- The consultation card is a real handoff artefact, not a filter screenshot.

## 4. Suggested order (inside the window, from 29 Sep)
1. Gender-presentation fix (section 1): about half a day, ~60 units.
2. Deploy (needs you) and phone test.
3. Hair Type Detection in the rules (2.3).
4. Interviews plus the barber reaction (needs you).
5. Tests, CI and an accessibility pass (2.8, 2.10).
6. Record the video.
