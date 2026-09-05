import { create } from "zustand";
import { parseExpiryDate } from "@/lib/expiry";

export type InventoryItem = {
  id: string;
  name: string;
  company: string;
  formula: string;
  expDate: string; // MM-YYYY format e.g. "11-2026", "03-2027", "10-2026"
  costPrice: number;
  salePrice: number;
  stock: number;
  boxQty: number;
  section: string;
};

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "1", name: "Panadol 500mg", company: "GSK", formula: "Paracetamol", expDate: "11-2026", costPrice: 80, salePrice: 120, stock: 45, boxQty: 100, section: "OTC" },
  { id: "2", name: "Brufen 400mg", company: "Abbott", formula: "Ibuprofen", expDate: "10-2026", costPrice: 120, salePrice: 180, stock: 32, boxQty: 50, section: "OTC" },
  { id: "3", name: "Augmentin 625mg", company: "GSK", formula: "Amoxicillin+Clavulanate", expDate: "03-2027", costPrice: 600, salePrice: 850, stock: 8, boxQty: 20, section: "Rx" },
  { id: "4", name: "Flagyl 400mg", company: "Sanofi", formula: "Metronidazole", expDate: "12-2026", costPrice: 60, salePrice: 95, stock: 60, boxQty: 100, section: "Rx" },
  { id: "5", name: "Amoxil 250mg", company: "GSK", formula: "Amoxicillin", expDate: "01-2027", costPrice: 140, salePrice: 210, stock: 25, boxQty: 50, section: "Rx" },
  { id: "6", name: "Disprin", company: "Reckitt", expDate: "11-2026", formula: "Aspirin", costPrice: 25, salePrice: 45, stock: 100, boxQty: 200, section: "OTC" },
  { id: "7", name: "Ponstan 500mg", company: "Pfizer", expDate: "04-2027", formula: "Mefenamic Acid", costPrice: 175, salePrice: 260, stock: 5, boxQty: 30, section: "Rx" },
  { id: "8", name: "Risek 20mg", company: "Getz", expDate: "08-2026", formula: "Omeprazole", costPrice: 250, salePrice: 380, stock: 22, boxQty: 30, section: "Rx" },
  { id: "9", name: "Calpol Syrup", company: "GSK", expDate: "09-2026", formula: "Paracetamol", costPrice: 95, salePrice: 150, stock: 35, boxQty: 24, section: "OTC" },
  { id: "10", name: "Ventolin Inhaler", company: "GSK", expDate: "02-2027", formula: "Salbutamol", costPrice: 420, salePrice: 650, stock: 3, boxQty: 1, section: "Rx" },
  { id: "11", name: "Rigix 10mg", company: "Sami", expDate: "10-2026", formula: "Cetirizine", costPrice: 80, salePrice: 125, stock: 40, boxQty: 50, section: "OTC" },
  { id: "12", name: "Arinac Forte", company: "Abbott", expDate: "11-2026", formula: "Pseudoephedrine+Ibuprofen", costPrice: 130, salePrice: 195, stock: 55, boxQty: 50, section: "OTC" },
  { id: "13", name: "Nexium 40mg", company: "AstraZeneca", expDate: "09-2026", formula: "Esomeprazole", costPrice: 420, salePrice: 580, stock: 12, boxQty: 14, section: "Rx" },
  { id: "14", name: "Lipitor 20mg", company: "Pfizer", expDate: "10-2026", formula: "Atorvastatin", costPrice: 350, salePrice: 520, stock: 7, boxQty: 30, section: "Rx" },
  { id: "15", name: "Zithromax 500mg", company: "Pfizer", expDate: "01-2027", formula: "Azithromycin", costPrice: 280, salePrice: 420, stock: 18, boxQty: 6, section: "Rx" },
];

interface InventoryState {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, "id">) => void;
  updateItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  restockItemByName: (name: string, quantity: number) => void;
  deductStockById: (id: string, quantity: number) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: INITIAL_INVENTORY,

  addItem: (newItem) =>
    set((state) => ({
      items: [...state.items, { ...newItem, id: Date.now().toString() }],
    })),

  updateItem: (id, updated) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...updated } : item)),
    })),

  deleteItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  restockItemByName: (name, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.name.toLowerCase() === name.toLowerCase()
          ? { ...item, stock: item.stock + quantity }
          : item
      ),
    })),

  deductStockById: (id, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock - quantity) } : item
      ),
    })),
}));

export function getExpiringSoonItems(items: InventoryItem[]) {
  return items.filter((item) => {
    const status = parseExpiryDate(item.expDate);
    return status.isExpiringSoon;
  });
}
