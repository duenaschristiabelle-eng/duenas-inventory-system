import React, { useState } from 'react';
import {
  FileBarChart2,
  Download,
  Printer,
  Calendar,
  Layers,
  AlertTriangle,
  Clock,
  Boxes,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Item, StockSummaryReport } from '../types/inventory';
import {
  formatPHP,
  formatDate,
  calculateStockStatus,
  calculateExpirationStatus,
  calculateDaysRemaining,
} from '../utils/inventoryRules';

interface ReportsViewProps {
  report: StockSummaryReport;
  items: Item[];
  storeName: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  report,
  items,
  storeName,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const now = new Date();

  // Export report to CSV
  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Item Name',
      'Category',
      'Stock Level',
      'Unit',
      'Cost Price (PHP)',
      'Selling Price (PHP)',
      'Total Cost Value (PHP)',
      'Total Retail Value (PHP)',
      'Stock Status',
      'Min Threshold',
      'Expiration Date',
      'Location',
      'Supplier',
    ];

    const rows = items.map((item) => {
      const stockStatus = calculateStockStatus(item.currentStock, item.minStockThreshold);
      const totalCost = (item.currentStock * item.costPrice).toFixed(2);
      const totalRetail = (item.currentStock * item.sellingPrice).toFixed(2);
      return [
        `"${item.sku}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        item.currentStock,
        `"${item.unit}"`,
        item.costPrice.toFixed(2),
        item.sellingPrice.toFixed(2),
        totalCost,
        totalRetail,
        `"${stockStatus}"`,
        item.minStockThreshold,
        `"${item.expiryDate || 'N/A'}"`,
        `"${item.location || ''}"`,
        `"${(item.supplier || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Duenas_Store_Stock_Summary_${now.toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              <span>Official Store Reporting</span>
              <span>·</span>
              <span>{now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
              Stock Summary & Valuation Report
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
              Comprehensive audit of store inventory, asset value, low stock warnings, and shelf life
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Formal Report Header */}
        <div className="border-b border-neutral-200 pb-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-display font-bold text-2xl text-neutral-900">
                {storeName}
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Store Inventory Status & Asset Summary Report
              </p>
            </div>
            <div className="text-right text-xs text-neutral-500">
              <p className="font-semibold text-neutral-800">Generated: {now.toLocaleString()}</p>
              <p>Store Database: Local IndexedDB</p>
            </div>
          </div>
        </div>

        {/* Executive KPI Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80">
            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider block">
              Total SKUs & Units
            </span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
                {report.totalStockUnits}
              </span>
              <span className="text-xs text-neutral-500 ml-1.5">units</span>
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Across {report.totalItems} distinct products
            </span>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80">
            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider block">
              Total Cost Value
            </span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
                {formatPHP(report.totalCostValue)}
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Acquisition / wholesale investment
            </span>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80">
            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider block">
              Total Retail Value
            </span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
                {formatPHP(report.totalRetailValue)}
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block font-mono">
              +{formatPHP(report.potentialProfit)} projected gross margin
            </span>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80">
            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider block">
              Alerts & Risk Watch
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-800 font-mono tabular-nums">
                {report.lowStockCount}
              </span>
              <span className="text-xs text-neutral-500">low stock</span>
            </div>
            <span className="text-[11px] text-rose-700 font-medium mt-1 block">
              {report.expiredCount} expired · {report.expiringIn30DaysCount} expiring in 30d
            </span>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-neutral-900">
            1. Category Valuation & Stock Breakdown
          </h3>
          <div className="overflow-x-auto border border-neutral-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider text-[11px] border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Products</th>
                  <th className="py-2.5 px-4 text-right">Units on Hand</th>
                  <th className="py-2.5 px-4 text-right">Total Cost</th>
                  <th className="py-2.5 px-4 text-right">Retail Value</th>
                  <th className="py-2.5 px-4 text-right">Low Stock Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono tabular-nums">
                {report.categoryBreakdown.map((cat) => (
                  <tr key={cat.category} className="hover:bg-neutral-50/60">
                    <td className="py-2.5 px-4 font-sans font-semibold text-neutral-900">
                      {cat.category}
                    </td>
                    <td className="py-2.5 px-4 text-right text-neutral-600">
                      {cat.itemCount}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-neutral-900">
                      {cat.totalStockUnits}
                    </td>
                    <td className="py-2.5 px-4 text-right text-neutral-600">
                      {formatPHP(cat.totalCostValue)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-neutral-900">
                      {formatPHP(cat.totalRetailValue)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {cat.lowStockCount > 0 ? (
                        <span className="text-amber-700 font-semibold">
                          {cat.lowStockCount}
                        </span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-50/80 font-bold font-mono tabular-nums border-t border-neutral-200">
                <tr>
                  <td className="py-3 px-4 font-sans text-neutral-900">Total Portfolio</td>
                  <td className="py-3 px-4 text-right">{report.totalItems}</td>
                  <td className="py-3 px-4 text-right text-neutral-900">{report.totalStockUnits}</td>
                  <td className="py-3 px-4 text-right">{formatPHP(report.totalCostValue)}</td>
                  <td className="py-3 px-4 text-right text-emerald-800">{formatPHP(report.totalRetailValue)}</td>
                  <td className="py-3 px-4 text-right text-amber-800">{report.lowStockCount}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Detailed Item Inventory Audit Table */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-display font-bold text-base text-neutral-900">
              2. Complete Item Inventory Ledger
            </h3>
            {/* Filter category on screen */}
            <div className="no-print">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1 px-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              >
                <option value="All">Filter by Category: All</option>
                {report.categoryBreakdown.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-neutral-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold uppercase tracking-wider text-[11px] border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Stock</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-right">Retail Price</th>
                  <th className="py-2.5 px-3 text-right">Total Retail Val</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredItems.map((item) => {
                  const stockStatus = calculateStockStatus(item.currentStock, item.minStockThreshold);
                  const expStatus = calculateExpirationStatus(item.expiryDate);
                  const days = calculateDaysRemaining(item.expiryDate);

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 px-3 font-mono text-neutral-500 text-[11px]">
                        {item.sku}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-neutral-900">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 text-[11px]">
                        {item.category}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {item.currentStock}{' '}
                        <span className="font-normal text-[10px] text-neutral-500">
                          {item.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600">
                        {formatPHP(item.costPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-neutral-900">
                        {formatPHP(item.sellingPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {formatPHP(item.currentStock * item.sellingPrice)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-600">
                        {item.expiryDate ? formatDate(item.expiryDate) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        {stockStatus === 'out_of_stock' ? (
                          <span className="text-rose-700 font-bold">Out of stock</span>
                        ) : stockStatus === 'low_stock' ? (
                          <span className="text-amber-800 font-semibold">Low stock</span>
                        ) : (
                          <span className="text-emerald-700">Healthy</span>
                        )}
                        {expStatus === 'expired' && (
                          <span className="block text-[10px] text-rose-700 font-semibold">
                            Expired!
                          </span>
                        )}
                        {expStatus === 'critical' && (
                          <span className="block text-[10px] text-rose-600 font-semibold">
                            Exp in {days}d
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer for Report */}
        <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Dueñas Store Inventory Management System</span>
          <span>End of Stock Summary Report</span>
        </div>

      </div>

    </div>
  );
};
