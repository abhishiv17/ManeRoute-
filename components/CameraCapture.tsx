"use client";

import { useEffect, useRef, useState } from "react";

// Live camera capture with a framing guide. Works on laptops (webcam) and phones (front camera).
// Needs a secure context (https or localhost). Falls back to file upload on any failure.
// `pose` switches the guide for the texture scan: front, head turned right, head turned left.

export type Pose = "front" | "right" | "left";

type Props = {
  onCapture: (file: File) => void;
  onCancel: () => void;
  onFallback: (reason: string) => void;
  pose?: Pose;
  /** Start a 3-second countdown as soon as the camera is live (hands-free side shots). */
  autoTimer?: boolean;
};

type CamState = "starting" | "live" | "countdown";

const PROMPTS: Record<Pose, string> = {
  front: "Face in the frame · shoulders on the line · hair down",
  right: "Turn your head right, about halfway · shoulders still",
  left: "Now turn your head left, about halfway",
};

export default function CameraCapture({ onCapture, onCancel, onFallback, pose = "front", autoTimer = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<CamState>("starting");
  const [count, setCount] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        onFallback("Your browser can't open the camera here. Please upload a photo instead.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play().catch(() => {});
        setState("live");
      } catch (e) {
        const name = (e as DOMException)?.name;
        onFallback(
          name === "NotAllowedError"
            ? "Camera access was blocked. Allow the camera in your browser's site settings, or upload a photo instead."
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "We couldn't find a camera on this device. Please upload a photo instead."
              : name === "NotReadableError"
                ? "Your camera is being used by another app. Close it and try again, or upload a photo."
                : "We couldn't start the camera. Please upload a photo instead.",
        );
      }
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onFallback]);

  // Rough live brightness check so users fix lighting before capturing.
  useEffect(() => {
    if (state !== "live") return;
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || !v.videoWidth) return;
      ctx.drawImage(v, 0, 0, 32, 32);
      const d = ctx.getImageData(0, 0, 32, 32).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      const mean = sum / (d.length / 4);
      setHint(mean < 60 ? "It looks dark. Face a window or turn on a light." : mean > 225 ? "It looks very bright. Move away from direct light." : null);
    }, 700);
    return () => clearInterval(id);
  }, [state]);

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    // Save un-mirrored, as a real photo would be.
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob(
      (b) => {
        if (!b) return;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCapture(new File([b], `camera-${pose}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  };

  const startTimer = () => {
    setState("countdown");
    let n = 3;
    setCount(n);
    timerRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        snap();
      } else setCount(n);
    }, 1000);
  };

  useEffect(() => {
    if (state === "live" && autoTimer) startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, autoTimer]);

  // Technical framing: thin corner ticks for the head, a shoulder rule and centre marks, no ovals.
  const tick = (x: number, y: number, dx: number, dy: number) => `M${x} ${y + dy} V${y} H${x + dx}`;

  return (
    <div className="camera">
      <div className="camera-view">
        <video ref={videoRef} playsInline muted aria-label="Camera preview" />
        <svg className="camera-guide" viewBox="0 0 300 375" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <g stroke="#FFF8EA" strokeWidth="1.2" fill="none" opacity="0.9">
            <path d={tick(88, 46, 18, 18)} />
            <path d={tick(212, 46, -18, 18)} />
            <path d={tick(88, 236, 18, -18)} />
            <path d={tick(212, 236, -18, -18)} />
            <path d="M40 286 H260" strokeDasharray="2 5" />
            <path d="M150 40 v8 M150 232 v8 M84 141 h-8 M216 141 h8" />
          </g>
          <text x="40" y="280" fill="#FFF8EA" fontFamily="var(--body)" fontWeight="700" fontSize="8" letterSpacing="1">SHOULDERS</text>
          <text x="92" y="40" fill="#FFF8EA" fontFamily="var(--body)" fontWeight="700" fontSize="8" letterSpacing="1">FACE</text>
          {pose !== "front" && (
            <path
              d={pose === "right" ? "M226 141 h34 m-10 -9 l10 9 -10 9" : "M74 141 h-34 m10 -9 l-10 9 10 9"}
              stroke="#F08A24"
              strokeWidth="2.5"
              fill="none"
            />
          )}
        </svg>
        {state === "starting" && (
          <div className="camera-msg">
            <div className="spinner" />
            <span>Starting camera · allow access if asked</span>
          </div>
        )}
        {state === "countdown" && <div className="camera-count" aria-live="assertive">{count}</div>}
        {state !== "starting" && <div className="camera-top">{hint ?? PROMPTS[pose]}</div>}
      </div>
      <div className="dock">
        <button className="cta block" onClick={snap} disabled={state !== "live"}>Capture</button>
        <div className="btn-row" style={{ marginTop: 6 }}>
          <button className="textbtn" onClick={startTimer} disabled={state !== "live"}>3-second timer</button>
          <button className="textbtn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
