"use client";

import { useEffect, useMemo, useState } from "react";
import { baselineText, cardSummaryText, CHEM, GROW, renderCardPng, type CardData } from "@/lib/client/card";
import { makeThumb, savePlan } from "@/lib/client/plans";
import Mascot from "@/components/Mascot";
import { ROUTE_HEADLINES } from "@/lib/rules";

type Base = Omit<CardData, "questions" | "note">;

const stamp = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

// CONSULTATION / 05: a real document for the chair. Edit on the left, the document on the right.
export default function CardView({
  data,
  onBack,
  onDelete,
  onStartJourney,
}: {
  data: Base;
  onBack: () => void;
  onDelete: () => void;
  onStartJourney: () => Promise<void>;
}) {
  const [starting, setStarting] = useState(false);
  const canJourney = data.route.route !== "retake_required";
  const startJourney = async () => {
    setStarting(true);
    try {
      await onStartJourney();
    } catch {
      setStarting(false);
      setNotice("Journeys need on-device storage, which isn't available here (private mode or storage blocked).");
    }
  };
  const [questions, setQuestions] = useState<{ text: string; on: boolean }[]>(() =>
    data.route.questions.map((text, i) => ({ text, on: i < 3 || i === data.route.questions.length - 1 })),
  );
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [png, setPng] = useState<Blob | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const full: CardData = useMemo(
    () => ({ ...data, questions: questions.filter((q) => q.on).map((q) => q.text), note }),
    [data, questions, note],
  );

  // The shared/downloaded image is re-rendered shortly after edits stop.
  useEffect(() => {
    let alive = true;
    setPng(null);
    const t = setTimeout(() => {
      renderCardPng(full).then((b) => alive && setPng(b)).catch(() => alive && setNotice("The image couldn't be drawn. Copy as text still works."));
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [full]);

  const fileName = `maneroute-${data.target.id}.png`;
  const download = () => {
    if (!png) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(png);
    a.download = fileName;
    a.click();
    setNotice("Saved to your downloads.");
  };
  const share = async () => {
    if (!png) return;
    const file = new File([png], fileName, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My ManeRoute consultation", text: `Goal: ${data.target.name}` });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    download();
  };
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(cardSummaryText(full));
      setNotice("Copied. Paste it into a message to your barber.");
    } catch {
      setNotice("Copying isn't available in this browser.");
    }
  };
  const save = async () => {
    if (!png) return;
    try {
      await savePlan({
        targetName: data.target.name,
        routeKind: data.route.route,
        routeHeadline: ROUTE_HEADLINES[data.route.route],
        baselineLabel: baselineText(data.baseline),
        textureLabel: data.texture?.term,
        summary: cardSummaryText(full),
        card: png,
        thumb: await makeThumb(data.targetImage || data.sourceImage),
      });
      setSaved(true);
      setNotice("Saved to My plans on this device.");
    } catch {
      setNotice("Saving isn't available here (private mode or storage blocked).");
    }
  };
  const addQuestion = () => {
    const t = custom.trim();
    if (!t) return;
    setQuestions([...questions, { text: t.endsWith("?") ? t : `${t}?`, on: true }]);
    setCustom("");
  };

  const photos = [
    { label: "Current", src: data.sourceImage },
    ...data.stages.filter((s) => s.image).map((s, i, arr) => ({ label: arr.length > 1 ? `Stage ${i + 1}` : "Along the way", src: s.image! })),
    ...(data.growOutImage ? [{ label: "Grown", src: data.growOutImage }] : []),
    { label: "Target", src: data.targetImage ?? data.sourceImage },
  ];
  const keep = [GROW[data.prefs.growOut], CHEM[data.prefs.chemical], `Styling: ${data.prefs.maintenance === "low" ? "minimal" : data.prefs.maintenance === "high" ? "happy to put time in" : "a few minutes"}`];
  if (data.prefs.keepLength) keep.unshift("Keep as much length as possible");
  if (data.prefs.nonNegotiables.trim()) keep.push(`Please don't: ${data.prefs.nonNegotiables.trim()}`);

  return (
    <main className="flow-main">
      <div className="kicker">
        <span>Consultation / 05</span>
        <button className="textbtn" style={{ minHeight: 0, padding: 0 }} onClick={onBack}>← Route</button>
      </div>
      <h1 className="display h3 screen-title">The document.</h1>

      <div className="doc-layout">
        <article className="doc" aria-label="Consultation document">
          <div className="doc-head"><span>ManeRoute / Consultation</span><span>{stamp()}</span></div>
          <div className="doc-photos">
            {photos.map((p) => (
              <figure key={p.label}><img src={p.src} alt={p.label} /><figcaption>{p.label}</figcaption></figure>
            ))}
          </div>
          <div className="doc-grid">
            <div><div className="doc-label">Current</div><div className="doc-val">{baselineText(data.baseline).split(" (")[0]}</div>{data.texture && <div className="mono">{data.texture.term}</div>}</div>
            <div><div className="doc-label">Target</div><div className="doc-val">{data.target.name}</div></div>
            <div style={{ gridColumn: "1 / -1" }}><div className="doc-label">Route</div><div className="doc-val accent">{ROUTE_HEADLINES[data.route.route]}</div></div>
          </div>
          <div className="doc-sec">
            <div className="doc-label">What matters</div>
            <ul className="doc-list">{keep.map((k) => <li key={k}>{k}</li>)}{note.trim() && <li>{note.trim()}</li>}</ul>
          </div>
          {data.route.cautions.length > 0 && (
            <div className="doc-sec">
              <div className="doc-label">Let&apos;s talk about</div>
              <ul className="doc-list">{data.route.cautions.slice(0, 3).map((c) => <li key={c.rule}>{c.text}</li>)}</ul>
            </div>
          )}
          <div className="doc-sec">
            <div className="doc-label">Ask your stylist</div>
            <ul className="doc-list">{full.questions.map((q) => <li key={q}>{q}</li>)}</ul>
          </div>
          <div className="doc-foot"><span>Previews: YouCam AI · references, not guarantees</span><span>ROU ●</span></div>
        </article>

        <div>
          <div className="kicker" style={{ borderBottom: "2px dashed var(--line)", paddingBottom: 6, marginBottom: 12 }}>
            <span>Edit the document</span><span>{full.questions.length} questions</span>
          </div>
          <ul className="q-edit">
            {questions.map((q, i) => (
              <li key={i}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={q.on}
                    onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))}
                  />
                  <span>{q.text}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="add-q">
            <input
              type="text"
              value={custom}
              maxLength={140}
              placeholder="Add your own question"
              aria-label="Add your own question"
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addQuestion()}
            />
            <button className="cta plain" onClick={addQuestion} disabled={!custom.trim()}>Add</button>
          </div>
          <label htmlFor="stylist-note" className="mono" style={{ display: "block", margin: "16px 0 6px" }}>Note to your stylist</label>
          <textarea
            id="stylist-note"
            maxLength={280}
            value={note}
            placeholder="e.g. I have a wedding in six weeks."
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {notice && <p className="note ok" role="status">{notice}</p>}

      {canJourney && (
        <section className="jr-cta-card" style={{ marginTop: 24 }}>
          <Mascot mood="walk" size={84} />
          <div>
            <div className="chapter-num" style={{ margin: 0 }}>Next: walk the route</div>
            <h2 className="display h3" style={{ margin: "4px 0 8px" }}>Start this journey</h2>
            <p className="small">
              Turn this plan into a road you track: check-in photos re-measured by YouCam, a haircare routine for your hair
              with a daily checklist, and trim reminders. Saved on this device only.
            </p>
            <button className="cta" onClick={startJourney} disabled={starting}>{starting ? "Setting off…" : "Start my journey"}</button>
          </div>
        </section>
      )}

      <div className="dock">
        <button className="cta block" onClick={share} disabled={!png}>{png ? "Share" : "Preparing…"}</button>
        <div className="btn-row" style={{ marginTop: 6 }}>
          <button className="textbtn" onClick={download} disabled={!png}>Download</button>
          <button className="textbtn" onClick={copyText}>Copy</button>
          <button className="textbtn" onClick={save} disabled={!png || saved}>{saved ? "Saved ✓" : "Save to My plans"}</button>
        </div>
      </div>

      <section style={{ padding: "22px 0 0" }}>
        <div className="kicker"><span>End of session</span></div>
        <p className="small muted" style={{ margin: "6px 0" }}>
          Clears your photos, previews and this document from the page. Saved plans stay on this device until you delete
          them. ManeRoute&apos;s server stores none of this.
        </p>
        <button className="textbtn danger" onClick={onDelete}>Delete session data</button>
      </section>
    </main>
  );
}
