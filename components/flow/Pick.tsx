"use client";

import { useState } from "react";
import { getStyle, stylesIn, thumbFor } from "@/lib/catalog";
import { LENGTH_BANDS, LENGTH_BAND_LABELS, type HairBaseline, type LengthBand, type TargetStyle } from "@/lib/types";
import type { PreparedPhoto } from "@/lib/client/image";
import type { ApiFailure } from "@/lib/client/api";
import Measure, { distanceLabel } from "@/components/route/Measure";
import { LengthSilhouette, type Shelf } from "./shared";

export type LengthState =
  | { state: "running" }
  | { state: "done"; baseline: HairBaseline }
  | { state: "timeout"; taskId: string }
  | { state: "error"; failure: ApiFailure };

const SHELVES: [Shelf, string][] = [
  ["barbershop", "Men's"],
  ["salon", "Women's"],
  ["all", "All"],
];

const BAND_SHORT: Record<LengthBand, string> = {
  above_ears: "Above ears",
  ear_length: "Ear length",
  short: "Short",
  above_chest: "Medium",
  long: "Long",
};

/** The analysis builds the route while you browse: YOU → LENGTH → (TEXTURE) → ROUTE. */
function AnalysisTree({ photo, length, onRetake, onKeepWaiting, onRetry }: {
  photo: PreparedPhoto;
  length: LengthState;
  onRetake: () => void;
  onKeepWaiting: () => void;
  onRetry: () => void;
}) {
  const lenState =
    length.state === "done" ? "done" : length.state === "error" ? "fail" : "now";
  const lenText =
    length.state === "done"
      ? `${BAND_SHORT[length.baseline.lengthBand]}${length.baseline.atLeast ? "+" : ""} ✓`
      : length.state === "error"
        ? "Interrupted"
        : length.state === "timeout"
          ? "Slow…"
          : "Measuring…";
  return (
    <section className="tree" aria-live="polite" aria-label="Analysis">
      <div className="tree-you">
        <img src={photo.dataUrl} alt="" />
        <span>You ● Current state</span>
      </div>
      <div className={`tree-row ${lenState}`}>
        <span className="glyph">├─</span>
        <span>Length · YouCam</span>
        <span className="state">{lenText}</span>
      </div>
      <div className="tree-row">
        <span className="glyph">├─</span>
        <span>Texture · optional</span>
        <span className="state muted">At route</span>
      </div>
      <div className="tree-row">
        <span className="glyph">└─</span>
        <span>Route</span>
        <span className="state muted">Pick a cut</span>
      </div>
      {length.state === "error" && (
        <p className="small" style={{ margin: "8px 0 0", textTransform: "none", letterSpacing: 0, fontFamily: "var(--sans)", color: "var(--err)" }}>
          {length.failure.message}
        </p>
      )}
      <div className="tree-actions">
        {length.state === "timeout" && <button className="textbtn" onClick={onKeepWaiting}>Keep waiting</button>}
        {length.state === "error" && !length.failure.retake && <button className="textbtn" onClick={onRetry}>Try again</button>}
        <button className="textbtn" onClick={onRetake}>{length.state === "error" && length.failure.retake ? "Retake photo" : "New photo"}</button>
      </div>
    </section>
  );
}

function CutImage({ style, shelf }: { style: TargetStyle; shelf: Shelf }) {
  const [loaded, setLoaded] = useState(false);
  const src = thumbFor(style, shelf);
  return (
    <div className="cut-img">
      {!loaded && <div className="fallback" aria-hidden><LengthSilhouette band={style.targetLengthBand} /></div>}
      {src && <img src={src} alt="" loading="lazy" className={loaded ? "in" : ""} onLoad={() => setLoaded(true)} />}
    </div>
  );
}

