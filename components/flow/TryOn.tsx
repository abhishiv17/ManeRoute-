"use client";

import Mascot from "@/components/Mascot";
import Interrupt from "@/components/route/Interrupt";
import Measure, { distanceLabel } from "@/components/route/Measure";
import { scriptFor } from "@/lib/barber";
import { getStyle } from "@/lib/catalog";
import type { PreparedPhoto } from "@/lib/client/image";
import type { HairBaseline, TargetStyle } from "@/lib/types";
import { CompareSlider, shortBand, zoom, type Preview, type Shelf } from "./shared";
import FinishPanel, { type FinishState } from "./Finish";
import type { Finish, FinishKind } from "@/lib/addons";

export type Try = { styleId: string; preview: Preview };

const ok = (p: Preview) => p.state === "success";

// CONSULTATION / 03: the destination on your own face. The try-on is the hero: it wipes in from
// your photo, and every look you try collects in a lookbook so three or four sit side by side.
export default function TryOn({
  photo,
  baseline,
  tries,
  activeId,
  setActive,
  suggestions,
  onTry,
  shelf,
  finish,
  noChemicals,
  onFinish,
  onRemoveFinish,
  onResetFinish,
  onRetryFinish,
  onRetry,
  onRetake,
  onTryAnother,
  onPlan,
}: {
  photo: PreparedPhoto;
  baseline: HairBaseline | null;
  tries: Try[];
  activeId: string;
  setActive: (id: string) => void;
  suggestions: { style: TargetStyle; thumb?: string }[];
  onTry: (id: string) => void;
  shelf: Shelf;
  finish?: FinishState;
  noChemicals: boolean;
  onFinish: (f: Finish) => void;
  onRemoveFinish: (kind: FinishKind) => void;
  onResetFinish: () => void;
  onRetryFinish: () => void;
  onRetry: (id: string) => void;
  onRetake: () => void;
  onTryAnother: () => void;
  onPlan: (id: string) => void;
}) {
  const active = tries.find((t) => t.styleId === activeId);
  const style = getStyle(activeId);
  if (!active || !style) return null;
  const p = active.preview;
  const image = p.state === "success" ? p.image : null;
  // Mock mode (YOUCAM_MOCK=1) finishes without an image: say so instead of passing the original photo off as the target.
  const simulated = p.state === "success" && !p.image;
  const script = scriptFor(style);
  // Beard, fringe or colour on top of the cut: the hero shows the finished look.
  const finished = finish?.preview.state === "success" && finish.preview.image && finish.steps.length ? finish.preview.image : null;
  const finishing = finish?.preview.state === "running";
  const shown = finished ?? image;
  const lookName = finish?.steps.length ? `${style.name} + ${finish.steps.map((f) => f.name).join(" + ")}` : style.name;

  const save = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = shown ?? image;
    a.download = `maneroute-${style.id}.jpg`;
    a.click();
  };
  const show = (id: string) => {
    setActive(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="flow-main">
      <div className="kicker"><span>Consultation / 03</span><span>Your lookbook · {String(tries.length).padStart(2, "0")}</span></div>

      <section className="tryon-hero bleed">
        <div className="tryon-stage">
          {shown && !simulated ? (
            <div className="tryon-heroimg">
              <CompareSlider className="hero" intro before={photo.dataUrl} after={shown} beforeLabel="You now" afterLabel={finished ? lookName : style.name} />
              {finishing && (
                <div className="finish-overlay" aria-live="polite">
                  <div className="scan" aria-hidden />
                  <div className="render-cap">
                    <Mascot mood="think" size={42} />
                    <span>
                      <b>Adding {finish!.steps[finish!.steps.length - 1].name.toLowerCase()}</b>
                      <span className="mono">YouCam AI · 15–40 s</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : simulated ? (
            <div className="tryon-render">
              <img src={photo.dataUrl} alt="" />
              <div className="render-cap">
                <span className="mono">Simulated</span>
                <span>No YouCam image in mock mode. This is your original photo.</span>
              </div>
            </div>
          ) : p.state === "running" || p.state === "idle" ? (
            <div className="tryon-render" aria-live="polite">
              <img src={photo.dataUrl} alt="" className="dim" />
              <div className="scan" aria-hidden />
              <div className="render-cap">
                <Mascot mood="think" size={48} />
                <span>
                  <b>Rendering {style.name} on your face</b>
                  <span className="mono">YouCam Hairstyle Try-On · 15–40 s</span>
                </span>
              </div>
            </div>
          ) : (
            <Interrupt
              headline={p.state === "timeout" ? "Still rendering." : "This try-on didn't render."}
              actions={
                p.state === "error" && p.failure.retake ? (
                  <button className="cta" onClick={onRetake}>Retake photo</button>
                ) : (
                  <button className="cta" onClick={() => onRetry(style.id)}>{p.state === "timeout" ? "Check again" : "Try again"}</button>
                )
              }
              code={p.state === "error" ? p.failure.code : undefined}
            >
              {p.state === "error" ? p.failure.message : "YouCam is taking longer than usual. Checking again costs nothing."}
            </Interrupt>
          )}
        </div>

        <aside className="tryon-side">
          <div className="mono accent">On your face · YouCam Hairstyle Try-On</div>
          <h1 className="display tryon-name">{style.name}</h1>
          <p className="tryon-desc">{style.description}</p>
          <Measure baseline={baseline} target={style.targetLengthBand} />
          <div className="tryon-ask">
            <div className="doc-label">In the chair, ask for</div>
            <p>{script.ask}</p>
          </div>
          <FinishPanel
            shelf={shelf}
            finish={finish}
            ready={Boolean(image) || simulated}
            noChemicals={noChemicals}
            onPick={onFinish}
            onRemove={onRemoveFinish}
            onReset={onResetFinish}
            onRetry={onRetryFinish}
          />
          <button className="cta block tryon-cta" onClick={() => onPlan(style.id)} disabled={!image && !simulated}>
            Calculate my route
          </button>
          <div className="btn-row tryon-links">
            {shown && <button className="textbtn" onClick={() => zoom(shown, lookName)}>Full size</button>}
            <button className="textbtn" onClick={save} disabled={!image}>Save image</button>
          </div>
          <p className="tiny muted">A reference, not a guarantee.{style.sideEffects.length > 0 && ` This template also ${style.sideEffects.join(" and ")}.`}</p>
        </aside>
      </section>

      <section className="lookbook bleed" aria-label="Your lookbook">
        <div className="lookbook-head">
          <h2 className="display h3">Your lookbook</h2>
          <span className="mono muted">Every look on your face. Tap one to bring it up.</span>
        </div>
        <div className="look-grid">
          <figure className="look-tile now">
            <span className="look-img"><img src={photo.dataUrl} alt="" /></span>
            <figcaption><span className="look-name">You now</span><span className="look-meta">{baseline ? shortBand(baseline.lengthBand) : "Measuring…"}</span></figcaption>
          </figure>
          {tries.map((t) => {
            const s = getStyle(t.styleId);
            if (!s) return null;
            const img = t.preview.state === "success" ? t.preview.image ?? photo.dataUrl : null;
            const failed = t.preview.state === "error" || t.preview.state === "timeout";
            return (
              <button key={t.styleId} className="look-tile" aria-pressed={t.styleId === activeId} onClick={() => show(t.styleId)}>
                <span className={`look-img ${ok(t.preview) ? "" : "pending"}`}>
                  {img ? <img src={img} alt="" /> : <span className="mono">{failed ? "Didn't render" : "Rendering…"}</span>}
                </span>
                <span className="look-name">{s.name}</span>
                <span className="look-meta">
                  {shortBand(s.targetLengthBand)}
                  {baseline ? ` · ${distanceLabel(baseline.lengthBand, s.targetLengthBand)}` : ""}
                </span>
              </button>
            );
          })}
          <button className="look-tile add" onClick={onTryAnother}>
            <span className="look-img"><span className="look-plus" aria-hidden>+</span></span>
            <span className="look-name">Try another cut</span>
            <span className="look-meta">Back to all cuts</span>
          </button>
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="look-next bleed" aria-label="Try next">
          <div className="mono muted">Try next on your face</div>
          <div className="look-chips">
            {suggestions.map(({ style: s, thumb }) => (
              <button key={s.id} className="look-chip" onClick={() => onTry(s.id)}>
                {thumb ? <img src={thumb} alt="" /> : <span className="look-chip-blank" aria-hidden />}
                <span>
                  <b>{s.name}</b>
                  <small>{shortBand(s.targetLengthBand)}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="dock tryon-dock">
        <button className="cta block" onClick={() => onPlan(style.id)} disabled={!image && !simulated}>
          Calculate my route
        </button>
        <div className="btn-row" style={{ marginTop: 6 }}>
          <button className="textbtn" onClick={onTryAnother}>Try another cut</button>
        </div>
      </div>
    </main>
  );
}
