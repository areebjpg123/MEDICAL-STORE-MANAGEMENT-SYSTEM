import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { getDB } from "@/lib/db";

export type ClientBalance = {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number; // Positive means they owe us
};

export type LedgerPayment = {
  id: string;
  clientId: string;
  clientName: string;
  phone: string;
  amount: number;
  date: string;
  notes: string;
};

interface LedgerState {
  clients: ClientBalance[];
  payments: LedgerPayment[];
  initialized: boolean;
  fetchLedger: () => Promise<void>;
  subscribeToRealtime: () => void;
  addClientBalance: (client: Omit<ClientBalance, "id">) => Promise<void>;
  updateClientBalance: (id: string, updated: Partial<ClientBalance>) => Promise<void>;
  addPayment: (payment: Omit<LedgerPayment, "id">) => Promise<void>;
}

const mapClientToFrontend = (db: any): ClientBalance => ({
  id: db.id,
  name: db.name,
  phone: db.phone || "",
  address: db.address || "",
  balance: Number(db.balance) || 0,
});

const mapClientToBackend = (item: Partial<ClientBalance>) => {
  const db: any = {};
  if (item.name !== undefined) db.name = item.name;
  if (item.phone !== undefined) db.phone = item.phone;
  if (item.address !== undefined) db.address = item.address;
  if (item.balance !== undefined) db.balance = item.balance;
  return db;
};

const mapPaymentToFrontend = (db: any): LedgerPayment => ({
  id: db.id,
  clientId: db.client_id,
  clientName: db.client_name,
  phone: db.phone || "",
  amount: Number(db.amount) || 0,
  date: db.date,
  notes: db.notes || "",
});

const mapPaymentToBackend = (item: Partial<LedgerPayment>) => {
  const db: any = {};
  if (item.clientId !== undefined) db.client_id = item.clientId;
  if (item.clientName !== undefined) db.client_name = item.clientName;
  if (item.phone !== undefined) db.phone = item.phone;
  if (item.amount !== undefined) db.amount = item.amount;
  if (item.date !== undefined) db.date = item.date;
  if (item.notes !== undefined) db.notes = item.notes;
  return db;
};

export const useLedgerStore = create<LedgerState>((set, get) => {
  const supabase = createClient();
  let realtimeChannel: any = null;

  return {
    clients: [],
    payments: [],
    initialized: false,

    fetchLedger: async () => {
      // 1. Fast local load
      try {
        const db = await getDB();
        const localClients = await db.getAll('clients');
        if (localClients.length > 0) {
          set({ clients: localClients as any, initialized: true });
        }
      } catch (e) {
        console.error("Local DB ledger fetch failed");
      }

      // 2. Fetch full sync
      const [clientsRes, paymentsRes] = await Promise.all([
        supabase.from('ledger_clients').select('*').order('created_at', { ascending: false }),
        supabase.from('ledger_payments').select('*').order('date', { ascending: false }).limit(500),
      ]);

      if (clientsRes.data) {
        const clients = clientsRes.data.map(mapClientToFrontend);
        set({ clients, initialized: true });

        try {
          const db = await getDB();
          const tx = db.transaction('clients', 'readwrite');
          await tx.store.clear();
          for (const c of clients) {
            tx.store.put(c as any);
          }
          await tx.done;
        } catch(e) {}
      }
      
      if (paymentsRes.data) {
        set({ payments: paymentsRes.data.map(mapPaymentToFrontend) });
      }
    },

    subscribeToRealtime: () => {
      if (realtimeChannel) return;
      
      realtimeChannel = supabase.channel('ledger-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_clients' }, async (payload) => {
          const db = await getDB();
          if (payload.eventType === 'INSERT') {
            const newClient = mapClientToFrontend(payload.new);
            set((state) => ({ clients: [newClient, ...state.clients] }));
            db.put('clients', newClient as any);
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapClientToFrontend(payload.new);
            set((state) => ({
              clients: state.clients.map(c => c.id === payload.new.id ? updated : c)
            }));
            db.put('clients', updated as any);
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ledger_payments' }, (payload) => {
          set((state) => ({ payments: [mapPaymentToFrontend(payload.new), ...state.payments] }));
        })
        .subscribe();
    },

    addClientBalance: async (newClient) => {
      const tempId = `temp-client-${Date.now()}`;
      const clientWithId = { ...newClient, id: tempId };
      set((state) => ({ clients: [clientWithId, ...state.clients] }));
      
      const db = await getDB();
      db.put('clients', clientWithId as any);

      const dbItem = mapClientToBackend(newClient);
      const { data, error } = await supabase.from('ledger_clients').insert(dbItem).select().single();
      
      if (data) {
        const finalClient = mapClientToFrontend(data);
        set((state) => ({
          clients: state.clients.map(c => c.id === tempId ? finalClient : c)
        }));
        db.delete('clients', tempId);
        db.put('clients', finalClient as any);
      } else if (error) {
        console.error("Failed to add client:", error);
      }
    },

    updateClientBalance: async (id, updated) => {
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));

      const db = await getDB();
      const current = get().clients.find(c => c.id === id);
      if (current) db.put('clients', current as any);

      const dbItem = mapClientToBackend(updated);
      const { error } = await supabase.from('ledger_clients').update(dbItem).eq('id', id);
      if (error) console.error("Failed to update client:", error);
    },

    addPayment: async (newPayment) => {
      const tempId = `temp-payment-${Date.now()}`;
      set((state) => ({ payments: [{ ...newPayment, id: tempId }, ...state.payments] }));
      
      const dbItem = mapPaymentToBackend(newPayment);
      const { data, error } = await supabase.from('ledger_payments').insert(dbItem).select().single();
      
      if (data) {
        set((state) => ({
          payments: state.payments.map(p => p.id === tempId ? mapPaymentToFrontend(data) : p)
        }));
      } else if (error) {
        console.error("Failed to add payment:", error);
      }
    },
  };
});
