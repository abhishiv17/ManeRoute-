"use client";

import { useEffect, useRef, useState } from "react";
import Mascot from "@/components/Mascot";

// Chapter one: the same person at both ends of the road, and the road runs both ways.
// Rou walks from "now" to "target"; when Rou arrives the two photos flip places and the
// route flips with them (grow it out ⇄ cut it shorter). A button flips it by hand.

const LONG = { src: "/examples/salon-now.jpg", alt: "Long wavy hair" };
const PIXIE = { src: "/examples/salon-target.jpg", alt: "Pixie, previewed on the same person" };

type Dir = "grow" | "cut";
const WALK_MS = 2600;
const REST_MS = 1400;

export default function HereThere() {
  // Starts from the short cut, so the first road shown is "grow it out".
  const [dir, setDir] = useState<Dir>("grow");
  const [arrived, setArrived] = useState(false);
  const [walking, setWalking] = useState(false);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAuto(false);
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // One lap: set off, arrive (cheer), flip the photos, rest, go again.
  useEffect(() => {
    if (!auto || !visible) return;
    const timers: number[] = [];
    const start = requestAnimationFrame(() => setWalking(true));
    timers.push(window.setTimeout(() => setArrived(true), WALK_MS));
    timers.push(
      window.setTimeout(() => {
        setDir((d) => (d === "grow" ? "cut" : "grow"));
        setWalking(false);
        setArrived(false);
      }, WALK_MS + REST_MS),
    );
    return () => {
      cancelAnimationFrame(start);
      timers.forEach(clearTimeout);
    };
  }, [auto, visible, dir]);

  const flip = () => {
    setAuto(false);
    setWalking(false);
    setArrived(false);
    setDir((d) => (d === "grow" ? "cut" : "grow"));
  };

  const now = dir === "grow" ? PIXIE : LONG;
  const target = dir === "grow" ? LONG : PIXIE;
  const label = dir === "grow" ? "Grow it out" : "Cut it shorter";

  return (
    <div ref={root} className="here-there">
      <div className={`states ${dir === "cut" ? "flipped" : ""}`}>
        <figure>
          <div className="flip-card">
            <img className="face front" src={PIXIE.src} alt={dir === "grow" ? `Now: ${PIXIE.alt}` : ""} aria-hidden={dir !== "grow"} />
            <img className="face back" src={LONG.src} alt={dir === "cut" ? `Now: ${LONG.alt}` : ""} aria-hidden={dir !== "cut"} />
          </div>
          <figcaption>Where you are</figcaption>
        </figure>

        <div className="states-road">
          <div className="road-track" aria-hidden>
            <div className={`road-walker ${walking ? "go" : ""} ${arrived ? "arrived" : ""}`}>
              <Mascot mood={arrived ? "cheer" : walking ? "walk" : "happy"} size={56} title="Rou walking the route" />
            </div>
            <i />
          </div>
          <span key={label} className="road-label">{label} →</span>
        </div>

        <figure>
          <div className="flip-card late">
            <img className="face front" src={LONG.src} alt={dir === "grow" ? `Target: ${LONG.alt}` : ""} aria-hidden={dir !== "grow"} />
            <img className="face back" src={PIXIE.src} alt={dir === "cut" ? `Target: ${PIXIE.alt}` : ""} aria-hidden={dir !== "cut"} />
          </div>
          <figcaption>Where you want to be</figcaption>
        </figure>
      </div>

      <div className="states-foot">
        <button type="button" className="swap-btn" onClick={flip} aria-label={`Flip the route. Now showing: ${label}`}>
          <Mascot mood="wave" size={36} animate />
          <span>Flip it ⇄</span>
        </button>
        {!auto && (
          <button type="button" className="swap-play" onClick={() => setAuto(true)}>Let Rou walk it</button>
        )}
        <span className="sr-only" aria-live="polite">{`${label}: from ${now.alt.toLowerCase()} to ${target.alt.toLowerCase()}`}</span>
      </div>
    </div>
  );
}
