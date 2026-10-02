// The painted road: a sunset landscape with a road running to the horizon.
// Pure SVG in flat, poster-like layers. "road" is the full picture, cropped from the top
// so the road always survives; "band" is a thin strip of hills for the page header.

const DASHES: [number, number, number][] = [
  // [top y, bottom y, half width at bottom]
  [632, 642, 1.6],
  [664, 680, 2.6],
  [712, 738, 4.2],
  [782, 824, 6.6],
  [874, 900, 9],
];

/** A thin strip of the same hills along the bottom of the nav band; stretches to any width. */
function Band({ className }: { className: string }) {
  return (
    <svg className={`scene band ${className}`} viewBox="0 0 1600 120" preserveAspectRatio="none" aria-hidden>
      <circle cx="1250" cy="94" r="30" fill="#FFE7A8" opacity="0.9" />
      <path d="M0 90 L120 62 L230 80 L380 50 L520 84 L660 66 L820 88 L980 54 L1130 80 L1290 60 L1450 82 L1600 64 V120 H0 Z" fill="#5F8189" />
      <path d="M0 104 C200 86 400 92 600 100 C800 108 1000 90 1200 96 C1400 102 1500 94 1600 98 V120 H0 Z" fill="#E0893A" />
      <path d="M1080 120 C1250 100 1420 86 1600 78 V120 Z" fill="#C4372B" />
      <path d="M0 113 C400 106 1200 106 1600 113 V120 H0 Z" fill="#EBA743" />
    </svg>
  );
}

export default function Scene({ focus = "road", className = "" }: { focus?: "road" | "band"; className?: string }) {
  if (focus === "band") return <Band className={className} />;
  return (
    <svg className={`scene ${className}`} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#173F3B" />
          <stop offset="0.38" stopColor="#2A6559" />
          <stop offset="0.56" stopColor="#6FA184" />
          <stop offset="0.66" stopColor="#E9C46F" />
          <stop offset="0.72" stopColor="#F29A3A" />
        </linearGradient>
        <radialGradient id="sc-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE6A6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFE6A6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#sc-sky)" />
      <circle cx="800" cy="585" r="230" fill="url(#sc-glow)" />
      <circle cx="800" cy="590" r="62" fill="#FFE7A8" />

      {/* clouds */}
      <g fill="#F7C465">
        <path d="M-40 470 c60 -34 150 -30 200 -6 c40 -22 110 -18 150 8 c50 -6 90 6 110 22 H-40 Z" />
        <path d="M1080 430 c50 -30 130 -28 170 -4 c34 -18 92 -14 124 8 c46 -4 80 8 96 22 H1080 Z" />
        <path d="M520 500 c30 -18 80 -18 104 -2 c22 -10 60 -8 80 6 H520 Z" />
      </g>
      <g fill="#FDE3A2">
        <path d="M10 452 c50 -22 110 -18 146 0 c-40 2 -100 8 -146 0 Z" />
        <path d="M1120 414 c40 -18 96 -16 126 0 c-36 2 -86 6 -126 0 Z" />
      </g>

      {/* far mountains */}
      <path d="M0 560 L170 478 L290 522 L460 436 L630 526 L750 488 L890 548 L1060 428 L1230 506 L1380 458 L1600 546 V660 H0 Z" fill="#5F8189" />
      <path d="M0 600 L220 546 L380 584 L560 528 L720 592 L900 566 L1100 526 L1300 578 L1600 548 V670 H0 Z" fill="#86A09D" />

      {/* mid hills */}
      <path d="M0 646 C200 596 360 606 520 634 C680 662 760 616 900 620 C1050 624 1200 586 1600 624 V740 H0 Z" fill="#E0893A" />
      <path d="M0 694 C140 646 300 654 470 706 V790 H0 Z" fill="#C8642A" />
      <path d="M1040 712 C1190 620 1330 566 1600 524 V780 H1040 Z" fill="#C4372B" />
      <path d="M1140 660 C1270 598 1400 566 1600 544 V584 C1420 604 1300 634 1180 690 Z" fill="#E4583B" />

      {/* fields */}
      <path d="M0 744 C300 704 520 694 800 702 C1080 694 1300 704 1600 736 V900 H0 Z" fill="#EBA743" />
      <path d="M0 806 C150 776 320 786 520 836 L470 900 H0 Z" fill="#D57E2C" />
      <path d="M1600 796 C1450 776 1280 796 1080 846 L1130 900 H1600 Z" fill="#D57E2C" />
      <g fill="#8C3A22">
        <ellipse cx="120" cy="820" rx="46" ry="20" />
        <ellipse cx="300" cy="844" rx="30" ry="14" />
        <ellipse cx="1450" cy="828" rx="52" ry="22" />
        <ellipse cx="1260" cy="856" rx="28" ry="12" />
      </g>

      {/* the road */}
      <path d="M788 612 L812 612 L1020 900 L580 900 Z" fill="#34312D" />
      <path d="M788 612 L580 900 M812 612 L1020 900" stroke="#6E665A" strokeWidth="4" />
      <g fill="#F5CF73">
        {DASHES.map(([t, b, w]) => {
          const wt = w * ((t - 612) / (b - 612));
          return <path key={t} d={`M${800 - wt} ${t} L${800 + wt} ${t} L${800 + w} ${b} L${800 - w} ${b} Z`} />;
        })}
      </g>
    </svg>
  );
}
