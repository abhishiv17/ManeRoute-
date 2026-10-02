"use client";

import { useCallback, useState } from "react";
import CameraCapture, { type Pose } from "@/components/CameraCapture";
import Mascot, { type MascotMood } from "@/components/Mascot";
import Measure, { distanceLabel } from "@/components/route/Measure";
import HairTimeline, { type Stop } from "@/components/route/HairTimeline";
import Interrupt from "@/components/route/Interrupt";
import { TEXTURE_GROUP_LABELS } from "@/lib/texture";
import type { HairBaseline, HairTexture, Preferences, TargetStyle, TransitionRoute } from "@/lib/types";
import type { ApiFailure } from "@/lib/client/api";
import { CaptureError, preparePhoto, type PreparedPhoto } from "@/lib/client/image";
import { Seg, zoom, shortBand, type Preview } from "./shared";

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

function Thumb({ src, label, pending }: { src: string | null; label: string; pending?: boolean }) {
  if (src) {
    return (
      <button className="textbtn" style={{ padding: 0, textDecoration: "none" }} onClick={() => zoom(src, label)} aria-label={`Enlarge ${label}`}>
        <img className="wp-img" src={src} alt={label} />
      </button>
    );
  }
  return pending ? (
    <div style={{ maxWidth: 280 }}>
      <div className="wp-img" style={{ display: "grid", placeItems: "center" }}><span className="mono muted">Rendering…</span></div>
      <div className="loader-line" />
    </div>
  ) : null;
}

