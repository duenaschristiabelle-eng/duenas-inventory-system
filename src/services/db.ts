import { Item, StockTransaction, User } from '../types/inventory';

const DB_NAME = 'DuenasStoreDB';
const DB_VERSION = 1;
const STORE_ITEMS = 'items';
const STORE_TRANSACTIONS = 'transactions';
const CURRENT_USER_KEY = 'duenas_current_user';
const SEED_FLAG_KEY = 'duenas_seeded_v1';

// Pre-configured default users
export const DEFAULT_USERS: User[] = [
  {
    id: 'u-admin',
    username: 'admin',
    name: 'Christiabelle Dueñas',
    role: 'owner',
    storeName: 'Dueñas Store',
  },
  {
    id: 'u-staff',
    username: 'staff',
    name: 'Staff Member',
    role: 'staff',
    storeName: 'Dueñas Store',
  },
];

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        const itemStore = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        itemStore.createIndex('category', 'category', { unique: false });
        itemStore.createIndex('sku', 'sku', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        const txStore = db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' });
        txStore.createIndex('itemId', 'itemId', { unique: false });
        txStore.createIndex('timestamp', 'timestamp', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback localStorage keys if IndexedDB is blocked
const LS_ITEMS = 'duenas_items_backup';
const LS_TX = 'duenas_tx_backup';

export const dbService = {
  async getItems(): Promise<Item[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_ITEMS, 'readonly');
        const store = tx.objectStore(STORE_ITEMS);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as Item[]) || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const data = localStorage.getItem(LS_ITEMS);
      return data ? JSON.parse(data) : [];
    }
  },

  async saveItem(item: Item): Promise<Item> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_ITEMS, 'readwrite');
        const store = tx.objectStore(STORE_ITEMS);
        const req = store.put(item);
        req.onsuccess = () => {
          this.backupToLocalStorage();
          resolve(item);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const items = await this.getItems();
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        items[idx] = item;
      } else {
        items.push(item);
      }
      localStorage.setItem(LS_ITEMS, JSON.stringify(items));
      return item;
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_ITEMS, 'readwrite');
        const store = tx.objectStore(STORE_ITEMS);
        const req = store.delete(id);
        req.onsuccess = () => {
          this.backupToLocalStorage();
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const items = await this.getItems();
      const updated = items.filter((i) => i.id !== id);
      localStorage.setItem(LS_ITEMS, JSON.stringify(updated));
    }
  },

  async getTransactions(): Promise<StockTransaction[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TRANSACTIONS, 'readonly');
        const store = tx.objectStore(STORE_TRANSACTIONS);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as StockTransaction[]) || [];
          // Sort newest first
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const data = localStorage.getItem(LS_TX);
      const list: StockTransaction[] = data ? JSON.parse(data) : [];
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return list;
    }
  },

  async recordTransaction(txRecord: StockTransaction): Promise<StockTransaction> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
        const store = tx.objectStore(STORE_TRANSACTIONS);
        const req = store.add(txRecord);
        req.onsuccess = () => {
          this.backupToLocalStorage();
          resolve(txRecord);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = await this.getTransactions();
      list.unshift(txRecord);
      localStorage.setItem(LS_TX, JSON.stringify(list));
      return txRecord;
    }
  },

  async backupToLocalStorage() {
    try {
      const items = await this.getItems();
      const tx = await this.getTransactions();
      localStorage.setItem(LS_ITEMS, JSON.stringify(items));
      localStorage.setItem(LS_TX, JSON.stringify(tx));
    } catch {
      // ignore
    }
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(CURRENT_USER_KEY);
    } else {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  },

  async seedInitialData(force = false): Promise<Item[]> {
    const hasSeeded = localStorage.getItem(SEED_FLAG_KEY);
    const existing = await this.getItems();

    if (!force && hasSeeded && existing.length > 0) {
      return existing;
    }

    const today = new Date();
    const addDays = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const initialItems: Item[] = [
      {
        id: 'ds-item-1',
        name: 'San Miguel Pale Pilsen 320ml',
        sku: 'DS-BEV-001',
        barcode: '4800016551201',
        category: 'Beverages',
        currentStock: 48,
        minStockThreshold: 24,
        unit: 'bottle',
        costPrice: 52.0,
        sellingPrice: 65.0,
        expiryDate: addDays(120),
        supplier: 'San Miguel Brewery Distributor',
        location: 'Chiller 1',
        notes: 'Best seller evening crowd',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-2',
        name: 'Coca-Cola Original Taste 1.5L',
        sku: 'DS-BEV-002',
        barcode: '4801981110022',
        category: 'Beverages',
        currentStock: 18,
        minStockThreshold: 12,
        unit: 'bottle',
        costPrice: 68.0,
        sellingPrice: 85.0,
        expiryDate: addDays(90),
        supplier: 'Coca-Cola Beverages PH',
        location: 'Beverage Rack A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-3',
        name: 'Century Tuna Flakes in Oil 155g',
        sku: 'DS-CAN-001',
        barcode: '748485100012',
        category: 'Canned Goods',
        currentStock: 4, // LOW STOCK ALERT
        minStockThreshold: 15,
        unit: 'can',
        costPrice: 38.0,
        sellingPrice: 46.0,
        expiryDate: addDays(365),
        supplier: 'Century Pacific Food',
        location: 'Shelf B2',
        notes: 'Low stock - reorder pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-4',
        name: 'Purefoods Corned Beef 150g',
        sku: 'DS-CAN-002',
        barcode: '4800194112028',
        category: 'Canned Goods',
        currentStock: 0, // OUT OF STOCK ALERT
        minStockThreshold: 10,
        unit: 'can',
        costPrice: 62.0,
        sellingPrice: 75.0,
        expiryDate: addDays(400),
        supplier: 'San Miguel Foods',
        location: 'Shelf B2',
        notes: 'Stock ran out yesterday',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-5',
        name: 'Lucky Me! Pancit Canton Kalamansi 80g',
        sku: 'DS-NDL-001',
        barcode: '4800016644217',
        category: 'Instant Noodles & Pasta',
        currentStock: 72,
        minStockThreshold: 30,
        unit: 'pack',
        costPrice: 13.5,
        sellingPrice: 17.0,
        expiryDate: addDays(180),
        supplier: 'Monde Nissin Corp',
        location: 'Shelf C1',
        notes: 'High volume staple item',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-6',
        name: 'Lucky Me! Instant Mami Chicken 55g',
        sku: 'DS-NDL-002',
        barcode: '4800016644330',
        category: 'Instant Noodles & Pasta',
        currentStock: 8, // LOW STOCK ALERT
        minStockThreshold: 20,
        unit: 'pack',
        costPrice: 11.0,
        sellingPrice: 14.0,
        expiryDate: addDays(150),
        supplier: 'Monde Nissin Corp',
        location: 'Shelf C1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-7',
        name: 'Gardenia Classic White Bread 400g',
        sku: 'DS-BAK-001',
        barcode: '4800110001016',
        category: 'Dairy & Bakery',
        currentStock: 12,
        minStockThreshold: 5,
        unit: 'pack',
        costPrice: 65.0,
        sellingPrice: 80.0,
        expiryDate: addDays(3), // EXPIRATION CRITICAL ALERT (<= 7 days)
        supplier: 'Gardenia Bakeries PH',
        location: 'Front Bread Rack',
        notes: 'Short shelf life - display in front',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-8',
        name: 'Bear Brand Fortified Milk Powder 300g',
        sku: 'DS-DRY-001',
        barcode: '7613035332194',
        category: 'Dairy & Bakery',
        currentStock: 16,
        minStockThreshold: 8,
        unit: 'pack',
        costPrice: 128.0,
        sellingPrice: 148.0,
        expiryDate: addDays(18), // EXPIRATION WARNING ALERT (<= 30 days)
        supplier: 'Nestlé Philippines',
        location: 'Shelf D1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-9',
        name: 'Sinandomeng Special Rice 25kg Sack',
        sku: 'DS-RIC-001',
        category: 'Grains & Rice',
        currentStock: 6,
        minStockThreshold: 3,
        unit: 'sack',
        costPrice: 1250.0,
        sellingPrice: 1420.0,
        supplier: 'Bulacan Rice Mill Wholesaler',
        location: 'Pallet 1 (Backroom)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-10',
        name: 'Dinorado Fragrant Rice 1kg Pack',
        sku: 'DS-RIC-002',
        category: 'Grains & Rice',
        currentStock: 3, // LOW STOCK ALERT
        minStockThreshold: 10,
        unit: 'kg',
        costPrice: 58.0,
        sellingPrice: 70.0,
        supplier: 'Bulacan Rice Mill Wholesaler',
        location: 'Rice Bin B',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-11',
        name: 'Silver Swan Soy Sauce 1L Bottle',
        sku: 'DS-CON-001',
        barcode: '4800049720018',
        category: 'Condiments & Sauces',
        currentStock: 24,
        minStockThreshold: 10,
        unit: 'bottle',
        costPrice: 42.0,
        sellingPrice: 52.0,
        expiryDate: addDays(240),
        supplier: 'NutriAsia Inc.',
        location: 'Shelf E2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-12',
        name: 'Datu Puti White Vinegar 1L Bottle',
        sku: 'DS-CON-002',
        barcode: '4800049720124',
        category: 'Condiments & Sauces',
        currentStock: 20,
        minStockThreshold: 10,
        unit: 'bottle',
        costPrice: 38.0,
        sellingPrice: 48.0,
        expiryDate: addDays(300),
        supplier: 'NutriAsia Inc.',
        location: 'Shelf E2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-13',
        name: 'Safeguard Pure White Soap Bar 130g',
        sku: 'DS-PER-001',
        barcode: '4902430752108',
        category: 'Personal Care',
        currentStock: 30,
        minStockThreshold: 12,
        unit: 'pcs',
        costPrice: 44.0,
        sellingPrice: 55.0,
        expiryDate: addDays(500),
        supplier: 'Procter & Gamble PH',
        location: 'Shelf F1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-14',
        name: 'Fresh Bakery Pan De Coco (Pack of 6)',
        sku: 'DS-BAK-002',
        category: 'Dairy & Bakery',
        currentStock: 5,
        minStockThreshold: 4,
        unit: 'pack',
        costPrice: 25.0,
        sellingPrice: 35.0,
        expiryDate: addDays(-2), // EXPIRED ALERT! (-2 days)
        supplier: 'Local Bakery Dueñas Partner',
        location: 'Front Snack Counter',
        notes: 'Expired item demonstration alert',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ds-item-15',
        name: 'Piattos Cheese Flavored Potato Chips 85g',
        sku: 'DS-SNK-002',
        barcode: '4800016052128',
        category: 'Snacks & Confectionery',
        currentStock: 22,
        minStockThreshold: 10,
        unit: 'pack',
        costPrice: 34.0,
        sellingPrice: 42.0,
        expiryDate: addDays(110),
        supplier: 'Universal Robina Corp (URC)',
        location: 'Snack Aisle 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const initialTransactions: StockTransaction[] = [
      {
        id: 'tx-seed-1',
        itemId: 'ds-item-1',
        itemName: 'San Miguel Pale Pilsen 320ml',
        itemSku: 'DS-BEV-001',
        type: 'stock_in',
        quantity: 48,
        previousStock: 0,
        newStock: 48,
        unitPrice: 52.0,
        totalAmount: 2496.0,
        reason: 'supplier_delivery',
        referenceNumber: 'PO-SMB-20261020',
        recordedBy: 'Christiabelle Dueñas',
        notes: 'Weekly beer crate delivery',
        timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 'tx-seed-2',
        itemId: 'ds-item-5',
        itemName: 'Lucky Me! Pancit Canton Kalamansi 80g',
        itemSku: 'DS-NDL-001',
        type: 'stock_in',
        quantity: 100,
        previousStock: 12,
        newStock: 112,
        unitPrice: 13.5,
        totalAmount: 1350.0,
        reason: 'restock',
        referenceNumber: 'REC-MN-9912',
        recordedBy: 'Christiabelle Dueñas',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'tx-seed-3',
        itemId: 'ds-item-5',
        itemName: 'Lucky Me! Pancit Canton Kalamansi 80g',
        itemSku: 'DS-NDL-001',
        type: 'stock_out',
        quantity: 40,
        previousStock: 112,
        newStock: 72,
        unitPrice: 17.0,
        totalAmount: 680.0,
        reason: 'sale',
        referenceNumber: 'POS-DAY-SALE',
        recordedBy: 'Staff Member',
        notes: 'Bulk retail customer purchases',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
      {
        id: 'tx-seed-4',
        itemId: 'ds-item-4',
        itemName: 'Purefoods Corned Beef 150g',
        itemSku: 'DS-CAN-002',
        type: 'stock_out',
        quantity: 10,
        previousStock: 10,
        newStock: 0,
        unitPrice: 75.0,
        totalAmount: 750.0,
        reason: 'sale',
        referenceNumber: 'POS-EVENING',
        recordedBy: 'Staff Member',
        notes: 'Sold out remaining cans',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
    ];

    // Clear and re-populate
    try {
      const db = await openDB();
      const tx = db.transaction([STORE_ITEMS, STORE_TRANSACTIONS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const txStore = tx.objectStore(STORE_TRANSACTIONS);

      itemStore.clear();
      txStore.clear();

      for (const item of initialItems) {
        itemStore.put(item);
      }
      for (const t of initialTransactions) {
        txStore.put(t);
      }
    } catch {
      localStorage.setItem(LS_ITEMS, JSON.stringify(initialItems));
      localStorage.setItem(LS_TX, JSON.stringify(initialTransactions));
    }

    localStorage.setItem(SEED_FLAG_KEY, 'true');
    this.backupToLocalStorage();
    return initialItems;
  },

  async clearAllData(): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction([STORE_ITEMS, STORE_TRANSACTIONS], 'readwrite');
      tx.objectStore(STORE_ITEMS).clear();
      tx.objectStore(STORE_TRANSACTIONS).clear();
    } catch {
      // ignore
    }
    localStorage.removeItem(LS_ITEMS);
    localStorage.removeItem(LS_TX);
    localStorage.removeItem(SEED_FLAG_KEY);
  },
};
