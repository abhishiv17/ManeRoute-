# ManeRoute

**From the hair you have to the hair you want.**

ManeRoute is a mobile-first web app (PWA) that turns a hairstyle goal into a road you can actually walk. You try any cut on your own face, see how far it is from your hair today, and get a plan your barber or stylist can use. Then you track the journey: check-in photos measured by AI, a haircare routine built for your hair, and reminders for trims.

Your guide is **Rou**, a lion-cub road-tripper with a sunset mane, a map-pin tail and a satchel holding your consultation card.

> ManeRoute is a planning tool. Previews are references, not guarantees. It does not predict growth speed, and it is not medical advice.

---

## Why it exists

Most bad haircuts come from a bad conversation, not bad cutting. An inspiration photo can't say *"my hair is nowhere near that long"*, *"no perms"* or *"I have five minutes in the morning"*. Try-on apps make it worse: they show a perfect destination with no sense of how far away it is, and nothing happens after the photo.

ManeRoute shows the **route**, and then walks it with you.

## What you can do

### 1. Consult (`/consult`)
| Step | What happens | Powered by |
| --- | --- | --- |
| **You** | One photo with a framing guide, a 3-second timer and a light hint, or an upload | Camera API |
| **Pick** | Your current length is measured in the background while you browse 58 cuts in a photo grid (Men's, Women's or All: you choose, nothing is guessed from your photo). Once measured, the cuts sort into **Ready now**, **Grow one stage** and **Big change** | YouCam **Hair Length Detection** |
| **Try on** | Each cut wipes onto your own face in a full-width before/after slider. Every look collects in a **lookbook** to compare side by side, with suggestions to try next. **Finish the look** on top of the cut: 15 beard styles (Men's and All lists), 10 fringes and 9 colours, each with what to ask for | YouCam **Hairstyle Virtual Try-On**, **Beard Style Generator**, **Bangs**, **Hair Color** |
| **Route** | Your face at every stop on a painted road (now → along the way → grown → destination). A plain answer (*Ready for your next appointment*, *Grow it out first*, *Cut it shorter*, *Check with your stylist first*) with the reasons behind it, the cuts to ask for along the way, and, once your hair is at least short, **your own hair, grown out**. An optional **hair check** (three hands-free photos) reads texture, frizz and density, and the route and routine use them | YouCam **Hair Extension**, **Hair Type Detection**, **Hair Frizziness Detection**, **Hair Density Detection** |
| **Document** | A one-page card for the chair with **what to ask for, in barber language** and in order (next appointment first), then your questions and a note. Share it, download it or save it to **My plans** | Canvas, Web Share API |

### 2. Walk the road (`/journey`)
Press **Start my journey** on the document and the plan becomes a journey:

- **The road.** Every stop shows its AI preview: where you started → along-the-way cuts → your hair grown → the destination. Rou stands where you are.
- **Check-ins.** Every few weeks you take one new photo. YouCam measures your length again, and Hairstyle Try-On **re-renders your destination on that photo**, so you see it fitting your own hair a little better each time, side by side with the day-1 render. You move along the road when your length band changes or when you log the cut. Progress never goes backwards.
- **Your pace.** Worked out from your own measurements ("1 band longer in 9 weeks"), never predicted.
- **Photo history.** A slider between your first and latest photo, plus a log of every check-in and cut.
- **Haircare routine.** Six tap-to-answer questions (texture is skipped when the YouCam scan already measured it) give you a **daily, wash-day, weekly, monthly and this-stage** routine. Every step shows the rule that produced it and why. Products are named by type ("sulfate-free, colour-safe shampoo"), never by brand.
- **Today's checklist.** Tick off today's steps, toggle wash days, and keep a streak.
- **Trims and reminders.** Log a cut and the next trim is planned from it. **Add reminders to my calendar** downloads an `.ics` file with repeating check-in and trim events.

### 3. My plans (`/plans`)
Saved consultation documents, grouped by month, kept on your device.

## Built on YouCam AI

| API | Endpoint | Used for |
| --- | --- | --- |
| File API | `POST /s2s/v2.0/file` → `PUT` presigned URL | Registering photos |
| AI Hair Length Detection v1.0 | `/s2s/v2.0/task/hair-length-detection` | Your starting length, and every journey check-in |
| AI Hair Type Detection v1.0 | `/s2s/v2.0/task/hair-type-detection` | Natural texture (straight → coily) from three angles, for the route and the routine |
| AI Hairstyle Virtual Try-On v2.1 | `/s2s/v2.1/task/hair-transfer` | The target and along-the-way previews, and the destination re-rendered at every check-in |
| AI Hair Extension VTO v1.0 | `/s2s/v2.0/task/hair-ext` | "Your hair, grown" preview |
| AI Beard Style Generator | `/s2s/v2.0/task/beard-style` | 15 beard styles on top of the haircut try-on |
| AI Bangs | `/s2s/v2.0/task/hair-bang` | 20 fringes (10 Men's, 10 Women's) on top of the try-on |
| AI Hair Color | `/s2s/v2.0/task/hair-color` | 9 colours on top of the try-on |
| AI Hair Frizziness Detection | `/s2s/v2.0/task/hair-frizziness-detection` | Frizz from the hair-check photos, for rule R8 and routine step RT16 |
| AI Hair Density Detection | `/s2s/v2.0/task/hair-density-detection` | Density from a head-lowered photo, for rule R7 and routine step RT17 |

All calls go through Next.js route handlers on the server, and the API key never reaches the browser. Tasks are polled, and a refresh resumes them instead of paying again. A full consultation with a texture scan uses about 8–9 units, and each check-in about 4 (a length measurement plus the destination re-render). Details: [docs/YOUCAM_APIS.md](docs/YOUCAM_APIS.md).

## Honest by design

- **Rules, not scores.** The route (rules `R0`–`R6`, `P1`–`P4`) and the routine (`RT1`–`RT15`) are plain, ordered rules. Every result shows the rule id and a sentence, and there are no "92% match" numbers. See [docs/ROUTE_RULES.md](docs/ROUTE_RULES.md).
- **Real units only.** YouCam returns five visible length bands, so ManeRoute counts distance in bands. It never invents centimetres or weeks.
- **Uncertainty is kept.** "Short hair *or longer*" stays a lower bound, and those cases are sent to the stylist.

## Privacy

- Photos go only to YouCam, for analysis and previews. **ManeRoute's server stores nothing**: no database, no accounts, no analytics.
- Your session, saved plans, journeys, check-in photos (small copies) and routine ticks live **in your browser on your device**, and you can delete them with one tap.
- YouCam keeps processed files for up to 30 days under its own policy. See [docs/PRIVACY.md](docs/PRIVACY.md).

## Getting started

Requires Node 18.18+ (tested on Node 22).

```bash
npm install
cp .env.example .env.local   # then paste your key after YOUCAM_API_KEY=
npm run dev                  # http://localhost:3000
```

The camera needs HTTPS on a real phone (localhost works on a laptop). Use a deployed URL or a tunnel for phone testing.

### Environment variables
| Variable | Required | Purpose |
| --- | --- | --- |
| `YOUCAM_API_KEY` | Yes | Your YouCam API key (server-only) |
| `YOUCAM_API_BASE` | No | API host, default `https://yce-api-01.makeupar.com` |
| `MAX_TASKS_PER_HOUR` | No | Task starts per IP per hour in production (default 40) |
| `YOUCAM_MOCK` | No | `1` runs the whole app without spending units; every screen is labelled *simulated* |
| `YOUCAM_MOCK_TERM` | No | The length a mock check-in returns (default `ear length`) |

### Deploy (Vercel)
1. Import the repo into Vercel.
2. Add `YOUCAM_API_KEY` (and optionally the other variables above).
3. Deploy. The app is installable as a PWA.

## Testing

```bash
npm test             # 52 unit tests: route rules, barber scripts, beard/fringe/colour, hair checks, routine rules, journey progress, calendar, YouCam normalization, errors
npm run typecheck
npm run build        # NEXT_DIST_DIR=.next-check npm run build works while `npm run dev` is running
npm run e2e -- --size=phone    # real-browser walk-through with REAL YouCam calls (~7 units)
```

To try everything for free, run the dev server with `YOUCAM_MOCK=1`. The `maneroute-mock` entry in `.claude/launch.json` does this on port 3001. CI (`.github/workflows/ci.yml`) runs typecheck, tests and build on every push.

## Project layout

```
app/
  page.tsx · consult/ · journey/ · plans/ · not-found.tsx
  api/                    photo · length · texture · vto · extend · health (server-only YouCam calls)
components/
  Landing.tsx             home page, told in picture-book chapters
  ManeRoute.tsx           the consultation flow (state, history, refresh-safe session)
  flow/                   Start · Pick · TryOn · Plan · CardView · shared
  journey/                JourneyApp · RoadMap · CheckIn · Routine
  route/                  painted Scene, nav, length Measure, timeline, errors
  Mascot.tsx              Rou: 7 moods (happy, wave, walk, cheer, wow, think, oops), pure SVG
  CameraCapture.tsx       live camera with front / left / right framing guides
  Plans.tsx               My plans archive
lib/
  rules.ts                route engine
  routine.ts              haircare routine engine
  journey.ts              milestones, progress, pace, due dates, streaks
  ics.ts                  calendar file builder
  catalog.ts              58 cuts, GENERATED by scripts/build-catalog.mjs
  length.ts · texture.ts  YouCam result normalization
  youcam/ · server/       server-only API client, error mapping, rate limit, polling
  client/                 API calls, photo prep, card renderer, IndexedDB (plans, journeys)
public/                   icons, example photos, style pictures
scripts/                  YouCam template listing and catalog generator
tests/                    unit tests, e2e/flow.mjs
docs/                     product, research, architecture, rules, privacy, testing, submission
```

## Documentation

| Doc | What's in it |
| --- | --- |
| [docs/PRODUCT.md](docs/PRODUCT.md) | Pitch, users, experience, non-goals, roadmap |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagram, decisions, failure handling |
| [docs/YOUCAM_APIS.md](docs/YOUCAM_APIS.md) | Every YouCam endpoint, payload, mapping and unit cost |
| [docs/ROUTE_RULES.md](docs/ROUTE_RULES.md) | Every route rule, with worked examples |
| [docs/PRIVACY.md](docs/PRIVACY.md) | Photo lifecycle and controls |
| [docs/TESTING.md](docs/TESTING.md) | Unit tests, browser tests, manual QA checklist |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Evidence for the problem, competitors, assumptions |
| [docs/CRITIQUE.md](docs/CRITIQUE.md) · [docs/MVP-REVIEW.md](docs/MVP-REVIEW.md) | Honest reviews and what was fixed |
| [docs/SUBMISSION.md](docs/SUBMISSION.md) · [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Devpost text and demo video script |
| [docs/MANUAL_TASKS.md](docs/MANUAL_TASKS.md) | Decisions and tasks for the project owner |
| [CHANGELOG.md](CHANGELOG.md) | Dated work log |

## Tech

Next.js 16 · React 19 · TypeScript · YouCam AI APIs · IndexedDB · Canvas · Web Share API · iCalendar · PWA. There are no UI libraries. Rou, the painted landscape and every illustration are hand-written SVG.

## Third-party assets

Style pictures in `public/styles/` are YouCam template thumbnails, or previews generated with YouCam Hairstyle VTO on YouCam's sample model photos, used to pick the matching template. `tests/e2e/fixtures/front.jpg` is one of those sample photos. Beard and fringe pictures in `public/addons/` are YouCam's own template thumbnails (from the beard-style and hair-bang template lists), used to choose those templates. There are no other third-party images, fonts or music.
