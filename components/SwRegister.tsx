"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      return;
    }
    // A worker left behind by `next start` on the same localhost port keeps serving cached
    // /_next/static chunks, so `next dev` edits never reach the page. Remove it in development.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      if (regs.length === 0) return;
      Promise.all([
        ...regs.map((r) => r.unregister()),
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("maneroute-")).map((k) => caches.delete(k)))),
      ]).then(() => window.location.reload());
    });
  }, []);
  return null;
}
