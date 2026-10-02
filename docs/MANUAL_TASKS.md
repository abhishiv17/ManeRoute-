# What needs AbhiShiv

Claude can do everything in the codebase. The items below need your accounts, your face, your judgement, or an action nobody else can take.

## A. Decisions (please answer; Claude's recommendation is marked)

| # | Decision | Options | Recommendation |
| --- | --- | --- | --- |
| D1 | **Submission-window timing.** The rules require the project to be "newly created or significantly updated after" 29 Sep 2026, 12:00 pm ET. The MVP was built on 28 Sep. | (a) Keep building and log all significant work from 29 Sep in CHANGELOG. (b) Freeze and submit as is. | **(a).** Make the next big features (below) inside the window and document them. |
| D2 | **Next feature inside the window** | Hair Type Detection (data-driven texture rule) · Hair Extension VTO ("try the length today" on length-building routes) · Stylist view link · Beard targets | **Hair Type Detection**, because it makes the R5 rule use real YouCam data rather than catalog flags |
| D3 | ~~Audience focus~~ | Done: 60 cuts in user-chosen Barbershop / Salon collections | |
| D4 | **Repo visibility** | Public GitHub repo (needs a licence) · Private repo shared with contact_event@PerfectCorp.com | **Public with the MIT licence**, which is simpler for judges |
| D5 | **Hosting** | Vercel (free Hobby plan) · Netlify · Render | **Vercel**: zero config for Next.js |
| D6 | **Special award** | Women in Tech · Rising Star/Student · none | Tick only what genuinely applies to you or your team |

## B. Manual tasks (only you can do these)

| # | Task | When | Notes |
| --- | --- | --- | --- |
| T1 | **Register** on the Devpost hackathon page | Now | https://youcam-api-skin-ai-ecommerce.devpost.com/ (opens 29 Sep, 12:00 pm ET) |
| T2 | **Check your YouCam unit balance** and claim hackathon credits if offered | Now | Console: https://yce.makeupar.com/api-console/en/api-keys/. Each full consultation costs 4–6 units, and testing on 28 Sep used roughly 20–25 |
| T3 | ~~Create a GitHub repo~~ Done: https://github.com/abhishiv17/ManeRoute-, first commit made locally on 2 Oct. **Push it** (`git push -u origin main`) and set its visibility | After D4 | Claude won't push until you say so. Never commit `.env.local` (it's already gitignored) |
| T4 | **Create a Vercel account and import the repo** | After T3 | Add the environment variable `YOUCAM_API_KEY` in Vercel → Project → Settings → Environment Variables. Claude can prepare everything else |
| T5 | **Test on your real phone** over the Vercel URL | After T4 | The camera needs HTTPS. Run the checklist in [TESTING.md](TESTING.md) |
| T6 | **Interview 3–5 people** (and ideally 1–2 barbers or stylists) | This week | Use the assumptions table in [RESEARCH.md](RESEARCH.md) section 4. Paste notes into `docs/INTERVIEWS.md` and Claude will turn them into the "What we learned" section |
| T7 | **Record the demo video** | After T5 | Follow [DEMO_SCRIPT.md](DEMO_SCRIPT.md). Use your own face, or someone who agrees in writing. No copyrighted music |
| T8 | **Upload the video** publicly to YouTube or Vimeo | After T7 | Copy the link into SUBMISSION.md |
| T9 | **Take 5 phone screenshots** for Devpost | After T5 | Onboarding, camera, picker, route, card |
| T10 | **Fill the `‹…›` placeholders** in [SUBMISSION.md](SUBMISSION.md) and submit on Devpost | Before 2 Nov 2026, 11:45 am ET | Aim to submit a few days early |
| T11 | **Keep the demo running** until judging ends, with enough units | Through judging | Consider raising `MAX_TASKS_PER_HOUR` or topping up units |
| T14 | **Try the texture scan yourself** on the camera: front, then turn right, then left (3-second timer, hands-free) | Now | The only path Claude could not verify with sample photos, because it needs real side angles of a person |
| T12 | **Rotate your YouCam key** after the hackathon | After results | It's been used on your laptop and will be in Vercel |

## C. Things to be aware of

- **Your ISP blocks `cdn.perfectcorp.com`** (it resolves to an Airtel "restricted" page). The app no longer depends on it, but if you browse YouCam's docs and images look broken, that's why.
- **Template photos.** The style thumbnails in `public/styles/` come from YouCam's own template list. They're shown to pick a YouCam template, which is their intended use, but if you want zero doubt, ask the YouCam team (YouCamOnlineEditor_API@perfectcorp.com) or let Claude switch to illustrated icons.
