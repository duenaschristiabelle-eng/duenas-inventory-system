import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStockStatus,
  calculateDaysRemaining,
  calculateExpirationStatus,
  validateStockTransaction,
  getLowStockAlerts,
  getExpirationAlerts,
  generateStockSummaryReport,
} from './inventoryRules';
import { Item } from '../types/inventory';

const mockBaseItem: Item = {
  id: 'test-1',
  name: 'Lucky Me Pancit Canton Kalamansi',
  sku: 'DS-SNK-001',
  category: 'Instant Noodles & Pasta',
  currentStock: 25,
  minStockThreshold: 10,
  unit: 'pack',
  costPrice: 12.5,
  sellingPrice: 16.0,
  expiryDate: '2026-12-31',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

test('calculateStockStatus correctly categorizes health', () => {
  assert.equal(calculateStockStatus(0, 10), 'out_of_stock');
  assert.equal(calculateStockStatus(-2, 10), 'out_of_stock');
  assert.equal(calculateStockStatus(5, 10), 'low_stock');
  assert.equal(calculateStockStatus(10, 10), 'low_stock');
  assert.equal(calculateStockStatus(11, 10), 'healthy');
  assert.equal(calculateStockStatus(100, 10), 'healthy');
});

test('calculateDaysRemaining and calculateExpirationStatus', () => {
  const refDate = new Date('2026-10-29T00:00:00.000Z');

  // Expired yesterday
  assert.equal(calculateDaysRemaining('2026-10-28', refDate), -1);
  assert.equal(calculateExpirationStatus('2026-10-28', refDate), 'expired');

  // Expiring today
  assert.equal(calculateDaysRemaining('2026-10-29', refDate), 0);
  assert.equal(calculateExpirationStatus('2026-10-29', refDate), 'critical');

  // Expiring in 5 days
  assert.equal(calculateDaysRemaining('2026-11-03', refDate), 5);
  assert.equal(calculateExpirationStatus('2026-11-03', refDate), 'critical');

  // Expiring in 15 days
  assert.equal(calculateDaysRemaining('2026-11-13', refDate), 15);
  assert.equal(calculateExpirationStatus('2026-11-13', refDate), 'warning');

  // Expiring in 90 days
  assert.equal(calculateDaysRemaining('2027-01-27', refDate), 90);
  assert.equal(calculateExpirationStatus('2027-01-27', refDate), 'good');

  // No expiry
  assert.equal(calculateDaysRemaining(undefined, refDate), null);
  assert.equal(calculateExpirationStatus(undefined, refDate), 'none');
});

test('validateStockTransaction handles stock-in and stock-out correctly', () => {
  const item: Item = { ...mockBaseItem, currentStock: 20 };

  // Valid stock-in
  const inRes = validateStockTransaction(item, 'stock_in', 10);
  assert.equal(inRes.valid, true);
  assert.equal(inRes.newStock, 30);

  // Valid stock-out
  const outRes = validateStockTransaction(item, 'stock_out', 5);
  assert.equal(outRes.valid, true);
  assert.equal(outRes.newStock, 15);

  // Exact stock-out to zero
  const exactOut = validateStockTransaction(item, 'stock_out', 20);
  assert.equal(exactOut.valid, true);
  assert.equal(exactOut.newStock, 0);

  // Over-stock out (excessive)
  const overOut = validateStockTransaction(item, 'stock_out', 25);
  assert.equal(overOut.valid, false);
  assert.equal(overOut.newStock, 20);
  assert.match(overOut.error || '', /Insufficient stock/);

  // Negative quantity rejection
  const negQty = validateStockTransaction(item, 'stock_in', -5);
  assert.equal(negQty.valid, false);
});

test('getLowStockAlerts returns low stock and out of stock items sorted', () => {
  const items: Item[] = [
    { ...mockBaseItem, id: '1', currentStock: 15, minStockThreshold: 10 }, // Healthy
    { ...mockBaseItem, id: '2', currentStock: 4, minStockThreshold: 10 },  // Low stock (deficit 6)
    { ...mockBaseItem, id: '3', currentStock: 0, minStockThreshold: 10 },  // Out of stock
    { ...mockBaseItem, id: '4', currentStock: 2, minStockThreshold: 15 },  // Low stock (deficit 13)
  ];

  const alerts = getLowStockAlerts(items);
  assert.equal(alerts.length, 3);
  // Out of stock must come first
  assert.equal(alerts[0].item.id, '3');
  assert.equal(alerts[0].severity, 'out_of_stock');
  // Highest deficit next
  assert.equal(alerts[1].item.id, '4');
  assert.equal(alerts[2].item.id, '2');
});

test('getExpirationAlerts filters and sorts expiring items', () => {
  const refDate = new Date('2026-10-29T00:00:00.000Z');
  const items: Item[] = [
    { ...mockBaseItem, id: '1', expiryDate: '2026-10-20' }, // Expired (-9 days)
    { ...mockBaseItem, id: '2', expiryDate: '2026-11-05' }, // Critical (+7 days)
    { ...mockBaseItem, id: '3', expiryDate: '2026-11-20' }, // Warning (+22 days)
    { ...mockBaseItem, id: '4', expiryDate: '2027-05-01' }, // Good (> 30 days)
    { ...mockBaseItem, id: '5', expiryDate: undefined },    // None
  ];

  const alerts = getExpirationAlerts(items, refDate);
  assert.equal(alerts.length, 3);
  assert.equal(alerts[0].item.id, '1');
  assert.equal(alerts[0].status, 'expired');
  assert.equal(alerts[1].item.id, '2');
  assert.equal(alerts[1].status, 'critical');
  assert.equal(alerts[2].item.id, '3');
  assert.equal(alerts[2].status, 'warning');
});

test('generateStockSummaryReport computes accurate valuation and breakdown', () => {
  const refDate = new Date('2026-10-29T00:00:00.000Z');
  const items: Item[] = [
    {
      ...mockBaseItem,
      id: '1',
      category: 'Instant Noodles & Pasta',
      currentStock: 10,
      costPrice: 10,
      sellingPrice: 15,
      minStockThreshold: 5,
      expiryDate: '2026-12-01',
    },
    {
      ...mockBaseItem,
      id: '2',
      category: 'Beverages',
      currentStock: 20,
      costPrice: 20,
      sellingPrice: 25,
      minStockThreshold: 25, // Low stock
      expiryDate: '2026-10-15', // Expired
    },
    {
      ...mockBaseItem,
      id: '3',
      category: 'Beverages',
      currentStock: 0, // Out of stock
      costPrice: 50,
      sellingPrice: 65,
      minStockThreshold: 5,
      expiryDate: '2026-11-10', // Expiring in 12 days
    },
  ];

  const report = generateStockSummaryReport(items, refDate);
  assert.equal(report.totalItems, 3);
  assert.equal(report.totalStockUnits, 30); // 10 + 20 + 0

  // Cost: (10*10) + (20*20) + (0*50) = 100 + 400 + 0 = 500
  assert.equal(report.totalCostValue, 500);

  // Retail: (10*15) + (20*25) + (0*65) = 150 + 500 + 0 = 650
  assert.equal(report.totalRetailValue, 650);

  // Profit: 650 - 500 = 150
  assert.equal(report.potentialProfit, 150);

  assert.equal(report.outOfStockCount, 1);
  assert.equal(report.lowStockCount, 2); // id 2 and id 3
  assert.equal(report.expiredCount, 1); // id 2
  assert.equal(report.expiringIn30DaysCount, 1); // id 3

  assert.equal(report.categoryBreakdown.length, 2);
});
