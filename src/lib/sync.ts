/**
 * Background Sync Utility
 * Queues operations when offline and flushes them when back online.
 */

import { getDB } from "./db";

export type PendingOperation = {
  id: string;
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
};

const SYNC_STORE = "pending_sync";

/** Queue an operation for later sync. Stored in localStorage as fallback. */
export function queueOperation(op: Omit<PendingOperation, "id" | "timestamp">) {
  const entry: PendingOperation = {
    ...op,
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: Date.now(),
  };

  const existing = JSON.parse(localStorage.getItem(SYNC_STORE) || "[]") as PendingOperation[];
  existing.push(entry);
  localStorage.setItem(SYNC_STORE, JSON.stringify(existing));
}

/** Get all pending operations. */
export function getPendingOperations(): PendingOperation[] {
  return JSON.parse(localStorage.getItem(SYNC_STORE) || "[]");
}

/** Clear a specific operation after successful sync. */
export function clearOperation(id: string) {
  const existing = getPendingOperations();
  localStorage.setItem(
    SYNC_STORE,
    JSON.stringify(existing.filter((op) => op.id !== id))
  );
}

/** Clear all pending operations. */
export function clearAllOperations() {
  localStorage.removeItem(SYNC_STORE);
}

/** Flush all pending operations. Called when the browser goes online. */
export async function flushPendingSync(
  syncFn: (op: PendingOperation) => Promise<boolean>
) {
  const pending = getPendingOperations();
  if (pending.length === 0) return;

  console.log(`[Sync] Flushing ${pending.length} pending operations...`);

  for (const op of pending) {
    try {
      const success = await syncFn(op);
      if (success) {
        clearOperation(op.id);
        console.log(`[Sync] Operation ${op.id} synced successfully.`);
      }
    } catch (error) {
      console.error(`[Sync] Failed to sync operation ${op.id}:`, error);
    }
  }
}

/** Register the online event listener to auto-flush when back online. */
export function registerAutoSync(
  syncFn: (op: PendingOperation) => Promise<boolean>
) {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    console.log("[Sync] Back online. Flushing pending operations...");
    flushPendingSync(syncFn);
  });
}
