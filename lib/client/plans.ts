// "My plans": consultation cards saved on this device only (IndexedDB), never on a server.
// Every call fails soft: in private windows or with storage blocked, saving is simply unavailable.

export type SavedPlan = {
  id: string;
  createdAt: number;
  targetName: string;
  routeKind: string;
  routeHeadline: string;
  baselineLabel: string;
  textureLabel?: string;
  summary: string;
  card: Blob;
  thumb: string; // small data URL for the list
};

const DB = "maneroute";
const STORE = "plans";

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

export async function savePlan(p: Omit<SavedPlan, "id" | "createdAt">): Promise<SavedPlan> {
  const plan: SavedPlan = { ...p, id: crypto.randomUUID(), createdAt: Date.now() };
  await tx("readwrite", (s) => s.put(plan));
  return plan;
}

export async function listPlans(): Promise<SavedPlan[]> {
  try {
    const all = await tx<SavedPlan[]>("readonly", (s) => s.getAll() as IDBRequest<SavedPlan[]>);
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function deletePlan(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export async function deleteAllPlans(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
}

/** Small JPEG thumbnail for the plans list. */
export async function makeThumb(src: string, w = 160): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = w;
  c.height = Math.round((img.height / img.width) * w);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}
