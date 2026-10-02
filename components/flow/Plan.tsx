"use client";

import { useCallback, useState } from "react";
import CameraCapture, { type Pose } from "@/components/CameraCapture";
import Mascot, { type MascotMood } from "@/components/Mascot";
import Measure, { distanceLabel } from "@/components/route/Measure";
import RoadStrip, { type RoadStop } from "@/components/route/RoadStrip";
import ChairSteps from "@/components/route/ChairSteps";
import { chairPlan } from "@/lib/barber";
import Interrupt from "@/components/route/Interrupt";
import { TEXTURE_GROUP_LABELS } from "@/lib/texture";
import type { HairBaseline, HairTexture, Preferences, TargetStyle, TransitionRoute } from "@/lib/types";
import type { ApiFailure } from "@/lib/client/api";
import { CaptureError, preparePhoto, type PreparedPhoto } from "@/lib/client/image";
import { Seg, zoom, shortBand, type CheckState, type Preview } from "./shared";
import { finishSteps, type Finish } from "@/lib/addons";

export type TextureState =
  | { state: "none" }
  | { state: "running" }
  | { state: "done"; texture: HairTexture }
  | { state: "error"; failure: ApiFailure };

const MOOD: Record<TransitionRoute["route"], MascotMood> = {
  can_discuss_now: "cheer",
  length_building: "happy",
  cut_first: "wow",
  stylist_confirmation_needed: "think",
  retake_required: "oops",
};

const img = (p: Preview) => (p.state === "success" ? p.image : null);

function TextureCheck({ texture, frizz, density, textureMatters, onScan }: { texture: TextureState; frizz: CheckState; density: CheckState; textureMatters: boolean; onScan: (right: PreparedPhoto, left: PreparedPhoto, down?: PreparedPhoto) => void }) {
  const [pose, setPose] = useState<Pose | null>(null);
  const [right, setRight] = useState<PreparedPhoto | null>(null);
  const [left, setLeft] = useState<PreparedPhoto | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const onFallback = useCallback((reason: string) => {
    setPose(null);
    setErr(reason);
  }, []);
  const prep = async (f: Blob) => {
    try {
      return await preparePhoto(f);
    } catch (e) {
      setErr(e instanceof CaptureError ? e.message : "We couldn't use that photo.");
      return null;
    }
  };

  if (pose) {
    return (
      <section style={{ padding: "18px 0", borderTop: "2px dashed var(--line)" }}>
        <div className="kicker"><span>Hair check</span><span>{pose === "right" ? "01 / 03" : pose === "left" ? "02 / 03" : "03 / 03"}</span></div>
        <CameraCapture
          key={pose}
          pose={pose}
          autoTimer
          onFallback={onFallback}
          onCancel={() => setPose(null)}
          onCapture={async (f) => {
            const p = await prep(f);
            if (!p) return setPose(null);
            if (pose === "right") {
              setRight(p);
              setPose("left");
            } else if (pose === "left") {
              setLeft(p);
              setPose("down");
            } else {
              setPose(null);
              if (right && left) onScan(right, left, p);
            }
          }}
        />
      </section>
    );
  }

  const reading = (label: string, c: CheckState) =>
    c.state === "done" ? (
      <div style={{ marginTop: 4 }}>{label}: <b>{c.reading.term}</b></div>
    ) : c.state === "running" ? (
      <div className="mono muted" style={{ marginTop: 4 }}>Reading {label.split(" · ")[0].toLowerCase()}…</div>
    ) : c.state === "error" ? (
      <div className="mono muted" style={{ marginTop: 4 }}>{label.split(" · ")[0]}: not read ({c.message})</div>
    ) : null;

  if (texture.state === "done") {
    return (
      <div className="note ok">
        <div className="mono">Hair check · YouCam</div>
        Texture: <b>{TEXTURE_GROUP_LABELS[texture.texture.group]}</b> · “{texture.texture.term}”. The route and your routine use it.
        {reading("Frizz · YouCam Hair Frizziness Detection", frizz)}
        {reading("Density · YouCam Hair Density Detection", density)}
      </div>
    );
  }

  return (
    <section style={{ padding: "18px 0", borderTop: "2px dashed var(--line)" }}>
      <div className="kicker"><span>Optional</span><span>+3 photos</span></div>
      <h2 className="display h3" style={{ margin: "6px 0 8px" }}>{textureMatters ? "Does it suit your texture?" : "Check your hair"}</h2>
      <p className="small">
        {textureMatters ? "This look depends on texture. " : ""}Three hands-free photos (head turned right, then left, then
        lowered; a 3-second timer each) let YouCam read your <b>texture</b>, <b>frizz</b> and <b>density</b>. The route
        flags what matters for this cut, and your routine uses them.
      </p>
      {texture.state === "running" && (
        <>
          <p className="mono">Reading your texture, frizz and density…</p>
          <div className="loader-line" />
        </>
      )}
      {texture.state === "error" && (
        <Interrupt headline="Texture not read." code={texture.failure.code}>{texture.failure.message}</Interrupt>
      )}
      {err && <p className="small" style={{ color: "var(--err)" }}>{err}</p>}
      {texture.state !== "running" && (
        <div className="btn-row">
          <button className="cta ghost" onClick={() => { setErr(null); setPose("right"); }}>Scan with camera</button>
          <label className="cta ghost" style={{ cursor: "pointer" }}>
            Upload 3 photos
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = "";
                if (files.length !== 2 && files.length !== 3)
                  return setErr("Choose two or three photos: head turned right, then left, then (for density) lowered.");
                const [r, l, d] = await Promise.all(files.map(prep));
                if (r && l) onScan(r, l, d ?? undefined);
              }}
            />
          </label>
        </div>
      )}
    </section>
  );
}

