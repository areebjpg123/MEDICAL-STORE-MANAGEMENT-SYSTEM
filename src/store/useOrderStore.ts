import { create } from "zustand";
import { useInventoryStore } from "./useInventoryStore";
import { createClient } from "@/utils/supabase/client";
import { queueOperation } from "@/lib/sync";
import { getDB } from "@/lib/db";

export type OrderItem = {
  name: string;
  qty: number;
  price: number;
  costPrice?: number;
  returnedQty?: number;
};

export type Order = {
  id: string;
  receiptNumber: string;
  clientName: string;
  date: string;
  total: number;
  originalTotal: number;
  costTotal?: number;
  status: "DISPATCHED" | "CANCELLED" | "REPLACED";
  items: OrderItem[];
};

interface OrderState {
  orders: Order[];
  totalRevenue: number;
  initialized: boolean;
  fetchOrders: () => Promise<void>;
  subscribeToRealtime: () => void;
  addOrder: (newOrder: Omit<Order, "id" | "date" | "status" | "costTotal">) => Promise<void>;
  processReplacement: (orderId: string, returns: { [itemName: string]: number }) => Promise<{ refundTotal: number; itemsRestockedCount: number }>;
  wipeAll: () => Promise<void>;
}

const mapToFrontend = (dbOrder: any): Order => ({
  id: dbOrder.id,
  receiptNumber: dbOrder.receipt_number,
  clientName: dbOrder.client_name,
  date: dbOrder.date,
  total: Number(dbOrder.total_amount),
  originalTotal: Number(dbOrder.original_total) || Number(dbOrder.total_amount),
  costTotal: Number(dbOrder.cost_total) || 0,
  status: dbOrder.status as any,
  items: typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items,
});

const mapToBackend = (order: Partial<Order>) => {
  const db: any = {};
  if (order.receiptNumber !== undefined) db.receipt_number = order.receiptNumber;
  if (order.clientName !== undefined) db.client_name = order.clientName;
  if (order.total !== undefined) db.total_amount = order.total;
  if (order.originalTotal !== undefined) db.original_total = order.originalTotal;
  if (order.costTotal !== undefined) db.cost_total = order.costTotal;
  if (order.status !== undefined) db.status = order.status;
  if (order.items !== undefined) db.items = order.items; // Supabase handles JSONB arrays
  return db;
};

export const useOrderStore = create<OrderState>((set, get) => {
  const supabase = createClient();
  let realtimeChannel: any = null;

  return {
    orders: [],
    totalRevenue: 0,
    initialized: false,

    fetchOrders: async () => {
      // 1. Fast local load
      try {
        const db = await getDB();
        const localOrders = await db.getAll('orders');
        if (localOrders.length > 0) {
          const totalRevenue = localOrders.reduce((sum, o) => sum + o.total, 0);
          set({ orders: localOrders as any, totalRevenue, initialized: true });
        }
      } catch (e) {
        console.error("Local DB order fetch failed");
      }

      // 2. Fetch full sync from online
      let allData: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .range(from, from + step - 1)
          .order('date', { ascending: false });

        if (error) {
          console.error("Fetch error:", error);
          break;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += step;
          if (data.length < step) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      if (allData.length > 0) {
        const orders = allData.map(mapToFrontend);
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        set({ orders, totalRevenue, initialized: true });

        try {
          const db = await getDB();
          const tx = db.transaction('orders', 'readwrite');
          await tx.store.clear();
          for (const o of orders) {
            tx.store.put(o as any);
          }
          await tx.done;
        } catch(e) {}
      }
    },

    subscribeToRealtime: () => {
      if (realtimeChannel) return;
      realtimeChannel = supabase.channel('orders-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
          const db = await getDB();
          if (payload.eventType === 'INSERT') {
            const newOrder = mapToFrontend(payload.new);
            set((state) => {
              const orders = [newOrder, ...state.orders];
              return { orders, totalRevenue: state.totalRevenue + newOrder.total };
            });
            db.put('orders', newOrder as any);
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapToFrontend(payload.new);
            set((state) => {
              const oldOrder = state.orders.find(o => o.id === updated.id);
              const diff = oldOrder ? updated.total - oldOrder.total : 0;
              return {
                orders: state.orders.map(o => o.id === updated.id ? updated : o),
                totalRevenue: state.totalRevenue + diff
              };
            });
            db.put('orders', updated as any);
          } else if (payload.eventType === 'DELETE') {
            set((state) => {
              const oldOrder = state.orders.find(o => o.id === payload.old.id);
              const diff = oldOrder ? oldOrder.total : 0;
              return {
                orders: state.orders.filter(o => o.id !== payload.old.id),
                totalRevenue: state.totalRevenue - diff
              };
            });
            db.delete('orders', payload.old.id);
          }
        })
        .subscribe();
    },

    addOrder: async (newOrderData) => {
      let costTotal = 0;
      newOrderData.items.forEach(i => {
        if (i.costPrice) costTotal += i.costPrice * i.qty;
      });

      const order: Order = {
        ...newOrderData,
        id: `temp-order-${Date.now()}`,
        date: new Date().toISOString(),
        status: "DISPATCHED",
        costTotal
      };

      set((state) => ({
        orders: [order, ...state.orders],
        totalRevenue: state.totalRevenue + order.total,
      }));

      const db = await getDB();
      db.put('orders', order as any);

      const dbItem = mapToBackend(order);
      const { data, error } = await supabase.from('orders').insert(dbItem).select().single();
      
      if (error) {
        queueOperation({ type: "INSERT", table: "orders", data: dbItem });
      } else if (data) {
        const finalItem = mapToFrontend(data);
        set((state) => ({
          orders: state.orders.map(o => o.id === order.id ? finalItem : o)
        }));
        db.delete('orders', order.id);
        db.put('orders', finalItem as any);
      }
    },

    processReplacement: async (orderId, returns) => {
      const state = get();
      const targetOrder = state.orders.find((o) => o.id === orderId);
      if (!targetOrder) return { refundTotal: 0, itemsRestockedCount: 0 };

      let refundTotal = 0;
      let itemsRestockedCount = 0;
      const updatedItems = targetOrder.items.map((item) => {
        const retQty = returns[item.name];
        if (retQty && retQty > 0) {
          refundTotal += item.price * retQty;
          itemsRestockedCount += retQty;
          useInventoryStore.getState().restockItemByName(item.name, retQty);
          return { ...item, returnedQty: (item.returnedQty || 0) + retQty };
        }
        return item;
      });

      const newTotal = Math.max(0, targetOrder.total - refundTotal);
      const updatedOrder: Order = {
        ...targetOrder,
        total: newTotal,
        items: updatedItems,
        status: "REPLACED" as const,
      };

      set((state) => ({
        orders: state.orders.map((o) => o.id === orderId ? updatedOrder : o),
        totalRevenue: Math.max(0, state.totalRevenue - refundTotal),
      }));

      const db = await getDB();
      db.put('orders', updatedOrder as any);

      const dbItem = mapToBackend(updatedOrder);
      const { error } = await supabase.from('orders').update(dbItem).eq('id', orderId);
      
      if (error) {
        queueOperation({ type: "UPDATE", table: "orders", data: dbItem });
      }

      return { refundTotal, itemsRestockedCount };
    },

    wipeAll: async () => {
      set({ orders: [], totalRevenue: 0 });
      const db = await getDB();
      await db.clear('orders');
      const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error("Orders Wipe failed", error);
      }
    },
  };
});
