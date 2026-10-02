"use client";

import Mascot from "@/components/Mascot";
import Interrupt from "@/components/route/Interrupt";
import { getStyle } from "@/lib/catalog";
import type { PreparedPhoto } from "@/lib/client/image";
import { CompareSlider, zoom, type Preview } from "./shared";

export type Try = { styleId: string; preview: Preview };

const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

// CONSULTATION / 03: the destination on your own face. The image dominates; every look you try is kept.
export default function TryOn({
  photo,
  tries,
  activeId,
  setActive,
  onRetry,
  onRetake,
  onTryAnother,
  onPlan,
}: {
  photo: PreparedPhoto;
  tries: Try[];
  activeId: string;
  setActive: (id: string) => void;
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

  const save = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `maneroute-${style.id}.jpg`;
    a.click();
  };

  return (
    <main className="flow-main">
      <div className="kicker"><span>Consultation / 03</span><span>Preview</span></div>
      <h1 className="display h3 screen-title">{style.name}</h1>

      {image ? (
        <>
          <CompareSlider before={photo.dataUrl} after={image} beforeLabel="Current" afterLabel="Target" />
          <div className="frame-meta" style={{ maxWidth: 520, width: "100%", margin: "8px auto 0" }}>
            <span>Current · {today()}</span>
            <button className="textbtn" style={{ minHeight: 0, padding: 0 }} onClick={() => zoom(image, style.name)}>Full size</button>
            <span>Target · YouCam try-on</span>
          </div>
        </>
      ) : simulated ? (
        <div style={{ maxWidth: 520, width: "100%", margin: "0 auto" }}>
          <div className="frame">
            <img src={photo.dataUrl} alt="" />
          </div>
          <p className="mono muted center-text" style={{ marginTop: 6 }}>Simulated: no YouCam image in mock mode. This is your original photo.</p>
        </div>
      ) : p.state === "running" || p.state === "idle" ? (
        <div style={{ maxWidth: 520, width: "100%", margin: "0 auto" }} aria-live="polite">
          <div className="frame">
            <img src={photo.dataUrl} alt="" style={{ filter: "grayscale(0.6) contrast(0.9)" }} />
          </div>
          <div className="loader-line" />
          <div className="rou" style={{ marginTop: 6 }}>
            <Mascot mood="think" size={52} />
            <div className="rou-body">
              <div className="rou-label">ROU</div>
              <div className="rou-text caps">Rendering on your face.</div>
              <div className="mono muted" style={{ marginTop: 4 }}>YouCam Hairstyle Try-On · 15–40 s</div>
            </div>
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

      <p className="tiny muted center-text" style={{ marginTop: 10 }}>
        A reference, not a guarantee.{style.sideEffects.length > 0 && ` This template also ${style.sideEffects.join(" and ")}.`}
      </p>

      {tries.length > 1 && (
        <section aria-label="Looks you've tried" style={{ marginTop: 14 }}>
          <div className="kicker" style={{ borderBottom: "2px dashed var(--line)", paddingBottom: 6, marginBottom: 8 }}>
            <span>Your looks</span>
            <span>{String(tries.length).padStart(2, "0")}</span>
          </div>
          <div className="strip">
            {tries.map((t, i) => {
              const s = getStyle(t.styleId);
              const img = t.preview.state === "success" ? t.preview.image ?? photo.dataUrl : null; // thumbnail only
              return (
                <button key={t.styleId} aria-pressed={t.styleId === activeId} onClick={() => setActive(t.styleId)}>
                  {img ? <img src={img} alt="" /> : <span className="pending"><span className="mono">…</span></span>}
                  <span className="mono">{String(i + 1).padStart(2, "0")} {s?.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="dock">
        <button className="cta block" onClick={() => onPlan(style.id)} disabled={!image && !simulated}>Calculate my route</button>
        <div className="btn-row" style={{ marginTop: 6 }}>
          <button className="textbtn" onClick={onTryAnother}>Try another cut</button>
          <button className="textbtn" onClick={save} disabled={!image}>Save image</button>
        </div>
      </div>
    </main>
  );
}
