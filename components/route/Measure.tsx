import { LENGTH_BANDS, type HairBaseline, type LengthBand } from "@/lib/types";

// The length instrument: YouCam's five visible length bands on one measured line.
// Markers show where you are and where the target is; the distance is counted in bands,
// because YouCam returns categories, not millimetres, and growth time can't be predicted honestly.
const SHORT: Record<LengthBand, string> = {
  above_ears: "Above ears",
  ear_length: "Ear",
  short: "Short",
  above_chest: "Medium",
  long: "Long",
};

const pos = (b: LengthBand) => ((LENGTH_BANDS.indexOf(b) + 0.5) / LENGTH_BANDS.length) * 100;

export function distanceLabel(from: LengthBand, to: LengthBand): string {
  const d = LENGTH_BANDS.indexOf(to) - LENGTH_BANDS.indexOf(from);
  if (d === 0) return "Same band";
  const n = Math.abs(d);
  return `${n} band${n > 1 ? "s" : ""} ${d > 0 ? "longer" : "shorter"}`;
}

export default function Measure({ baseline, target }: { baseline: HairBaseline | null; target?: LengthBand }) {
  const you = baseline ? pos(baseline.lengthBand) : null;
  const tgt = target ? pos(target) : null;
  return (
    <div className="measure" aria-label="Length scale">
      <div className="measure-track">
        <div className="measure-ticks" aria-hidden>
          {LENGTH_BANDS.map((b) => <span key={b} />)}
        </div>
        {you !== null && tgt !== null && (
          <div className="measure-span" style={{ left: `${Math.min(you, tgt)}%`, width: `${Math.abs(tgt - you)}%` }} />
        )}
        {you !== null && <div className="measure-mark you" style={{ left: `${you}%` }} title="You" />}
        {tgt !== null && <div className="measure-mark target" style={{ left: `${tgt}%` }} title="Target" />}
      </div>
      <div className="measure-labels" aria-hidden>
        {LENGTH_BANDS.map((b) => <span key={b}>{SHORT[b]}</span>)}
      </div>
      <div className="measure-legend">
        <span>● You <b>{baseline ? SHORT[baseline.lengthBand] + (baseline.atLeast ? "+" : "") : "measuring…"}</b></span>
        {target && (
          <>
            <span className="accent">● Target <b>{SHORT[target]}</b></span>
            {baseline && <span className="distance">{distanceLabel(baseline.lengthBand, target)}</span>}
          </>
        )}
      </div>
    </div>
  );
}
