"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import Mascot from "@/components/Mascot";
import Interrupt from "@/components/route/Interrupt";
import { pollLength, pollVto, startLength, startVto, uploadPhoto, type ApiFailure } from "@/lib/client/api";
import { CaptureError, preparePhoto, type PreparedPhoto } from "@/lib/client/image";
import { makeThumb } from "@/lib/client/plans";
import { CompareSlider, toFailure } from "@/components/flow/shared";
import { BAND_SHORT, currentBand, type CheckIn as CheckInT, type Journey } from "@/lib/journey";
import { LENGTH_BANDS } from "@/lib/types";

// A check-in: one new front photo, measured again by YouCam Hair Length Detection, with the
// destination re-rendered on it by YouCam Hairstyle Try-On (about 2 units in all). The band
// moves Rou along the road; the re-render shows the destination fitting today's hair even when
// the band hasn't changed yet. Nothing is predicted.
type Phase =
  | { at: "intro" }
  | { at: "camera" }
  | { at: "confirm"; photo: PreparedPhoto }
  | { at: "measuring"; photo: PreparedPhoto }
  | { at: "error"; photo: PreparedPhoto; failure: ApiFailure }
  | { at: "done"; photo: PreparedPhoto; checkin: CheckInT; render: Render };

type Render = { state: "running" } | { state: "ready"; image: string } | { state: "simulated" } | { state: "failed"; message: string };

