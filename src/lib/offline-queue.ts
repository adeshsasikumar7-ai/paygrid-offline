import { supabase } from "@/integrations/supabase/client";

export type PgEvent = {
  event_id: string;
  kind: "payment" | "telemetry" | "tamper" | "resolve_tamper";
  meter_id: string;
  occurred_at: string;
  [k: string]: unknown;
};

const DB = "paygrid";
const STORE = "queue";
const listeners = new Set<(n: number) => void>();

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "event_id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export const newId = () => crypto.randomUUID();

export async function queued(): Promise<PgEvent[]> {
  const all = await tx<PgEvent[]>("readonly", (s) => s.getAll());
  return all.sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
}

async function notify() {
  const n = (await queued()).length;
  listeners.forEach((l) => l(n));
}

export function onQueueChange(fn: (n: number) => void) {
  listeners.add(fn);
  void notify();
  return () => void listeners.delete(fn);
}

let flushing = false;
export async function flush(): Promise<{ inserted: number } | null> {
  if (flushing || !navigator.onLine) return null;
  flushing = true;
  try {
    const events = await queued();
    if (!events.length) return null;
    const { data, error } = await supabase.rpc("submit_events", { _batch_id: newId(), _events: events as never });
    if (error) throw error;
    for (const e of events) await tx("readwrite", (s) => s.delete(e.event_id));
    await notify();
    return { inserted: Number((data as { inserted?: number } | null)?.inserted ?? 0) };
  } finally {
    flushing = false;
  }
}

/** Stores the event on the device first, then tries to send it. */
export async function enqueue(ev: Omit<PgEvent, "event_id" | "occurred_at">) {
  const full = { ...ev, event_id: newId(), occurred_at: new Date().toISOString() } as PgEvent;
  await tx("readwrite", (s) => s.put(full));
  await notify();
  try {
    await flush();
  } catch {
    /* stays queued */
  }
  return full;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flush().catch(() => {}));
}
