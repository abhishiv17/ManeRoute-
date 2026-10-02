# ManeRoute: product definition

> **From the hair you have to the hair you want.**

## One-line pitch

ManeRoute turns "I want this hairstyle" into a clear, shareable consultation plan. It detects your current visible hair length with YouCam AI, previews the target and an in-between stage with YouCam Hairstyle VTO, and uses transparent rules to show the route from here to there.

## The problem

Clients bring an inspiration photo to a barber or stylist but cannot easily explain:

- what should change and what must be preserved;
- whether they are willing to grow their hair out;
- whether they accept colour or chemical treatment (perms, relaxers);
- how much daily styling and upkeep they can handle;
- which parts of the inspiration are unrealistic from their current hair.

The result is the familiar "that's not what I meant" moment. In a UK survey of 2,000 clients, 45% had been disappointed with an appointment outcome in the past year, 33% felt the stylist didn't listen, and 28% of those with a poor experience never returned (see [RESEARCH.md](RESEARCH.md)).

Try-on apps don't fix this. They show a **destination**, not the distance from where the client is now, and they give the stylist nothing structured to work with.

## Who it's for

| User | Need | What ManeRoute gives them |
| --- | --- | --- |
| **Client** before an appointment (primary) | Explain what they want, and learn whether it's realistic | A route, AI previews, and a card to share |
| **Barber or stylist** (receives the card) | Understand the goal, limits and starting point before cutting | Baseline, preferences, non-negotiables, questions, previews |
| **Salon or retailer** (future) | Better consultations, fewer redos, more rebookings | A consultation step that can be embedded in booking or retail flows |

## Core experience

1. **Onboarding**: what ManeRoute is and isn't, how it works, a photo guide with do's and don'ts, and privacy consent.
2. **Capture**: a live camera with a face-and-shoulder guide, a 3-second timer and a lighting hint, with photo upload as a fallback.
3. **Baseline**: YouCam Hair Length Detection returns a length category, and "or longer" results are shown as uncertain.
4. **Target**: 58 cuts in Men's / Women's / All lists (chosen by the user, never inferred), each mapped to a tested YouCam template and tried on with Hairstyle VTO.
5. **Boundaries**: grow-out willingness, chemical treatment, upkeep, keep-length, and free-text non-negotiables.
6. **Route**: one of *Ready for your next appointment*, *Grow it out first*, *Cut it shorter*, *Check with your stylist first* or *Retake your photo*, with the rule ids that fired and plain-language reasons.
7. **Previews**: the target, a planning stage when the gap is two or more length bands, and, from short hair up, the user's own hair grown out (Hair Extension).
8. **Consultation card**: rendered on the device as a PNG and shared through the Web Share API, downloaded, or copied as text.
9. **Delete session**: clears everything from the device.

## What makes it different

- **YouCam analysis changes the outcome.** The same target produces a different route for a client with ear-length hair than for one with long hair.
- **No invented numbers.** There are no "92% achievable" scores, only named rules and plain sentences.
- **Uncertainty is kept, not hidden.** The "or longer" results, texture-dependent looks and preference conflicts all appear on the card.
- **Built for the handoff.** The output is a document for the stylist, not a selfie filter.

## Non-goals

- A generic hairstyle filter or selfie editor.
- Medical or diagnostic claims about hair or scalp.
- Exact length in centimetres, or growth timelines.
- Booking, payments, a marketplace, or a chatbot-first interface.
- Inferring sensitive traits such as race, ethnicity, gender identity or health.

## Consumer and retail value

- **Consumers** get fewer bad cuts, more confidence and a better first conversation.
- **Salons and barbers** get faster consultations and fewer redos and walk-outs, and a card that doubles as a record for the next visit.
- **Retail and eCommerce**: the route is a natural place to recommend grow-out products, styling tools or extensions later. The Hair Extension VTO fits the length-building route.

## Success criteria for the MVP

A judge understands within 30 seconds that:
1. this is not just a filter;
2. YouCam analysis changes the route;
3. YouCam VTO visualises the target and the in-between stage;
4. the rule engine is transparent and built by us;
5. the card is useful enough to send before an appointment.

## Roadmap (after MVP)

| Next | Why it strengthens the consultation |
| --- | --- |
| Hair Type Detection | Replaces "texture-sensitive" guesses with a detected texture category, so the R5 rule becomes data-driven |
| Hair Extension VTO | Shows a "try the length today" alternative on length-building routes |
| Bangs VTO | Previews a fringe separately, a common hesitation |
| Stylist view link | Lets the stylist open the card in a browser and add notes |
| Beard targets | For barbershop consultations |
