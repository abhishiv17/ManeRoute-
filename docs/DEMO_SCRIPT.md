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
| 0:30–0:45 | Pick screen: the length ticks over to the YouCam result and the grid sorts into Ready now / Grow one stage / Big change | "While I browse 58 cuts, **YouCam Hair Length Detection** measures my starting point, ear length, and sorts them into what I can have now and what needs growing." |
| 0:45–1:05 | **Try it on** → the wipe reveal → drag the slider; tap a "Try next" chip; scroll to the lookbook | "**YouCam Hairstyle Virtual Try-On** puts each cut on my own face, and every look lands in my lookbook to compare." |
| 1:00–1:10 | **Finish the look**: tap a beard (and a colour), the look wipes in on top of the cut | "And for the barbershop: **YouCam's Beard Style Generator** puts a beard on the new cut, and Hair Color tries a shade." |
| 1:05–1:30 | **Calculate my route**: the road with my face at each stop, the headline, "Why", then **What to ask for** | "My route, as a road: me now, the cut to ask for on the way, **YouCam Hair Extension** showing my own hair longer, and the destination. And exactly what to say in the chair." |
| 1:30–1:40 | Optional: hair check, right, left, then head lowered | "Three hands-free photos, and YouCam reads my **texture, frizz and density**: the route and my routine use them." |
| 1:40–1:55 | **Build the document**: the "In the chair, ask for" section, add a question, **Save to My plans**, **Share** | "One page for my barber, in barber language: what to ask for at my next appointment and at the destination." |
| 1:55–2:15 | **Start my journey**: the road with previews and Rou, build the routine, tick a step | "And it doesn't stop at a try-on. The plan becomes a road, with a haircare routine built for my hair." |
| 2:15–2:30 | **Check in** with a new photo → "YouCam reads…" → the destination wipes onto today's photo, next to the day-1 render | "Every few weeks, one photo. YouCam measures my length again and re-renders my destination on today's hair, so I can see it getting closer." |
| 2:30–2:40 | Title card: ManeRoute, the YouCam APIs, the URL | "ManeRoute. Built on nine YouCam AI APIs: hair length, type, frizz and density detection, hairstyle, extension, beard, bangs and colour try-on." |

If anything fails during recording, cut it. Never show a feature as working when it didn't work.

## Title and description for YouTube
**Title:** ManeRoute: from the hair you have to the hair you want (YouCam API Hackathon)
**Description:** A 2-minute demo of ManeRoute, a mobile web app that plans the route from your hair today to the cut you want, and tracks the journey. Built with YouCam AI Hair Length Detection, Hairstyle Virtual Try-On, Hair Extension and Hair Type Detection. ‹live URL› · https://github.com/abhishiv17/ManeRoute-
