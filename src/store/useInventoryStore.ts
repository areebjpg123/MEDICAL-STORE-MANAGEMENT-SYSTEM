import { create } from "zustand";
import { parseExpiryDate } from "@/lib/expiry";
import { createClient } from "@/utils/supabase/client";
import { queueOperation } from "@/lib/sync";

export type InventoryItem = {
  id: string;
  name: string;
  company: string;
  formula: string;
  expDate: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  boxQty: number;
  section: string;
  category?: "medicine" | "extras";
  orderNumber?: string;
  orderDate?: string;
  billImage?: string;
  purchaseSource?: "company" | "market";
  baseAmount?: number;
  tradeDiscount?: number;
  taxPercentage?: number;
  extraDiscount?: number;
  bonusQuantity?: number;
  netCost?: number;
};

interface InventoryState {
  items: InventoryItem[];
  initialized: boolean;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<InventoryItem, "id">) => Promise<void>;
  updateItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  restockItemByName: (name: string, quantity: number) => Promise<void>;
  deductStockById: (id: string, quantity: number) => Promise<void>;
  wipeAll: () => Promise<void>;
  subscribeToRealtime: () => void;
}

const mapToFrontend = (dbProduct: any): InventoryItem => ({
  id: dbProduct.id,
  name: dbProduct.name,
  company: dbProduct.company_name || "",
  formula: dbProduct.formula_name || "",
  expDate: dbProduct.exp_date || "",
  costPrice: dbProduct.cost_price || 0,
  salePrice: dbProduct.sale_price || 0,
  stock: dbProduct.stock_quantity || 0,
  boxQty: dbProduct.box_quantity || 0,
  section: dbProduct.section || "OTC",
  category: dbProduct.category || "medicine",
  purchaseSource: dbProduct.purchase_source || "market",
  baseAmount: Number(dbProduct.base_amount) || 0,
  tradeDiscount: Number(dbProduct.trade_discount) || 15,
  taxPercentage: Number(dbProduct.tax_percentage) || 0,
  extraDiscount: Number(dbProduct.extra_discount) || 0,
  bonusQuantity: Number(dbProduct.bonus_quantity) || 0,
  netCost: Number(dbProduct.net_cost) || 0,
  orderNumber: dbProduct.order_number || "",
  orderDate: dbProduct.order_date || "",
  billImage: dbProduct.bill_image || "",
});

const mapToBackend = (item: Partial<InventoryItem>) => {
  const db: any = {};
  if (item.name !== undefined) db.name = item.name;
  if (item.company !== undefined) db.company_name = item.company;
  if (item.formula !== undefined) db.formula_name = item.formula;
  if (item.expDate !== undefined) db.exp_date = item.expDate;
  if (item.costPrice !== undefined) db.cost_price = item.costPrice;
  if (item.salePrice !== undefined) db.sale_price = item.salePrice;
  if (item.stock !== undefined) db.stock_quantity = item.stock;
  if (item.boxQty !== undefined) db.box_quantity = item.boxQty;
  if (item.section !== undefined) db.section = item.section;
  if (item.category !== undefined) db.category = item.category;
  if (item.purchaseSource !== undefined) db.purchase_source = item.purchaseSource;
  if (item.baseAmount !== undefined) db.base_amount = item.baseAmount;
  if (item.tradeDiscount !== undefined) db.trade_discount = item.tradeDiscount;
  if (item.taxPercentage !== undefined) db.tax_percentage = item.taxPercentage;
  if (item.extraDiscount !== undefined) db.extra_discount = item.extraDiscount;
  if (item.bonusQuantity !== undefined) db.bonus_quantity = item.bonusQuantity;
  if (item.netCost !== undefined) db.net_cost = item.netCost;
  if (item.orderNumber !== undefined) db.order_number = item.orderNumber;
  if (item.orderDate !== undefined) db.order_date = item.orderDate;
  if (item.billImage !== undefined) db.bill_image = item.billImage;
  return db;
};

export const useInventoryStore = create<InventoryState>((set, get) => {
  const supabase = createClient();
  let realtimeChannel: any = null;

  return {
    items: [],
    initialized: false,

    fetchItems: async () => {
      let allData: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .range(from, from + step - 1);

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

      set({ items: allData.map(mapToFrontend), initialized: true });
    },

    subscribeToRealtime: () => {
      if (realtimeChannel) return; // Already subscribed
      realtimeChannel = supabase.channel('products-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            set((state) => ({ items: [...state.items, mapToFrontend(payload.new)] }));
          } else if (payload.eventType === 'UPDATE') {
            set((state) => ({
              items: state.items.map(item => item.id === payload.new.id ? mapToFrontend(payload.new) : item)
            }));
          } else if (payload.eventType === 'DELETE') {
            set((state) => ({ items: state.items.filter(item => item.id !== payload.old.id) }));
          }
        })
        .subscribe();
    },

    addItem: async (newItem) => {
      // Optimistic UI update
      const tempId = `temp-${Date.now()}`;
      set((state) => ({ items: [...state.items, { ...newItem, id: tempId }] }));
      
      const dbItem = mapToBackend(newItem);
      const { data, error } = await supabase.from('products').insert(dbItem).select().single();
      
      if (error) {
        // Fallback to local queue if offline
        queueOperation({ type: "INSERT", table: "products", data: dbItem });
      } else if (data) {
        set((state) => ({
          items: state.items.map(item => item.id === tempId ? mapToFrontend(data) : item)
        }));
      }
    },

    updateItem: async (id, updated) => {
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, ...updated } : item)),
      }));

      const dbItem = mapToBackend(updated);
      const { error } = await supabase.from('products').update(dbItem).eq('id', id);
      
      if (error) {
        queueOperation({ type: "UPDATE", table: "products", data: { ...dbItem, id } });
      }
    },

    deleteItem: async (id) => {
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) queueOperation({ type: "DELETE", table: "products", data: { id } });
    },

    restockItemByName: async (name, quantity) => {
      const item = get().items.find(i => i.name.toLowerCase() === name.toLowerCase());
      if (item) {
        get().updateItem(item.id, { stock: item.stock + quantity });
      }
    },

    deductStockById: async (id, quantity) => {
      const item = get().items.find(i => i.id === id);
      if (item) {
        get().updateItem(item.id, { stock: Math.max(0, item.stock - quantity) });
      }
    },

    wipeAll: async () => {
      if (!confirm("Are you sure you want to wipe ALL products? This cannot be undone!")) return;
      set({ items: [] });
      const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error("Wipe failed", error);
        alert("Failed to wipe data online, but cleared locally.");
      }
    },
  };
});

export function getExpiringSoonItems(items: InventoryItem[]) {
  return items.filter((item) => {
    const status = parseExpiryDate(item.expDate);
    return status.isExpiringSoon;
  });
}
