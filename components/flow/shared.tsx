"use client";

import { useEffect, useRef, useState } from "react";
import { LENGTH_BAND_LABELS, type Collection, type HairBaseline, type TargetStyle } from "@/lib/types";
import { ApiError, type ApiFailure } from "@/lib/client/api";
import type { HairReading } from "@/lib/hairCheck";

export type Preview =
  | { state: "idle" }
  | { state: "running"; taskId?: string }
  | { state: "success"; image: string | null; simulated?: boolean }
  | { state: "timeout"; taskId: string }
  | { state: "error"; failure: ApiFailure };

export type Shelf = Collection | "all";

/** A background YouCam hair check (density, frizz): kept quiet unless it reads clearly. */
export type CheckState =
  | { state: "none" }
  | { state: "running" }
  | { state: "done"; reading: HairReading }
  | { state: "error"; message: string };

export const toFailure = (e: unknown): ApiFailure =>
  e instanceof ApiError ? e.failure : { code: "unknown", message: "Something went wrong. Please try again.", retake: false };

export const shortBand = (b: HairBaseline["lengthBand"]) => LENGTH_BAND_LABELS[b].split(" (")[0];

// ---------- Zoomable previews ----------

export function zoom(src: string, label: string) {
  window.dispatchEvent(new CustomEvent("maneroute:zoom", { detail: { src, label } }));
}

export function Lightbox() {
  const [img, setImg] = useState<{ src: string; label: string } | null>(null);
  useEffect(() => {
    const on = (e: Event) => setImg((e as CustomEvent).detail);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setImg(null);
    window.addEventListener("maneroute:zoom", on);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("maneroute:zoom", on);
      window.removeEventListener("keydown", esc);
    };
  }, []);
  if (!img) return null;
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={img.label} onClick={() => setImg(null)}>
      <img src={img.src} alt={img.label} />
      <div className="lightbox-cap">{img.label} · tap to close</div>
    </div>
  );
}

// ---------- Style pictures ----------

export function LengthSilhouette({ band }: { band: TargetStyle["targetLengthBand"] }) {
  const end = { above_ears: 44, ear_length: 60, short: 84, above_chest: 108, long: 132 }[band];
  const short = band === "above_ears";
  return (
    <svg viewBox="0 0 120 150" className="silhouette" aria-hidden>
      <path d="M14 150 C 16 114, 38 102, 60 101 C 82 102, 104 114, 106 150 Z" fill="var(--line)" />
      <rect x="52" y="78" width="16" height="24" fill="var(--line)" />
      <path
        d={`M34 50 C 32 18, 88 18, 86 50 L ${short ? 84 : 90} ${end} C 76 ${end + 4}, 44 ${end + 4}, ${short ? 36 : 30} ${end} Z`}
        fill="var(--accent)"
        opacity="0.75"
      />
      <ellipse cx="60" cy="58" rx="19" ry="24" fill="var(--surface-2)" stroke="var(--line)" />
    </svg>
  );
}

// ---------- Form bits ----------

export function Seg<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map(([v, label]) => (
        <label key={v}>
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

// ---------- Before / after slider ----------

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Drag to compare. With `intro`, each new `after` image is revealed with a wipe: your photo,
 * then the new cut sweeps across, then the handle settles in the middle. Any touch stops it.
 */
export function CompareSlider({
  before,
  after,
  beforeLabel,
  afterLabel,
  intro = false,
  className = "",
}: {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  intro?: boolean;
  className?: string;
}) {
  const [pos, setPos] = useState(intro ? 100 : 50);
  const [wiping, setWiping] = useState(false);
  const touched = useRef(false);

  useEffect(() => {
    if (!intro) return;
    touched.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPos(50);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (touched.current) return setWiping(false);
      const t = now - start;
      if (t < 300) setPos(100);
      else if (t < 1500) setPos(100 - 100 * easeInOut((t - 300) / 1200));
      else if (t < 1900) setPos(0);
      else if (t < 2600) setPos(50 * easeInOut((t - 1900) / 700));
      else {
        setPos(50);
        return setWiping(false);
      }
      raf = requestAnimationFrame(tick);
    };
    setWiping(true);
    setPos(100);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [intro, after]);

  const stop = () => {
    touched.current = true;
    setWiping(false);
  };

  return (
    <div className={`compare ${wiping ? "wiping" : ""} ${className}`} style={{ ["--pos" as string]: `${pos}%` }}>
      <img src={after} alt={afterLabel} className="compare-after" />
      <div className="compare-before">
        <img src={before} alt={beforeLabel} />
      </div>
      <div className="compare-line" aria-hidden />
      <span className="compare-tag left">{beforeLabel}</span>
      <span className="compare-tag right">{afterLabel}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        onPointerDown={stop}
        onKeyDown={stop}
        onChange={(e) => {
          stop();
          setPos(Number(e.target.value));
        }}
        aria-label={`Slide to compare ${beforeLabel} and ${afterLabel}`}
      />
    </div>
  );
}
