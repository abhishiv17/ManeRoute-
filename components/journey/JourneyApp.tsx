"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import SiteNav from "@/components/route/SiteNav";
import { CompareSlider, Lightbox, zoom } from "@/components/flow/shared";
import { deleteJourney, listJourneys, putJourney } from "@/lib/client/journeys";
import { buildIcs } from "@/lib/ics";
import {
  BAND_SHORT,
  currentBand,
  nextCheckIn,
  nextTrim,
  pace,
  progress,
  rouLine,
  type CheckIn as CheckInT,
  type Journey,
  type Milestone,
} from "@/lib/journey";
import RoadMap from "./RoadMap";
import CheckIn from "./CheckIn";
import Routine, { RoutineSetup, routineFor } from "./Routine";

// MY JOURNEY: the route you're actually walking. Stored on this device only.
const DAY = 86_400_000;
const date = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dueText = (d: { inDays: number; overdue: boolean }) =>
  d.overdue ? `${-d.inDays} day${d.inDays === -1 ? "" : "s"} overdue` : d.inDays === 0 ? "Today" : d.inDays === 1 ? "Tomorrow" : `In ${d.inDays} days`;

type View = { at: "home" } | { at: "checkin" } | { at: "setup" } | { at: "log"; milestone: Milestone | null };

