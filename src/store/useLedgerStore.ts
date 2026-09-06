import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

export type ClientBalance = {
  id: string;
  name: string;
  phone: string;
  date: string;
  totalBilled: number;
  totalPaid: number;
};

export type Payment = {
  id: string;
  clientId?: string;
  clientName: string;
  phone: string;
  amount: number;
  date: string;
  notes: string;
};

interface LedgerState {
  clients: ClientBalance[];
  payments: Payment[];
  initialized: boolean;
  fetchLedger: () => Promise<void>;
  addClient: (client: Omit<ClientBalance, "id">) => Promise<void>;
  updateClient: (id: string, client: Partial<ClientBalance>) => Promise<void>;
  addPayment: (payment: Omit<Payment, "id">) => Promise<void>;
  subscribeToRealtime: () => void;
}

const mapClientToFrontend = (dbClient: any): ClientBalance => ({
  id: dbClient.id,
  name: dbClient.name,
  phone: dbClient.phone || "",
  date: dbClient.date || "",
  totalBilled: Number(dbClient.total_billed) || 0,
  totalPaid: Number(dbClient.total_paid) || 0,
});

const mapClientToBackend = (item: Partial<ClientBalance>) => {
  const db: any = {};
  if (item.name !== undefined) db.name = item.name;
  if (item.phone !== undefined) db.phone = item.phone;
  if (item.date !== undefined) db.date = item.date;
  if (item.totalBilled !== undefined) db.total_billed = item.totalBilled;
  if (item.totalPaid !== undefined) db.total_paid = item.totalPaid;
  return db;
};

const mapPaymentToFrontend = (dbPayment: any): Payment => ({
  id: dbPayment.id,
  clientId: dbPayment.client_id,
  clientName: dbPayment.client_name,
  phone: dbPayment.phone || "",
  amount: Number(dbPayment.amount) || 0,
  date: dbPayment.date || "",
  notes: dbPayment.notes || "",
});

const mapPaymentToBackend = (item: Partial<Payment>) => {
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
      const [clientsRes, paymentsRes] = await Promise.all([
        supabase.from('ledger_clients').select('*').order('created_at', { ascending: false }),
        supabase.from('ledger_payments').select('*').order('created_at', { ascending: false })
      ]);

      if (clientsRes.error) console.error("Error fetching clients:", clientsRes.error);
      if (paymentsRes.error) console.error("Error fetching payments:", paymentsRes.error);

      set({
        clients: (clientsRes.data || []).map(mapClientToFrontend),
        payments: (paymentsRes.data || []).map(mapPaymentToFrontend),
        initialized: true
      });
    },

    subscribeToRealtime: () => {
      if (realtimeChannel) return;

      realtimeChannel = supabase.channel('ledger-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_clients' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            set((state) => ({ clients: [mapClientToFrontend(payload.new), ...state.clients] }));
          } else if (payload.eventType === 'UPDATE') {
            set((state) => ({
              clients: state.clients.map(c => c.id === payload.new.id ? mapClientToFrontend(payload.new) : c)
            }));
          } else if (payload.eventType === 'DELETE') {
            set((state) => ({ clients: state.clients.filter(c => c.id !== payload.old.id) }));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_payments' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            set((state) => ({ payments: [mapPaymentToFrontend(payload.new), ...state.payments] }));
          } else if (payload.eventType === 'UPDATE') {
            set((state) => ({
              payments: state.payments.map(p => p.id === payload.new.id ? mapPaymentToFrontend(payload.new) : p)
            }));
          } else if (payload.eventType === 'DELETE') {
            set((state) => ({ payments: state.payments.filter(p => p.id !== payload.old.id) }));
          }
        })
        .subscribe();
    },

    addClient: async (newClient) => {
      const tempId = `temp-client-${Date.now()}`;
      set((state) => ({ clients: [{ ...newClient, id: tempId }, ...state.clients] }));
      
      const dbItem = mapClientToBackend(newClient);
      const { data, error } = await supabase.from('ledger_clients').insert(dbItem).select().single();
      
      if (data) {
        set((state) => ({
          clients: state.clients.map(c => c.id === tempId ? mapClientToFrontend(data) : c)
        }));
      } else if (error) {
        console.error("Failed to add client:", error);
      }
    },

    updateClient: async (id, updated) => {
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));

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