function TextureCheck({ texture, onScan }: { texture: TextureState; onScan: (right: PreparedPhoto, left: PreparedPhoto) => void }) {
  const [pose, setPose] = useState<Pose | null>(null);
  const [right, setRight] = useState<PreparedPhoto | null>(null);
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
        <div className="kicker"><span>Texture check</span><span>{pose === "right" ? "01 / 02" : "02 / 02"}</span></div>
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
            } else {
              setPose(null);
              if (right) onScan(right, p);
            }
          }}
        />
      </section>
    );
  }

  if (texture.state === "done") {
    return (
      <div className="note ok">
        <div className="mono">Texture measured · YouCam Hair Type</div>
        <b>{TEXTURE_GROUP_LABELS[texture.texture.group]}</b> · “{texture.texture.term}”. The route above uses it.
      </div>
    );
  }

  return (
    <section style={{ padding: "18px 0", borderTop: "2px dashed var(--line)" }}>
      <div className="kicker"><span>Optional</span><span>+2 photos</span></div>
      <h2 className="display h3" style={{ margin: "6px 0 8px" }}>Does it suit your texture?</h2>
      <p className="small">
        This look depends on texture. Two side photos (a hands-free 3-second timer each) let YouCam Hair Type Detection
        read yours, and the route will say whether the look will sit like the preview.
      </p>
      {texture.state === "running" && (
        <>
          <p className="mono">Reading your texture…</p>
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
            Upload 2 side photos
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = "";
                if (files.length !== 2) return setErr("Choose exactly two photos: head turned right, then left.");
                const [r, l] = await Promise.all(files.map(prep));
                if (r && l) onScan(r, l);
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
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  lengthReady: boolean;
  nowLabel: string;
  baseline: HairBaseline | null;
  route: TransitionRoute | null;
  stages: { style: TargetStyle; preview: Preview }[];
  growPreview: Preview;
  texture: TextureState;
  onScan: (right: PreparedPhoto, left: PreparedPhoto) => void;
  /** A stage style id, or "grow". */
  onRetryPreview: (which: string) => void;
  onCard: () => void;
  onBack: () => void;
}) {
  const up = <K extends keyof Preferences>(k: K, v: Preferences[K]) => setPrefs({ ...prefs, [k]: v });
  const needsTexture = style.textureNeed !== "any" || style.textureSensitive;
  const measured = texture.state === "done" ? texture.texture : null;
  const rules = route ? [...route.reasons, ...route.cautions].map((r) => r.rule.split("_")[0]) : [];

  const stops: Stop[] = [{ label: "Now", sub: nowLabel, image: photo.dataUrl }];
  stages.forEach((st, i) => stops.push({ label: stages.length > 1 ? `Stage ${i + 1}` : "Along the way", sub: st.style.name, image: img(st.preview) }));
  if (route?.growOut) stops.push({ label: "Grown", sub: "Your own cut, longer", image: img(growPreview) });
  stops.push({ label: "Target", sub: style.name, image: targetImage });

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
          <section className={`classification class-${route.route}`}>
            <div className="kicker">
              <span>Route calculated</span>
              <span className="accent">{[...new Set(rules)].join(" · ")}</span>
            </div>
            <div className="display" style={{ marginTop: 8 }}>{route.headline}</div>
            <p className="plain">{route.explanation}</p>
            <Measure baseline={baseline} target={style.targetLengthBand} />
          </section>

          <ol className="route-v" aria-label="Your route">
            <li className="done">
              <span className="wp-dot" />
              <div className="wp-head"><span className="wp-title">01 / Now</span><span className="wp-meta">{nowLabel}{measured ? ` · ${TEXTURE_GROUP_LABELS[measured.group]}` : ""}</span></div>
              <div className="wp-body">You are here.</div>
            </li>
            {route.route === "cut_first" && (
              <li className="done">
                <span className="wp-dot" />
                <div className="wp-head"><span className="wp-title">Cut</span><span className="wp-rule">R3</span></div>
                <div className="wp-body">Agree on the shape before any length comes off. Going in stages is fine.</div>
              </li>
            )}
            {stages.map((st, i) => (
              <li className="done" key={st.style.id}>
                <span className="wp-dot" />
                <div className="wp-head">
                  <span className="wp-title">{stages.length > 1 ? `Stage ${i + 1}` : "Along the way"}</span>
                  <span className="wp-meta">{shortBand(st.style.targetLengthBand)}</span>
                </div>
                <div className="wp-body">{st.style.name}: a cut to ask for on the way, not a growth prediction.</div>
                <Thumb src={img(st.preview)} label={st.style.name} pending={st.preview.state === "running" || st.preview.state === "idle"} />
                {(st.preview.state === "error" || st.preview.state === "timeout") && (
                  <button className="textbtn" onClick={() => onRetryPreview(st.style.id)}>Retry this preview</button>
                )}
              </li>
            ))}
            {route.growOut && (
              <li className="done">
                <span className="wp-dot" />
                <div className="wp-head"><span className="wp-title">Let it grow</span><span className="wp-meta">{route.growOut === "chest" ? "Chest length" : "Long"}</span></div>
                <div className="wp-body">Your own cut, longer (YouCam Hair Extension). Compare it with the target shape.</div>
                <Thumb src={img(growPreview)} label="Your hair, grown" pending={growPreview.state === "running" || growPreview.state === "idle"} />
                {(growPreview.state === "error" || growPreview.state === "timeout") && <button className="textbtn" onClick={() => onRetryPreview("grow")}>Retry this preview</button>}
              </li>
            )}
            {route.growOutSkipped && (
              <li className="done">
                <span className="wp-dot" />
                <div className="wp-head"><span className="wp-title">Let it grow</span><span className="wp-meta">Preview later</span></div>
                <div className="wp-body">
                  &quot;Your hair, grown&quot; (YouCam Hair Extension) lengthens the cut you have. From hair this short it would keep the
                  short top and add length underneath, so it isn&apos;t shown yet. The along-the-way cut shows the route instead.
                </div>
              </li>
            )}
            <li className="done">
              <span className="wp-dot fill" />
              <div className="wp-head"><span className="wp-title">Target</span><span className="wp-meta">{shortBand(style.targetLengthBand)}{baseline ? ` · ${distanceLabel(baseline.lengthBand, style.targetLengthBand)}` : ""}</span></div>
              <div className="wp-body">
                {route.reasons.map((r) => (
                  <p key={r.rule} style={{ margin: "0 0 4px" }}>{r.text} <span className="wp-rule">{r.rule.split("_")[0]}</span></p>
                ))}
              </div>
            </li>
          </ol>

          <section style={{ padding: "18px 0", borderTop: "2px dashed var(--line)" }}>
            <div className="kicker"><span>Scrub the route</span><span>0 → 100%</span></div>
            <div style={{ marginTop: 12 }}><HairTimeline stops={stops} /></div>
          </section>

          {route.cautions.length > 0 && (
            <div className="rou">
              <Mascot mood={MOOD[route.route]} size={56} />
              <div className="rou-body">
                <div className="rou-label">ROU&apos;S NOTE</div>
                {route.cautions.map((c) => (
                  <p key={c.rule} className="rou-text" style={{ margin: "0 0 6px" }}>{c.text} <span className="wp-rule">{c.rule.split("_")[0]}</span></p>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {needsTexture && <TextureCheck texture={texture} onScan={onScan} />}

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
