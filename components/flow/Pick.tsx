"use client";

import { useState } from "react";
import { getStyle, stylesIn, thumbFor } from "@/lib/catalog";
import { LENGTH_BANDS, type HairBaseline, type LengthBand, type TargetStyle } from "@/lib/types";
import type { PreparedPhoto } from "@/lib/client/image";
import type { ApiFailure } from "@/lib/client/api";
import Measure, { distanceLabel } from "@/components/route/Measure";
import { LengthSilhouette, type CheckState, type Shelf } from "./shared";

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
function AnalysisTree({ photo, length, density, onRetake, onKeepWaiting, onRetry }: {
  photo: PreparedPhoto;
  length: LengthState;
  density: CheckState;
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
        <span className="glyph" aria-hidden>├─</span>
        <span>Length · YouCam</span>
        <span className="state">{lenText}</span>
      </div>
      <div className={`tree-row ${density.state === "done" ? "done" : ""}`}>
        <span className="glyph" aria-hidden>├─</span>
        <span>Texture, frizz, density · optional</span>
        <span className={`state ${density.state === "done" ? "" : "muted"}`}>{density.state === "done" ? "Checked ✓" : "At route"}</span>
      </div>
      <div className="tree-row">
        <span className="glyph" aria-hidden>└─</span>
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
  density,
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
  density: CheckState;
}) {
  const baseline = length.state === "done" ? length.baseline : null;
  const style = selected ? getStyle(selected) : undefined;
  const cur = baseline ? LENGTH_BANDS.indexOf(baseline.lengthBand) : -1;

  const visible = shelf ? stylesIn(shelf).filter((s) => band === "any" || s.targetLengthBand === band) : [];
  const at = (s: TargetStyle) => LENGTH_BANDS.indexOf(s.targetLengthBand);
  // Once YouCam has measured the hair, the cuts are grouped by what it takes to get there.
  const groups: { key: string; title: string; caption: string; styles: TargetStyle[] }[] = (
    cur >= 0
      ? [
          {
            key: "now",
            title: "Ready now",
            caption: "Your length or shorter: you can ask for these at your next appointment.",
            styles: visible.filter((s) => at(s) <= cur).sort((a, b) => cur - at(a) - (cur - at(b))),
          },
          {
            key: "one",
            title: "Grow one stage",
            caption: `One length band longer than your hair today (${BAND_SHORT[LENGTH_BANDS[cur]].toLowerCase()}).`,
            styles: visible.filter((s) => at(s) === cur + 1),
          },
          {
            key: "big",
            title: "Big change",
            caption: "Two or more bands longer: a route with cuts to ask for along the way.",
            styles: visible.filter((s) => at(s) >= cur + 2).sort((a, b) => at(a) - at(b)),
          },
        ]
      : LENGTH_BANDS.map((b) => ({ key: b, title: BAND_SHORT[b], caption: "", styles: visible.filter((s) => s.targetLengthBand === b) }))
  ).filter((g) => g.styles.length);

  return (
    <main className="flow-main">
      <div className="kicker"><span>Consultation / 02</span><span>Destination</span></div>
      <h1 className="display h3 screen-title">Pick a destination.</h1>

      <AnalysisTree photo={photo} length={length} density={density} onRetake={onRetake} onKeepWaiting={onKeepWaiting} onRetry={onRetryLength} />

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

      {shelf && cur < 0 && length.state !== "error" && (
        <p className="small muted" style={{ marginTop: 12 }}>
          Grouped by length for now. As soon as YouCam has measured yours, they&apos;re sorted into what you can have now and what needs growing.
        </p>
      )}

      {groups.map((g) => (
        <section key={g.key} className="cut-group" aria-label={g.title}>
          <div className="cut-group-head">
            <h2 className="display cut-group-title">{g.title}</h2>
            <span className="mono muted">{String(g.styles.length).padStart(2, "0")} cuts</span>
          </div>
          {g.caption && <p className="cut-group-caption">{g.caption}</p>}
          <div className="cut-grid">
            {g.styles.map((s) => {
              const tags: { text: string; cls?: string }[] = [];
              if (cur >= 0) {
                const d = at(s) - cur;
                tags.push({ text: d === 0 ? "Your length" : distanceLabel(LENGTH_BANDS[cur], s.targetLengthBand), cls: d <= 0 ? "on" : undefined });
              }
              tags.push({ text: `${s.maintenance} upkeep`, cls: s.maintenance === "low" ? "on" : undefined });
              if (s.requiresStylistConfirmation) tags.push({ text: "Ask first", cls: "warn" });
              if (s.sideEffects.length) tags.push({ text: `Template ${s.sideEffects[0]}` });
              return (
                <button
                  key={s.id}
                  className="cut-card"
                  aria-pressed={selected === s.id}
                  aria-label={`${s.name}. ${s.description}`}
                  onClick={() => setSelected(s.id)}
                >
                  <CutImage style={s} shelf={shelf!} />
                  {tried.has(s.id) && <span className="cut-badge">Tried</span>}
                  <span className="cut-card-body">
                    <span className="cut-card-name">{s.name}</span>
                    <span className="cut-card-meta">{BAND_SHORT[s.targetLengthBand]}</span>
                    <span className="cut-card-desc">{s.description}</span>
                    <span className="cut-chips">
                      {tags.map((t) => <span key={t.text} className={t.cls}>{t.text}</span>)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
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
