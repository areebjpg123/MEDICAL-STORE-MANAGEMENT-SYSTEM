import { create } from 'zustand';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
};

interface CartState {
  officialCart: CartItem[];
  roughCart: CartItem[];
  targetCart: 'official' | 'rough';
  setTargetCart: (target: 'official' | 'rough') => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: (target?: 'official' | 'rough') => void;
}

export const useCartStore = create<CartState>((set) => ({
  officialCart: [],
  roughCart: [],
  targetCart: 'official',
  
  setTargetCart: (target) => set({ targetCart: target }),
  
  addItem: (item) => set((state) => {
    const targetArray = state.targetCart === 'official' ? state.officialCart : state.roughCart;
    const existing = targetArray.find(i => i.id === item.id);
    let newArray;
    if (existing) {
      newArray = targetArray.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
    } else {
      newArray = [...targetArray, item];
    }
    return state.targetCart === 'official' ? { officialCart: newArray } : { roughCart: newArray };
  }),
  
  removeItem: (id) => set((state) => {
    if (state.targetCart === 'official') {
      return { officialCart: state.officialCart.filter(i => i.id !== id) };
    }
    return { roughCart: state.roughCart.filter(i => i.id !== id) };
  }),
  
  updateQuantity: (id, quantity) => set((state) => {
    if (state.targetCart === 'official') {
      return { officialCart: state.officialCart.map(i => i.id === id ? { ...i, quantity } : i) };
    }
    return { roughCart: state.roughCart.map(i => i.id === id ? { ...i, quantity } : i) };
  }),
  
  clearCart: (target) => set((state) => {
    const t = target || state.targetCart;
    if (t === 'official') return { officialCart: [] };
    return { roughCart: [] };
  }),
}));
