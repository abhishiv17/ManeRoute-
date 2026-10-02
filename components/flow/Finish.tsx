"use client";

import { useState } from "react";
import { BEARDS, bangsFor, COLOURS, FINISH_LABELS, type Finish, type FinishKind, type FinishOption } from "@/lib/addons";
import type { Preview, Shelf } from "./shared";

export type FinishState = { steps: Finish[]; preview: Preview };

// "Finish the look": a beard, a fringe or a colour, layered on top of the haircut try-on.
// One of each at most; picking another of the same kind replaces it.
export default function FinishPanel({
  shelf,
  finish,
  ready,
  noChemicals,
  onPick,
  onRemove,
  onReset,
  onRetry,
}: {
  shelf: Shelf;
  finish?: FinishState;
  /** The haircut try-on has finished, so there's something to build on. */
  ready: boolean;
  noChemicals: boolean;
  onPick: (f: Finish) => void;
  onRemove: (kind: FinishKind) => void;
  onReset: () => void;
  onRetry: () => void;
}) {
  const kinds: FinishKind[] = shelf === "salon" ? ["bangs", "color"] : ["beard", "bangs", "color"];
  const [tab, setTab] = useState<FinishKind>(kinds[0]);
  const busy = finish?.preview.state === "running";
  const applied = finish?.steps ?? [];
  const options: FinishOption[] = tab === "beard" ? BEARDS : tab === "bangs" ? bangsFor(shelf) : COLOURS;
  const on = (o: FinishOption) => applied.some((f) => f.kind === o.kind && f.id === o.id);

  return (
    <section className="finish" aria-label="Finish the look">
      <div className="finish-head">
        <span className="doc-label">Finish the look</span>
        {applied.length > 0 && (
          <button className="textbtn" style={{ minHeight: 0, padding: 0 }} onClick={onReset} disabled={busy}>
            Back to the cut
          </button>
        )}
      </div>
      <div className="finish-tabs" role="tablist" aria-label="Beard, fringe or colour">
        {kinds.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {FINISH_LABELS[k]}
            {applied.some((f) => f.kind === k) && <span className="finish-dot" aria-label="applied" />}
          </button>
        ))}
      </div>
      {tab === "color" && noChemicals && (
        <p className="tiny muted" style={{ margin: "6px 0 0" }}>You said no chemical treatment: a colour means dye. Preview it anyway, then decide.</p>
      )}
      <div className="finish-options" role="tabpanel">
        {options.map((o) => (
          <button
            key={o.id}
            className={`finish-opt ${o.kind}`}
            aria-pressed={on(o)}
            disabled={!ready || busy}
            onClick={() => (on(o) ? onRemove(o.kind) : onPick({ kind: o.kind, id: o.id, name: o.name }))}
            title={o.ask}
          >
            {o.thumb ? <img src={o.thumb} alt="" loading="lazy" /> : <span className="finish-swatch" style={{ background: o.hex }} aria-hidden />}
            <span>{o.name}</span>
          </button>
        ))}
      </div>
      {!ready && <p className="tiny muted" style={{ margin: "6px 0 0" }}>Available once the haircut has rendered.</p>}
      {applied.length > 0 && (
        <ul className="finish-applied">
          {applied.map((f) => (
            <li key={f.kind}>
              <span className="mono muted">{FINISH_LABELS[f.kind]}</span> {f.name}
              <button className="finish-x" onClick={() => onRemove(f.kind)} disabled={busy} aria-label={`Remove ${f.name}`}>×</button>
            </li>
          ))}
        </ul>
      )}
      {finish?.preview.state === "error" && (
        <p className="small" style={{ color: "var(--err)", margin: "8px 0 0" }}>
          {finish.preview.failure.message} <button className="textbtn" style={{ minHeight: 0, padding: 0 }} onClick={onRetry}>Try again</button>
        </p>
      )}
    </section>
  );
}
