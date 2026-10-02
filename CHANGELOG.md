# Changelog

Dated log of work, kept for the hackathon's "work completed during the submission period" requirement (window opens 29 Sep 2026, 12:00 pm ET).

## 2026-10-02
- **Live audit of every README feature** with real YouCam calls in a fresh browser: consult, all four AI APIs, the document actions, My plans, every journey feature, refresh, deletion and API-key privacy. Results in `docs/TESTING.md`.
- **One name per route, everywhere.** The route screen, the document, the copied text and saved plans said "Length-building" while the README and the journey said "Grow it out first". All now use `ROUTE_HEADLINES` in `lib/rules.ts`: *Ready for your next appointment*, *Grow it out first*, *Cut it shorter*, *Check with your stylist first*, *Retake your photo*.
- **The skipped grow-out preview is explained.** When a route would use "your hair, grown" but the hair is shorter than short (the "mullet" case), the route now sets `growOutSkipped`, the route screen shows a "Let it grow" stop saying why, and the limitation is recorded. 39 unit tests.
- **Log a cut** without a routine now says to build the routine to plan the next trim, instead of claiming it was planned.
- **Development fix:** a service worker left by `next start` on localhost served cached `/_next/static` chunks, so `next dev` changes (including the whole journey) never reached that browser. The worker no longer caches on localhost, and development unregisters any leftover worker.
- **Mock mode:** a simulated try-on is labelled as simulated instead of showing the original photo as the "Target".
- **Docs:** the Devpost draft, demo script, route rules, product and testing docs brought up to date with the app.
- Git repository initialised.

