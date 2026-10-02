import {
  LENGTH_BAND_LABELS,
  type HairBaseline,
  type HairTexture,
  type Preferences,
  type TargetStyle,
  type TransitionRoute,
  type HairCheck,
} from "@/lib/types";
import { ROUTE_HEADLINES } from "@/lib/rules";
import { chairPlan, type ChairStep } from "@/lib/barber";
import { finishSteps, type Finish } from "@/lib/addons";
import { getStyle } from "@/lib/catalog";

// Renders the consultation document to a PNG entirely in the browser, in the same editorial
// language as the app: paper, ink, thin rules, mono labels, condensed display type, one orange signal.
// All images are data URLs, so the canvas is never tainted and nothing is uploaded.

export type CardData = {
  target: TargetStyle;
  baseline: HairBaseline;
  texture?: HairTexture | null;
  prefs: Preferences;
  route: TransitionRoute;
  sourceImage: string;
  targetImage?: string | null;
  /** Along-the-way cuts, in order, with their previews on the user's photo. */
  stages: { name: string; image: string | null }[];
  growOutImage?: string | null;
  /** The haircut alone, before any beard, fringe or colour (the journey compares re-renders with it). */
  targetCutImage?: string | null;
  /** Beard, fringe and colour added on top of the cut, in order. */
  finish?: Finish[];
  /** YouCam Hair Density / Frizziness readings, when they could be read. */
  hairCheck?: HairCheck;
  /** Questions as edited by the user on the document screen. */
  questions: string[];
  /** Optional free-text note to the stylist. */
  note: string;
  simulated?: boolean;
};

const W = 1080;
const PAD = 64;
const C = { bg: "#FFF8EA", ink: "#1E2420", muted: "#5E5A4E", line: "#D9C8A4", route: "#F08A24", routeInk: "#A24806", soft: "#EADCC0" };

export const GROW = { yes: "Open to growing out", maybe: "Maybe grow out, if it's worth it", no: "Doesn't want to grow out" };
export const CHEM = { yes: "Open to colour or chemical treatment", no: "No chemical treatment", unsure: "Unsure about chemical treatment" };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** What to ask for, in order, for the document: the next appointment first, the destination last. */
export function chairFor(d: Pick<CardData, "baseline" | "target" | "route" | "finish">): ChairStep[] {
  if (d.route.route === "retake_required") return [];
  const stages = d.route.stageStyleIds.map((id) => getStyle(id)).filter((s): s is TargetStyle => Boolean(s));
  return [...chairPlan(d.baseline.lengthBand, d.target, stages), ...finishSteps(d.finish ?? [])];
}

export function baselineText(b: HairBaseline): string {
  return `${LENGTH_BAND_LABELS[b.lengthBand]}${b.atLeast ? " or longer" : ""}`;
}

export function cardSummaryText(d: CardData): string {
  const lines = [
    `MANEROUTE / CONSULTATION`,
    `Target: ${d.target.name}`,
    `Route: ${ROUTE_HEADLINES[d.route.route]}`,
    `Current length (YouCam Hair Length Detection): ${baselineText(d.baseline)}`,
  ];
  const chair = chairFor(d);
  if (chair.length) {
    lines.push("", "In the chair, ask for:");
    chair.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.when}: ${c.title}`, `   "${c.ask}"`);
      for (const x of c.details) lines.push(`   - ${x}`);
    });
  }
  if (d.texture) lines.push(`Texture (YouCam Hair Type Detection): ${d.texture.term}`);
  if (d.hairCheck?.density) lines.push(`Density (YouCam Hair Density Detection): ${d.hairCheck.density.term}`);
  if (d.hairCheck?.frizz) lines.push(`Frizz (YouCam Hair Frizziness Detection): ${d.hairCheck.frizz.term}`);
  lines.push("", "What matters:", `- ${GROW[d.prefs.growOut]}`, `- ${CHEM[d.prefs.chemical]}`, `- Daily styling: ${d.prefs.maintenance}`);
  if (d.prefs.keepLength) lines.push("- Keep as much length as possible");
  if (d.prefs.nonNegotiables.trim()) lines.push(`- Please don't: ${d.prefs.nonNegotiables.trim()}`);
  if (d.note.trim()) lines.push(`- ${d.note.trim()}`);
  if (d.route.cautions.length) lines.push("", "Let's talk about:", ...d.route.cautions.slice(0, 3).map((r) => `- ${r.text}`));
  if (d.questions.length) lines.push("", "Ask your stylist:", ...d.questions.map((q) => `- ${q}`));
  lines.push("", "Previews made with YouCam AI on my photo. References, not guarantees.");
  return lines.join("\n");
}

