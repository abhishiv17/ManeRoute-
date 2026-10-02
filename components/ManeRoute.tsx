"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATALOG, getStyle, stylesIn, thumbFor } from "@/lib/catalog";
import { planRoute } from "@/lib/rules";
import { LENGTH_BANDS, type GrowOutLength, type HairBaseline, type HairTexture, type LengthBand, type Preferences } from "@/lib/types";
import {
  ApiError,
  pollExtend,
  pollFinish,
  pollHairCheck,
  pollLength,
  pollTexture,
  pollVto,
  startExtend,
  startFinish,
  startHairCheck,
  startLength,
  startTexture,
  startVto,
  uploadPhoto,
} from "@/lib/client/api";
import { withFinish, type Finish, type FinishKind } from "@/lib/addons";
import type { HairReading } from "@/lib/hairCheck";
import { preparePhoto, type PreparedPhoto } from "@/lib/client/image";
import { baselineText, type CardData } from "@/lib/client/card";
import { journeyFromCard, putJourney } from "@/lib/client/journeys";
import Start from "./flow/Start";
import Pick, { type LengthState } from "./flow/Pick";
import TryOn from "./flow/TryOn";
import Plan, { type TextureState } from "./flow/Plan";
import CardView from "./flow/CardView";
import { Lightbox, toFailure, type CheckState, type Preview, type Shelf } from "./flow/shared";
import type { FinishState } from "./flow/Finish";
import SiteNav from "./route/SiteNav";

// Flow: start (tips + consent + photo) → pick → try on (compare many) → plan → card.
// The length check runs in the background while the user browses.
// Every step is a browser-history entry, and the session survives a refresh (sessionStorage).

type Step = "start" | "pick" | "tryon" | "plan" | "card";
const STEPS: Step[] = ["start", "pick", "tryon", "plan", "card"];
const STEP_LABELS = ["You", "Pick", "Try on", "Route", "Document"];
const STORE = "maneroute.session.v2";

const DEFAULT_PREFS: Preferences = { growOut: "maybe", keepLength: false, chemical: "unsure", maintenance: "medium", nonNegotiables: "" };

type Looks = Record<string, Preview>;

type Saved = {
  step: Step;
  front: string;
  fileId?: string;
  baseline?: HairBaseline;
  lengthTask?: string;
  texture?: HairTexture;
  shelf: Shelf | null;
  band: LengthBand | "any";
  selected: string | null;
  tried: string[];
  activeId: string | null;
  planId: string | null;
  prefs: Preferences;
  looks: Record<string, { image?: string | null; taskId?: string }>;
  grow: Record<string, { image?: string | null; taskId?: string }>;
  finishes?: Record<string, { steps: Finish[]; image?: string | null }>;
  density?: HairReading;
  frizz?: HairReading;
};

const persistable = (p: Preview) =>
  p.state === "success" ? { image: p.image } : p.state === "running" || p.state === "timeout" ? { taskId: p.taskId } : {};

