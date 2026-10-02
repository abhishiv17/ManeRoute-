# Testing

## Automated
```bash
npm test          # rule engine + YouCam term normalization (9 tests)
npm run typecheck
npm run build
```

## End-to-end check with real YouCam calls (28 Sep 2026)
I drove the whole flow in Chrome with Playwright at **phone (390×844)** and **laptop (1366×768)** sizes, using YouCam's own template model photos. The console showed no errors.

| Case | Size | Photo | Target | Result |
| --- | --- | --- | --- | --- |
| Grow it out first, with a planning stage | phone | short hair | Long straight with fringe | "ear length" → Grow it out first, soft layered preview + target preview, card rendered, delete worked |
| Cut it shorter, with a keep-length conflict | laptop | long wavy | Low-maintenance crew cut | "above chest or longer" → Cut it shorter + P2, straight lob planning stage |
| Invalid capture | laptop | plain grey image | none | YouCam error → **Retake your photo** with the code and checklist |
| Camera | both | fake webcam | none | Live preview, guide, timer, cancel |

## Manual QA checklist (run before recording and before submitting)

**Onboarding**
- [ ] Welcome → How → Photo guide → Privacy. Back and Skip work.
- [ ] "Take my photo" stays disabled until consent is ticked.

**Capture**
- [ ] Laptop: **Open camera** shows the webcam with the oval and shoulder guide. Capture and the 3-second timer work.
- [ ] Phone (HTTPS URL): the front camera opens in the page.
- [ ] Deny camera permission → a clear message and **Upload a photo** still works.
- [ ] Upload a tiny image (< 320 px) → "too small" message.
- [ ] Upload a non-image file → "isn't an image" message.
- [ ] Dark room → "It looks dark" hint on the live camera.

**Analysis**
- [ ] A good photo → the baseline shows the raw YouCam term.
- [ ] Photo with the face turned or cropped → **Retake your photo** with a checklist.
- [ ] Turn Wi-Fi off during analysis → a network error with **Try again**.

**Route and previews**
- [ ] Same-band target → Ready for your next appointment, no planning stage.
- [ ] Ear length or shorter → a long or medium target → a "Let it grow" stop explains why there is no grown-out preview; from short hair the "Your hair, grown" preview appears.
- [ ] A gap of two or more bands → a planning stage preview appears.
- [ ] Wavy target with "No" chemicals and "Low" upkeep → P3 + P4 cautions.
- [ ] Tap a preview → a full-screen zoom, closed by tap or Esc.
- [ ] **Try a different target** goes back to the picker.

**Card**
- [ ] The card shows the photo, previews, baseline, preferences, reasons, questions and limitations.
- [ ] Phone: **Share card** opens the share sheet with a PNG.
- [ ] Laptop: **Share card** falls back to a download, and **Copy as text** works.
- [ ] **Delete session data** returns to the welcome screen with nothing left.

**PWA**
- [ ] On the deployed URL, "Add to Home Screen" or Install works and the app opens standalone.

## Mock mode
`YOUCAM_MOCK=1 npm run dev` runs the whole UI without spending units. A yellow "Simulated" banner shows on every screen and on the card. Use it only for development.

## Browser test in the repo (added 28 Sep 2026)

`tests/e2e/flow.mjs` drives the real app in Chrome or Edge with **real YouCam calls**. It covers: landing, onboarding, the camera, upload, analysis, shelf choice, the Barbershop picker, preferences, the route with all previews, the card editor (a custom question and a note), Save to My plans, the plans page and the 404 page. It fails on any page error.

| Run | Result (28 Sep 2026) |
| --- | --- |
| `npm run e2e -- --size=phone` | Passed. Ear length → Grown-out waves: length-building, *Mid-part bob* planning stage (barbershop shelf), your cut grown, target. *Superseded:* since the 29 Sep grow-out fix, ear-length hair gets no grown-out preview (see the 2 Oct audit below) |
| `npm run e2e -- --size=laptop` | Passed. One Hair Extension preview hit a network drop and showed **Retry**; this led to automatic retries for idempotent requests |
| `npm run e2e -- --size=laptop --scan-fail --only-analysis` | Passed. The texture scan with non-side photos showed `error_face_angle_invalid`, with **Continue without texture** and **Retake side photos** |

Not yet verified end to end: a **successful** texture scan, because it needs real side-angle photos of a person. Run the camera scan yourself (see MANUAL_TASKS).

## Live audit with real YouCam calls (2 Oct 2026)

A fresh Chrome profile (Playwright, 1366×800) against `npm run dev` in real mode (`/api/health`: configured, not mock), checking every README feature. About 11 units.

| Area | Checked | Result |
| --- | --- | --- |
| Nav, PWA | "My journey" and "My plans" in the nav; `manifest.webmanifest` (standalone, 3 icons) | Pass |
| Hair Length Detection | Background check on Pick | Pass: "Ear length" |
| Catalog | Men's 33 / Women's 52 / All 58 | Pass |
| Hairstyle VTO | Grown-out waves: before/after slider shows two different images | Pass |
| Route | Grow it out first, rules R2 + R5, along-the-way cut *Tousled waves* (Men's list) | Pass |
| Hair Type Detection | Two front photos instead of side views → **Texture not read**, `ERROR_FACE_ANGLE_INVALID`, retry buttons | Pass (error path) |
| Hair Extension | Not triggered by the app run (ear length is shorter than short, by design); called directly with `length: "chest"` | Pass: image returned |
| Refresh | Reload on the route step | Pass: 0 new paid calls |
| Document | Current / Along the way / Target images (target ≠ current), custom question + note, Download PNG (756 KB), Copy text, Save to My plans | Pass |
| Journey | Start my journey, road with 3 stops and previews, meter, 6-question routine, checklist + wash day, rule ids RT1–RT15, real check-in ("Ear length", same band), photo log, Log a cut, `.ics` with a repeating check-in event, data kept after reload | Pass |
| My plans | Grouped 2026 / OCT, saved document reopens | Pass |
| Privacy | API key absent from every `/_next` and `/api` response; delete session, delete journey, delete all plans | Pass |
| Runtime | Page and console errors | None |

Also passing: `npm test`, `npm run typecheck`, `NEXT_DIST_DIR=.next-check npm run build`.

