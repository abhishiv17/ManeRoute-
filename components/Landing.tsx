import Link from "next/link";
import { CATALOG, stylesIn } from "@/lib/catalog";
import Mascot from "@/components/Mascot";
import SiteNav from "@/components/route/SiteNav";
import Scene from "@/components/route/Scene";
import ChapterRail from "@/components/route/ChapterRail";
import HereThere from "@/components/route/HereThere";

// Home page: told like a picture book. A painted road to the horizon, then short chapters.
// Static: no photo is taken here.

// One row per list, each on its own example model, so the two lists never read as mixed.
const SHOWCASE: { shelf: "barbershop" | "salon"; label: string; ids: string[] }[] = [
  { shelf: "barbershop", label: "Men's", ids: ["male_textured_crop", "all_messy_tapered_fade", "all_side_swept_undercut", "male_tousled_cut"] },
  { shelf: "salon", label: "Women's", ids: ["all_pixie", "all_french_bob", "all_face_framing_shag_cut", "all_curtain_wavy"] },
];

const ROUTES = [
  ["Ready to go", "You already have the length. Take the card to your next visit."],
  ["Grow it out", "The target is longer. You'll see the cuts to ask for along the way."],
  ["Cut it shorter", "The target is shorter. Agree on the shape before anything comes off."],
  ["Ask your stylist", "Technique, texture or an unclear length reading. A professional checks first."],
  ["Retake the photo", "The photo couldn't be read. ManeRoute won't guess."],
] as const;

const CHAPTERS = [
  { id: "journey", label: "The journey" },
  { id: "stops", label: "Four stops" },
  { id: "routes", label: "Two routes" },
  { id: "walk", label: "Walk the road" },
  { id: "cuts", label: "The cuts" },
  { id: "privacy", label: "Your photo" },
  { id: "faq", label: "Questions" },
];

