import { create } from "zustand";
import { useInventoryStore } from "./useInventoryStore";

export type OrderItem = {
  name: string;
  qty: number;
  price: number;
  returnedQty?: number;
};

export type Order = {
  id: string;
  receiptNumber: string;
  clientName: string;
  date: string;
  total: number;
  originalTotal: number;
  status: "DISPATCHED" | "PENDING" | "CANCELLED" | "REPLACED";
  items: OrderItem[];
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: "1",
    receiptNumber: "RCP-001",
    clientName: "Walk-in",
    date: "2026-09-05 14:30",
    total: 1250,
    originalTotal: 1250,
    status: "DISPATCHED",
    items: [
      { name: "Panadol 500mg", qty: 2, price: 120 },
      { name: "Brufen 400mg", qty: 1, price: 180 },
      { name: "Disprin", qty: 3, price: 45 },
    ],
  },
  {
    id: "2",
    receiptNumber: "RCP-002",
    clientName: "Ali Medical",
    date: "2026-09-05 13:15",
    total: 8500,
    originalTotal: 8500,
    status: "DISPATCHED",
    items: [
      { name: "Augmentin 625mg", qty: 5, price: 850 },
      { name: "Amoxil 250mg", qty: 10, price: 210 },
      { name: "Risek 20mg", qty: 3, price: 380 },
    ],
  },
  {
    id: "3",
    receiptNumber: "RCP-003",
    clientName: "City Pharmacy",
    date: "2026-09-05 11:00",
    total: 3200,
    originalTotal: 3200,
    status: "PENDING",
    items: [
      { name: "Ponstan 500mg", qty: 5, price: 260 },
      { name: "Flagyl 400mg", qty: 10, price: 95 },
    ],
  },
  {
    id: "4",
    receiptNumber: "RCP-004",
    clientName: "Walk-in",
    date: "2026-09-05 10:30",
    total: 450,
    originalTotal: 450,
    status: "DISPATCHED",
    items: [
      { name: "Calpol Syrup", qty: 1, price: 150 },
      { name: "Rigix 10mg", qty: 2, price: 125 },
    ],
  },
  {
    id: "5",
    receiptNumber: "RCP-005",
    clientName: "Hameed Medicos",
    date: "2026-09-04 16:00",
    total: 6100,
    originalTotal: 6100,
    status: "DISPATCHED",
    items: [
      { name: "Ventolin Inhaler", qty: 2, price: 650 },
      { name: "Nexium 40mg", qty: 4, price: 580 },
      { name: "Arinac Forte", qty: 8, price: 195 },
    ],
  },
  {
    id: "6",
    receiptNumber: "RCP-006",
    clientName: "Walk-in",
    date: "2026-09-04 09:45",
    total: 520,
    originalTotal: 520,
    status: "CANCELLED",
    items: [{ name: "Lipitor 20mg", qty: 1, price: 520 }],
  },
];

interface OrderState {
  orders: Order[];
  totalRevenue: number;
  addOrder: (newOrder: Omit<Order, "id" | "date" | "status">) => void;
  processReplacement: (orderId: string, returns: { [itemName: string]: number }) => { refundTotal: number; itemsRestockedCount: number };
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: INITIAL_ORDERS,
  totalRevenue: 24580,

  addOrder: (newOrderData) => {
    const newOrder: Order = {
      ...newOrderData,
      id: Date.now().toString(),
      date: new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      status: "DISPATCHED",
    };
    set((state) => ({
      orders: [newOrder, ...state.orders],
      totalRevenue: state.totalRevenue + newOrder.total,
    }));
  },

  processReplacement: (orderId, returns) => {
    const { orders, totalRevenue } = get();
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

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              total: newTotal,
              items: updatedItems,
              status: "REPLACED",
            }
          : o
      ),
      totalRevenue: Math.max(0, state.totalRevenue - refundTotal),
    }));

    return { refundTotal, itemsRestockedCount };
  },
}));
