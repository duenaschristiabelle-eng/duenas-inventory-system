export type ItemCategory =
  | 'Beverages'
  | 'Canned Goods'
  | 'Instant Noodles & Pasta'
  | 'Grains & Rice'
  | 'Condiments & Sauces'
  | 'Snacks & Confectionery'
  | 'Dairy & Bakery'
  | 'Personal Care'
  | 'Household & Cleaning'
  | 'General Merchandise';

export type ItemUnit =
  | 'pcs'
  | 'pack'
  | 'bottle'
  | 'can'
  | 'sachet'
  | 'kg'
  | 'sack'
  | 'box';

export interface Item {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: ItemCategory;
  currentStock: number;
  minStockThreshold: number;
  unit: ItemUnit;
  costPrice: number;
  sellingPrice: number;
  expiryDate?: string; // YYYY-MM-DD
  supplier?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'stock_in' | 'stock_out';

export type StockInReason =
  | 'supplier_delivery'
  | 'restock'
  | 'customer_return'
  | 'audit_adjustment';

export type StockOutReason =
  | 'sale'
  | 'damaged'
  | 'expired'
  | 'personal_use'
  | 'loss_theft'
  | 'audit_adjustment';

export type TransactionReason = StockInReason | StockOutReason;

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  type: TransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitPrice: number;
  totalAmount: number;
  reason: TransactionReason;
  referenceNumber?: string;
  recordedBy: string;
  notes?: string;
  timestamp: string; // ISO 8601
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
  storeName: string;
}

export type StockStatus = 'out_of_stock' | 'low_stock' | 'healthy';
export type ExpirationStatus = 'expired' | 'critical' | 'warning' | 'good' | 'none';

export interface LowStockAlert {
  item: Item;
  deficit: number;
  severity: 'out_of_stock' | 'low_stock';
}

export interface ExpirationAlert {
  item: Item;
  daysRemaining: number;
  status: 'expired' | 'critical' | 'warning';
}

export interface CategorySummary {
  category: ItemCategory;
  itemCount: number;
  totalStockUnits: number;
  totalCostValue: number;
  totalRetailValue: number;
  lowStockCount: number;
}

export interface StockSummaryReport {
  totalItems: number;
  totalStockUnits: number;
  totalCostValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  outOfStockCount: number;
  lowStockCount: number;
  expiredCount: number;
  expiringIn30DaysCount: number;
  categoryBreakdown: CategorySummary[];
}
