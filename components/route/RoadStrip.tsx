"use client";

import Mascot from "@/components/Mascot";
import { LengthSilhouette, zoom } from "@/components/flow/shared";
import type { LengthBand } from "@/lib/types";

export type RoadStop = {
  key: string;
  /** Where on the route: "Now", "Along the way", "Let it grow", "Destination". */
  label: string;
  name: string;
  band: string;
  /** The length band the silhouette shows while there's no picture. */
  bandId: LengthBand;
  image: string | null;
  state: "ready" | "pending" | "failed" | "skipped";
  note?: string;
  onRetry?: () => void;
};

// The route as a road: your face at every stop, left to right, on a painted road with Rou at
// the start. Swipeable on a phone, the full width of the page on a laptop.
export default function RoadStrip({ stops }: { stops: RoadStop[] }) {
  return (
    <div className="road-wrap bleed">
      <ol className="road-strip" aria-label="Your route, from now to the destination">
        {stops.map((s, i) => (
          <li key={s.key} className={`road-stop ${s.state} ${i === 0 ? "first" : ""} ${i === stops.length - 1 ? "last" : ""}`}>
            <div className="road-fig">
              {s.image ? (
                <button className="road-img" onClick={() => zoom(s.image!, s.name)} aria-label={`Enlarge ${s.name}`}>
                  <img src={s.image} alt="" />
                </button>
              ) : (
                <span className="road-img empty">
                  <LengthSilhouette band={s.bandId} />
                  {s.state === "pending" && <span className="road-status mono">Rendering…</span>}
                  {s.state === "failed" && (
                    <button className="road-status textbtn" onClick={s.onRetry}>Retry this preview</button>
                  )}
                </span>
              )}
              {i === 0 && (
                <span className="road-rou" aria-hidden>
                  <Mascot mood="walk" size={70} />
                </span>
              )}
            </div>
            <div className="road-lane" aria-hidden>
              <span className="road-pin">{i + 1}</span>
            </div>
            <div className="rs-label">{s.label}</div>
            <div className="rs-name">{s.name}</div>
            <div className="rs-band">{s.band}</div>
            {s.note && <p className="rs-note">{s.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
