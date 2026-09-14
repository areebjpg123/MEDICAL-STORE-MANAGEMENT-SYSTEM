/**
 * Background Sync Utility
 * Queues operations when offline and flushes them when back online.
 */

import { getDB } from "./db";
import { createClient } from "@/utils/supabase/client";

export type PendingOperation = {
  id: string;
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
};

const SYNC_STORE_KEY = "pending_sync_queue";

// Fallback to IndexedDB (or localStorage if IDB fails) for aggressive offline persistence
async function getQueue(): Promise<PendingOperation[]> {
  try {
    const db = await getDB();
    const queue = await db.get('clients', SYNC_STORE_KEY); // Reusing clients store as keyval
    return queue || [];
  } catch {
    return JSON.parse(localStorage.getItem(SYNC_STORE_KEY) || "[]");
  }
}

async function saveQueue(queue: PendingOperation[]) {
  try {
    const db = await getDB();
    await db.put('clients', queue as any, SYNC_STORE_KEY);
  } catch {
    localStorage.setItem(SYNC_STORE_KEY, JSON.stringify(queue));
  }
}

/** Queue an operation for later sync */
export async function queueOperation(op: Omit<PendingOperation, "id" | "timestamp">) {
  const entry: PendingOperation = {
    ...op,
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: Date.now(),
  };

  const existing = await getQueue();
  existing.push(entry);
  await saveQueue(existing);
  
  // Try flushing immediately if online
  if (typeof navigator !== "undefined" && navigator.onLine) {
    flushPendingSync();
  }
}

let isFlushing = false;

/** Flush all pending operations to Supabase */
export async function flushPendingSync() {
  if (isFlushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  isFlushing = true;
  const pending = await getQueue();
  if (pending.length === 0) {
    isFlushing = false;
    return;
  }

  console.log(`[Sync] Flushing ${pending.length} pending operations...`);
  const supabase = createClient();
  const failed: PendingOperation[] = [];

  for (const op of pending) {
    try {
      let error = null;

      if (op.type === "INSERT") {
        const res = await supabase.from(op.table).insert(op.data);
        error = res.error;
      } else if (op.type === "UPDATE") {
        // Assume data contains 'id' for the where clause
        const res = await supabase.from(op.table).update(op.data).eq("id", op.data.id);
        error = res.error;
      } else if (op.type === "DELETE") {
        const res = await supabase.from(op.table).delete().eq("id", op.data.id);
        error = res.error;
      }

      if (error) {
        console.error(`[Sync] Op ${op.id} failed:`, error);
        failed.push(op); // Keep it in queue to retry later
      } else {
        console.log(`[Sync] Op ${op.id} synced successfully.`);
      }
    } catch (err) {
      console.error(`[Sync] Critical failure on ${op.id}:`, err);
      failed.push(op);
    }
  }

  await saveQueue(failed);
  isFlushing = false;
}

/** Auto-flush service (call once in layout) */
export function registerAutoSync() {
  if (typeof window === "undefined") return;
  
  // Try on load
  flushPendingSync();

  // Try when coming back online
  window.addEventListener("online", () => {
    console.log("[Sync] Back online. Flushing...");
    flushPendingSync();
  });
  
  // Try aggressively every 30 seconds as a fallback
  setInterval(() => {
    if (navigator.onLine) {
      flushPendingSync();
    }
  }, 30000);
}
