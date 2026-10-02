# Research: the consultation problem

This file collects the evidence behind ManeRoute, the competitive landscape, and the assumptions that still need testing with real people.

## 1. Evidence that the problem is real

| Finding | Source |
| --- | --- |
| In the past year, **45%** of UK clients were disappointed with an appointment outcome and **33%** felt the stylist didn't listen (2,000 female-identifying adults and 100 stylists, March 2023) | [Ripe Insurance salon survey](https://www.ripeinsurance.co.uk/small-business/hair-and-beauty-insurance/blog/salon-etiquette-the-uks-awkward-hair-salon-misunderstandings/) |
| After a poor experience, **28%** of clients didn't return and only **8%** left a review, so most dissatisfaction is silent | Same survey |
| **68%** of women report being unhappy with their hair | [American Salon / HairRx study](https://www.americansalon.com/hair/study-shows-shocking-percentage-women-are-unhappy-their-hair) |
| Consultation guides tell clients to bring photos, but also to say what they *don't* want, how much upkeep they can manage and how their texture behaves. These are the fields ManeRoute captures | [TheRightHairstyles consultation guide](https://therighthairstyles.com/how-to-show-stylist-what-you-want/) |
| Academic work models hairdressing dissatisfaction as leading to complaints and lower revisit intention | [Fashion and Textiles (Springer), 2019](https://link.springer.com/article/10.1186/s40691-019-0191-3) |

**Insight:** the failure usually isn't the stylist's skill. It's the **gap between the inspiration and what the client can put into words**, plus unstated limits such as not wanting to grow it out, avoiding chemicals, or needing low upkeep.

## 2. Competitive landscape

| Product type | Examples | What they do | Gap ManeRoute fills |
| --- | --- | --- | --- |
| AI hairstyle try-on | [YouCam AI Hairstyle Generator](https://yce.perfectcorp.com/ai-hairstyle-generator), [HairTry](https://hair-try.com/), [HairHunt](https://therighthairstyles.com/hairhunt-app/) | Show the destination on your face | No starting-point analysis, no route, no structured handoff |
| Salon analysis tools | [TheHair.App](https://thehair.app/) | Help stylists analyse hair in the salon | Used by stylists, and only once the client is already in the chair |
| Inspiration boards | Pinterest, Instagram saves | Collect photos | Photos of other people's hair, with no baseline and no limits |

Round-ups of 2026 try-on apps ([1](https://therighthairstyles.com/free-hairstyle-try-on-tools-and-apps/), [2](https://www.hairlookapp.com/post/best-hairstyle-apps-virtual-try-on-2026)) all compete on how realistic the destination looks. None of them measures the client's **current length** or produces a consultation artefact. That combination is ManeRoute's angle.

## 3. Design principles drawn from the research

1. **Start from the client's real hair**, which is why the baseline comes before the target.
2. **Name the limits**: grow-out, chemicals, upkeep and non-negotiables are first-class fields.
3. **Be honest about uncertainty**. Keep "or longer", flag texture-dependent looks, and never score.
4. **Make the output useful to the stylist**, so the card leads with the goal, starting point, limits and questions.
5. **Keep it low-effort**: one photo, one tap per preference, and about two minutes end to end.

## 4. Assumptions to test (needs AbhiShiv)

These are hypotheses, not facts. A short round of interviews would make the submission much stronger. See [MANUAL_TASKS.md](MANUAL_TASKS.md).

| # | Assumption | How to test | Pass signal |
| --- | --- | --- | --- |
| A1 | Clients struggle to say what they want beyond showing a photo | Ask 5 people about their last disappointing cut | 3 or more describe a communication gap |
| A2 | Stylists would read a one-page card before an appointment | Show the card to 2 or 3 barbers or stylists | They'd prefer it to a photo alone |
| A3 | The length-band baseline feels accurate to users | Five people run the app and rate "is this your length?" | 4 of 5 say yes, or "or longer" is acceptable |
| A4 | The planning-stage preview helps more than it confuses | Ask users to explain the route back in their own words | They describe it as a step, not a promise |
| A5 | Users trust the privacy explanation | Watch them read the consent screen | Nobody hesitates without a clear reason |

Record the answers in `docs/INTERVIEWS.md`. Even quotes from 3 people are valuable for the Devpost story and the video.

## 5. Hackathon fit

- The **YouCam API Skin AI & eCommerce VTO Hackathon** permits APIs from the "Skin, Beauty, Fashion, Jewelry & Watch, Hair & Beard" categories, so both hair APIs qualify ([rules](https://youcam-api-skin-ai-ecommerce.devpost.com/rules)).
- Submission period: **29 Sep 2026, 12:00 pm ET to 2 Nov 2026, 11:45 am ET**.
- Judging (equally weighted): Technological Implementation, Design, Potential Impact and Quality of the Idea. Stage one is a pass/fail check that the project fits the theme and uses the required APIs.
- ⚠️ Projects must be *newly created or significantly updated after the start of the submission period*. The MVP was started on 28 Sep 2026, one day before the window opens, so significant work must happen inside the window and be documented in [../CHANGELOG.md](../CHANGELOG.md). See [MANUAL_TASKS.md](MANUAL_TASKS.md).
