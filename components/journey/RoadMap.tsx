"use client";

import Mascot from "@/components/Mascot";
import { zoom } from "@/components/flow/shared";
import { BAND_SHORT, progress, type Journey, type Milestone } from "@/lib/journey";
import { LENGTH_BANDS } from "@/lib/types";

// The road: every milestone of the route, with its YouCam preview, and Rou standing where you are.
// Milestones are reached by a new measurement in the right band or by logging the cut.
const KIND: Record<Milestone["kind"], string> = {
  start: "Start",
  stage: "Along the way",
  grow: "Grown out",
  target: "Destination",
};

const date = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function RoadMap({ journey, onLog }: { journey: Journey; onLog: (m: Milestone) => void }) {
  const p = progress(journey);
  const reachedAt = (i: number): number | null => {
    const m = journey.milestones[i];
    if (i === 0) return journey.createdAt;
    if (m.loggedAt) return m.loggedAt;
    // The first check-in whose band reached this milestone, in the direction of travel.
    const k = LENGTH_BANDS.indexOf(m.band);
    const hit = journey.checkins
      .filter((c) => c.kind === "measure" && c.band && c.at > journey.createdAt)
      .sort((a, b) => a.at - b.at)
      .find((c) => (journey.direction === "cut" ? LENGTH_BANDS.indexOf(c.band!) <= k : LENGTH_BANDS.indexOf(c.band!) >= k));
    return hit?.at ?? null;
  };

  return (
    <ol className="jr-road" aria-label="Your route">
      {journey.milestones.map((m, i) => {
        const state = p.states[i];
        const here = i === p.at;
        const when = state !== "ahead" ? reachedAt(i) : null;
        const isNext = i === p.at + 1;
        const loggable = isNext && (m.kind === "stage" || m.kind === "target");
        return (
          <li key={m.id} className={`jr-stop ${state} ${here ? "is-here" : ""}`}>
            <div className="jr-lane" aria-hidden>
              <span className="jr-node">{state === "done" && !here ? "✓" : ""}</span>
              {here && (
                <span className="jr-rou">
                  <Mascot mood={p.arrived ? "cheer" : "walk"} size={58} title="Rou: you are here" />
                </span>
              )}
            </div>
            <div className="jr-card">
              {m.image ? (
                <button className="jr-thumb" onClick={() => zoom(m.image!, m.name)} aria-label={`Enlarge ${m.name}`}>
                  <img src={m.image} alt="" />
                </button>
              ) : (
                <span className="jr-thumb empty" aria-hidden>{BAND_SHORT[m.band].slice(0, 1)}</span>
              )}
              <div className="jr-card-body">
                <div className="jr-kind">{KIND[m.kind]}{here && !p.arrived ? " · You are here" : ""}</div>
                <div className="jr-name">{m.name}</div>
                <div className="jr-meta">
                  {BAND_SHORT[m.band]}
                  {when ? ` · ${i === 0 ? "started" : p.how[i] === "logged" ? "cut" : "measured"} ${date(when)}` : ""}
                </div>
                {isNext && journey.direction !== "cut" && m.kind !== "target" && (
                  <div className="jr-hint">Reached when a check-in reads {BAND_SHORT[m.band].toLowerCase()}{m.kind === "stage" ? ", or when you get this cut" : ""}.</div>
                )}
                {loggable && (
                  <button className="jr-chip-btn" onClick={() => onLog(m)}>I got this cut</button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
