import { StateStorage } from 'zustand/middleware';
import { getDB } from './db';

// We will use the 'clients' store in db.ts as a general key-value store since we aren't using it yet.
// Actually, let's just make sure db.ts has a 'store_state' object store or just use 'clients' since it doesn't enforce schema values.
// Better yet, let's just use localStorage for small state, and raw idb for large state.
// Since inventory can be 10k items, it MUST be in IndexedDB.

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const db = await getDB();
      const value = await db.get('clients' as any, name);
      return value || null;
    } catch (e) {
      return localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const db = await getDB();
      await db.put('clients' as any, value, name);
    } catch (e) {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await getDB();
      await db.delete('clients' as any, name);
    } catch (e) {
      localStorage.removeItem(name);
    }
  },
};
