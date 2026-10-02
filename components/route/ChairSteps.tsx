import type { ChairStep } from "@/lib/barber";

// What to say in the chair, in order: the next appointment first, the destination last.
export default function ChairSteps({ steps }: { steps: ChairStep[] }) {
  return (
    <ol className="chair">
      {steps.map((s, i) => (
        <li key={`${s.when}-${s.title}`} className="chair-step">
          <div className="chair-when"><span className="chair-num">{i + 1}</span>{s.when}</div>
          <div className="chair-title">{s.title}</div>
          <p className="chair-ask">“{s.ask}”</p>
          {s.details.length > 0 && (
            <ul className="chair-details">
              {s.details.map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
          {s.styling && <p className="chair-styling"><b>Day to day:</b> {s.styling}</p>}
        </li>
      ))}
    </ol>
  );
}
