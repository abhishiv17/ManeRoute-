# Privacy and safety

Face and hair photos are sensitive, so ManeRoute is built to hold as little as possible.

## What happens to a photo

1. The photo is taken or picked in the browser and resized on the device.
2. It's sent once to ManeRoute's server (`/api/photo`), which checks the file header and forwards it to the YouCam File API. **It isn't written to disk, logged or kept in memory after the request.**
3. YouCam processes it for Hair Length Detection and Hairstyle VTO. **YouCam keeps uploaded and generated files for up to 30 days** ([policy](https://docs.perfectcorp.com/develop/file_retention_period)).
4. The results (length category and preview images) come back to the browser and live only in page memory.
5. **Delete session data** on the card screen clears the photo, previews, preferences and card from the device. Closing the tab does the same.

## Controls

| Requirement | How it's met |
| --- | --- |
| Keep API keys server-side | The key is read only in `lib/youcam/client.ts` (`server-only` import), and a build check confirms it isn't in `.next/static` |
| Don't commit secrets | `.env.local` is gitignored, and `.env.example` has placeholders only |
| Don't store images longer than needed | No database and no file writes. The service worker never caches `/api/*` or images |
| Delete-session control | On the card screen |
| No accounts | There's no login |
| No training use | ManeRoute doesn't train anything. The YouCam API terms govern YouCam's side |
| Explain the previews | The onboarding, route screen and card all say the previews are generated for this consultation and are planning references |
| No sensitive inferences | Only length category and the user's own preferences are used. No medical, race, ethnicity, gender-identity or age inference |
| Informed consent | A consent checkbox names YouCam and the 30-day retention before capture |
| Logging | The server logs only the YouCam error code, method and a redacted path, never headers, bodies or the key |
| Abuse | A per-IP limit on paid task starts |
| Security headers | `nosniff`, `Referrer-Policy: no-referrer`, and a `Permissions-Policy` limiting the camera to this origin; API responses are `no-store` |

## Known limits (honest list)

- YouCam, not ManeRoute, controls YouCam's retention. The public docs show no deletion endpoint, so ManeRoute can't erase files on YouCam's side before the 30 days are up.
- The rate limit lives in memory per server instance, so it's best effort on serverless platforms.
- The generated card is a normal image once shared. Users choose who receives it.

## Saved plans ("My plans")

Cards the user chooses to save are stored in the browser's IndexedDB on that device only. They are never uploaded, there are no accounts, and **My plans** has per-plan and delete-all controls. The texture-scan side photos follow the same lifecycle as the front photo: they go to YouCam once and live in page memory until the session is deleted.