export default function Pick({
  photo,
  length,
  shelf,
  setShelf,
  band,
  setBand,
  selected,
  setSelected,
  tried,
  onTryOn,
  onRetake,
  onKeepWaiting,
  onRetryLength,
}: {
  photo: PreparedPhoto;
  length: LengthState;
  shelf: Shelf | null;
  setShelf: (s: Shelf) => void;
  band: LengthBand | "any";
  setBand: (b: LengthBand | "any") => void;
  selected: string | null;
  setSelected: (id: string) => void;
  tried: Set<string>;
  onTryOn: () => void;
  onRetake: () => void;
  onKeepWaiting: () => void;
  onRetryLength: () => void;
}) {
  const baseline = length.state === "done" ? length.baseline : null;
  const style = selected ? getStyle(selected) : undefined;
  const cur = baseline ? LENGTH_BANDS.indexOf(baseline.lengthBand) : -1;

  const visible = shelf ? stylesIn(shelf).filter((s) => band === "any" || s.targetLengthBand === band) : [];
  const groups = LENGTH_BANDS.map((b, i) => ({ band: b, i, styles: visible.filter((s) => s.targetLengthBand === b) }))
    .filter((g) => g.styles.length)
    .sort((a, b) => (cur < 0 ? a.i - b.i : Math.abs(a.i - cur) - Math.abs(b.i - cur) || a.i - b.i));
  let n = 0;

  return (
    <main className="flow-main">
      <div className="kicker"><span>Consultation / 02</span><span>Destination</span></div>
      <h1 className="display h3 screen-title">Pick a destination.</h1>

      <AnalysisTree photo={photo} length={length} onRetake={onRetake} onKeepWaiting={onKeepWaiting} onRetry={onRetryLength} />

      <div className="sticky-filters">
        <div className="tabs-text" role="tablist" aria-label="Which cuts to show">
          {SHELVES.map(([c, label]) => (
            <button key={c} role="tab" aria-selected={shelf === c} onClick={() => setShelf(c)}>
              {label}
              <span className="count">{stylesIn(c).length}</span>
            </button>
          ))}
        </div>
        {shelf && (
          <div className="filter-mono" role="group" aria-label="Filter by length">
            {(["any", ...LENGTH_BANDS] as const).map((b) => (
              <button key={b} aria-pressed={band === b} onClick={() => setBand(b)}>
                {b === "any" ? "Any length" : BAND_SHORT[b]}
              </button>
            ))}
          </div>
        )}
      </div>

      {!shelf && (
        <p className="small muted" style={{ marginTop: 12 }}>
          Choose which cuts to see. Unisex cuts are in both lists, and every try-on is made on your own face.
        </p>
      )}

      {groups.map((g) => (
        <section key={g.band} aria-label={LENGTH_BAND_LABELS[g.band]}>
          <div className="cut-group-head">
            <span className="display" style={{ fontSize: 26 }}>{BAND_SHORT[g.band]}</span>
            <span className="mono accent">
              {cur < 0 ? "" : g.i === cur ? "Your length" : distanceLabel(LENGTH_BANDS[cur], g.band)}
            </span>
          </div>
          {g.styles.map((s) => {
            n += 1;
            const tags: { text: string; cls?: string }[] = [];
            if (cur >= 0) tags.push({ text: g.i === cur ? "Keeps your length" : g.i > cur ? "Needs grow-out" : "Cut shorter", cls: g.i === cur ? "on" : undefined });
            tags.push({ text: `${s.maintenance} upkeep`, cls: s.maintenance === "low" ? "on" : undefined });
            if (s.requiresStylistConfirmation) tags.push({ text: "Technique · ask first", cls: "warn" });
            if (s.sideEffects.length) tags.push({ text: `Template ${s.sideEffects[0]}` });
            return (
              <button
                key={s.id}
                className={`cut-row ${n % 2 === 0 ? "alt" : ""}`}
                aria-pressed={selected === s.id}
                aria-label={`${s.name}. ${s.description}`}
                onClick={() => setSelected(s.id)}
              >
                <CutImage style={s} shelf={shelf!} />
                <div className="cut-text">
                  <span className="cut-num">{String(n).padStart(2, "0")}{tried.has(s.id) && <span className="cut-tried"> · Tried</span>}</span>
                  <span className="cut-name">{s.name}</span>
                  <span className="wp-meta">{BAND_SHORT[s.targetLengthBand]}</span>
                  <span className="cut-desc">{s.description}</span>
                  <ul className="cut-tags">
                    {tags.map((t) => <li key={t.text} className={t.cls}>{t.text}</li>)}
                  </ul>
                </div>
              </button>
            );
          })}
        </section>
      ))}

      <div className="dock">
        {style ? (
          <div className="dock-sel">
            <div>
              <div className="sel-name">{style.name}</div>
              <Measure baseline={baseline} target={style.targetLengthBand} />
            </div>
            <button className="cta block" onClick={onTryOn}>
              {tried.has(style.id) ? "See it again" : "Try it on"}
            </button>
          </div>
        ) : (
          <button className="cta block" disabled>{shelf ? "Pick a cut" : "Choose Men's, Women's or All"}</button>
        )}
      </div>
    </main>
  );
}