function fonts() {
  const cs = getComputedStyle(document.documentElement);
  const sans = cs.getPropertyValue("--font-body").trim() || "Helvetica, Arial, sans-serif";
  const display = cs.getPropertyValue("--font-display").trim() || "Impact, sans-serif";
  return { sans, display };
}

export async function renderCardPng(d: CardData): Promise<Blob> {
  const { sans, display } = fonts();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  // Small spaced labels: the body face, bold (the app has no monospace any more).
  const setMono = (size: number, weight = 500) => {
    ctx.font = `${Math.max(700, weight)} ${size}px ${sans}`;
    (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "normal";
  };
  const setSans = (size: number, weight = 400) => {
    ctx.font = `${weight} ${size}px ${sans}`;
    (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "normal";
  };
  const setDisplay = (size: number) => {
    ctx.font = `400 ${size * 0.9}px ${display}`;
    (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "normal";
  };
  const spaced = (text: string, x: number, y: number, spacing = 2) => {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${spacing}px`;
    ctx.fillText(text.toUpperCase(), x, y);
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  };
  const rule = (y: number, weight = 2, color = C.ink) => {
    ctx.fillStyle = color;
    ctx.fillRect(PAD, y, W - PAD * 2, weight);
  };

  const [src, grow, tgt, ...mids] = await Promise.all([
    loadImage(d.sourceImage),
    d.growOutImage ? loadImage(d.growOutImage) : Promise.resolve(null),
    d.targetImage ? loadImage(d.targetImage) : Promise.resolve(null),
    ...d.stages.filter((s) => s.image).map((s) => loadImage(s.image!)),
  ]);
  const panels: { label: string; img: HTMLImageElement | null }[] = [{ label: "Current", img: src }];
  mids.forEach((m, i) => panels.push({ label: mids.length > 1 ? `Stage ${i + 1}` : "Along the way", img: m }));
  if (grow) panels.push({ label: "Grown", img: grow });
  panels.push({ label: "Target", img: tgt });

  canvas.width = W;
  canvas.height = 5200;
  const inner = W - PAD * 2;
  let y = PAD;
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, canvas.height);

  // Header
  ctx.fillStyle = C.ink;
  setMono(22, 600);
  spaced("ManeRoute / Consultation", PAD, y + 20, 3);
  ctx.textAlign = "right";
  spaced(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), W - PAD, y + 20, 3);
  ctx.textAlign = "left";
  y += 40;
  rule(y, 3);
  y += 30;

  // Photos along the route
  const gap = 12;
  const pw = (inner - gap * (panels.length - 1)) / panels.length;
  const ph = pw * 1.25;
  panels.forEach((p, i) => {
    const x = PAD + i * (pw + gap);
    ctx.fillStyle = C.soft;
    ctx.fillRect(x, y, pw, ph);
    if (p.img) drawCover(ctx, p.img, x, y, pw, ph);
    ctx.fillStyle = C.ink;
    setMono(17, 500);
    spaced(`${String(i + 1).padStart(2, "0")} ${p.label}`, x, y + ph + 30, 2);
  });
  // route line under the photos
  const ly = y + ph + 52;
  ctx.fillStyle = C.route;
  ctx.fillRect(PAD, ly, inner, 3);
  panels.forEach((_, i) => {
    const cx = PAD + i * (pw + gap) + 8;
    ctx.beginPath();
    ctx.arc(cx, ly + 1.5, 8, 0, Math.PI * 2);
    ctx.fillStyle = i === panels.length - 1 ? C.route : C.bg;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.route;
    ctx.stroke();
  });
  y = ly + 44;

  // Current / Target / Route
  const col = (label: string, value: string, x: number, width: number, color = C.ink, sub?: string) => {
    ctx.fillStyle = C.muted;
    setMono(17, 500);
    spaced(label, x, y, 3);
    ctx.fillStyle = color;
    setDisplay(46);
    let yy = y + 50;
    for (const l of wrap(ctx, value.toUpperCase(), width)) {
      ctx.fillText(l, x, yy);
      yy += 46;
    }
    if (sub) {
      ctx.fillStyle = C.muted;
      setMono(17, 500);
      spaced(sub, x, yy - 6, 1);
      yy += 24;
    }
    return yy;
  };
  rule(y - 10, 1, C.line);
  y += 30;
  const half = (inner - 32) / 2;
  const endA = col("Current", baselineText(d.baseline).split(" (")[0], PAD, half, C.ink, d.texture ? d.texture.term : undefined);
  const endB = col("Target", d.target.name, PAD + half + 32, half);
  y = Math.max(endA, endB) + 10;
  rule(y - 10, 1, C.line);
  y += 30;
  y = col("Route", ROUTE_HEADLINES[d.route.route], PAD, inner, C.routeInk) + 10;

  // In the chair: what to ask for, in order
  const chair = chairFor(d);
  if (chair.length) {
    rule(y, 1, C.line);
    y += 44;
    ctx.fillStyle = C.muted;
    setMono(17, 500);
    spaced("In the chair, ask for", PAD, y, 3);
    y += 22;
    chair.forEach((c, i) => {
      y += 26;
      ctx.fillStyle = C.route;
      ctx.beginPath();
      ctx.arc(PAD + 13, y - 6, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.ink;
      setMono(15, 800);
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), PAD + 13, y);
      ctx.textAlign = "left";
      ctx.fillStyle = C.routeInk;
      setMono(17, 500);
      spaced(c.when, PAD + 40, y, 2);
      y += 44;
      ctx.fillStyle = C.ink;
      setDisplay(38);
      ctx.fillText(c.title.toUpperCase(), PAD + 40, y);
      y += 44;
      setSans(28);
      for (const l of wrap(ctx, `“${c.ask}”`, inner - 40)) {
        ctx.fillText(l, PAD + 40, y);
        y += 38;
      }
      ctx.fillStyle = C.muted;
      setSans(24);
      for (const x of c.details) {
        const lines = wrap(ctx, `· ${x}`, inner - 60);
        lines.forEach((l) => {
          ctx.fillText(l, PAD + 52, y);
          y += 32;
        });
      }
      y += 10;
    });
    y += 6;
  }

  // Checklist sections
  const section = (title: string, rows: string[]) => {
    if (!rows.length) return;
    rule(y, 1, C.line);
    y += 44;
    ctx.fillStyle = C.muted;
    setMono(17, 500);
    spaced(title, PAD, y, 3);
    y += 40;
    setSans(28);
    for (const r of rows) {
      ctx.fillStyle = C.ink;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(PAD, y - 21, 22, 22);
      const lines = wrap(ctx, r, inner - 44);
      lines.forEach((l, i) => {
        ctx.fillText(l, PAD + 44, y);
        if (i < lines.length - 1) y += 38;
      });
      y += 48;
    }
    y += 4;
  };

  const matters = [GROW[d.prefs.growOut], CHEM[d.prefs.chemical], `Daily styling: ${d.prefs.maintenance === "low" ? "minimal" : d.prefs.maintenance === "high" ? "happy to put time in" : "a few minutes"}`];
  if (d.prefs.keepLength) matters.unshift("Keep as much length as possible");
  if (d.prefs.nonNegotiables.trim()) matters.push(`Please don't: ${d.prefs.nonNegotiables.trim()}`);
  if (d.note.trim()) matters.push(d.note.trim());
  section("What matters", matters);
  section("Let's talk about", d.route.cautions.slice(0, 3).map((r) => r.text));
  section("Ask your stylist", d.questions);

  // Footer
  rule(y, 3);
  y += 40;
  ctx.fillStyle = C.muted;
  setMono(16, 500);
  const foot = d.simulated
    ? "SIMULATED DEMO DATA · NOT REAL YOUCAM RESULTS"
    : "Previews: YouCam AI on my photo · references, not guarantees";
  spaced(foot, PAD, y, 2);
  ctx.textAlign = "right";
  ctx.fillStyle = C.ink;
  spaced("Rou", W - PAD - 26, y, 3);
  ctx.textAlign = "left";
  ctx.beginPath();
  ctx.arc(W - PAD - 8, y - 6, 8, 0, Math.PI * 2);
  ctx.fillStyle = C.route;
  ctx.fill();
  y += PAD - 10;

  const out = document.createElement("canvas");
  out.width = W;
  out.height = Math.ceil(y);
  out.getContext("2d")!.drawImage(canvas, 0, 0);
  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error("render failed"))), "image/png"));
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, Math.max(0, (img.height - sh) * 0.3), sw, sh, x, y, w, h);
}