export default function Landing() {
  const count = CATALOG.length;
  return (
    <div className="story">
      <section className="hero">
        <Scene focus="road" />
        <SiteNav current="/" overlay />
        <div className="hero-copy">
          <p className="hero-sub">From the hair you have</p>
          <h1 className="display hero-title">
            To the hair<br />you <em>want</em>
          </h1>
          <p className="hero-lead">
            Try any cut on your own photo, see how far away it is, then walk the road: check-ins that measure your
            progress, and a haircare routine built for your hair.
          </p>
          <Link href="/consult" className="cta">Start your route</Link>
          <p className="hero-note">First try-on in about a minute · No account</p>
        </div>
        <div className="hero-rou"><Mascot mood="wave" size={150} title="Rou, the ManeRoute guide, waving from the road" /></div>
      </section>

      <ChapterRail chapters={CHAPTERS} />

      <section className="chapter teal" id="journey">
        <div className="wrap">
          <p className="chapter-num">Chapter one</p>
          <h2 className="display h2">A long way from here to there</h2>
          <p className="lead">
            You know the cut you want. You don&apos;t know how far away it is, what to ask for in between, or how to explain it
            in the chair. ManeRoute draws the road.
          </p>
          <HereThere />
          <p className="fine">Real YouCam Hairstyle Try-On on a YouCam sample model.</p>
        </div>
      </section>

      <section className="chapter" id="stops">
        <div className="wrap">
          <p className="chapter-num">Chapter two</p>
          <h2 className="display h2">Four stops on the way</h2>
          <ol className="stops">
            <li>
              <span className="stop-pin">1</span>
              <h3 className="display">You are here</h3>
              <p>One photo in a guided frame. YouCam Hair Length Detection finds your starting point while you browse.</p>
            </li>
            <li>
              <span className="stop-pin">2</span>
              <h3 className="display">Try the destination</h3>
              <p>{count} men&apos;s and women&apos;s cuts, each tried on your own face with YouCam Hairstyle Try-On. Try as many as you like.</p>
            </li>
            <li>
              <span className="stop-pin">3</span>
              <h3 className="display">See the route</h3>
              <p>Plain rules, no scores. The cut to ask for along the way, your own hair grown out (from short hair up), and an optional texture check.</p>
            </li>
            <li>
              <span className="stop-pin">4</span>
              <h3 className="display">Start the journey</h3>
              <p>Take a card to your barber, then track the road: check-ins, your routine and trim reminders.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="chapter sand" id="routes">
        <div className="wrap">
          <p className="chapter-num">Chapter three</p>
          <h2 className="display h2">Two people, two roads</h2>
          <div className="examples">
            <article className="example">
              <h3 className="display">Grow it out</h3>
              <div className="example-row">
                <figure><img src="/examples/barber-now.jpg" alt="Now: ear length" /><figcaption>Now</figcaption></figure>
                <figure><img src="/styles/barbershop/all_tousled_waves.jpg" alt="Along the way: tousled waves" /><figcaption>Along the way</figcaption></figure>
                <figure><img src="/styles/barbershop/all_hippie_wave.jpg" alt="Target: grown-out waves" /><figcaption>Target</figcaption></figure>
              </div>
            </article>
            <article className="example">
              <h3 className="display">Cut it shorter</h3>
              <div className="example-row">
                <figure><img src="/examples/salon-now.jpg" alt="Now: long" /><figcaption>Now</figcaption></figure>
                <figure><img src="/examples/salon-stage.jpg" alt="Along the way: straight lob" /><figcaption>Along the way</figcaption></figure>
                <figure><img src="/examples/salon-target.jpg" alt="Target: pixie" /><figcaption>Target</figcaption></figure>
              </div>
            </article>
          </div>
          <h3 className="display h3 sub-head">Five ways it can go</h3>
          <ul className="fact-cards">
            {ROUTES.map(([name, text]) => (
              <li key={name}>
                <h4 className="display">{name}</h4>
                <p>{text}</p>
              </li>
            ))}
          </ul>
          <p className="fine">No “92% match”. Every answer says which rule made it.</p>
        </div>
      </section>

      <section className="chapter" id="walk">
        <div className="wrap">
          <p className="chapter-num">Chapter four</p>
          <h2 className="display h2">Then walk the road</h2>
          <p className="lead">
            A plan is only the start. Your journey keeps the previews as stops on a road, and Rou walks it with you.
          </p>
          <div className="walk-grid">
            <div className="walk-rou"><Mascot mood="walk" size={150} title="Rou walking the road" /></div>
            <ul className="fact-cards">
              <li>
                <h4 className="display">Check-ins that measure</h4>
                <p>Every few weeks, one new photo. YouCam Hair Length Detection measures it again, and your destination is re-rendered on it, so you see the cut fitting your own hair as it grows. Your pace is yours, never predicted.</p>
              </li>
              <li>
                <h4 className="display">A routine for your hair</h4>
                <p>Six taps, plus your YouCam texture scan, give a daily, wash-day, weekly and monthly routine. Every step says why. Product types, not brands.</p>
              </li>
              <li>
                <h4 className="display">Today&apos;s checklist</h4>
                <p>Tick off today&apos;s steps and keep a streak. Wash days, masks and heat-free days are counted for you.</p>
              </li>
              <li>
                <h4 className="display">Trims on your calendar</h4>
                <p>Log each cut and the next trim is planned from it. Add check-ins and trims to your own calendar, no account needed.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="chapter" id="cuts">
        <div className="wrap">
          <p className="chapter-num">Chapter five</p>
          <h2 className="display h2">{count} cuts to choose from</h2>
          {SHOWCASE.map((row) => (
            <div key={row.shelf} className="cut-row-block">
              <p className="cut-row-label"><b>{row.label}</b> · {stylesIn(row.shelf).length} cuts</p>
              <div className="cut-strip">
                {row.ids.map((tid) => {
                  const s = CATALOG.find((x) => x.templateId === tid);
                  return s ? (
                    <figure key={tid}>
                      <img src={`/styles/${row.shelf}/${tid}.jpg`} alt={`${s.name} example`} />
                      <figcaption>{s.name}</figcaption>
                    </figure>
                  ) : null;
                })}
              </div>
            </div>
          ))}
          <p className="fine">
            Unisex cuts are in both lists. You choose the list; nothing is guessed from your photo.
          </p>
        </div>
      </section>

      <section className="chapter teal" id="privacy">
        <div className="wrap">
          <p className="chapter-num">Chapter six</p>
          <h2 className="display h2">Your photo stays yours</h2>
          <ul className="fact-cards on-dark">
            <li><h4 className="display">Sent only to YouCam</h4><p>For the analysis and try-ons. ManeRoute&apos;s server stores nothing.</p></li>
            <li><h4 className="display">Kept on your device</h4><p>Your session, plans, journeys and check-in photos live in your browser. One tap deletes them.</p></li>
            <li><h4 className="display">No account, no tracking</h4><p>No sign-up, no analytics, no guesses about gender, ethnicity or health.</p></li>
            <li><h4 className="display">Said plainly</h4><p>YouCam keeps processed files for up to 30 days under its own policy.</p></li>
          </ul>
        </div>
      </section>

      <section className="chapter faq" id="faq">
        <div className="wrap narrow">
          <p className="chapter-num">Before you set off</p>
          <h2 className="display h2">Questions</h2>
          <details><summary>Is this a haircut filter?</summary><p>No. The try-on is the start. The point is the distance from your hair now, the route, and the card you take to your appointment.</p></details>
          <details><summary>How does tracking work?</summary><p>Start a journey from your consultation. Every few weeks, take one new photo: YouCam measures your length band again, renders your destination on the new photo, and Rou moves along the road when your length changes. Log your cuts, tick off your routine, and add the reminders to your calendar. It all stays on your device.</p></details>
          <details><summary>Why no millimetres or “weeks to grow”?</summary><p>YouCam measures length as one of five visible bands, and growth speed differs for everyone. ManeRoute shows the real bands and the distance between them instead of inventing numbers.</p></details>
          <details><summary>What is the texture check?</summary><p>Two extra photos with your head turned. YouCam Hair Type Detection reads your natural texture, which changes the advice for wavy, curly and sleek looks. It&apos;s optional and only offered when a look depends on texture.</p></details>
          <details><summary>Where are my saved plans?</summary><p>Only in this browser on this device. They are never uploaded.</p></details>
          <details><summary>Does it work on a laptop?</summary><p>Yes, with your webcam or an uploaded photo. On a phone it uses the front camera.</p></details>
        </div>
      </section>

      <section className="finale">
        <Scene focus="road" />
        <div className="finale-copy">
          <Mascot mood="cheer" size={130} />
          <h2 className="display h2">Walk in with a plan</h2>
          <Link href="/consult" className="cta">Start your route</Link>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <span className="footer-brand">ManeRoute</span>
          <span>Built on YouCam Hair Length Detection, Hair Type Detection, Hairstyle Try-On and Hair Extension.</span>
          <span>A planning tool. Previews are references, not guarantees. Not medical advice.</span>
        </div>
      </footer>
    </div>
  );
}
