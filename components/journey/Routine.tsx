"use client";

import { useState } from "react";
import { getStyle } from "@/lib/catalog";
import { TEXTURE_GROUP_LABELS } from "@/lib/texture";
import { currentBand, dayKey, streak, toggleTick, WASH_DAY, weekKey, type Journey } from "@/lib/journey";
import { buildRoutine, CADENCE_LABELS, DEFAULT_ANSWERS, type Cadence, type Routine as RoutineT, type RoutineAnswers } from "@/lib/routine";

// The routine: six taps of answers → a daily / wash-day / weekly / monthly plan built by plain rules,
// a checklist for today, and a streak. Every step says why it's there.

export function routineFor(j: Journey): RoutineT | null {
  if (!j.answers) return null;
  const s = getStyle(j.targetId);
  if (!s) return null;
  return buildRoutine({ answers: j.answers, measuredTexture: j.texture?.group ?? null, band: currentBand(j), target: s, direction: j.direction, hair: j.hairCheck });
}

type Q<K extends keyof RoutineAnswers> = { key: K; label: string; options: [RoutineAnswers[K], string][] };

const QUESTIONS: Q<keyof RoutineAnswers>[] = [
  { key: "texture", label: "Your natural texture", options: [["straight", "Straight"], ["wavy", "Wavy"], ["curly", "Curly"], ["coily", "Coily"], ["unsure", "Not sure"]] },
  { key: "scalp", label: "Your scalp, a day after washing", options: [["oily", "Oily"], ["balanced", "Fine"], ["dry", "Dry or tight"], ["flaky", "Flaky or itchy"]] },
  { key: "heat", label: "Hair dryer, straightener or curler", options: [["never", "Never"], ["sometimes", "Sometimes"], ["daily", "Most days"]] },
  { key: "chemical", label: "Colour or chemical treatments", options: [["none", "None"], ["colour", "Colour"], ["bleach", "Bleach or highlights"], ["straightened", "Relaxer, keratin or perm"]] },
  { key: "minutes", label: "Time for your hair in the morning", options: [[2, "2 min"], [5, "5 min"], [15, "15 min+"]] },
  { key: "active", label: "Sweat or swim often?", options: [["no", "Not really"], ["gym", "Gym or sport"], ["swim", "Swimming"]] },
] as Q<keyof RoutineAnswers>[];

