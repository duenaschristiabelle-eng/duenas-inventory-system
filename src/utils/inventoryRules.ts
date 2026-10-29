import {
  Item,
  StockStatus,
  ExpirationStatus,
  LowStockAlert,
  ExpirationAlert,
  StockSummaryReport,
  CategorySummary,
  ItemCategory,
  TransactionType,
} from '../types/inventory';

export function calculateStockStatus(currentStock: number, minThreshold: number): StockStatus {
  if (currentStock <= 0) return 'out_of_stock';
  if (currentStock <= minThreshold) return 'low_stock';
  return 'healthy';
}

export function calculateDaysRemaining(
  expiryDateStr?: string,
  referenceDate: Date = new Date()
): number | null {
  if (!expiryDateStr) return null;
  const expiry = new Date(expiryDateStr + 'T00:00:00');
  if (isNaN(expiry.getTime())) return null;

  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - ref.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateExpirationStatus(
  expiryDateStr?: string,
  referenceDate: Date = new Date()
): ExpirationStatus {
  const days = calculateDaysRemaining(expiryDateStr, referenceDate);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'good';
}

export function validateStockTransaction(
  currentItem: Item,
  type: TransactionType,
  quantity: number
): { valid: boolean; newStock: number; error?: string } {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return {
      valid: false,
      newStock: currentItem.currentStock,
      error: 'Quantity must be a positive number greater than zero',
    };
  }

  if (type === 'stock_in') {
    const newStock = currentItem.currentStock + quantity;
    return { valid: true, newStock };
  }

  // stock_out
  if (quantity > currentItem.currentStock) {
    return {
      valid: false,
      newStock: currentItem.currentStock,
      error: `Insufficient stock: only ${currentItem.currentStock} ${currentItem.unit} currently available.`,
    };
  }

  const newStock = currentItem.currentStock - quantity;
  return { valid: true, newStock };
}

export function getLowStockAlerts(items: Item[]): LowStockAlert[] {
  const alerts: LowStockAlert[] = [];

  for (const item of items) {
    if (item.currentStock <= item.minStockThreshold) {
      alerts.push({
        item,
        deficit: Math.max(0, item.minStockThreshold - item.currentStock),
        severity: item.currentStock <= 0 ? 'out_of_stock' : 'low_stock',
      });
    }
  }

  // Sort: out_of_stock first, then highest deficit
  return alerts.sort((a, b) => {
    if (a.severity === 'out_of_stock' && b.severity !== 'out_of_stock') return -1;
    if (b.severity === 'out_of_stock' && a.severity !== 'out_of_stock') return 1;
    return b.deficit - a.deficit;
  });
}

export function getExpirationAlerts(
  items: Item[],
  referenceDate: Date = new Date()
): ExpirationAlert[] {
  const alerts: ExpirationAlert[] = [];

  for (const item of items) {
    if (!item.expiryDate) continue;
    const days = calculateDaysRemaining(item.expiryDate, referenceDate);
    if (days !== null && days <= 30) {
      let status: 'expired' | 'critical' | 'warning' = 'warning';
      if (days < 0) status = 'expired';
      else if (days <= 7) status = 'critical';

      alerts.push({
        item,
        daysRemaining: days,
        status,
      });
    }
  }

  // Sort: expired first (most negative days), then shortest days remaining
  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function generateStockSummaryReport(
  items: Item[],
  referenceDate: Date = new Date()
): StockSummaryReport {
  let totalStockUnits = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;
  let expiredCount = 0;
  let expiringIn30DaysCount = 0;

  const categoryMap = new Map<
    ItemCategory,
    { count: number; units: number; cost: number; retail: number; lowStock: number }
  >();

  for (const item of items) {
    const stock = Math.max(0, item.currentStock);
    totalStockUnits += stock;
    const cost = stock * item.costPrice;
    const retail = stock * item.sellingPrice;
    totalCostValue += cost;
    totalRetailValue += retail;

    if (stock <= 0) {
      outOfStockCount++;
      lowStockCount++;
    } else if (stock <= item.minStockThreshold) {
      lowStockCount++;
    }

    if (item.expiryDate) {
      const days = calculateDaysRemaining(item.expiryDate, referenceDate);
      if (days !== null) {
        if (days < 0) expiredCount++;
        else if (days <= 30) expiringIn30DaysCount++;
      }
    }

    const catData = categoryMap.get(item.category) || {
      count: 0,
      units: 0,
      cost: 0,
      retail: 0,
      lowStock: 0,
    };
    catData.count += 1;
    catData.units += stock;
    catData.cost += cost;
    catData.retail += retail;
    if (stock <= item.minStockThreshold) {
      catData.lowStock += 1;
    }
    categoryMap.set(item.category, catData);
  }

  const categoryBreakdown: CategorySummary[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      itemCount: data.count,
      totalStockUnits: data.units,
      totalCostValue: Number(data.cost.toFixed(2)),
      totalRetailValue: Number(data.retail.toFixed(2)),
      lowStockCount: data.lowStock,
    })
  );

  // Sort categories by total value descending
  categoryBreakdown.sort((a, b) => b.totalRetailValue - a.totalRetailValue);

  return {
    totalItems: items.length,
    totalStockUnits,
    totalCostValue: Number(totalCostValue.toFixed(2)),
    totalRetailValue: Number(totalRetailValue.toFixed(2)),
    potentialProfit: Number((totalRetailValue - totalCostValue).toFixed(2)),
    outOfStockCount,
    lowStockCount,
    expiredCount,
    expiringIn30DaysCount,
    categoryBreakdown,
  };
}

export function formatPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
