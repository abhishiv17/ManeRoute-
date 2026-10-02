"use client";

import { useEffect, useState } from "react";

// The chapter rail on the right edge of the landing page: one tick per chapter,
// the one you're reading is highlighted. Desktop only.
export default function ChapterRail({ chapters }: { chapters: { id: string; label: string }[] }) {
  const [active, setActive] = useState(chapters[0]?.id);
  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id)).filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [chapters]);

  return (
    <nav className="rail" aria-label="Chapters">
      {chapters.map((c) => (
        <a key={c.id} href={`#${c.id}`} aria-current={active === c.id ? "true" : undefined}>
          <span className="rail-label">{c.label}</span>
          <i />
        </a>
      ))}
    </nav>
  );
}
