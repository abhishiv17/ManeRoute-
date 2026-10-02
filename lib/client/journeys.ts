// Journeys, stored on this device only (IndexedDB), never on a server.
// A separate database from "My plans", so neither can break the other's schema.
import { getStyle } from "@/lib/catalog";
import { directionOf, type Journey, type Milestone } from "@/lib/journey";
import type { GrowOutLength, LengthBand } from "@/lib/types";
import type { CardData } from "./card";
import { makeThumb } from "./plans";

const DB = "maneroute-journeys";
const STORE = "journeys";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexeddb"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    t.oncomplete = () => db.close();
  });
}

export async function listJourneys(): Promise<Journey[]> {
  try {
    const all = await tx<Journey[]>("readonly", (s) => s.getAll() as IDBRequest<Journey[]>);
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function putJourney(j: Journey): Promise<Journey> {
  const next = { ...j, updatedAt: Date.now() };
  await tx("readwrite", (s) => s.put(next));
  return next;
}

export async function deleteJourney(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

const GROW_BAND: Record<GrowOutLength, LengthBand> = { chest: "above_chest", long: "long" };

const thumb = async (src: string | null | undefined, w = 320) => {
  if (!src) return undefined;
  try {
    return await makeThumb(src, w);
  } catch {
    return undefined;
  }
};

/** Builds a journey from the finished consultation: its milestones carry the YouCam previews. */
export async function journeyFromCard(data: Omit<CardData, "questions" | "note">): Promise<Journey> {
  const now = Date.now();
  const startBand = data.baseline.lengthBand;
  const startPhoto = await thumb(data.sourceImage, 360);
  const milestones: Milestone[] = [{ id: "start", kind: "start", name: "Where you started", band: startBand, image: startPhoto }];
  for (const [i, id] of data.route.stageStyleIds.entries()) {
    const s = getStyle(id);
    if (!s) continue;
    milestones.push({ id: `stage-${i}`, kind: "stage", name: s.name, band: s.targetLengthBand, styleId: s.id, image: await thumb(data.stages[i]?.image) });
  }
  if (data.route.growOut) {
    milestones.push({ id: "grow", kind: "grow", name: "Your hair, grown", band: GROW_BAND[data.route.growOut], image: await thumb(data.growOutImage) });
  }
  milestones.push({ id: "target", kind: "target", name: data.target.name, band: data.target.targetLengthBand, styleId: data.target.id, image: await thumb(data.targetImage) });

  const direction = directionOf(startBand, data.target.targetLengthBand);
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "active",
    targetId: data.target.id,
    targetName: data.target.name,
    targetBand: data.target.targetLengthBand,
    routeKind: data.route.route,
    routeHeadline: data.route.headline,
    direction,
    milestones,
    checkins: [
      {
        id: crypto.randomUUID(),
        at: now,
        kind: "measure",
        photo: startPhoto,
        band: startBand,
        atLeast: data.baseline.atLeast,
        raw: data.baseline.rawProviderValue,
        simulated: data.simulated,
      },
    ],
    texture: data.texture ?? null,
    prefs: data.prefs,
    answers: null,
    // Growing is slow: monthly photos show change; shorter routes are about upkeep.
    checkEveryDays: direction === "grow" ? 28 : 21,
    ticks: {},
  };
}