export default function Plan({
  photo,
  style,
  targetImage,
  finish,
  density,
  frizz,
  prefs,
  setPrefs,
  lengthReady,
  nowLabel,
  baseline,
  route,
  stages,
  growPreview,
  texture,
  onScan,
  onRetryPreview,
  onCard,
  onBack,
}: {
  photo: PreparedPhoto;
  style: TargetStyle;
  targetImage: string | null;
  finish: Finish[];
  density: CheckState;
  frizz: CheckState;
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  lengthReady: boolean;
  nowLabel: string;
  baseline: HairBaseline | null;
  route: TransitionRoute | null;
  stages: { style: TargetStyle; preview: Preview }[];
  growPreview: Preview;
  texture: TextureState;
  onScan: (right: PreparedPhoto, left: PreparedPhoto, down?: PreparedPhoto) => void;
  /** A stage style id, or "grow". */
  onRetryPreview: (which: string) => void;
  onCard: () => void;
  onBack: () => void;
}) {
  const up = <K extends keyof Preferences>(k: K, v: Preferences[K]) => setPrefs({ ...prefs, [k]: v });
  const needsTexture = style.textureNeed !== "any" || style.textureSensitive;
  const measured = texture.state === "done" ? texture.texture : null;
  const previewState = (pv: Preview): RoadStop["state"] =>
    pv.state === "success" ? "ready" : pv.state === "error" || pv.state === "timeout" ? "failed" : "pending";
  const road: RoadStop[] = [
    { key: "now", label: "Now", name: "You today", band: nowLabel || "Measuring…", bandId: baseline?.lengthBand ?? "ear_length", image: photo.dataUrl, state: "ready" },
  ];
  stages.forEach((st, i) =>
    road.push({
      key: st.style.id,
      label: stages.length > 1 ? `Along the way · ${i + 1}` : "Along the way",
      name: st.style.name,
      band: shortBand(st.style.targetLengthBand),
      bandId: st.style.targetLengthBand,
      image: img(st.preview),
      state: previewState(st.preview),
      onRetry: () => onRetryPreview(st.style.id),
    }),
  );
  if (route?.growOut) {
    road.push({
      key: "grow",
      label: "Let it grow",
      name: "Your hair, grown",
      band: route.growOut === "chest" ? "Chest length" : "Long",
      bandId: route.growOut === "chest" ? "above_chest" : "long",
      image: img(growPreview),
      state: previewState(growPreview),
      note: "Your own cut, longer (YouCam Hair Extension).",
      onRetry: () => onRetryPreview("grow"),
    });
  } else if (route?.growOutSkipped) {
    road.push({
      key: "grow",
      label: "Let it grow",
      name: "Your hair, grown",
      band: "Preview later",
      bandId: style.targetLengthBand,
      image: null,
      state: "skipped",
      note: "YouCam Hair Extension lengthens the cut you have. From hair this short it would keep the short top, so it isn't shown yet.",
    });
  }
  road.push({
    key: "target",
    label: "Destination",
    name: style.name,
    band: shortBand(style.targetLengthBand) + (finish.length ? ` · + ${finish.map((f) => f.name).join(" + ")}` : ""),
    bandId: style.targetLengthBand,
    image: targetImage,
    state: targetImage ? "ready" : "pending",
  });
  const steps = baseline ? [...chairPlan(baseline.lengthBand, style, stages.map((st) => st.style)), ...finishSteps(finish)] : [];

  return (
    <main className="flow-main">
      <div className="kicker">
        <span>Consultation / 04</span>
        <button className="textbtn" style={{ minHeight: 0, padding: 0 }} onClick={onBack}>← Previews</button>
      </div>
      <h1 className="display h3 screen-title">Your route to {style.name}</h1>

      {!lengthReady || !route ? (
        <div aria-live="polite">
          <p className="mono">Measuring your starting point…</p>
          <div className="loader-line" />
        </div>
      ) : route.route === "retake_required" ? (
        <Interrupt headline="We couldn't read this frame.">{route.explanation}</Interrupt>
      ) : (
        <>
          <RoadStrip stops={road} />

          <section className={`classification class-${route.route}`}>
            <div className="kicker">
              <span>Your route</span>
              <span className="accent">{baseline ? distanceLabel(baseline.lengthBand, style.targetLengthBand) : ""}</span>
            </div>
            <div className="display" style={{ marginTop: 8 }}>{route.headline}</div>
            <p className="plain">{route.explanation}</p>
            <Measure baseline={baseline} target={style.targetLengthBand} />
          </section>

          <section className="why" aria-label="Why this route">
            <h2 className="display h3">Why</h2>
            <ul className="why-list">
              {route.reasons.map((r) => <li key={r.rule}>{r.text}</li>)}
              {measured && <li>Your texture reads as {TEXTURE_GROUP_LABELS[measured.group].toLowerCase()} (YouCam Hair Type Detection).</li>}
              {density.state === "done" && <li>Your hair density reads as “{density.reading.term}” (YouCam Hair Density Detection).</li>}
              {frizz.state === "done" && <li>Your frizz reads as “{frizz.reading.term}” (YouCam Hair Frizziness Detection).</li>}
            </ul>
          </section>

          {route.cautions.length > 0 && (
            <div className="rou">
              <Mascot mood={MOOD[route.route]} size={56} />
              <div className="rou-body">
                <div className="rou-label">WORTH TALKING ABOUT</div>
                {route.cautions.map((c) => (
                  <p key={c.rule} className="rou-text" style={{ margin: "0 0 6px" }}>{c.text}</p>
                ))}
              </div>
            </div>
          )}

          {steps.length > 0 && (
            <section className="chair-sec" aria-label="In the chair">
              <div className="kicker"><span>In the chair</span><span>{steps.length === 1 ? "One visit" : `${steps.length} steps`}</span></div>
              <h2 className="display h3" style={{ margin: "6px 0 4px" }}>What to ask for.</h2>
              <p className="small muted" style={{ margin: "0 0 12px" }}>In order. The lengths are a starting point; your barber or stylist adapts them to your hair.</p>
              <ChairSteps steps={steps} />
            </section>
          )}

          <details className="decided">
            <summary>How we decided</summary>
            <ul className="decided-list">
              {[...route.reasons, ...route.cautions].map((r) => (
                <li key={r.rule}><span className="wp-rule">{r.rule}</span> {r.text}</li>
              ))}
            </ul>
            <div className="doc-label" style={{ marginTop: 10 }}>Limits</div>
            <ul className="decided-list">
              {route.limitations.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </details>
        </>
      )}

      {route && route.route !== "retake_required" && (
        <TextureCheck texture={texture} frizz={frizz} density={density} textureMatters={needsTexture} onScan={onScan} />
      )}

      <section style={{ padding: "18px 0", borderTop: "2px dashed var(--line)" }}>
        <div className="kicker"><span>Your limits</span><span>On the document</span></div>
        <h2 className="display h3" style={{ margin: "6px 0 14px" }}>What matters to you.</h2>
        <fieldset>
          <legend>Grow your hair out?</legend>
          <Seg name="grow" value={prefs.growOut} onChange={(v) => up("growOut", v)} options={[["yes", "Yes"], ["maybe", "Maybe"], ["no", "No"]]} />
        </fieldset>
        <fieldset>
          <legend>Perms, relaxers or colour?</legend>
          <Seg name="chem" value={prefs.chemical} onChange={(v) => up("chemical", v)} options={[["yes", "Fine"], ["unsure", "Not sure"], ["no", "No"]]} />
        </fieldset>
        <fieldset style={{ marginBottom: 8 }}>
          <legend>Daily styling time?</legend>
          <Seg name="maint" value={prefs.maintenance} onChange={(v) => up("maintenance", v)} options={[["low", "Minimal"], ["medium", "A few min"], ["high", "I enjoy it"]]} />
        </fieldset>
        <details>
          <summary>More</summary>
          <label className="check" style={{ margin: "6px 0 12px" }}>
            <input type="checkbox" checked={prefs.keepLength} onChange={(e) => up("keepLength", e.target.checked)} />
            <span>Keep as much of my length as possible</span>
          </label>
          <label htmlFor="nn" className="mono" style={{ display: "block", marginBottom: 6 }}>Your barber must not</label>
          <textarea
            id="nn"
            maxLength={200}
            value={prefs.nonNegotiables}
            placeholder="e.g. no clippers on top, keep my ears covered"
            onChange={(e) => up("nonNegotiables", e.target.value)}
          />
        </details>
      </section>

      <div className="dock">
        <button className="cta block" onClick={onCard} disabled={!route || route.route === "retake_required"}>
          Build the document
        </button>
      </div>
    </main>
  );
}
