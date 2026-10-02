"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Scene from "./Scene";

// Site navigation, written in white over the painted landscape.
// `overlay`: sits on top of the landing hero. Otherwise it brings its own short painted band.
const ITEMS = [
  { href: "/", label: "Home" },
  { href: "/consult", label: "Consult" },
  { href: "/journey", label: "My journey" },
  { href: "/plans", label: "My plans" },
];

export default function SiteNav({
  current,
  right,
  overlay = false,
}: {
  current: "/" | "/consult" | "/journey" | "/plans" | null;
  right?: React.ReactNode;
  overlay?: boolean;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open]);

  const bar = (
    <header className="nav">
      <Link href="/" className="nav-brand">
        ManeRoute
        <small>From the hair you have to the hair you want</small>
      </Link>
      <ul className="nav-index">
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={current === i.href ? "page" : undefined}>{i.label}</Link>
          </li>
        ))}
      </ul>
      {right ?? (
        <Link href="/consult" className="nav-cta">Start</Link>
      )}
      <button className="menu-btn" aria-expanded={open} aria-controls="route-menu" onClick={() => setOpen(true)}>
        Menu
      </button>
    </header>
  );

  return (
    <>
      {overlay ? (
        <div className="nav-overlay">{bar}</div>
      ) : (
        <div className="nav-band">
          <Scene focus="band" />
          {bar}
        </div>
      )}
      {open && (
        <div className="menu-sheet" id="route-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <Scene focus="road" />
          <div className="menu-inner">
            <div className="nav">
              <Link href="/" className="nav-brand" onClick={() => setOpen(false)}>ManeRoute</Link>
              <button className="menu-btn" onClick={() => setOpen(false)} autoFocus>Close</button>
            </div>
            <ol className="route-index">
              {ITEMS.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} onClick={() => setOpen(false)} aria-current={current === i.href ? "page" : undefined}>
                    {i.label}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
