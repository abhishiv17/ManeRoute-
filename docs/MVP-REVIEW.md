# MVP review: judged as a product, not against the brief (29 Sep 2026)

I used the app end to end as a first-time user, on phone and laptop sizes with real YouCam calls, and reread the code. This review ignores the original brief and asks one question: **would a normal person get value fast, trust it, and come back?**

## Verdict

The engineering is solid, but the product is **too slow to deliver its payoff and talks like a spec**. The single thing people want (to *see themselves* with a new haircut) arrives on the 8th screen, after a questionnaire, and then shows up as a thumbnail. Everything else is secondary to fixing that.

## Critical (blocks a good MVP)

| # | Problem | Evidence | Fix |
| --- | --- | --- | --- |
| C1 | **Time to "wow" is about 8 screens.** Home → 3 onboarding slides → capture → analysis → style list choice → picker → preferences → *then* the preview | e2e walk-through | Merge onboarding into capture. Analyse in the background while you browse. Show the try-on straight after picking a style, with no questionnaire first |
| C2 | **The payoff is tiny.** The try-on is a quarter-width thumbnail in a 4-column strip | `RouteView` timeline | A full-width result with the before/after slider as the hero |
| C3 | **One look per run.** Trying another style means going back, and the in-between and grow-out previews regenerate too | `onChangeTarget` resets everything | "Try another" keeps a strip of every look you've tried, so you can compare and pick one to plan |
| C4 | **Back button and refresh destroy the session.** The steps are in-memory state, so phone back leaves `/consult` and a refresh loses the photos and every paid preview | `ManeRoute.tsx` has no history or storage | Push a history entry per step, handle back inside the flow, and restore the session from `sessionStorage` |
| C5 | **Developer language shown to users:** `R2_needs_length`, "route", "length band", "planning stage", "Stylist confirmation needed", long paragraphs | Route screen | Plain words: "What it'll take", "Cut first", "Grow it out", "Ask your stylist first", "Along the way". Rule ids go in a collapsed "How we decided" |

## Major

| # | Problem | Fix |
| --- | --- | --- |
| M1 | **The picker overwhelms:** a ~7,000 px page on phone, 33–58 cards each with 3–5 pills | A compact 3-column grid, one short tag per card, and the length groups kept. The men's/women's/all choice becomes a toggle at the top, not a separate screen |
| M2 | **The preferences form blocks the preview** and asks five questions up front | Move it after the try-on, as "Plan this look", with 3 taps plus an optional note |
| M3 | **The texture scan is pushed at capture as "recommended"**, adds two photos for everyone, and its success path is untested | Offer it only when the chosen look depends on texture, from the plan step ("Check it suits your hair") |
| M4 | **The card is a wall of text** (about 25 bullet lines, including a limitations list) that a barber won't read | One page: photos, goal, "keep / change / avoid", up to 5 questions, one disclaimer line |
| M5 | **The length result is dramatised** as a big "starting point" card, although people know their own length | Show it as one line with a "not right?" retake link. It matters as an input, not a reveal |
| M6 | **Onboarding is 3 slides before any action** | One screen: 3 photo tips, a one-line privacy note, a consent tick, then the camera |

## Minor
- The home page is long and wordy; it needs a shorter hero and a real "how it works in 3 steps".
- The mascot appears on almost every screen. Keep it for guidance, waiting and errors.
- Lazy-loaded style pictures flash the length drawing before appearing (cosmetic).
- An accessibility audit (axe/Lighthouse) still hasn't been run.

## The MVP, defined
> **See a haircut on yourself in under a minute, try a few, then send your barber a clear one-page plan.**

1. **Start:** one screen with tips, consent, camera or upload.
2. **Pick:** the length check runs in the background while you browse Men's / Women's / All.
3. **Try on:** a big result with a before/after slider. Try more, and every result is kept for comparison.
4. **Plan:** for the look you choose, answer 3 taps and get plain-language "what it'll take", with along-the-way and grow-out previews where useful, plus an optional texture check.
5. **Share:** a one-page card, saved on your device if you want.

## Status after the rebuild (29 Sep 2026)

| # | Status |
| --- | --- |
| C1 time to wow | ✅ Home → one start screen → pick → try-on. The length check runs in the background while you browse |
| C2 tiny payoff | ✅ Full-width before/after slider is the hero of the try-on screen |
| C3 one look per run | ✅ Every try-on is kept in "Your looks" to compare; re-opening a look costs nothing |
| C4 back/refresh | ✅ Each step is a history entry; refresh restores photo, looks, plan and unfinished YouCam tasks (e2e verifies **zero** new YouCam calls after refresh) |
| C5 jargon | ✅ Plain headlines ("Grow it out first", "Cut it shorter", "Check with your stylist first"), plain reasons; rule ids only under "How we decided" |
| M1 picker | ✅ Compact 3-column grid (5 on laptop), one tag per card, Men's / Women's / All toggle on the same screen |
| M2 form before preview | ✅ Questions moved after the try-on, below the plan answer |
| M3 texture scan friction | ✅ Offered only for looks that depend on texture, inside the plan |
| M4 wall-of-text card | ✅ One page: photos, hair now, what matters, what to talk about, questions (3–4 pre-ticked) |
| M5 dramatised length | ✅ One line at the top of the picker with a "New photo" link |
| M6 onboarding | ✅ One screen: tips, consent, camera/upload |
| Planning stage on men's list | ✅ Now prefers cuts typical for the chosen list (e.g. *Tousled waves*, not *Mid-part bob*) |

Verified: `npm run e2e -- --size=phone` and `--size=laptop --scan-fail` both pass with real YouCam calls; 20 unit tests; production build.