export default function ManeRoute() {
  const [step, setStepState] = useState<Step>("start");
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [length, setLength] = useState<LengthState>({ state: "running" });
  const [texture, setTexture] = useState<TextureState>({ state: "none" });
  const [shelf, setShelfState] = useState<Shelf | null>(null);
  const [band, setBand] = useState<LengthBand | "any">("any");
  const [selected, setSelected] = useState<string | null>(null);
  const [tried, setTried] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [looks, setLooks] = useState<Looks>({});
  const [grow, setGrow] = useState<Record<string, Preview>>({});
  const [finishes, setFinishes] = useState<Record<string, FinishState>>({});
  const [density, setDensity] = useState<CheckState>({ state: "none" });
  const [frizz, setFrizz] = useState<CheckState>({ state: "none" });
  const [simulated, setSimulated] = useState(false);
  const [restored, setRestored] = useState(false);

  const abortRef = useRef(new AbortController());
  const uploadRef = useRef<Promise<string> | null>(null);
  const fromPop = useRef(false);

  // ---------- navigation with real browser history ----------
  const setStep = useCallback((s: Step) => {
    setStepState(s);
    if (!fromPop.current) window.history.pushState({ maneroute: s }, "", `#${s}`);
    fromPop.current = false;
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s = (e.state?.maneroute as Step) || "start";
      fromPop.current = true;
      setStepState(s);
      fromPop.current = false;
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Never show a step whose data is missing (e.g. after back/forward).
  const safeStep: Step =
    !photo ? "start" : step === "tryon" && !activeId ? "pick" : (step === "plan" || step === "card") && !planId ? "pick" : step;

  // ---------- background length check ----------
  const ensureUpload = useCallback((p: PreparedPhoto) => {
    if (!uploadRef.current) {
      uploadRef.current = uploadPhoto(p.blob).then((r) => {
        if (r.simulated) setSimulated(true);
        setFileId(r.fileId);
        return r.fileId;
      });
      uploadRef.current.catch(() => (uploadRef.current = null));
    }
    return uploadRef.current;
  }, []);

  const pollLengthTask = useCallback(async (taskId: string) => {
    setLength({ state: "running" });
    const out = await pollLength(taskId, abortRef.current.signal);
    if (out.kind === "aborted") return;
    if (out.kind === "timeout") return setLength({ state: "timeout", taskId });
    if (out.kind === "error") return setLength({ state: "error", failure: out.failure });
    if (out.simulated) setSimulated(true);
    setLength({ state: "done", baseline: out.result });
  }, []);

  // YouCam Hair Density (front photo) and Frizziness (three scan photos) run quietly in the
  // background; a failure (for example a slightly turned head) just means no reading.
  const runCheck = useCallback(async (kind: "density" | "frizz", ids: string[], set: (c: CheckState) => void) => {
    set({ state: "running" });
    try {
      const { taskId } = await startHairCheck(kind, ids);
      const out = await pollHairCheck(kind, taskId, abortRef.current.signal);
      if (out.kind === "aborted") return;
      if (out.kind === "success") {
        if (out.simulated) setSimulated(true);
        return set({ state: "done", reading: out.result });
      }
      set({ state: "error", message: out.kind === "error" ? out.failure.message : "It took too long." });
    } catch (e) {
      set({ state: "error", message: toFailure(e).message });
    }
  }, []);

  const runLength = useCallback(
    async (p: PreparedPhoto) => {
      setLength({ state: "running" });
      try {
        const id = await ensureUpload(p);
        const { taskId } = await startLength(id);
        lengthTaskRef.current = taskId;
        await pollLengthTask(taskId);
      } catch (e) {
        setLength({ state: "error", failure: toFailure(e) });
      }
    },
    [ensureUpload, pollLengthTask, runCheck],
  );
  const lengthTaskRef = useRef<string | null>(null);

  const onPhoto = (p: PreparedPhoto) => {
    abortRef.current.abort();
    abortRef.current = new AbortController();
    uploadRef.current = null;
    lengthTaskRef.current = null;
    setPhoto(p);
    setFileId(null);
    setLooks({});
    setGrow({});
    setTried([]);
    setActiveId(null);
    setPlanId(null);
    setTexture({ state: "none" });
    setFinishes({});
    setDensity({ state: "none" });
    setFrizz({ state: "none" });
    runLength(p);
    setStep("pick");
  };

  const retake = () => {
    setPhoto(null);
    setStep("start");
  };

  // ---------- try-ons ----------
  const runImage = useCallback(
    async (
      key: string,
      set: (fn: (m: Record<string, Preview>) => Record<string, Preview>) => void,
      start: (fileId: string) => Promise<{ taskId: string }>,
      poll: typeof pollVto,
      existingTask?: string,
    ) => {
      const put = (p: Preview) => set((m) => ({ ...m, [key]: p }));
      try {
        let taskId = existingTask;
        if (!taskId) {
          put({ state: "running" });
          const id = await ensureUpload(photo!);
          taskId = (await start(id)).taskId;
        }
        put({ state: "running", taskId });
        const out = await poll(taskId, abortRef.current.signal);
        if (out.kind === "aborted") return;
        if (out.kind === "timeout") return put({ state: "timeout", taskId });
        if (out.kind === "error") return put({ state: "error", failure: out.failure });
        if (out.result.simulated) setSimulated(true);
        put({ state: "success", image: out.result.image, simulated: out.result.simulated });
      } catch (e) {
        put({ state: "error", failure: toFailure(e) });
      }
    },
    [ensureUpload, photo],
  );

  const tryLook = (id: string, task?: string) => runImage(id, setLooks, (f) => startVto(f, id), pollVto, task);
  const growLook = (len: GrowOutLength, task?: string) => runImage(len, setGrow, (f) => startExtend(f, len), pollExtend, task);

  const showLook = (id: string) => {
    if (!looks[id] || looks[id].state === "error") tryLook(id);
    if (!tried.includes(id)) setTried((t) => [...t, id]);
    setActiveId(id);
  };

  const onTryOn = () => {
    if (!selected) return;
    showLook(selected);
    setStep("tryon");
  };

  // Three untried cuts near the active look's length, to try straight from the lookbook.
  const suggestions = useMemo(() => {
    const a = activeId ? getStyle(activeId) : undefined;
    if (!a) return [];
    const ai = LENGTH_BANDS.indexOf(a.targetLengthBand);
    const near = (b: LengthBand) => Math.abs(LENGTH_BANDS.indexOf(b) - ai);
    return stylesIn(shelf ?? "all")
      .filter((s) => s.templateId && !tried.includes(s.id))
      .sort((x, y) => near(x.targetLengthBand) - near(y.targetLengthBand) || Number(x.home !== a.home) - Number(y.home !== a.home))
      .slice(0, 3)
      .map((s) => ({ style: s, thumb: thumbFor(s, shelf ?? "all") }));
  }, [activeId, tried, shelf]);

  const retryLook = (id: string) => {
    const p = looks[id];
    tryLook(id, p?.state === "timeout" ? p.taskId : undefined);
  };

  // ---------- finish the look: beard, fringe, colour on top of a try-on ----------
  const cutImage = (id: string): string | null => {
    const p = looks[id];
    return p?.state === "success" ? p.image ?? photo?.dataUrl ?? null : null;
  };
  const shownImage = (id: string): string | null => {
    const f = finishes[id];
    return f?.preview.state === "success" && f.preview.image ? f.preview.image : cutImage(id);
  };

  /** Applies `steps[start..]` one after another, each on the previous result. */
  const renderFinishes = async (styleId: string, steps: Finish[], from: string, start: number) => {
    setFinishes((m) => ({ ...m, [styleId]: { steps, preview: { state: "running" } } }));
    let image = from;
    try {
      for (const f of steps.slice(start)) {
        const raw = await (await fetch(image)).blob();
        const prepared = await preparePhoto(raw.type.startsWith("image/") ? raw : new Blob([raw], { type: "image/jpeg" }));
        const up = await uploadPhoto(prepared.blob);
        if (up.simulated) setSimulated(true);
        const { taskId } = await startFinish(f.kind, up.fileId, f.id);
        const out = await pollFinish(f.kind, taskId, abortRef.current.signal);
        if (out.kind === "aborted") return;
        if (out.kind === "timeout") throw new ApiError({ code: "timeout", message: "YouCam took too long to render it.", retake: false });
        if (out.kind === "error") throw new ApiError(out.failure);
        if (out.result.simulated) setSimulated(true);
        image = out.result.image ?? image;
      }
      setFinishes((m) => ({ ...m, [styleId]: { steps, preview: { state: "success", image } } }));
    } catch (e) {
      const failure = e instanceof ApiError || !(e instanceof Error) || !e.message ? toFailure(e) : { code: "finish_failed", message: e.message, retake: false };
      setFinishes((m) => ({ ...m, [styleId]: { steps, preview: { state: "error", failure } } }));
    }
  };

  const applyFinish = (styleId: string, f: Finish) => {
    const cut = cutImage(styleId);
    if (!cut) return;
    const cur = finishes[styleId];
    const steps = withFinish(cur?.steps ?? [], f);
    const adding = !cur?.steps.some((x) => x.kind === f.kind);
    // A new kind goes on top of what's shown; replacing one re-renders the stack from the cut.
    if (adding && cur?.preview.state === "success" && cur.preview.image) return renderFinishes(styleId, steps, cur.preview.image, steps.length - 1);
    if (adding && !cur) return renderFinishes(styleId, steps, cut, 0);
    return renderFinishes(styleId, steps, cut, 0);
  };
  const resetFinish = (styleId: string) =>
    setFinishes((m) => {
      const n = { ...m };
      delete n[styleId];
      return n;
    });
  const removeFinish = (styleId: string, kind: FinishKind) => {
    const cur = finishes[styleId];
    const cut = cutImage(styleId);
    if (!cur || !cut) return;
    const steps = cur.steps.filter((x) => x.kind !== kind);
    if (!steps.length) return resetFinish(styleId);
    renderFinishes(styleId, steps, cut, 0);
  };
  const retryFinish = (styleId: string) => {
    const cur = finishes[styleId];
    const cut = cutImage(styleId);
    if (cur && cut) renderFinishes(styleId, cur.steps, cut, 0);
  };

  // ---------- plan ----------
  const baseline = length.state === "done" ? length.baseline : null;
  const planStyle = planId ? getStyle(planId) : undefined;
  const route = useMemo(
    () =>
      planStyle && baseline
        ? planRoute(baseline, planStyle, prefs, CATALOG, {
            collection: shelf ?? "all",
            texture: texture.state === "done" ? texture.texture : null,
            hair: {
              density: density.state === "done" ? density.reading : null,
              frizz: frizz.state === "done" ? frizz.reading : null,
            },
          })
        : null,
    [planStyle, baseline, prefs, shelf, texture, density, frizz],
  );
  const stageStyles = useMemo(
    () => (route?.stageStyleIds ?? []).map((id) => getStyle(id)).filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [route?.stageStyleIds],
  );
  const stageKey = stageStyles.map((s) => s.id).join(",");

  // Start the extra previews the plan needs, once each (they are cached across plans).
  useEffect(() => {
    if (!route || safeStep !== "plan" || !photo) return;
    for (const s of stageStyles) if (!looks[s.id]) tryLook(s.id);
    if (route.growOut && !grow[route.growOut]) growLook(route.growOut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageKey, route?.growOut, safeStep]);

  // The hair check: texture (front, right, left), frizz (front, left, right) and, with the
  // lowered-head photo, density. Frizz and density never block the texture result.
  const onScan = async (right: PreparedPhoto, left: PreparedPhoto, down?: PreparedPhoto) => {
    setTexture({ state: "running" });
    try {
      const front = await ensureUpload(photo!);
      const [r, l, d] = await Promise.all([uploadPhoto(right.blob), uploadPhoto(left.blob), down ? uploadPhoto(down.blob) : Promise.resolve(null)]);
      runCheck("frizz", [front, l.fileId, r.fileId], setFrizz);
      if (d) runCheck("density", [d.fileId], setDensity);
      const { taskId } = await startTexture([front, r.fileId, l.fileId]);
      const out = await pollTexture(taskId, abortRef.current.signal);
      if (out.kind === "success") return setTexture({ state: "done", texture: out.result });
      if (out.kind === "aborted") return;
      setTexture({
        state: "error",
        failure: out.kind === "error" ? out.failure : { code: "timeout", message: "The texture check took too long.", retake: false },
      });
    } catch (e) {
      setTexture({ state: "error", failure: toFailure(e) });
    }
  };

  // ---------- persistence (survives refresh; cleared on delete) ----------
  useEffect(() => {
    (async () => {
      try {
        const raw = sessionStorage.getItem(STORE);
        if (!raw) return;
        const s = JSON.parse(raw) as Saved;
        const blob = await (await fetch(s.front)).blob();
        const p = await preparePhoto(blob);
        setPhoto(p);
        if (s.fileId) {
          setFileId(s.fileId);
          uploadRef.current = Promise.resolve(s.fileId);
        }
        setShelfState(s.shelf);
        setBand(s.band);
        setSelected(s.selected);
        setTried(s.tried);
        setActiveId(s.activeId);
        setPlanId(s.planId);
        setPrefs(s.prefs);
        if (s.texture) setTexture({ state: "done", texture: s.texture });
        const restoreMap = (m: Saved["looks"]) =>
          Object.fromEntries(
            Object.entries(m).map(([k, v]) => [k, v.image !== undefined ? ({ state: "success", image: v.image } as Preview) : ({ state: "idle" } as Preview)]),
          );
        setLooks(restoreMap(s.looks));
        setGrow(restoreMap(s.grow));
        if (s.finishes) {
          setFinishes(
            Object.fromEntries(
              Object.entries(s.finishes)
                .filter(([, v]) => v.image)
                .map(([k, v]) => [k, { steps: v.steps, preview: { state: "success", image: v.image! } as Preview }]),
            ),
          );
        }
        if (s.density) setDensity({ state: "done", reading: s.density });
        if (s.frizz) setFrizz({ state: "done", reading: s.frizz });
        // Resume unfinished YouCam tasks instead of paying for them again.
        for (const [k, v] of Object.entries(s.looks)) if (v.taskId) runImage(k, setLooks, (f) => startVto(f, k), pollVto, v.taskId);
        for (const [k, v] of Object.entries(s.grow)) if (v.taskId) runImage(k, setGrow, (f) => startExtend(f, k as GrowOutLength), pollExtend, v.taskId);
        if (s.baseline) setLength({ state: "done", baseline: s.baseline });
        else if (s.lengthTask) {
          lengthTaskRef.current = s.lengthTask;
          pollLengthTask(s.lengthTask);
        } else runLength(p);
        window.history.replaceState({ maneroute: s.step }, "", `#${s.step}`);
        setStepState(s.step);
      } catch {
        sessionStorage.removeItem(STORE);
      } finally {
        setRestored(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored) return;
    if (!photo) return;
    const t = setTimeout(() => {
      const s: Saved = {
        step: safeStep,
        front: photo.dataUrl,
        fileId: fileId ?? undefined,
        baseline: baseline ?? undefined,
        lengthTask: length.state === "running" || length.state === "timeout" ? lengthTaskRef.current ?? undefined : undefined,
        texture: texture.state === "done" ? texture.texture : undefined,
        shelf,
        band,
        selected,
        tried,
        activeId,
        planId,
        prefs,
        looks: Object.fromEntries(Object.entries(looks).map(([k, v]) => [k, persistable(v)])),
        grow: Object.fromEntries(Object.entries(grow).map(([k, v]) => [k, persistable(v)])),
        finishes: Object.fromEntries(
          Object.entries(finishes)
            .filter(([, v]) => v.preview.state === "success")
            .map(([k, v]) => [k, { steps: v.steps, image: v.preview.state === "success" ? v.preview.image : null }]),
        ),
        density: density.state === "done" ? density.reading : undefined,
        frizz: frizz.state === "done" ? frizz.reading : undefined,
      };
      try {
        sessionStorage.setItem(STORE, JSON.stringify(s));
      } catch {
        // Storage full: keep only the essentials so a refresh still restores the photo and choices.
        try {
          sessionStorage.setItem(STORE, JSON.stringify({ ...s, looks: {}, grow: {}, finishes: {} }));
        } catch {}
      }
    }, 300);
    return () => clearTimeout(t);
  }, [restored, photo, safeStep, fileId, baseline, length, texture, shelf, band, selected, tried, activeId, planId, prefs, looks, grow, finishes, density, frizz]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("maneroute.shelf");
      if (s === "barbershop" || s === "salon" || s === "all") setShelfState((cur) => cur ?? s);
    } catch {}
  }, []);
  const setShelf = (s: Shelf) => {
    setShelfState(s);
    try {
      localStorage.setItem("maneroute.shelf", s);
    } catch {}
  };

  const deleteSession = () => {
    abortRef.current.abort();
    try {
      sessionStorage.removeItem(STORE);
    } catch {}
    window.location.assign("/");
  };

  // ---------- card ----------
  const img = (p?: Preview) => (p?.state === "success" ? p.image ?? photo?.dataUrl ?? null : null);
  const cardData = useMemo((): Omit<CardData, "questions" | "note"> | null => {
    if (!photo || !baseline || !planStyle || !route) return null;
    return {
      target: planStyle,
      stages: stageStyles.map((s) => ({ name: s.name, image: img(looks[s.id]) })),
      baseline,
      texture: texture.state === "done" ? texture.texture : null,
      prefs,
      route,
      sourceImage: photo.dataUrl,
      targetImage: shownImage(planStyle.id),
      targetCutImage: img(looks[planStyle.id]),
      finish: finishes[planStyle.id]?.preview.state === "success" ? finishes[planStyle.id].steps : [],
      hairCheck: {
        density: density.state === "done" ? density.reading : null,
        frizz: frizz.state === "done" ? frizz.reading : null,
      },
      growOutImage: route.growOut ? img(grow[route.growOut]) : null,
      simulated,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, baseline, planStyle, route, stageStyles, texture, prefs, looks, grow, finishes, density, frizz, simulated]);

  const stepIdx = STEPS.indexOf(safeStep);
  const tryList = tried.map((id) => ({ styleId: id, preview: looks[id] ?? ({ state: "idle" } as Preview) }));

  if (!restored) return <div className="flow" />;

  return (
    <div className={`flow ${safeStep === "tryon" || safeStep === "pick" ? "wide" : ""}`}>
      <SiteNav current="/consult" right={<span className="nav-step">Step {stepIdx + 1} of {STEPS.length}</span>} />
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={stepIdx + 1}
        aria-valuetext={STEP_LABELS[stepIdx]}
        aria-label="Consultation progress"
      >
        <span className="p-fill" style={{ width: `calc(${(stepIdx / (STEPS.length - 1)) * 100}% - ${(stepIdx / (STEPS.length - 1)) * 12}px)` }} />
        {STEPS.map((s, i) => (
          <div key={s} className={`p-step ${i < stepIdx ? "done" : i === stepIdx ? "now" : ""}`}>
            <span className="p-dot" />
            <span className="p-label">{STEP_LABELS[i]}</span>
          </div>
        ))}
      </div>
      {simulated && <div className="sim-banner">Simulated demo: results are not from YouCam</div>}

      {safeStep === "start" && <Start onDone={onPhoto} />}

      {safeStep === "pick" && photo && (
        <Pick
          photo={photo}
          length={length}
          shelf={shelf}
          setShelf={setShelf}
          band={band}
          setBand={setBand}
          selected={selected}
          setSelected={setSelected}
          tried={new Set(tried)}
          onTryOn={onTryOn}
          onRetake={retake}
          onKeepWaiting={() => length.state === "timeout" && pollLengthTask(length.taskId)}
          onRetryLength={() => photo && runLength(photo)}
          density={density}
        />
      )}

      {safeStep === "tryon" && photo && activeId && (
        <TryOn
          photo={photo}
          baseline={baseline}
          tries={tryList}
          activeId={activeId}
          setActive={setActiveId}
          suggestions={suggestions}
          shelf={shelf ?? "all"}
          finish={finishes[activeId]}
          noChemicals={prefs.chemical === "no"}
          onFinish={(f) => applyFinish(activeId, f)}
          onRemoveFinish={(k) => removeFinish(activeId, k)}
          onResetFinish={() => resetFinish(activeId)}
          onRetryFinish={() => retryFinish(activeId)}
          onTry={(id) => {
            showLook(id);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onRetry={retryLook}
          onRetake={retake}
          onTryAnother={() => setStep("pick")}
          onPlan={(id) => {
            setPlanId(id);
            setStep("plan");
          }}
        />
      )}

      {safeStep === "plan" && photo && planStyle && (
        <Plan
          photo={photo}
          style={planStyle}
          targetImage={shownImage(planStyle.id)}
          finish={finishes[planStyle.id]?.preview.state === "success" ? finishes[planStyle.id].steps : []}
          density={density}
          frizz={frizz}
          prefs={prefs}
          setPrefs={setPrefs}
          lengthReady={Boolean(baseline)}
          nowLabel={baseline ? baselineText(baseline).split(" (")[0] : ""}
          baseline={baseline}
          route={route}
          stages={stageStyles.map((s) => ({ style: s, preview: looks[s.id] ?? ({ state: "idle" } as Preview) }))}
          growPreview={route?.growOut ? grow[route.growOut] ?? { state: "idle" } : { state: "idle" }}
          texture={texture}
          onScan={onScan}
          onRetryPreview={(w) => {
            if (w !== "grow") retryLook(w);
            if (w === "grow" && route?.growOut) {
              const p = grow[route.growOut];
              growLook(route.growOut, p?.state === "timeout" ? p.taskId : undefined);
            }
          }}
          onCard={() => setStep("card")}
          onBack={() => setStep("tryon")}
        />
      )}

      <Lightbox />
      {safeStep === "card" && cardData && (
        <CardView
          data={cardData}
          onBack={() => setStep("plan")}
          onDelete={deleteSession}
          onStartJourney={async () => {
            const j = await putJourney(await journeyFromCard(cardData));
            window.location.assign(`/journey#${j.id}`);
          }}
        />
      )}
    </div>
  );
}
