# Demo video script (target 2:00, hard cap 3:00)

**Format:** one continuous phone screen recording with a voice-over, uploaded publicly to YouTube or Vimeo. Not two clips.
**Rules:** 1–3 minutes, show the app running on its intended device (a phone), name the YouCam APIs, no copyrighted music or third-party logos. Judges don't have to watch past 3:00.

## Before recording
- Deploy and open the live URL on your phone (the camera needs HTTPS). Check `/api/health` says `"mock": false`. A yellow "Simulated" banner means mock mode: don't record.
- Use **your own photo**, or a friend's with written permission. No stock or celebrity photos.
- **Pick a pair that shows every preview.** "Your hair, grown" (Hair Extension) only appears when the current hair is **at least short** (YouCam reads "short hair" or longer) and the target is medium or long. From ear length or shorter the route shows a "Let it grow" stop that explains why instead. Good pairs:
  - short hair → **Long straight with fringe** (Women's list): Grow it out first, an along-the-way cut, your hair grown, the target.
  - ear-length hair → **Grown-out waves** (Men's list): Grow it out first, an along-the-way cut, and the "Let it grow" explanation.
- Do one full run before recording so the try-ons are fast and you know the timings. Clear the site data afterwards so the recording starts fresh.
- Do Not Disturb on, brightness up, notifications off.
- Music: none, or a track you have a licence for.

## Shot list

| Time | Screen | Voice-over (suggested) |
| --- | --- | --- |
| 0:00–0:12 | Home page hero, scroll once | "An inspiration photo can't tell you whether your hair is long enough for that cut, or what to ask for while it grows. ManeRoute plans the route." |
| 0:12–0:30 | **Start your route** → consent → camera with guide → capture | "One guided photo. It goes only to YouCam." |
| 0:30–0:45 | Pick screen: the length row ticks over to the YouCam result; switch list, scroll the cuts | "While I browse 58 cuts, **YouCam Hair Length Detection** measures my starting point. Here, ear length." |
| 0:45–1:05 | **Try it on** → loading → before/after slider, drag it; try a second cut | "**YouCam Hairstyle Virtual Try-On** puts each cut on my own face. Every look is kept so I can compare." |
| 1:05–1:30 | **Calculate my route**: the headline, the length bar, the along-the-way cut, "your hair, grown" (or the "Let it grow" note), the rule ids | "Here's the answer: grow it out first, two bands. The cut to ask for on the way, and **YouCam Hair Extension** showing my own hair longer. Every rule that fired is shown. No made-up scores." |
| 1:30–1:40 | Optional: texture scan, front then sides | "An optional scan with **YouCam Hair Type Detection** checks whether my texture suits the look." |
| 1:40–1:55 | **Build the document**: scroll it, add a question, **Save to My plans**, **Share** | "Then the part that matters: one page for my barber with my starting point, the previews, my limits and the questions to ask." |
| 1:55–2:15 | **Start my journey**: the road with previews and Rou, build the routine, tick a step | "And it doesn't stop at a try-on. The plan becomes a road, with a haircare routine built for my hair." |
| 2:15–2:30 | **Check in** with a new photo → "YouCam reads…" → **Add reminders to my calendar** | "Every few weeks, one photo. Hair Length Detection measures again and I move along the road. Reminders go into my calendar." |
| 2:30–2:40 | Title card: ManeRoute, the four YouCam APIs, the URL | "ManeRoute. Built on YouCam AI Hair Length Detection, Hairstyle Virtual Try-On, Hair Extension and Hair Type Detection." |

If anything fails during recording, cut it. Never show a feature as working when it didn't work.

## Title and description for YouTube
**Title:** ManeRoute: from the hair you have to the hair you want (YouCam API Hackathon)
**Description:** A 2-minute demo of ManeRoute, a mobile web app that plans the route from your hair today to the cut you want, and tracks the journey. Built with YouCam AI Hair Length Detection, Hairstyle Virtual Try-On, Hair Extension and Hair Type Detection. ‹live URL› · https://github.com/abhishiv17/ManeRoute-
