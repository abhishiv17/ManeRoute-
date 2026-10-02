"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import Mascot from "@/components/Mascot";
import Interrupt from "@/components/route/Interrupt";
import { pollLength, startLength, uploadPhoto, type ApiFailure } from "@/lib/client/api";
import { CaptureError, preparePhoto, type PreparedPhoto } from "@/lib/client/image";
import { makeThumb } from "@/lib/client/plans";
import { toFailure } from "@/components/flow/shared";
import { BAND_SHORT, currentBand, type CheckIn as CheckInT, type Journey } from "@/lib/journey";
import { LENGTH_BANDS } from "@/lib/types";

// A check-in: one new front photo, measured again by YouCam Hair Length Detection (about 1 unit).
// The result moves Rou along the road when the band changes. Nothing is predicted.
type Phase =
  | { at: "intro" }
  | { at: "camera" }
  | { at: "confirm"; photo: PreparedPhoto }
  | { at: "measuring"; photo: PreparedPhoto }
  | { at: "error"; photo: PreparedPhoto; failure: ApiFailure }
  | { at: "done"; checkin: CheckInT };

export default function CheckIn({
  journey,
  onSave,
  onClose,
}: {
  journey: Journey;
  onSave: (c: CheckInT) => Promise<void>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>({ at: "intro" });
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abort = useRef(new AbortController());
  const before = currentBand(journey);
  const lastPhoto = [...journey.checkins].reverse().find((c) => c.photo)?.photo;

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
      setPhase({ at: "done", checkin: c });
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
        Length Detection measures it again and the road updates.
      </p>
      <label className="check consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          Send this photo to YouCam (Perfect Corp.) to measure my length. Only a small copy is kept, on this device. YouCam
          keeps processed files for up to 30 days.
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
