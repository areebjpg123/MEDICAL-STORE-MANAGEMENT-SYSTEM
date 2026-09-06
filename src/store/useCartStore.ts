import { create } from "zustand";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  quantity: number;
  discount?: number;
  customPrice?: number;
};

interface CartState {
  officialCart: CartItem[];
  roughCart: CartItem[];
  officialDiscountPct: number;
  roughDiscountPct: number;
  roughDiscountFixed: number;

  addToOfficial: (item: CartItem) => void;
  addToRough: (item: CartItem) => void;
  updateOfficialQty: (id: string, delta: number) => void;
  updateRoughQty: (id: string, delta: number) => void;
  removeOfficialItem: (id: string) => void;
  removeRoughItem: (id: string) => void;
  setOfficialDiscountPct: (discount: number) => void;
  setRoughDiscountPct: (discount: number) => void;
  setRoughDiscountFixed: (fixed: number) => void;
  clearOfficial: () => void;
  clearRough: () => void;
  syncRoughToOfficial: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  officialCart: [],
  roughCart: [],
  officialDiscountPct: 0,
  roughDiscountPct: 0,
  roughDiscountFixed: 0,

  addToOfficial: (newItem) =>
    set((state) => {
      const existing = state.officialCart.find((i) => i.id === newItem.id);
      if (existing) {
        return {
          officialCart: state.officialCart.map((i) =>
            i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i
          ),
        };
      }
      return { officialCart: [...state.officialCart, newItem] };
    }),

  addToRough: (newItem) =>
    set((state) => {
      const existing = state.roughCart.find((i) => i.id === newItem.id);
      if (existing) {
        return {
          roughCart: state.roughCart.map((i) =>
            i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i
          ),
        };
      }
      return { roughCart: [...state.roughCart, newItem] };
    }),

  updateOfficialQty: (id, delta) =>
    set((state) => ({
      officialCart: state.officialCart
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0),
    })),

  updateRoughQty: (id, delta) =>
    set((state) => ({
      roughCart: state.roughCart
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0),
    })),

  removeOfficialItem: (id) =>
    set((state) => ({
      officialCart: state.officialCart.filter((i) => i.id !== id),
    })),

  removeRoughItem: (id) =>
    set((state) => ({
      roughCart: state.roughCart.filter((i) => i.id !== id),
    })),

  setOfficialDiscountPct: (discount) => set({ officialDiscountPct: discount }),
  setRoughDiscountPct: (discount) => set({ roughDiscountPct: discount }),
  setRoughDiscountFixed: (fixed) => set({ roughDiscountFixed: fixed }),

  clearOfficial: () => set({ officialCart: [], officialDiscountPct: 0 }),
  clearRough: () => set({ roughCart: [], roughDiscountPct: 0, roughDiscountFixed: 0 }),

  syncRoughToOfficial: () => {
    const { roughCart, roughDiscountPct } = get();
    set({
      officialCart: [...roughCart],
      officialDiscountPct: roughDiscountPct,
    });
  },
}));