## 2026-10-01
- **My journey: tracking and a haircare routine** (brief from AbhiShiv: the app was one-shot, take a photo and try on, with nothing that brings you back and nothing a chat assistant couldn't say). The consultation is now the start of a journey (`/journey`, `components/journey/`):
  - **Start this journey** on the consultation document turns the route into a road whose stops carry the YouCam previews (now → along the way → grown → destination).
  - **Check-ins:** a new photo every few weeks is measured again by YouCam Hair Length Detection (about 1 unit). A stop is reached when a measurement reaches its band or when the user logs the cut, and progress never goes backwards. The user's own pace ("1 band longer in 9 weeks") comes from their own measurements and is never a prediction. First-vs-latest photo slider and a history log.
  - **Routine builder** (`lib/routine.ts`): six taps (texture is skipped when YouCam scanned it), then a daily / wash-day / weekly / monthly / this-stage routine from 15 plain rules (RT1–RT15). Every step shows its rule id and reason. Product types only, never brands. Styling follows the hair you have today, then the destination's texture.
  - **Today's checklist** with a wash-day toggle, a streak and a washes-this-week count. **Trim planning** from the routine's cadence and the last logged cut. **Add reminders to my calendar** downloads an .ics file with repeating check-in and trim events (`lib/ics.ts`). No server, no account.
  - Everything is stored on the device in its own IndexedDB database (`maneroute-journeys`), separate from My plans.
  - Home page: new chapter "Then walk the road", an updated hero, stops and FAQ. "My journey" is in the nav.
  - 16 new unit tests (`tests/journey.test.ts`): routine rules, progress, pace, due dates, streaks and calendar output (38 in total).
  - `.claude/launch.json` gains `maneroute-mock` (port 3001, `YOUCAM_MOCK=1`) to test the whole journey without spending units.
- **Rou redesigned** (brief from AbhiShiv: Rou is the app's main energy, not just a logo). Rou is now a full-body lion-cub road-tripper instead of a round face (`components/Mascot.tsx`):
  - A swept sunset mane with a pompadour quiff that has the route painted down it, a road-trip bandana, a satchel with the consultation card poking out, a comb in the mane, and a tail that ends in a map pin.
  - Poster ink outline so Rou reads at tip-card size on cream and teal, in light and dark mode.
  - Whole-body poses for every mood (wave, cheer, wow, think with a paw on the chin, oops scratching the head), and a new `walk` mood with stepping legs that Rou uses on the chapter-one road. The bandana flutters, the pin tail sways and the quiff bounces.
  - Rou stands on the road in the home hero and the closing scene, and is larger in the flow tips.

## 2026-09-30
- **"Painted road" visual redesign** (brief from AbhiShiv, inspired by the storybook style of endspeciesism.org). It replaces the editorial wayfinding look, which felt too busy and technical.
  - A flat, poster-painted sunset landscape (teal sky, orange and red hills, a road to the horizon) drawn in SVG (`components/route/Scene.tsx`). It is the home hero, the closing scene and the menu, and a thin strip of the same hills tops every other page.
  - Type: Luckiest Guy (hand-cut poster lettering) for headlines, Alegreya Sans for reading. The monospace font is gone.
  - Palette: cream paper, deep teal, one sunset-orange action colour with a chunky pressed button, and gold highlights. Rounded photos and soft panels replace thin black rules. Routes are drawn as dashed road lines.
  - The home page is told in chapters (the journey, four stops, two roads, the cuts, your photo, questions), with a chapter rail on wide screens.
  - The flow screens, consultation card, shared PNG and My plans use the same system. No flow logic changed.

## 2026-09-29
- **Fixed the "mullet" grow-out preview** found by AbhiShiv on a real photo: YouCam Hair Extension lengthens the existing cut, so from short hair it kept the short top and added long lengths underneath. "Your hair, grown" now appears only when the current hair is at least short (above the shoulders). Big gaps get **two along-the-way cuts** instead (e.g. above the ears → long: ear-length cut, then medium cut), all from the chosen list. The home-page example that showed this effect was replaced. 22 unit tests.
- **Editorial wayfinding redesign** of every screen (brief from AbhiShiv): Archivo condensed display + IBM Plex Mono measurements on warm paper, one orange route signal, thin rules instead of cards.
  - Home as a campaign: stacked hero type with a route arrow, current → target states, four waypoints, five route classifications, catalogue strip, privacy, FAQ.
  - Consultation: numbered route progress, a measurement-studio capture with thin framing ticks, an analysis tree that fills in while you browse, editorial cut rows (alternating image sides), a length instrument (you vs target, distance in bands).
  - Preview with a clean before/after and metadata; the route screen as a vertical line of waypoints plus a scrubbable 0→100% hair timeline (current → along the way → grown → target).
  - A printable consultation document (on screen and as the shared PNG), a My plans archive by year and month, a route-index mobile menu, and errors/empty states in the same language.
  - Honest measurements: YouCam returns length categories, so distance is shown in bands, not invented millimetres or days.
- **MVP rebuild after an honest product review** (docs/MVP-REVIEW.md): start → pick → try-on → plan → card. The length check runs in the background; a big before/after try-on comes straight after picking; every try-on is kept for comparison; the questions moved after the try-on; the texture check is offered only when a look needs it; the card is one page.
- Browser back/forward stay inside the flow, and a refresh restores the session, including unfinished YouCam tasks (no double charges).
- Plain-language plan headlines, reasons and questions; rule ids moved under "How we decided".
- The planning stage prefers cuts typical for the chosen list.
- The e2e test covers refresh (asserts zero new YouCam calls) and back/forward; 20 unit tests.
- Style lists relabelled as **Men's styles / Women's styles / All styles**, chosen by the user at the start of the picker (never inferred from the photo). Unisex cuts stay in both lists.

## 2026-09-28 (before the submission window)

### Night: end-user platform pass
- **Gender-presentation fix:** a shelf chooser before styles; shelves became tags (25 unisex cuts on both); 27 second-model pictures (54 units); the planning stage is strictly on the browsed shelf; template side effects are shown up front.
- **New YouCam APIs:** Hair Type Detection (guided 3-angle texture scan, rule R6) and Hair Extension VTO ("your cut, grown").
- **Mascot Rou** (6 moods) across the landing, onboarding, capture, analysis, route, card, plans and 404 pages.
- **Standout features:** a before-and-after slider, an editable card (choose and add questions, note to stylist), **My plans** saved on the device, and a refreshed home page.
- **Robustness:** retries for idempotent YouCam requests and result downloads; every capture normalised to 640 × 800.
- **Quality:** 19 unit tests, an e2e browser script (`npm run e2e`), a CI workflow, and a production build that can run beside dev. Full flow verified in Chrome at phone and laptop sizes with real YouCam calls.

### Late evening
- Generated our own style pictures for the 40 styles whose YouCam thumbnails are on a CDN some networks block: real YouCam Hairstyle VTO runs on YouCam sample model photos (80 units). Every style card now loads locally.
- Checked all length bands by eye against the pictures. Moved 7 styles to the correct band (full afro, tousled waves, grown-out waves, locs, C-curl layers, beachy waves, bouncy curls) and dropped 2 looks that turned out to be tied-back styling (sleek middle part, goddess waves). Catalog: 58 cuts (17 barbershop, 41 salon).
- The per-IP task limit now applies only in production; local development is unrestricted.

### Evening, after the second user test
- Catalog grew from 7 to 60 haircuts pulled from YouCam's 116 templates (17 barbershop, 43 salon). Colour-only looks, updos, buns, braids and accessories were left out as styling rather than cuts. The catalog is generated by `scripts/build-catalog.mjs`.
- Style picker: the user chooses a collection (All / Barbershop / Salon); it is never inferred from the photo. There are length filters, and sections are grouped by length with a route hint (same band, cut-first, length-building).
- Style cards show a length drawing until the template picture loads, so blocked or slow image hosts never leave empty boxes.
- After capture, a step-by-step progress view shows photo prepared, sent to YouCam, Hair Length Detection running, length band.
- New landing page at `/`: hero with real YouCam before-and-after examples, the problem with sources, how it works, the five routes, styles, the consultation card, privacy, FAQ. The flow moved to `/consult`; the onboarding there is now 3 screens.
- The planning stage prefers a look from the same collection as the target.
- Tests: 11 passing.

### Earlier
- Read the YouCam File, Hair Length Detection and Hairstyle VTO v2.1 docs, and verified both APIs end to end with a real key.
- Next.js 16 + TypeScript app scaffold, with server-only YouCam client, polling routes, error mapping and a per-IP limit.
- Normalization of all 8 Hair Length terms to 5 bands plus an "or longer" flag.
- Transparent rule engine (R0–R5, P1–P4), planning-stage selection, and 9 unit tests.
- Curated catalog of 7 looks pinned to YouCam template ids.
- Mobile flow: capture, analysis, target picker, preferences, route with previews, consultation card (canvas PNG, Web Share, download, copy), delete session.
- PWA manifest, icons and a service worker that never caches API calls or photos.
- **Fixes after the first user test:**
  - style pictures were blank because the ISP blocks Perfect Corp.'s CDN, so they're now served locally with a fallback;
  - "Take photo" opened a file picker on laptops, so there's now a live in-page camera with a framing guide, 3-second timer, lighting hint and upload fallback;
  - added a 4-screen onboarding (what it is, how it works, photo do's and don'ts, privacy consent);
  - smaller preview labels, tap-to-zoom previews, a retake checklist with the YouCam error code, and 3-column layout on laptops.
- Documentation: product, research, architecture, APIs, rules, privacy, testing, submission draft, demo script, manual tasks.

## Inside the submission window
Every dated section from 2026-09-29 onwards (above) is work done inside the window.
