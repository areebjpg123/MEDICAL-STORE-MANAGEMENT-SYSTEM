import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface POSDB extends DBSchema {
  products: {
    key: string;
    value: {
      id: string;
      barcode: string;
      name: string;
      sale_price: number;
      stock_quantity: number;
      box_quantity?: number;
      section?: string;
      company_name?: string;
      formula_name?: string;
      cost_price?: number;
    };
    indexes: { 'by-barcode': string, 'by-name': string };
  };
  orders: {
    key: string;
    value: {
      id: string;
      receiptNumber: number;
      date: string;
      clientName: string;
      items: any[];
      total: number;
      status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED';
    };
  };
  clients: {
    key: string;
    value: {
      id: string;
      name: string;
      phone: string;
      address: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<POSDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<POSDB>('medical-pos-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-barcode', 'barcode');
          productStore.createIndex('by-name', 'name');
        }
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}
