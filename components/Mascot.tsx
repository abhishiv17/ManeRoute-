// "Rou" (from "route"): ManeRoute's lion-cub road-tripper. A mane is literally the brand,
// so Rou has the best hair on the road: a sunset mane with a swooped quiff that has the
// route painted down it. Rou travels light: a road-trip bandana, a satchel with the
// consultation card poking out, a comb in the mane, and a tail that ends in a map pin.
// Pure SVG, themed with CSS variables, so it works in light and dark mode at any size.

export type MascotMood = "happy" | "think" | "wow" | "oops" | "cheer" | "wave" | "walk";

const CX = 80;
const CY = 62;

/** A ring of swept, flame-like locks. `wind` makes the left side fuller, as if Rou is on the move. */
function lockRing(rOut: number, rIn: number, n: number, sweep: number, wind: number, phase = 0) {
  const step = (Math.PI * 2) / n;
  const pt = (a: number, r: number) => {
    const k = 1 + wind * -Math.cos(a);
    return `${(CX + Math.cos(a) * r * k).toFixed(1)} ${(CY + Math.sin(a) * r * k).toFixed(1)}`;
  };
  let d = `M${pt(phase, rIn)}`;
  for (let i = 0; i < n; i++) {
    const v = phase + i * step;
    const tip = v + step * (0.5 + sweep);
    const next = v + step;
    d += ` Q${pt(v + step * 0.15, rOut * 0.98)} ${pt(tip, rOut)}`;
    d += ` Q${pt(tip + step * 0.05, rIn + (rOut - rIn) * 0.35)} ${pt(next, rIn)}`;
  }
  return d + "Z";
}

const MANE_OUTER = lockRing(56, 42, 13, 0.32, 0.06, -0.2);
const MANE_MID = lockRing(46, 36, 11, 0.3, 0.05, 0.1);
const MANE_INNER = lockRing(38, 31, 9, 0.28, 0.04, 0.35);

const SHOULDER_L: [number, number] = [67, 114];
const SHOULDER_R: [number, number] = [93, 114];

const PAWS: Record<MascotMood, { l: [number, number]; r: [number, number] }> = {
  happy: { l: [58, 135], r: [102, 135] },
  walk: { l: [60, 134], r: [100, 134] },
  wave: { l: [58, 135], r: [114, 92] },
  cheer: { l: [46, 90], r: [114, 90] },
  wow: { l: [46, 112], r: [114, 112] },
  think: { l: [58, 135], r: [86, 100] },
  oops: { l: [58, 135], r: [108, 74] },
};

function Arm({ from, to, className }: { from: [number, number]; to: [number, number]; className?: string }) {
  const d = `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`;
  return (
    <g className={className}>
      <path d={d} stroke="var(--mascot-line)" strokeWidth="13" strokeLinecap="round" />
      <path d={d} stroke="var(--mascot-fur)" strokeWidth="8" strokeLinecap="round" />
    </g>
  );
}

