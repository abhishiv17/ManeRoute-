# Devpost submission draft

Hackathon: **YouCam API Skin AI & eCommerce VTO Hackathon** ([overview](https://youcam-api-skin-ai-ecommerce.devpost.com/), [rules](https://youcam-api-skin-ai-ecommerce.devpost.com/rules)).
Submission window: 29 Sep 2026, 12:00 pm ET to **2 Nov 2026, 11:45 am ET**.

The text below is ready to paste into the Devpost fields. Replace every `‹…›` before submitting.

---

## Project name
ManeRoute

## Tagline (≤ 60 characters)
From the hair you have to the hair you want.

## Built with
Next.js, React, TypeScript, YouCam AI Hair Length Detection, YouCam AI Hair Type Detection, YouCam AI Hairstyle Virtual Try-On, YouCam AI Hair Extension, YouCam File API, IndexedDB, Web Share API, Canvas, PWA, Vercel

## Inspiration
Most bad haircuts aren't bad cutting. They're a bad conversation. People hand their barber or stylist an inspiration photo, but the photo can't say *"I'm not willing to grow it out"*, *"no perms"*, *"I need something I can style in five minutes"*, or *"my hair is nowhere near that long."* In a 2023 survey of 2,000 UK salon clients, 45% had been disappointed with an appointment outcome in the past year and a third felt their stylist didn't listen.

Try-on apps make this worse in a way: they show a perfect destination with no sense of how far away it is. We wanted to show the **route**.

## What it does
ManeRoute is a mobile-first web app (PWA) that turns a hairstyle goal into a route you can walk, and then walks it with you.

**1. Consult (`/consult`)**
1. **Your photo.** A live camera with a framing guide, a 3-second timer and a lighting hint, or an upload.
2. **Your starting point, from YouCam AI Hair Length Detection.** It runs in the background while you browse. ManeRoute keeps YouCam's category, including "or longer" uncertainty, instead of inventing centimetres.
3. **58 cuts, tried on your own face with YouCam AI Hairstyle Virtual Try-On.** Men's, Women's or All lists, chosen by you and never guessed from your photo. Every try-on is kept in a full-width before/after slider so you can compare.
4. **A transparent route.** A rule engine returns *Ready for your next appointment*, *Grow it out first*, *Cut it shorter* or *Check with your stylist first*, with every rule that fired shown by id and a plain sentence. No made-up percentages. It adds the cuts to ask for along the way and, from short hair up, **your own hair grown out** with YouCam AI Hair Extension. An optional three-angle scan with YouCam AI Hair Type Detection makes the route texture-aware.
5. **A document for the chair.** One page with your photo, the previews, the YouCam length result, your limits, the reasons and questions for your stylist. Edit the questions, add a note, then share, download, copy or save it to **My plans**.

**2. Walk the road (`/journey`)**
- **Start my journey** turns the document into a road whose stops carry the YouCam previews, with Rou the mascot standing where you are.
- **Check-ins:** every few weeks one new photo is measured again by Hair Length Detection. You move along the road when your length band changes or when you log the cut. Your pace comes from your own measurements and is never predicted.
- **A haircare routine** from six taps: daily, wash-day, weekly, monthly and this-stage steps, each with the rule (RT1–RT15) and reason behind it, and a checklist with a streak.
- **Trims and reminders:** log a cut and the next trim is planned; **Add reminders to my calendar** downloads an `.ics` file.

**3. My plans (`/plans`)**: saved documents grouped by month.

Everything a user creates stays in their browser. ManeRoute's server stores nothing, and one tap deletes the session, a journey or all saved plans.

## Consumer and retail value
- **Clients** know before the appointment whether their hair is ready, what to ask for on the way, and how to look after it while it grows.
- **Barbers and stylists** get the goal, the limits and the starting point before they pick up scissors.
- **Salons and retailers** gain a consultation step to embed in booking or product pages, and a journey that brings the client back between appointments. The routine names product types, which is a natural place for grow-out and care products.

## How we built it
- **Next.js 16 + TypeScript.** Server route handlers hold the YouCam key; the server is stateless, with no database and nothing written to disk.
- **YouCam File API → Hair Length Detection v1.0**, with a normalization layer that maps all 8 documented results to 5 bands plus an "or longer" flag.
- **YouCam Hairstyle VTO v2.1** with 58 cuts curated from YouCam's 116 templates, and `hair_color: "src"` where the template supports it so previews show shape rather than a colour change.
- **YouCam Hair Extension VTO v1.0** for "your hair, grown", and **YouCam Hair Type Detection v1.0** from a guided three-angle scan, which drives texture rule R6.
- **Refresh-safe polling.** Task ids are kept in the session, so a refresh resumes a YouCam task instead of paying for it again. Every YouCam engine error code maps to a plain-language fix.
- **Pure TypeScript rule engines** for the route (R0–R6, P1–P4) and the routine (RT1–RT15), a journey model for progress, pace and due dates, and an iCalendar builder.
- **On-device storage:** the session in sessionStorage; plans and journeys in IndexedDB; the document is drawn on a canvas.
- **Quality:** 39 unit tests, a Playwright browser walk-through with real YouCam calls, CI running typecheck, tests and build, and a PWA manifest.

## Challenges we ran into
- **Uncertain AI output.** YouCam sometimes says "short hair *or longer*". Treating that as "short" would send people down the wrong route, so those cases go to the stylist instead.
- **The "mullet" preview.** Hair Extension lengthens the cut you already have, so from very short hair it kept the short top and added long lengths underneath. "Your hair, grown" now appears only from short hair up, the route screen says why when it's skipped, and big gaps get two along-the-way cuts instead.
- **One photo, several APIs.** The browser prepares a single JPG that satisfies Hair Length Detection, Hairstyle VTO and Hair Extension, and the server checks the header before spending units.
- **Honest in-between previews and progress.** An along-the-way cut could read as a growth prediction, so it's labelled as a cut to ask for. Journey progress moves only on a measured band change or a logged cut, never on a timer.
- **Blocked CDN.** On one test network the template thumbnail CDN was blocked by the ISP, so the picker serves pictures locally.

## Accomplishments we're proud of
- Four YouCam AI APIs, each making a different decision: where you are, what the target looks like on you, what your own hair looks like longer, and whether your texture suits the look.
- The route is fully explainable: anyone can read *why* on one screen.
- The document is useful on its own. A stylist who has never seen the app understands it.
- It doesn't end at a try-on: the journey gives a reason to come back, measured by the same API.

## What we learned
‹Fill in with your own learnings, e.g. from user interviews in docs/INTERVIEWS.md›

## What's next
A stylist view where the barber can reply with notes, beard targets for barbershops, and an optional account to keep journeys across devices.

## YouCam APIs used (exact)
| API | Endpoint | Purpose |
| --- | --- | --- |
| File API | `POST /s2s/v2.0/file` | Register and upload the user photo |
| AI Hair Length Detection v1.0 | `POST/GET /s2s/v2.0/task/hair-length-detection` | Starting length, and every journey check-in |
| AI Hairstyle Virtual Try-On v2.1 | `POST/GET /s2s/v2.1/task/hair-transfer` | Target and along-the-way previews |
| Hairstyle templates v2.1 | `GET /s2s/v2.1/task/template/hair-transfer` | Curating the 58-cut catalog |
| AI Hair Type Detection v1.0 | `POST/GET /s2s/v2.0/task/hair-type-detection` | Natural texture from a 3-angle scan; drives rule R6 and the routine |
| AI Hair Extension VTO v1.0 | `POST/GET /s2s/v2.0/task/hair-ext` | "Your hair, grown" preview on grow-out routes, from short hair up |

## Work completed during the submission period
The initial MVP was created on 28 Sep 2026, before the window opened. Significant work since 29 Sep 2026, 12:00 pm ET (details in CHANGELOG.md):
- **29 Sep:** the MVP rebuilt after an honest product review (start → pick → try-on → route → document), refresh-safe sessions that resume YouCam tasks, the "mullet" grow-out fix with two-stage routes, Men's / Women's / All lists, and a full visual redesign.
- **30 Sep:** the "painted road" visual identity across every screen, the document and the shared image.
- **1 Oct:** **My journey**: check-ins measured by YouCam, a road with the previews, a routine engine (RT1–RT15) with a daily checklist and streaks, trim planning and calendar reminders. Rou redesigned as a full-body mascot.
- **2 Oct:** one plain name per route on every screen, an on-screen explanation when the grown-out preview is skipped, a service-worker fix for development, simulated try-ons clearly labelled, and a full live audit of every feature with real YouCam calls.

## Links
- Live demo: ‹https://… (Vercel URL)›
- Repository: https://github.com/abhishiv17/ManeRoute- (public, or private and shared with contact_event@PerfectCorp.com)
- Demo video (public YouTube or Vimeo, 1–3 min): ‹https://…›

## Test instructions for judges
1. Open ‹live URL› on a phone (or a laptop with a webcam). No login is needed.
2. Tap **Start your route**, tick consent, then use the camera or upload a front-facing photo with hair down and shoulders visible.
3. While your length is measured, pick a list and a cut, then tap **Try it on**. A try-on takes about 15–40 s.
4. Tap **Calculate my route**, set your limits, then **Build the document**. Try **Download**, **Copy** and **Save to My plans**.
5. Tap **Start my journey**, build the routine, tick a step, then **Check in** with another photo and **Add reminders to my calendar**.
6. Open **My plans** to reopen the saved document. The delete buttons on each page remove everything.

A consultation uses about 4–9 YouCam units from our key (more with the texture scan), and each check-in about 1.

---

## Submission checklist
- [ ] Working app deployed and reachable without login until judging ends
- [ ] Repo URL with source, assets, README setup and test instructions
- [ ] English description (above) with consumer and retail value
- [ ] 1–3 min public demo video, one continuous edit: capture → YouCam length → try-on → route → document → journey check-in, naming each YouCam API, recorded on a phone (see DEMO_SCRIPT.md)
- [ ] Screenshots (phone): camera, picker with length, try-on slider, route, document, journey
- [ ] Exact YouCam APIs listed (above)
- [ ] No unlicensed music, logos or third-party photos in the video or repo
- [ ] "Work completed during the submission period" filled in from CHANGELOG
- [ ] Special awards: tick Women in Tech or Rising Star/Student only if they apply to you
