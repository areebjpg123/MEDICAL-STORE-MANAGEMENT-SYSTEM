import { create } from "zustand";
import { useInventoryStore } from "./useInventoryStore";
import { createClient } from "@/utils/supabase/client";
import { queueOperation } from "@/lib/sync";

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
  status: "DISPATCHED" | "PENDING" | "CANCELLED" | "REPLACED";
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
  receiptNumber: dbOrder.receipt_number ? `RCP-${dbOrder.receipt_number}` : "",
  clientName: dbOrder.client_name || "",
  date: dbOrder.date || "",
  total: dbOrder.total || 0,
  originalTotal: dbOrder.original_total || 0,
  costTotal: dbOrder.cost_total || 0,
  status: dbOrder.status || "PENDING",
  items: dbOrder.items || [],
});

const mapToBackend = (order: Partial<Order>) => {
  const db: any = {};
  if (order.id !== undefined) db.id = order.id;
  if (order.clientName !== undefined) db.client_name = order.clientName;
  if (order.date !== undefined) db.date = order.date;
  if (order.total !== undefined) db.total = order.total;
  if (order.originalTotal !== undefined) db.original_total = order.originalTotal;
  if (order.costTotal !== undefined) db.cost_total = order.costTotal;
  if (order.status !== undefined) db.status = order.status;
  if (order.items !== undefined) db.items = order.items;
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

      const orders = allData.map(mapToFrontend);
      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

      set({ orders, totalRevenue, initialized: true });
    },

    subscribeToRealtime: () => {
      if (realtimeChannel) return;
      realtimeChannel = supabase.channel('orders-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = mapToFrontend(payload.new);
            set((state) => {
              if (state.orders.find(o => o.id === newOrder.id)) return state; // Deduplicate optimistic updates
              return { 
                orders: [newOrder, ...state.orders],
                totalRevenue: state.totalRevenue + newOrder.total
              };
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = mapToFrontend(payload.new);
            set((state) => {
              const oldOrder = state.orders.find(o => o.id === updatedOrder.id);
              const diff = oldOrder ? updatedOrder.total - oldOrder.total : updatedOrder.total;
              return {
                orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
                totalRevenue: state.totalRevenue + diff
              };
            });
          } else if (payload.eventType === 'DELETE') {
            set((state) => {
              const oldOrder = state.orders.find(o => o.id === payload.old.id);
              return {
                orders: state.orders.filter(o => o.id !== payload.old.id),
                totalRevenue: state.totalRevenue - (oldOrder ? oldOrder.total : 0)
              };
            });
          }
        })
        .subscribe();
    },

    addOrder: async (newOrderData) => {
      const newOrder: Order = {
        ...newOrderData,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        status: "DISPATCHED",
        costTotal: newOrderData.items.reduce((sum, item) => sum + (item.costPrice || item.price * 0.7) * item.qty, 0),
      };

      set((state) => ({
        orders: [newOrder, ...state.orders],
        totalRevenue: state.totalRevenue + newOrder.total,
      }));

      const dbItem = mapToBackend(newOrder);
      const { error } = await supabase.from('orders').insert(dbItem);
      
      if (error) {
        queueOperation({ type: "INSERT", table: "orders", data: dbItem });
      }
    },

    processReplacement: async (orderId, returns) => {
      const { orders } = get();
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) return { refundTotal: 0, itemsRestockedCount: 0 };

      let refundTotal = 0;
      let itemsRestockedCount = 0;

      const restockFn = useInventoryStore.getState().restockItemByName;

      const updatedItems = targetOrder.items.map((item) => {
        const returnQty = Math.min(item.qty, returns[item.name] || 0);
        if (returnQty > 0) {
          refundTotal += returnQty * item.price;
          itemsRestockedCount += returnQty;
          // Restock inventory immediately!
          restockFn(item.name, returnQty);
        }
        return {
          ...item,
          qty: item.qty - returnQty,
          returnedQty: (item.returnedQty || 0) + returnQty,
        };
      });

      const newTotal = Math.max(0, targetOrder.total - refundTotal);
      
      const updatedOrder = {
        ...targetOrder,
        total: newTotal,
        items: updatedItems,
        status: "REPLACED" as const,
      };

      set((state) => ({
        orders: state.orders.map((o) => o.id === orderId ? updatedOrder : o),
        totalRevenue: Math.max(0, state.totalRevenue - refundTotal),
      }));

      const dbItem = mapToBackend(updatedOrder);
      const { error } = await supabase.from('orders').update(dbItem).eq('id', orderId);
      
      if (error) {
        queueOperation({ type: "UPDATE", table: "orders", data: dbItem });
      }

      return { refundTotal, itemsRestockedCount };
    },

    wipeAll: async () => {
      set({ orders: [], totalRevenue: 0 });
      const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error("Orders Wipe failed", error);
      }
    },
  };
});
