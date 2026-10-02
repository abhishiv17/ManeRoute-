"use client";

import { useEffect, useState } from "react";
import { LENGTH_BAND_LABELS, type Collection, type HairBaseline, type TargetStyle } from "@/lib/types";
import { ApiError, type ApiFailure } from "@/lib/client/api";

export type Preview =
  | { state: "idle" }
  | { state: "running"; taskId?: string }
  | { state: "success"; image: string | null; simulated?: boolean }
  | { state: "timeout"; taskId: string }
  | { state: "error"; failure: ApiFailure };

export type Shelf = Collection | "all";

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

export function CompareSlider({ before, after, beforeLabel, afterLabel }: { before: string; after: string; beforeLabel: string; afterLabel: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="compare" style={{ ["--pos" as string]: `${pos}%` }}>
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
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Slide to compare ${beforeLabel} and ${afterLabel}`}
      />
    </div>
  );
}