export default function CheckIn({
  journey,
  onSave,
  onPatch,
  onClose,
}: {
  journey: Journey;
  onSave: (c: CheckInT) => Promise<void>;
  onPatch: (id: string, fields: Partial<CheckInT>) => Promise<void>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>({ at: "intro" });
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abort = useRef(new AbortController());
  const before = currentBand(journey);
  const lastPhoto = [...journey.checkins].reverse().find((c) => c.photo)?.photo;
  // Check-ins re-render the haircut alone, so compare with the day-1 haircut (before any beard or colour).
  const dayOne = journey.cutImage ?? journey.milestones.find((m) => m.kind === "target")?.image;

  // A fresh controller per mount (React's dev double-mount would otherwise leave it aborted).
  useEffect(() => {
    abort.current = new AbortController();
    return () => abort.current.abort();
  }, []);

  const use = async (f: Blob | undefined) => {
    setNote(null);
    if (!f) return;
    try {
      setPhase({ at: "confirm", photo: await preparePhoto(f) });
    } catch (e) {
      setNote(e instanceof CaptureError ? e.message : "We couldn't use this photo. Please try another.");
      setPhase({ at: "intro" });
    }
  };

  const onFallback = useCallback((reason: string) => {
    setNote(reason);
    setPhase({ at: "intro" });
  }, []);

  const measure = async (photo: PreparedPhoto) => {
    setPhase({ at: "measuring", photo });
    try {
      const up = await uploadPhoto(photo.blob);
      // The destination, re-rendered on today's photo, runs alongside the measurement.
      const render = (async () => {
        const { taskId } = await startVto(up.fileId, journey.targetId);
        return pollVto(taskId, abort.current.signal);
      })().catch((e) => ({ kind: "error" as const, failure: toFailure(e) }));
      const { taskId } = await startLength(up.fileId);
      const out = await pollLength(taskId, abort.current.signal);
      if (out.kind === "aborted") return;
      if (out.kind === "timeout") throw { failure: { code: "timeout", message: "YouCam took too long to measure. Try again in a minute.", retake: false } };
      if (out.kind === "error") return setPhase({ at: "error", photo, failure: out.failure });
      const c: CheckInT = {
        id: crypto.randomUUID(),
        at: Date.now(),
        kind: "measure",
        photo: await makeThumb(photo.dataUrl, 360),
        band: out.result.lengthBand,
        atLeast: out.result.atLeast,
        raw: out.result.rawProviderValue,
        simulated: Boolean(up.simulated || out.simulated),
      };
      await onSave(c);
      setPhase({ at: "done", photo, checkin: c, render: { state: "running" } });

      const r = await render;
      if (r.kind === "aborted") return;
      let next: Render;
      if (r.kind === "success" && r.result.image) {
        const thumb = await makeThumb(r.result.image, 480);
        await onPatch(c.id, { preview: thumb });
        next = { state: "ready", image: r.result.image };
      } else if (r.kind === "success") {
        next = { state: "simulated" };
      } else {
        next = { state: "failed", message: r.kind === "error" ? r.failure.message : "YouCam took too long to render it." };
      }
      setPhase((ph) => (ph.at === "done" && ph.checkin.id === c.id ? { ...ph, render: next } : ph));
    } catch (e) {
      const failure = (e as { failure?: ApiFailure }).failure ?? toFailure(e);
      setPhase({ at: "error", photo, failure });
    }
  };

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        use(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  const head = (sub: string) => (
    <div className="kicker">
      <span>Check-in · {sub}</span>
      <button className="textbtn" style={{ minHeight: 0, padding: 0 }} onClick={onClose}>Close</button>
    </div>
  );

  if (phase.at === "camera") {
    return (
      <section className="jr-panel">
        {head("Capture")}
        <h2 className="display h3 screen-title">Same spot, same light.</h2>
        <CameraCapture onCapture={(f) => use(f)} onCancel={() => setPhase({ at: "intro" })} onFallback={onFallback} />
        {fileInput}
      </section>
    );
  }

  if (phase.at === "confirm" || phase.at === "measuring" || phase.at === "error") {
    const busy = phase.at === "measuring";
    return (
      <section className="jr-panel">
        {head(busy ? "Measuring" : "Check the frame")}
        <div className="jr-pair">
          {lastPhoto && (
            <figure><img src={lastPhoto} alt="Your last check-in" /><figcaption>Last time · {BAND_SHORT[before]}</figcaption></figure>
          )}
          <figure><img src={phase.photo.dataUrl} alt="Your new photo" /><figcaption>Today</figcaption></figure>
        </div>
        {busy && (
          <div className="rou" role="status">
            <Mascot mood="think" size={52} />
            <div className="rou-body">
              <div className="rou-label">ROU</div>
              <div className="rou-text">YouCam is measuring your length…</div>
              <div className="loader-line" />
            </div>
          </div>
        )}
        {phase.at === "error" && (
          <Interrupt headline={phase.failure.retake ? "Let's retake this one." : "The measurement didn't finish."} code={phase.failure.code}>
            {phase.failure.message}
          </Interrupt>
        )}
        {!busy && (
          <div className="dock flat">
            {phase.at === "error" && phase.failure.retake ? (
              <button className="cta block" onClick={() => setPhase({ at: "camera" })}>Retake</button>
            ) : (
              <button className="cta block" onClick={() => measure(phase.photo)}>{phase.at === "error" ? "Try again" : "Measure my length"}</button>
            )}
            <div className="btn-row" style={{ marginTop: 6 }}>
              <button className="textbtn" onClick={() => setPhase({ at: "camera" })}>Retake</button>
              <button className="textbtn" onClick={() => fileRef.current?.click()}>Upload another</button>
            </div>
          </div>
        )}
        {fileInput}
      </section>
    );
  }

  if (phase.at === "done") {
    const after = phase.checkin.band!;
    const d = LENGTH_BANDS.indexOf(after) - LENGTH_BANDS.indexOf(before);
    const toward = (journey.direction === "grow" && d > 0) || (journey.direction === "cut" && d < 0);
    return (
      <section className="jr-panel">
        {head("Result")}
        <div className="jr-result">
          <Mascot mood={toward ? "cheer" : d === 0 ? "happy" : "think"} size={110} />
          <div>
            <div className="mono">YouCam reads</div>
            <div className="display h3">{BAND_SHORT[after]}{phase.checkin.atLeast ? " or longer" : ""}</div>
            <p className="small" style={{ marginTop: 8 }}>
              {d === 0
                ? `Same band as last time (${BAND_SHORT[before].toLowerCase()}). Hair grows inside a band long before it crosses into the next one, so this is normal.`
                : toward
                  ? `Up from ${BAND_SHORT[before].toLowerCase()}. That's a new band, and Rou has moved along the road.`
                  : `That's ${BAND_SHORT[before].toLowerCase()} before and ${BAND_SHORT[after].toLowerCase()} now, away from the destination. A cut, a different angle or tied-back hair can do this; retake if it looks wrong.`}
            </p>
            {phase.checkin.simulated && <p className="mono muted">Simulated result, not from YouCam</p>}
          </div>
        </div>

        <div className="jr-dest">
          <div className="jr-sub">{journey.targetName}, on today&apos;s hair</div>
          {phase.render.state === "ready" ? (
            <>
              <CompareSlider intro before={phase.photo.dataUrl} after={phase.render.image} beforeLabel="Today" afterLabel={journey.targetName} />
              {dayOne && (
                <div className="jr-pair" style={{ marginTop: 12 }}>
                  <figure><img src={dayOne} alt="" /><figcaption>Day 1 render</figcaption></figure>
                  <figure><img src={phase.render.image} alt="" /><figcaption>Today&apos;s render</figcaption></figure>
                </div>
              )}
              <p className="small muted" style={{ marginTop: 8 }}>The same destination, rendered by YouCam Hairstyle Try-On on your first photo and on today&apos;s.</p>
            </>
          ) : phase.render.state === "running" ? (
            <div className="tryon-render compact" aria-live="polite">
              <img src={phase.photo.dataUrl} alt="" className="dim" />
              <div className="scan" aria-hidden />
              <div className="render-cap">
                <Mascot mood="think" size={42} />
                <span>
                  <b>Rendering {journey.targetName} on today&apos;s photo</b>
                  <span className="mono">YouCam Hairstyle Try-On · 15–40 s</span>
                </span>
              </div>
            </div>
          ) : phase.render.state === "simulated" ? (
            <p className="small muted">Simulated: no YouCam image in mock mode.</p>
          ) : (
            <p className="small muted">The destination didn&apos;t render this time ({phase.render.message}). Your measurement is saved.</p>
          )}
        </div>
        <div className="dock flat"><button className="cta block" onClick={onClose}>Back to my journey</button></div>
      </section>
    );
  }

  return (
    <section className="jr-panel">
      {head("New photo")}
      <h2 className="display h3 screen-title">How far have you come?</h2>
      <p className="small">
        Take the photo the way you took the first one: face forward, hair down, shoulders in frame, good light. YouCam Hair
        Length Detection measures it again and the road updates, and YouCam Hairstyle Try-On renders {journey.targetName} on
        today&apos;s photo so you can see it fitting your hair.
      </p>
      <label className="check consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          Send this photo to YouCam (Perfect Corp.) to measure my length and render my destination on it. Only small copies
          are kept, on this device. YouCam keeps processed files for up to 30 days.
        </span>
      </label>
      {note && <Interrupt title="Photo" headline="Use a different photo.">{note}</Interrupt>}
      <div className="dock flat">
        <button className="cta block" disabled={!consent} onClick={() => setPhase({ at: "camera" })}>Open camera</button>
        <button className="textbtn" style={{ width: "100%" }} disabled={!consent} onClick={() => fileRef.current?.click()}>
          Or upload a photo
        </button>
      </div>
      {fileInput}
    </section>
  );
}
