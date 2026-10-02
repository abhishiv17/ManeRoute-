# Architecture

```
Phone or laptop browser (PWA)
  │  camera or upload → resize to JPG, long side ≤ 1024 px (lib/client/image.ts)
  │  consent, preferences, rule engine, card renderer all run on the device
  ▼
Next.js 16 route handlers (server only, holds YOUCAM_API_KEY)
  ├─ POST /api/photo          validate header + size → YouCam File API → file_id
  ├─ POST /api/length         start Hair Length Detection task
  ├─ GET  /api/length/:task   poll + normalise → HairBaseline
  ├─ POST /api/vto            catalog style id → template_id → start hair-transfer task
  ├─ GET  /api/vto/:task      poll → download result server-side → data URL
  └─ GET  /api/health         configured? mock? (never the key)
  ▼
YouCam S2S API  https://yce-api-01.makeupar.com
```

## Key decisions

| Decision | Why |
| --- | --- |
| **Stateless server** (no database, no sessions) | Nothing sensitive to store or leak, and it runs on serverless platforms (Vercel) without sticky sessions. The client holds `fileId` and task ids, which are useless without the key. |
| **Polling, not webhooks** | Webhooks need a public HTTPS callback and signature handling, while polling works on localhost and on judges' devices. The client polls every 2.5–3.5 s; the server makes one YouCam GET per poll. |
| **Client-side resize to JPG ≤ 1024 px** | Hairstyle VTO accepts only JPG with the long side at most 1024 px, and Hair Length needs at least 320 px per side. One prepared photo satisfies both, and uploads stay small (~100–250 KB). |
| **Server re-checks the image header** | It rejects non-JPEG and wrong sizes before spending units (`lib/server/image.ts`, no image library needed). |
| **VTO result fetched server-side** | The YouCam result URL is a short-lived S3 link. Fetching it on the server means the browser can draw it on the card canvas without CORS tainting, and the URL is never exposed. |
| **Rule engine runs on the client** | It's pure and deterministic (`lib/rules.ts`), so it's instant and testable, and the same code is unit-tested in Node. |
| **Catalog pins template ids** | Targets are YouCam-tested templates rather than arbitrary uploads, which gives predictable previews and no third-party photo rights issues. |
| **Thumbnails served locally** (`public/styles`) | Some ISPs block Perfect Corp.'s image CDN, which made the picker blank. |
| **Card rendered in canvas** | No server storage, and it works offline once the previews are loaded. |

## Folder map

```
app/
  page.tsx, layout.tsx, manifest.ts, globals.css
  api/photo, api/length, api/length/[taskId], api/vto, api/vto/[taskId], api/health
components/
  ManeRoute.tsx      step machine: intro → capture → analyzing → target → prefs → route → card
  Onboarding.tsx     4 intro screens + consent
  CameraCapture.tsx  getUserMedia, framing guide, timer, brightness hint
  SwRegister.tsx     registers the service worker in production
lib/
  types.ts           shared types (LengthBand, HairBaseline, TargetStyle, TransitionRoute…)
  length.ts          YouCam term → band + lower-bound flag
  rules.ts           transition rule engine
  catalog.ts         curated styles ↔ YouCam template ids
  youcam/client.ts   server-only API wrapper (File, tasks, templates, result download)
  youcam/errors.ts   engine/HTTP error codes → plain-language + retake flag
  server/            http helpers, rate limit, image header check, mock mode
  client/            photo prep, polling, card renderer
public/              icons, sw.js, styles/*.jpg
scripts/list-templates.mjs
tests/rules.test.ts
```

## State machine (client)

| Step | Enters when | Leaves to |
| --- | --- | --- |
| intro | app load, or after delete | capture (after consent) |
| capture | consent given, or retake | analyzing |
| analyzing | photo confirmed | target (success), stays with retry / keep waiting / retake |
| target | baseline received | prefs |
| prefs | style picked | route |
| route | route built, previews start in parallel | card, or target (change target) |
| card | previews finished (success or error) | route, or intro (delete) |

## Failure handling

| Failure | Where it's caught | What the user sees |
| --- | --- | --- |
| Camera blocked, missing or busy | `CameraCapture` | A reason and an upload fallback |
| Unreadable, too small or odd aspect photo | `preparePhoto` | "Let's try another photo" with the reason |
| Offline or network blip | `pollTask` tolerates 3 blips | "You seem to be offline… Try again" |
| YouCam engine error (face, pose, lighting, shoulders) | `mapEngineError` | A retake message, the YouCam code and a checklist |
| YouCam HTTP error (key, credits, 429) | `handleError` → `mapHttpError` | A plain explanation |
| Slow task | client timeout (90 s length, 180 s VTO) | **Keep waiting / Check again** re-polls the *same* task, so no extra units |
| Preview fails | per-slot error | Retry that slot only; the card still renders with "Preview unavailable" |
| Abuse of a public URL | per-IP limit on task starts | "Too many attempts" |

## Environment variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `YOUCAM_API_KEY` | yes | none | Bearer key, server only |
| `YOUCAM_API_BASE` | no | `https://yce-api-01.makeupar.com` | API host |
| `MAX_TASKS_PER_HOUR` | no | `40` | Per-IP task starts |
| `YOUCAM_MOCK` | no | unset | `1` returns simulated results, clearly labelled. Development only |

## Additions (28 Sep 2026, late)

- **Routes:** `/` landing, `/consult` flow, `/plans` saved plans (IndexedDB), and a mascot 404 page.
- **New API routes:** `POST/GET /api/texture` (Hair Type Detection, three file ids) and `POST/GET /api/extend` (Hair Extension). Image-returning tasks share `lib/server/tasks.ts → pollImageTask`.
- **Resilience:** YouCam GETs and result downloads retry up to three times on a network drop. POSTs, which start paid tasks, are never auto-retried. The client treats `provider_unreachable` as transient while polling.
- **Photo prep:** every capture is centre-cropped to 640 × 800 JPEG, the one size all four YouCam APIs accept, as Hair Type requires.
- **Flow components:** `components/flow/` (Capture, Analyzing, Picker, Prefs, RouteView, CardView, shared). `components/ManeRoute.tsx` is only the state machine.
- **Catalog:** generated by `scripts/build-catalog.mjs`; shelves are tags, and pictures live in `public/styles/<shelf>/`.
- **Builds alongside dev:** `NEXT_DIST_DIR=.next-check npm run build`.