export function RoutineSetup({ journey, onSave, onCancel }: { journey: Journey; onSave: (a: RoutineAnswers) => void; onCancel?: () => void }) {
  const [a, setA] = useState<RoutineAnswers>(journey.answers ?? DEFAULT_ANSWERS);
  const measured = journey.texture;
  return (
    <section className="jr-panel">
      <div className="kicker"><span>Your routine</span><span>6 taps</span></div>
      <h2 className="display h3" style={{ margin: "6px 0 4px" }}>Build my routine</h2>
      <p className="small muted">Tap what fits. You can change it any time.</p>
      {QUESTIONS.map((q) => {
        if (q.key === "texture" && measured) {
          return (
            <div key={q.key} className="jr-q">
              <div className="jr-q-label">{q.label}</div>
              <div className="note ok" style={{ margin: 0 }}>Measured by YouCam: <b>{TEXTURE_GROUP_LABELS[measured.group]}</b> · {measured.term}</div>
            </div>
          );
        }
        return (
          <fieldset key={q.key} className="jr-q">
            <legend className="jr-q-label">{q.label}</legend>
            <div className="jr-choices">
              {q.options.map(([v, label]) => (
                <label key={String(v)}>
                  <input type="radio" name={q.key} checked={a[q.key] === v} onChange={() => setA({ ...a, [q.key]: v })} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      <div className="dock flat">
        <button className="cta block" onClick={() => onSave(a)}>{journey.answers ? "Update my routine" : "Build my routine"}</button>
        {onCancel && <button className="textbtn" style={{ width: "100%" }} onClick={onCancel}>Cancel</button>}
      </div>
    </section>
  );
}

const ORDER: Cadence[] = ["daily", "wash", "weekly", "monthly", "phase"];

export default function Routine({
  journey,
  routine,
  onTicks,
  onEdit,
}: {
  journey: Journey;
  routine: RoutineT;
  onTicks: (fn: (t: Journey["ticks"]) => Journey["ticks"]) => void;
  onEdit: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const today = dayKey();
  const week = weekKey();
  const todayTicks = journey.ticks[today] ?? [];
  const washDay = todayTicks.includes(WASH_DAY);
  const daily = routine.steps.filter((s) => s.track && s.when === "daily");
  const wash = routine.steps.filter((s) => s.track && s.when === "wash");
  const weekly = routine.steps.filter((s) => s.track && s.when === "weekly");
  const todayList = [...(washDay ? wash : []), ...daily];
  const doneToday = todayList.filter((s) => todayTicks.includes(s.id)).length;
  const days = streak(journey.ticks, daily.map((s) => s.id));
  const washesThisWeek = Object.entries(journey.ticks).filter(([k, v]) => k.length === 10 && weekKey(new Date(k + "T12:00")) === week && v.includes(WASH_DAY)).length;

  const tick = (key: string, id: string) => onTicks((t) => toggleTick(t, key, id));

  return (
    <section className="jr-section" id="routine">
      <div className="jr-sec-head">
        <h2 className="display h3">Today&apos;s routine</h2>
        <button className="textbtn" onClick={onEdit}>Edit answers</button>
      </div>

      <div className="jr-stats">
        <div><b>{days}</b><span>day streak</span></div>
        <div><b>{doneToday}/{todayList.length}</b><span>done today</span></div>
        <div><b>{washesThisWeek}/{routine.washesPerWeek}</b><span>washes this week</span></div>
      </div>

      <label className="jr-wash">
        <input type="checkbox" checked={washDay} onChange={() => tick(today, WASH_DAY)} />
        <span>Today is a wash day</span>
      </label>

      <ul className="jr-checks">
        {todayList.map((s) => (
          <li key={s.id}>
            <label className={todayTicks.includes(s.id) ? "on" : ""}>
              <input type="checkbox" checked={todayTicks.includes(s.id)} onChange={() => tick(today, s.id)} />
              <span>
                <b>{s.title}</b>
                <small>{s.detail}</small>
                {s.product && <em className="jr-product">{s.product}</em>}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {weekly.length > 0 && (
        <>
          <div className="jr-sub">This week</div>
          <ul className="jr-checks">
            {weekly.map((s) => (
              <li key={s.id}>
                <label className={(journey.ticks[week] ?? []).includes(s.id) ? "on" : ""}>
                  <input type="checkbox" checked={(journey.ticks[week] ?? []).includes(s.id)} onChange={() => tick(week, s.id)} />
                  <span>
                    <b>{s.title}</b>
                    <small>{s.detail}</small>
                    {s.product && <em className="jr-product">{s.product}</em>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}

      <button className="jr-toggle" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
        {showAll ? "Hide the full routine" : "See the full routine, and why"}
      </button>
      {showAll && (
        <div className="jr-full">
          <p className="small muted">
            Built from your answers{routine.textureSource === "measured" ? ", your YouCam texture scan" : ""}, your current length and{" "}
            {journey.targetName}. Product types, not brands: pick what you like.
          </p>
          {ORDER.map((c) => {
            const steps = routine.steps.filter((s) => s.when === c);
            if (!steps.length) return null;
            return (
              <div key={c} className="jr-cadence">
                <div className="jr-sub">{CADENCE_LABELS[c]}</div>
                {steps.map((s) => (
                  <details key={s.id} className="jr-step">
                    <summary>
                      <b>{s.title}</b>
                      {s.product && <em className="jr-product">{s.product}</em>}
                    </summary>
                    <p>{s.detail}</p>
                    <p className="jr-why"><span className="wp-rule">{s.why.rule}</span> {s.why.text}</p>
                  </details>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