export default function JourneyApp() {
  const [list, setListState] = useState<Journey[] | null>(null);
  // The latest list, so quick successive edits (ticking two items fast) never start from a stale copy.
  const listRef = useRef<Journey[]>([]);
  const setList = (l: Journey[]) => {
    listRef.current = l;
    setListState(l);
  };
  const [id, setId] = useState<string | null>(null);
  const [view, setView] = useState<View>({ at: "home" });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    listJourneys().then((all) => {
      setList(all);
      const fromHash = decodeURIComponent(window.location.hash.slice(1));
      const active = all.filter((j) => j.status === "active");
      setId(all.find((j) => j.id === fromHash)?.id ?? active[0]?.id ?? all[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (id) window.history.replaceState(null, "", `#${id}`);
  }, [id]);

  const journey = list?.find((j) => j.id === id) ?? null;

  /** Applies a change to the latest copy of a journey, shows it at once, then stores it. */
  const update = useCallback((jid: string, fn: (j: Journey) => Journey) => {
    const cur = listRef.current.find((x) => x.id === jid);
    if (!cur) return Promise.resolve();
    const next = { ...fn(cur), updatedAt: Date.now() };
    setList(listRef.current.map((x) => (x.id === jid ? next : x)));
    return putJourney(next).then(
      () => {},
      () => setNotice("Saving isn't available here (private mode or storage blocked)."),
    );
  }, []);

  const go = (v: View) => {
    setView(v);
    setNotice(null);
    window.scrollTo({ top: 0 });
  };

  if (!list) return <div className="flow" />;

  if (!journey) {
    return (
      <div className="flow">
        <SiteNav current="/journey" />
        <main className="flow-main" style={{ paddingTop: 18 }}>
          <div className="kicker"><span>My journey · this device only</span></div>
          <h1 className="display h2 screen-title">No journey yet.</h1>
          <div className="jr-empty">
            <Mascot mood="wave" size={120} />
            <div>
              <p className="lead" style={{ margin: "0 0 12px" }}>
                Pick a look, and ManeRoute turns it into a road you can walk: check-in photos measured by YouCam, a haircare
                routine built for your hair, and reminders for trims.
              </p>
              <ol className="jr-how">
                <li><b>Consult.</b> Try cuts on your own photo and get the route.</li>
                <li><b>Start the journey</b> from your consultation document.</li>
                <li><b>Check in</b> every few weeks. Rou moves when your length does.</li>
              </ol>
            </div>
          </div>
          <Link href="/consult" className="cta block">Start a consultation</Link>
        </main>
      </div>
    );
  }

  const others = list.filter((j) => j.id !== journey.id);
  const routine = routineFor(journey);

  const remove = async () => {
    if (!confirm(`Delete the journey to ${journey.targetName}, with its check-in photos? This can't be undone.`)) return;
    await deleteJourney(journey.id).catch(() => {});
    const rest = list.filter((j) => j.id !== journey.id);
    setList(rest);
    setId(rest[0]?.id ?? null);
    go({ at: "home" });
  };

  return (
    <div className="flow">
      <SiteNav current="/journey" />
      <main className="flow-main" style={{ paddingTop: 18 }}>
        {view.at === "checkin" && (
          <CheckIn
            journey={journey}
            onSave={(c) => update(journey.id, (j) => ({ ...j, checkins: [...j.checkins, c] }))}
            onPatch={(cid, fields) => update(journey.id, (j) => ({ ...j, checkins: j.checkins.map((x) => (x.id === cid ? { ...x, ...fields } : x)) }))}
            onClose={() => go({ at: "home" })}
          />
        )}
        {view.at === "setup" && (
          <RoutineSetup
            journey={journey}
            onSave={(answers) => {
              update(journey.id, (j) => ({ ...j, answers }));
              go({ at: "home" });
              setTimeout(() => document.getElementById("routine")?.scrollIntoView({ behavior: "smooth" }), 60);
            }}
            onCancel={() => go({ at: "home" })}
          />
        )}
        {view.at === "log" && (
          <LogCut
            journey={journey}
            preset={view.milestone}
            onSave={(fn, msg) => {
              update(journey.id, fn);
              go({ at: "home" });
              setNotice(msg);
            }}
            onClose={() => go({ at: "home" })}
          />
        )}
        {view.at === "home" && (
          <Dashboard
            journey={journey}
            others={others}
            routine={routine}
            notice={notice}
            onSwitch={(j) => {
              setId(j.id);
              go({ at: "home" });
            }}
            onCheckIn={() => go({ at: "checkin" })}
            onSetup={() => go({ at: "setup" })}
            onLog={(m) => go({ at: "log", milestone: m })}
            onTicks={(fn) => update(journey.id, (j) => ({ ...j, ticks: fn(j.ticks) }))}
            onCadence={(checkEveryDays) => update(journey.id, (j) => ({ ...j, checkEveryDays }))}
            onNotice={setNotice}
            onRemove={remove}
          />
        )}
      </main>
      <Lightbox />
    </div>
  );
}

function Dashboard({
  journey: j,
  others,
  routine,
  notice,
  onSwitch,
  onCheckIn,
  onSetup,
  onLog,
  onTicks,
  onCadence,
  onNotice,
  onRemove,
}: {
  journey: Journey;
  others: Journey[];
  routine: ReturnType<typeof routineFor>;
  notice: string | null;
  onSwitch: (j: Journey) => void;
  onCheckIn: () => void;
  onSetup: () => void;
  onLog: (m: Milestone | null) => void;
  onTicks: (fn: (t: Journey["ticks"]) => Journey["ticks"]) => void;
  onCadence: (days: number) => void;
  onNotice: (s: string) => void;
  onRemove: () => void;
}) {
  const p = progress(j);
  const line = rouLine(j);
  const check = nextCheckIn(j);
  const trim = routine ? nextTrim(j, routine.trimEveryDays) : null;
  const myPace = pace(j);
  const day = Math.floor((Date.now() - j.createdAt) / DAY) + 1;
  const photos = useMemo(() => j.checkins.filter((c) => c.photo).sort((a, b) => a.at - b.at), [j.checkins]);
  const history = useMemo(() => [...j.checkins].sort((a, b) => b.at - a.at), [j.checkins]);
  const renders = useMemo(() => j.checkins.filter((c) => c.preview).sort((a, b) => a.at - b.at), [j.checkins]);
  const dayOne = j.cutImage ?? j.milestones.find((m) => m.kind === "target")?.image;
  const latestRender = renders[renders.length - 1];

  const addToCalendar = () => {
    const events = [
      {
        uid: `${j.id}-checkin`,
        title: "ManeRoute check-in",
        description: `New photo for your journey to ${j.targetName}: face forward, hair down, same light. Open ManeRoute → My journey.`,
        date: new Date(check.overdue ? Date.now() : check.date),
        rrule: `FREQ=DAILY;INTERVAL=${j.checkEveryDays}`,
      },
      ...(trim && routine
        ? [{
            uid: `${j.id}-trim`,
            title: j.direction === "grow" ? "Trim the ends (keep the length)" : "Haircut: keep the shape",
            description: `On the way to ${j.targetName}. Bring your ManeRoute card.`,
            date: new Date(trim.overdue ? Date.now() : trim.date),
            rrule: `FREQ=DAILY;INTERVAL=${routine.trimEveryDays}`,
          }]
        : []),
    ];
    const blob = new Blob([buildIcs(events)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "maneroute-reminders.ics";
    a.click();
    onNotice("Calendar file downloaded. Open it to add the reminders to your calendar.");
  };

  return (
    <>
      {others.length > 0 && (
        <nav className="jr-switch" aria-label="Your journeys">
          <span className="mono muted">Journeys</span>
          <button className="on" aria-current="true">{j.targetName}</button>
          {others.map((o) => <button key={o.id} onClick={() => onSwitch(o)}>{o.targetName}</button>)}
        </nav>
      )}

      <div className="kicker"><span>My journey · day {day}</span><span>{j.routeHeadline}</span></div>
      <h1 className="display h2 screen-title">To {j.targetName}</h1>

      <div className="jr-hero">
        <div className="jr-meter" role="img" aria-label={`${p.at} of ${j.milestones.length - 1} stops reached`}>
          <div className="jr-meter-fill" style={{ width: `${p.fraction * 100}%` }} />
          {j.milestones.map((m, i) => (
            <span key={m.id} className={`jr-meter-dot ${p.states[i]}`} style={{ left: `${(i / (j.milestones.length - 1)) * 100}%` }} />
          ))}
        </div>
        <div className="jr-meter-legend">
          <span>Now: <b>{BAND_SHORT[currentBand(j)]}</b></span>
          <span>{p.arrived ? "Arrived" : `${p.at} of ${j.milestones.length - 1} stops`}</span>
          <span>Goal: <b>{BAND_SHORT[j.targetBand]}</b></span>
        </div>
      </div>

      <div className="rou">
        <Mascot mood={line.mood} size={56} />
        <div className="rou-body">
          <div className="rou-label">ROU</div>
          <div className="rou-text">{line.text}</div>
        </div>
      </div>

      {notice && <p className="note ok" role="status">{notice}</p>}

      <section className="jr-next" aria-label="Next up">
        <div className={`jr-due ${check.inDays <= 0 ? "now" : ""}`}>
          <div className="jr-due-k">Check-in</div>
          <div className="jr-due-v">{dueText(check)}</div>
          <div className="jr-due-s">
            Every{" "}
            <select value={j.checkEveryDays} onChange={(e) => onCadence(Number(e.target.value))} aria-label="Check-in every">
              {[14, 21, 28, 42].map((d) => <option key={d} value={d}>{d / 7} weeks</option>)}
            </select>
          </div>
          <button className="cta plain block" onClick={onCheckIn}>Check in</button>
        </div>
        <div className="jr-due">
          <div className="jr-due-k">{j.direction === "grow" ? "Trim" : "Next cut"}</div>
          <div className="jr-due-v">{trim ? dueText(trim) : "-"}</div>
          <div className="jr-due-s">{routine ? `About every ${Math.round(routine.trimEveryDays / 7)} weeks` : "Build your routine to plan trims"}</div>
          <button className="cta ghost plain block" onClick={() => onLog(null)}>Log a cut</button>
        </div>
      </section>
      <button className="textbtn" onClick={addToCalendar}>Add reminders to my calendar</button>

      <section className="jr-section" aria-label="Your destination, on your hair">
        <div className="jr-sec-head">
          <h2 className="display h3">{j.targetName}, on your hair</h2>
          {latestRender && <span className="mono muted">Latest · {date(latestRender.at)}</span>}
        </div>
        {latestRender && dayOne ? (
          <>
            <CompareSlider
              before={dayOne}
              after={latestRender.preview!}
              beforeLabel={`Day 1 · ${BAND_SHORT[j.milestones[0].band]}`}
              afterLabel={`${date(latestRender.at)}${latestRender.band ? ` · ${BAND_SHORT[latestRender.band]}` : ""}`}
            />
            <p className="small muted" style={{ marginTop: 8 }}>
              The same destination, rendered by YouCam Hairstyle Try-On on your first photo and on your latest check-in.
            </p>
            {renders.length > 1 && (
              <div className="jr-renders">
                {renders.map((c) => (
                  <button key={c.id} onClick={() => zoom(c.preview!, date(c.at))} aria-label={`Enlarge the render from ${date(c.at)}`}>
                    <img src={c.preview} alt="" />
                    <span>{date(c.at)}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="jr-dest-empty">
            {dayOne && <img src={dayOne} alt="" />}
            <p className="small">
              Every check-in also renders {j.targetName} on that day&apos;s photo with YouCam Hairstyle Try-On, so you see the
              destination fitting your own hair a little better each time, even before the length band changes.
            </p>
          </div>
        )}
      </section>

      <section className="jr-section">
        <div className="jr-sec-head"><h2 className="display h3">The road</h2>{myPace && <span className="jr-pace">Your pace: {myPace.text}</span>}</div>
        <RoadMap journey={j} onLog={(m) => onLog(m)} />
      </section>

      {routine ? (
        <Routine journey={j} routine={routine} onTicks={onTicks} onEdit={onSetup} />
      ) : (
        <section className="jr-section jr-cta-card">
          <Mascot mood="think" size={72} />
          <div>
            <h2 className="display h3">Your haircare routine</h2>
            <p className="small">
              Six taps and you get a daily, wash-day, weekly and monthly routine for {j.texture ? "your measured texture" : "your hair"} and{" "}
              {j.targetName}, with the reason behind every step and a checklist for today.
            </p>
            <button className="cta" onClick={onSetup}>Build my routine</button>
          </div>
        </section>
      )}

      <section className="jr-section">
        <div className="jr-sec-head"><h2 className="display h3">Your photos</h2><span className="mono muted">{photos.length} check-in{photos.length === 1 ? "" : "s"}</span></div>
        {photos.length >= 2 ? (
          <CompareSlider
            before={photos[0].photo!}
            after={photos[photos.length - 1].photo!}
            beforeLabel={`${date(photos[0].at)} · ${BAND_SHORT[photos[0].band!]}`}
            afterLabel={`${date(photos[photos.length - 1].at)} · ${BAND_SHORT[photos[photos.length - 1].band!]}`}
          />
        ) : (
          <p className="small muted">After your first check-in you can slide between your first photo and your latest one here.</p>
        )}
        <ul className="jr-log">
          {history.map((c) => (
            <li key={c.id}>
              {c.photo ? (
                <button className="jr-log-img" onClick={() => zoom(c.photo!, date(c.at))} aria-label={`Enlarge photo from ${date(c.at)}`}>
                  <img src={c.photo} alt="" />
                </button>
              ) : (
                <span className="jr-log-img cut" aria-hidden>✂</span>
              )}
              <div>
                <div className="jr-log-t">
                  {c.kind === "measure" ? `Measured: ${BAND_SHORT[c.band!]}${c.atLeast ? " or longer" : ""}` : `Cut: ${j.milestones.find((m) => m.id === c.milestoneId)?.name ?? "trim / tidy-up"}`}
                </div>
                <div className="jr-log-s">{date(c.at)}{c.kind === "measure" ? " · YouCam Hair Length Detection" : ""}{c.simulated ? " · simulated" : ""}</div>
                {c.note && <div className="small">{c.note}</div>}
              </div>
              {c.preview && (
                <button className="jr-log-img" onClick={() => zoom(c.preview!, `${j.targetName} · ${date(c.at)}`)} aria-label={`Enlarge ${j.targetName} rendered on ${date(c.at)}`}>
                  <img src={c.preview} alt="" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="jr-section">
        <p className="small muted">
          Journeys, photos and ticks stay in this browser on this device. ManeRoute&apos;s server stores none of it. Check-ins
          measure length in YouCam&apos;s five bands; ManeRoute never predicts how fast hair grows.
        </p>
        <button className="textbtn danger" onClick={onRemove}>Delete this journey</button>
      </section>
    </>
  );
}

function LogCut({
  journey: j,
  preset,
  onSave,
  onClose,
}: {
  journey: Journey;
  preset: Milestone | null;
  onSave: (fn: (j: Journey) => Journey, msg: string) => void;
  onClose: () => void;
}) {
  const p = progress(j);
  const options = j.milestones.filter((m, i) => i > p.at && (m.kind === "stage" || m.kind === "target"));
  const [which, setWhich] = useState<string>(preset?.id ?? "trim");
  const [note, setNote] = useState("");
  const submit = () => {
    const now = Date.now();
    const c: CheckInT = { id: crypto.randomUUID(), at: now, kind: "cut", milestoneId: which === "trim" ? undefined : which, note: note.trim() || undefined };
    const name = j.milestones.find((m) => m.id === which)?.name;
    onSave(
      (cur) => ({ ...cur, milestones: cur.milestones.map((m) => (m.id === which ? { ...m, loggedAt: now } : m)), checkins: [...cur.checkins, c] }),
      name
        ? `Logged: ${name}. Rou has moved along the road.`
        : j.answers
          ? "Trim logged. The next one is planned from today."
          : "Trim logged. Build your routine below and the next trim is planned from today.",
    );
  };
  return (
    <section className="jr-panel">
      <div className="kicker"><span>Log a cut</span><button className="textbtn" style={{ minHeight: 0, padding: 0 }} onClick={onClose}>Close</button></div>
      <h2 className="display h3 screen-title">What did you get?</h2>
      <fieldset className="jr-q">
        <legend className="jr-q-label">Today&apos;s cut</legend>
        <div className="jr-choices col">
          {options.map((m) => (
            <label key={m.id}>
              <input type="radio" name="cut" checked={which === m.id} onChange={() => setWhich(m.id)} />
              <span>{m.name} <small>{m.kind === "target" ? "the destination" : "a stop on the way"}</small></span>
            </label>
          ))}
          <label>
            <input type="radio" name="cut" checked={which === "trim"} onChange={() => setWhich("trim")} />
            <span>A trim or tidy-up <small>same route, shape kept</small></span>
          </label>
        </div>
      </fieldset>
      <label htmlFor="cut-note" className="jr-q-label" style={{ display: "block", marginTop: 14 }}>Note (optional)</label>
      <textarea id="cut-note" maxLength={200} value={note} placeholder="e.g. Took 1 cm off, asked for longer layers." onChange={(e) => setNote(e.target.value)} />
      <div className="dock flat"><button className="cta block" onClick={submit}>Save</button></div>
    </section>
  );
}