export default function Mascot({
  mood = "happy",
  size = 96,
  title = "Rou, the ManeRoute guide",
  animate = true,
}: {
  mood?: MascotMood;
  size?: number;
  title?: string;
  animate?: boolean;
}) {
  const paws = PAWS[mood];
  const look = mood === "think" ? { x: 2, y: -3 } : mood === "oops" ? { x: -1, y: 0 } : { x: 0, y: 0 };
  const bigEyes = mood === "wow";
  const eyeRx = bigEyes ? 5.6 : 4.8;
  const eyeRy = bigEyes ? 7.2 : 6.2;
  return (
    <svg
      viewBox="0 0 160 180"
      width={size}
      height={(size * 180) / 160}
      className={`mascot m-${mood} ${animate ? "bob" : ""}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <g strokeLinejoin="round" strokeLinecap="round">
        {/* ground shadow */}
        <ellipse className="m-shadow" cx="80" cy="171" rx="34" ry="5" fill="var(--mascot-shadow)" />

        {/* tail, ending in a map pin */}
        <g className="m-tail">
          <path d="M97 150 C 128 158, 146 144, 140 126" fill="none" stroke="var(--mascot-line)" strokeWidth="9" />
          <path d="M97 150 C 128 158, 146 144, 140 126" fill="none" stroke="var(--mascot-fur)" strokeWidth="5" />
          <path
            d="M140 128 C 134 121, 130 116, 130 110 A10 10 0 1 1 150 110 C 150 116, 146 121, 140 128 Z"
            fill="var(--mascot-mane)"
            stroke="var(--mascot-line)"
            strokeWidth="2.6"
          />
          <circle cx="140" cy="110" r="3.6" fill="var(--mascot-muzzle)" />
        </g>

        {/* feet */}
        <g className="m-leg-l">
          <ellipse cx="68" cy="161" rx="11" ry="7.5" fill="var(--mascot-fur)" stroke="var(--mascot-line)" strokeWidth="2.6" />
        </g>
        <g className="m-leg-r">
          <ellipse cx="92" cy="161" rx="11" ry="7.5" fill="var(--mascot-fur)" stroke="var(--mascot-line)" strokeWidth="2.6" />
        </g>

        {/* body */}
        <path
          d="M60 154 C 55 132, 62 110, 80 108 C 98 110, 105 132, 100 154 C 92 160, 68 160, 60 154 Z"
          fill="var(--mascot-fur)"
          stroke="var(--mascot-line)"
          strokeWidth="2.6"
        />
        <ellipse cx="80" cy="139" rx="12" ry="13" fill="var(--mascot-muzzle)" />

        {/* satchel strap and bag, with the consultation card poking out */}
        <path d="M66 112 L 98 140" stroke="var(--mascot-bag)" strokeWidth="4" />
        <rect x="95" y="126" width="11" height="9" rx="1.5" fill="var(--mascot-muzzle)" stroke="var(--mascot-line)" strokeWidth="1.8" transform="rotate(-10 100 130)" />
        <path d="M97 129 h6 M97 132 h4" stroke="var(--mascot-mane)" strokeWidth="1.4" transform="rotate(-10 100 130)" />
        <rect x="90" y="133" width="22" height="16" rx="4" fill="var(--mascot-bag)" stroke="var(--mascot-line)" strokeWidth="2.4" />
        <path d="M90 139 Q101 143 112 139" fill="none" stroke="var(--mascot-line)" strokeWidth="1.8" />
        <rect x="98.5" y="139" width="5" height="5" rx="1.2" fill="var(--mascot-spark)" />

        {/* the mane: deep sunset outside, golden glow inside */}
        <g className="m-mane">
          <path d={MANE_OUTER} fill="var(--mascot-mane-deep)" stroke="var(--mascot-line)" strokeWidth="3" />
          <path d={MANE_MID} fill="var(--mascot-mane)" />
          <path d={MANE_INNER} fill="var(--mascot-mane-2)" />
        </g>

        {/* the quiff, with the route painted down it */}
        <g className="m-quiff">
          <path
            d="M56 38 C 46 14, 76 -6, 106 2 C 124 7, 130 24, 120 32 C 112 38, 102 32, 106 24 C 108 18, 116 20, 114 26 C 110 16, 96 14, 88 20 C 82 25, 80 32, 80 40 C 72 31, 63 31, 56 38 Z"
            fill="var(--mascot-mane)"
            stroke="var(--mascot-line)"
            strokeWidth="3"
          />
          <path d="M62 30 C 60 14, 86 2, 108 8" fill="none" stroke="var(--mascot-mane-2)" strokeWidth="5" />
          <path d="M62 30 C 60 14, 86 2, 108 8" fill="none" stroke="var(--mascot-road)" strokeWidth="2.2" strokeDasharray="4 5" />
          <path d="M70 34 C 70 22, 84 14, 100 14 M76 38 C 78 28, 88 22, 98 22" fill="none" stroke="var(--mascot-mane-deep)" strokeWidth="1.8" />
        </g>

        {/* a comb tucked in the mane */}
        <g transform="rotate(40 30 52)">
          <rect x="18" y="46" width="24" height="7" rx="2.5" fill="var(--mascot-comb)" stroke="var(--mascot-line)" strokeWidth="1.8" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={20 + i * 3.6} y="52" width="1.8" height="6" rx="0.9" fill="var(--mascot-comb)" stroke="var(--mascot-line)" strokeWidth="0.6" />
          ))}
        </g>

        {/* ears */}
        <g className="m-ear-l">
          <circle cx="56" cy="44" r="10" fill="var(--mascot-face)" stroke="var(--mascot-line)" strokeWidth="2.6" />
          <circle cx="56" cy="44" r="5" fill="var(--mascot-blush)" />
        </g>
        <g className="m-ear">
          <circle cx="104" cy="44" r="10" fill="var(--mascot-face)" stroke="var(--mascot-line)" strokeWidth="2.6" />
          <circle cx="104" cy="44" r="5" fill="var(--mascot-blush)" />
        </g>

        {/* face */}
        <ellipse cx="80" cy="72" rx="31" ry="28" fill="var(--mascot-face)" stroke="var(--mascot-line)" strokeWidth="3" />
        {/* a little forelock falling over the brow */}
        <path d="M68 46 C 72 54, 80 56, 84 50 C 86 56, 94 56, 96 48 C 90 42, 74 40, 68 46 Z" fill="var(--mascot-mane)" stroke="var(--mascot-line)" strokeWidth="2.2" />
        <ellipse cx="80" cy="85" rx="15" ry="10.5" fill="var(--mascot-muzzle)" />
        <ellipse cx="59" cy="82" rx="5.5" ry="4" fill="var(--mascot-blush)" opacity="0.75" />
        <ellipse cx="101" cy="82" rx="5.5" ry="4" fill="var(--mascot-blush)" opacity="0.75" />

        {/* brows */}
        {mood === "oops" && (
          <g stroke="var(--mascot-line)" strokeWidth="2.6" fill="none">
            <path d="M62 60 L 72 63" />
            <path d="M98 60 L 88 63" />
          </g>
        )}
        {mood === "think" && (
          <g stroke="var(--mascot-line)" strokeWidth="2.4" fill="none">
            <path d="M62 60 Q 67 57 72 60" />
            <path d="M88 57 Q 93 53 98 56" />
          </g>
        )}
        {(mood === "wow" || mood === "happy" || mood === "wave" || mood === "walk") && (
          <g stroke="var(--mascot-line)" strokeWidth="2.2" fill="none" opacity="0.85">
            <path d={mood === "wow" ? "M62 57 Q 67 53 72 56" : "M63 60 Q 67 58 71 60"} />
            <path d={mood === "wow" ? "M88 56 Q 93 53 98 57" : "M89 60 Q 93 58 97 60"} />
          </g>
        )}

        {/* eyes */}
        {mood === "cheer" ? (
          <g stroke="var(--mascot-line)" strokeWidth="3.4" fill="none">
            <path d="M62 72 Q 67 65 72 72" />
            <path d="M88 72 Q 93 65 98 72" />
          </g>
        ) : (
          <g className="m-eyes">
            <ellipse cx={67 + look.x} cy={71 + look.y} rx={eyeRx} ry={eyeRy} fill="var(--mascot-ink)" />
            <ellipse cx={93 + look.x} cy={71 + look.y} rx={eyeRx} ry={eyeRy} fill="var(--mascot-ink)" />
            <circle cx={68.8 + look.x} cy={68.5 + look.y} r="1.9" fill="#fff" />
            <circle cx={94.8 + look.x} cy={68.5 + look.y} r="1.9" fill="#fff" />
            <circle cx={65.6 + look.x} cy={73.5 + look.y} r="0.9" fill="#fff" />
            <circle cx={91.6 + look.x} cy={73.5 + look.y} r="0.9" fill="#fff" />
          </g>
        )}

        {/* nose */}
        <path d="M74.5 80 Q 80 76.5 85.5 80 Q 82.5 85.5 80 85.5 Q 77.5 85.5 74.5 80 Z" fill="var(--mascot-nose)" />

        {/* mouth */}
        {mood === "wow" && <ellipse cx="80" cy="92" rx="4" ry="5" fill="var(--mascot-ink)" />}
        {mood === "oops" && (
          <path d="M71 92 Q 75.5 88 80 92 Q 84.5 96 89 92" fill="none" stroke="var(--mascot-line)" strokeWidth="2.4" />
        )}
        {mood === "think" && <path d="M75 92 Q 80 90 85 91" fill="none" stroke="var(--mascot-line)" strokeWidth="2.4" />}
        {(mood === "happy" || mood === "wave" || mood === "walk") && (
          <path d="M72 88 Q 76 93 80 88.5 Q 84 93 88 88" fill="none" stroke="var(--mascot-line)" strokeWidth="2.4" />
        )}
        {mood === "cheer" && (
          <g>
            <path d="M70 88 Q 80 103 90 88 Z" fill="var(--mascot-ink)" />
            <path d="M75 95 Q 80 99 85 95 Q 80 92 75 95 Z" fill="var(--mascot-blush)" />
          </g>
        )}

        {/* bandana: a road-trip neckerchief whose knot flutters in the wind */}
        <g className="m-scarf-tail">
          <path d="M62 106 L 42 98 L 48 106 L 40 112 Z" fill="var(--mascot-scarf)" stroke="var(--mascot-line)" strokeWidth="2.2" />
        </g>
        <path
          d="M58 102 Q 80 114 102 102 L 101 109 Q 92 114 88 115 L 80 128 L 72 115 Q 66 113 59 109 Z"
          fill="var(--mascot-scarf)"
          stroke="var(--mascot-line)"
          strokeWidth="2.4"
        />
        <g fill="var(--mascot-muzzle)">
          <circle cx="76" cy="117" r="1.4" />
          <circle cx="84" cy="117" r="1.4" />
          <circle cx="80" cy="122" r="1.4" />
          <circle cx="66" cy="108" r="1.2" />
          <circle cx="94" cy="108" r="1.2" />
        </g>

        {/* arms (drawn last so paws sit in front) */}
        <Arm from={SHOULDER_L} to={paws.l} className="m-arm-l" />
        <Arm from={SHOULDER_R} to={paws.r} className={mood === "wave" ? "m-paw" : "m-arm-r"} />
      </g>

      {/* extras */}
      {mood === "oops" && <path d="M112 54 Q 117 63 112 67 Q 107 63 112 54 Z" fill="var(--mascot-drop)" stroke="var(--mascot-line)" strokeWidth="1.6" />}
      {mood === "think" && (
        <g fill="var(--mascot-mane-2)" stroke="var(--mascot-line)" strokeWidth="1.6">
          <circle cx="140" cy="30" r="3.5" />
          <circle cx="148" cy="17" r="5" />
          <circle cx="156" cy="2" r="6.5" />
        </g>
      )}
      {(mood === "wow" || mood === "cheer") && (
        <g className="m-sparks" fill="var(--mascot-spark)" stroke="var(--mascot-line)" strokeWidth="1.4" strokeLinejoin="round">
          <path d="M18 40 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" />
          <path d="M142 66 l3 6.5 6.5 3 -6.5 3 -3 6.5 -3 -6.5 -6.5 -3 6.5 -3z" />
          <path d="M26 128 l2.4 5 5 2.4 -5 2.4 -2.4 5 -2.4 -5 -5 -2.4 5 -2.4z" />
        </g>
      )}
    </svg>
  );
}

/** Rou as a wayfinding annotation (not a chatbot): a small marker, a label and a short note. */
export function MascotSays({
  mood = "happy",
  children,
  size = 52,
  tone = "neutral",
  label = "ROU",
  caps = false,
}: {
  mood?: MascotMood;
  children: React.ReactNode;
  size?: number;
  tone?: "neutral" | "warn" | "err" | "ok";
  label?: string;
  caps?: boolean;
}) {
  return (
    <div className={`rou ${tone === "warn" || tone === "err" ? "warn" : ""}`}>
      <Mascot mood={mood} size={size} />
      <div className="rou-body">
        <div className="rou-label">{label}</div>
        <div className={`rou-text ${caps ? "caps" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
