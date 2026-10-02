"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import SiteNav from "@/components/route/SiteNav";
import { deleteAllPlans, deletePlan, listPlans, type SavedPlan } from "@/lib/client/plans";

// MY PLANS: a chronological archive of the user's hair journey, stored on this device only.
export default function Plans() {
  const [plans, setPlans] = useState<SavedPlan[] | null>(null);
  const [open, setOpen] = useState<{ plan: SavedPlan; url: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const refresh = () => listPlans().then(setPlans);
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => () => {
    if (open) URL.revokeObjectURL(open.url);
  }, [open]);

  const show = (p: SavedPlan) => setOpen({ plan: p, url: URL.createObjectURL(p.card) });
  const remove = async (id: string) => {
    await deletePlan(id).catch(() => {});
    setOpen(null);
    refresh();
  };
  const removeAll = async () => {
    if (!confirm("Delete every saved plan on this device? This can't be undone.")) return;
    await deleteAllPlans().catch(() => {});
    setOpen(null);
    refresh();
  };
  const share = async (p: SavedPlan) => {
    const file = new File([p.card], `maneroute-${p.targetName.toLowerCase().replace(/\W+/g, "-")}.png`, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) return void (await navigator.share({ files: [file], title: `ManeRoute: ${p.targetName}` }));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setNote("Saved to your downloads.");
  };

  // Group by year, then month.
  const groups: { year: string; months: { month: string; items: SavedPlan[] }[] }[] = [];
  for (const p of plans ?? []) {
    const d = new Date(p.createdAt);
    const year = String(d.getFullYear());
    const month = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
    let g = groups.find((x) => x.year === year);
    if (!g) groups.push((g = { year, months: [] }));
    let m = g.months.find((x) => x.month === month);
    if (!m) g.months.push((m = { month, items: [] }));
    m.items.push(p);
  }
  let n = 0;

  return (
    <div className="flow">
      <SiteNav current="/plans" />
      <main className="flow-main" style={{ paddingTop: 18 }}>
        <div className="kicker"><span>Archive · this device only</span><span>{plans ? String(plans.length).padStart(2, "0") : "··"} routes</span></div>
        <h1 className="display h2 screen-title">My plans</h1>

        {plans && plans.length === 0 && (
          <section style={{ paddingTop: 12 }}>
            <div className="display h3">No routes yet.</div>
            <p className="lead" style={{ margin: "10px 0 20px" }}>Your next hairstyle starts here.</p>
            <div className="rou">
              <Mascot mood="wave" size={56} />
              <div className="rou-body">
                <div className="rou-label">ROU</div>
                <div className="rou-text">Finish a consultation and choose “Save to My plans” on the document.</div>
              </div>
            </div>
            <Link href="/consult" className="cta block">Start consultation</Link>
          </section>
        )}

        {open ? (
          <section>
            <button className="textbtn" onClick={() => setOpen(null)}>← All routes</button>
            <div className="kicker" style={{ marginTop: 8 }}><span>{open.plan.routeHeadline}</span><span>{new Date(open.plan.createdAt).toLocaleDateString("en-GB")}</span></div>
            <h2 className="display h3" style={{ margin: "6px 0 14px" }}>{open.plan.targetName}</h2>
            <img src={open.url} alt={`Consultation document for ${open.plan.targetName}`} style={{ borderRadius: 18, boxShadow: "0 12px 34px rgba(60, 40, 10, 0.12)" }} />
            {note && <p className="note ok" role="status">{note}</p>}
            <div className="dock">
              <button className="cta block" onClick={() => share(open.plan)}>Share</button>
              <div className="btn-row" style={{ marginTop: 6 }}>
                <button className="textbtn" onClick={() => navigator.clipboard?.writeText(open.plan.summary).then(() => setNote("Copied."))}>Copy</button>
                <button className="textbtn danger" onClick={() => remove(open.plan.id)}>Delete</button>
              </div>
            </div>
          </section>
        ) : (
          groups.map((g) => (
            <section key={g.year}>
              <div className="archive-year">{g.year}</div>
              {g.months.map((m) => (
                <div key={m.month}>
                  <div className="archive-month">{m.month}</div>
                  {m.items.map((p) => {
                    n += 1;
                    return (
                      <button key={p.id} className="archive-row" onClick={() => show(p)}>
                        <span className="mono muted">{String(n).padStart(2, "0")}</span>
                        <span>
                          <span className="display" style={{ fontSize: 26, display: "block" }}>{p.targetName}</span>
                          <span className="mono accent">{p.routeHeadline}</span>
                          <span className="mini-route"><span>{p.baselineLabel.split(" (")[0]}</span><i /><span>Target</span></span>
                        </span>
                        <img src={p.thumb} alt="" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </section>
          ))
        )}

        {plans && plans.length > 0 && !open && (
          <button className="textbtn danger" style={{ marginTop: 20 }} onClick={removeAll}>Delete all saved plans</button>
        )}
      </main>
    </div>
  );
}
