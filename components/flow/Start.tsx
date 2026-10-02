"use client";

import { useCallback, useRef, useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import Mascot from "@/components/Mascot";
import Interrupt from "@/components/route/Interrupt";
import { CaptureError, preparePhoto, type PreparedPhoto } from "@/lib/client/image";

// CONSULTATION / 01: a measurement studio. Tips, consent, then camera or upload.
export default function Start({ onDone }: { onDone: (photo: PreparedPhoto) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [camera, setCamera] = useState(false);
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [camNote, setCamNote] = useState<string | null>(null);

  const onFallback = useCallback((reason: string) => {
    setCamera(false);
    setCamNote(reason);
  }, []);

  const use = async (f: Blob | undefined) => {
    setError(null);
    if (!f) return;
    try {
      setPhoto(await preparePhoto(f));
    } catch (e) {
      setError(e instanceof CaptureError ? e.message : "We couldn't use this photo. Please try another.");
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

  if (camera) {
    return (
      <main className="flow-main">
        <div className="kicker"><span>Consultation / 01</span><span>Capture</span></div>
        <h1 className="display h3 screen-title">Hold still.</h1>
        <CameraCapture
          onCapture={(f) => {
            setCamera(false);
            use(f);
          }}
          onCancel={() => setCamera(false)}
          onFallback={onFallback}
        />
        {fileInput}
      </main>
    );
  }

  if (photo) {
    return (
      <main className="flow-main">
        <div className="kicker"><span>Consultation / 01</span><span>Check the frame</span></div>
        <h1 className="display h3 screen-title">You are here.</h1>
        <div className="frame" style={{ maxWidth: 440, width: "100%", margin: "0 auto" }}>
          <img src={photo.dataUrl} alt="Your photo" />
        </div>
        <div className="frame-meta" style={{ maxWidth: 440, width: "100%", margin: "6px auto 0" }}>
          <span>Current state</span>
          <span>640 × 800</span>
        </div>
        <p className="small muted" style={{ marginTop: 14 }}>Face, hair down and both shoulders should be visible.</p>
        <div className="dock">
          <button className="cta block" onClick={() => onDone(photo)}>Use this photo</button>
          <div className="btn-row" style={{ marginTop: 6 }}>
            <button className="textbtn" onClick={() => setCamera(true)}>Retake</button>
            <button className="textbtn" onClick={() => fileRef.current?.click()}>Upload another</button>
          </div>
        </div>
        {fileInput}
      </main>
    );
  }

  return (
    <main className="flow-main">
      <div className="kicker"><span>Consultation / 01</span><span>01 / 03</span></div>
      <h1 className="display h2 screen-title">Let&apos;s see<br />where you are.</h1>

      <ol className="route-v" aria-label="How to take the photo">
        <li className="done"><span className="wp-dot" /><div className="wp-title">Face forward</div><div className="wp-meta">Head level · look at the lens</div></li>
        <li className="done"><span className="wp-dot" /><div className="wp-title">Hair down</div><div className="wp-meta">Not tied up · no hat</div></li>
        <li className="done"><span className="wp-dot" /><div className="wp-title">Shoulders up</div><div className="wp-meta">Frame shoulders · face the light</div></li>
      </ol>

      <div className="rou" aria-hidden>
        <Mascot mood="wave" size={56} />
        <div className="rou-body">
          <div className="rou-label">ROU</div>
          <div className="rou-text caps">Good light. Face forward.</div>
        </div>
      </div>

      <label className="check consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          Send my photo to YouCam (Perfect Corp.) to analyse my hair and make try-ons. ManeRoute stores nothing on its
          servers; YouCam keeps processed files for up to 30 days. <a href="/#privacy" target="_blank" rel="noreferrer">Privacy</a>
        </span>
      </label>

      {camNote && <Interrupt title="Camera unavailable" headline="Use a photo instead.">{camNote}</Interrupt>}
      {error && (
        <Interrupt headline="We couldn't read this frame.">
          {error}
        </Interrupt>
      )}

      <div className="dock">
        <button className="cta block" disabled={!consent} onClick={() => { setCamNote(null); setCamera(true); }}>
          Open camera
        </button>
        <button className="textbtn" style={{ width: "100%" }} disabled={!consent} onClick={() => fileRef.current?.click()}>
          Or upload a photo
        </button>
      </div>
      {fileInput}
    </main>
  );
}
