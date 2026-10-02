"use client";

import { useState } from "react";

export type Stop = { label: string; sub?: string; image: string | null };

// Drag along the route: 0% is you now, 100% is the target. Stops in between are the
// planning stage and your hair grown out. Between two stops the images cross-fade.
export default function HairTimeline({ stops }: { stops: Stop[] }) {
  const [v, setV] = useState(100);
  const n = stops.length;
  const at = (i: number) => (n === 1 ? 0 : (i / (n - 1)) * 100);
  const seg = Math.min(n - 2, Math.floor((v / 100) * (n - 1)));
  const t = n === 1 ? 0 : ((v / 100) * (n - 1)) - seg;
  const a = stops[Math.max(0, seg)];
  const b = stops[Math.max(0, seg) + 1] ?? a;
  const nearest = Math.round((v / 100) * (n - 1));
  const fallback = stops.find((s) => s.image)?.image ?? null;

  return (
    <div className="timeline-x">
      <div className="tl-stage">
        {(a.image ?? fallback) && <img src={a.image ?? fallback!} alt="" style={{ opacity: 1 }} />}
        {(b.image ?? fallback) && <img src={b.image ?? fallback!} alt={stops[nearest].label} style={{ opacity: b.image ? t : 0 }} />}
        <span className="tl-now">{String(nearest + 1).padStart(2, "0")} / {stops[nearest].label}</span>
      </div>
      <div className="tl-track">
        <div className="tl-fill" style={{ width: `${v}%` }} />
        {stops.map((s, i) => (
          <span key={s.label}>
            <span className={`tl-stop ${s.image ? "" : "pending"}`} style={{ left: `${at(i)}%` }} />
            <span className={`tl-stop-label ${i === 0 ? "first" : i === n - 1 ? "last" : ""}`} style={{ left: `${at(i)}%` }}>
              {s.label}
            </span>
          </span>
        ))}
        <span className="tl-knob" style={{ left: `${v}%` }} />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={v}
          onChange={(e) => setV(Number(e.target.value))}
          aria-label="Move along your route from now to the target"
          aria-valuetext={stops[nearest].label}
        />
      </div>
      <div className="tl-caption">
        <span className="muted">{Math.round(v)}%</span>
        <span>{stops[nearest].sub ?? stops[nearest].label}</span>
      </div>
    </div>
  );
}
