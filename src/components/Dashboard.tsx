import React, { useState } from 'react';
import {
  Package,
  TrendingDown,
  Plus,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Boxes,
  DollarSign,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  Item,
  StockTransaction,
  LowStockAlert,
  ExpirationAlert,
  StockSummaryReport,
} from '../types/inventory';
import {
  formatPHP,
  formatDate,
  formatDateTime,
  calculateStockStatus,
} from '../utils/inventoryRules';

interface DashboardProps {
  items: Item[];
  transactions: StockTransaction[];
  report: StockSummaryReport;
  lowStockAlerts: LowStockAlert[];
  expirationAlerts: ExpirationAlert[];
  onNavigateToItems: (filter?: 'all' | 'low_stock' | 'out_of_stock' | 'expiring') => void;
  onNavigateToTransactions: () => void;
  onNavigateToReports: () => void;
  onOpenStockIn: (item?: Item) => void;
  onOpenStockOut: (item?: Item) => void;
  onOpenAddItem: () => void;
  onResetSeedData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  items,
  transactions,
  report,
  lowStockAlerts,
  expirationAlerts,
  onNavigateToItems,
  onNavigateToTransactions,
  onNavigateToReports,
  onOpenStockIn,
  onOpenStockOut,
  onOpenAddItem,
  onResetSeedData,
}) => {
  const [activeAlertTab, setActiveAlertTab] = useState<'low_stock' | 'expiration'>('low_stock');

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              <span>Dueñas Store Overview</span>
              <span className="text-neutral-300">·</span>
              <span className="text-emerald-700 font-medium">Local Database Active</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
              Store Inventory Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
              Live tracking for {report.totalItems} store items and {report.totalStockUnits} total stock units on shelves.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenStockIn()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Stock In</span>
            </button>
            <button
              onClick={() => onOpenStockOut()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs transition-colors"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Stock Out</span>
            </button>
            <button
              onClick={onOpenAddItem}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total SKUs & Units */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Inventory
              </span>
              <Boxes className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums">
                {report.totalStockUnits}
              </span>
              <span className="text-xs text-neutral-500">units in stock</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500">{report.totalItems} active SKUs</span>
            <button
              onClick={() => onNavigateToItems('all')}
              className="text-amber-800 font-semibold hover:text-amber-900 flex items-center gap-0.5"
            >
              <span>View catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Metric 2: Inventory Valuation */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Retail Valuation
              </span>
              <DollarSign className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="mt-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums">
                {formatPHP(report.totalRetailValue)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Cost: <span className="font-mono tabular-nums text-neutral-700">{formatPHP(report.totalCostValue)}</span></span>
            <span className="text-emerald-700 font-semibold font-mono tabular-nums">+{formatPHP(report.potentialProfit)}</span>
          </div>
        </div>

        {/* Metric 3: Low Stock Alerts */}
        <div
          onClick={() => onNavigateToItems('low_stock')}
          className={`cursor-pointer bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors ${
            lowStockAlerts.length > 0
              ? 'border-amber-300 hover:border-amber-400'
              : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Low Stock Alerts
              </span>
              <AlertTriangle className={`w-4 h-4 ${lowStockAlerts.length > 0 ? 'text-amber-700' : 'text-neutral-400'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums">
                {lowStockAlerts.length}
              </span>
              <span className="text-xs text-neutral-500">items need reorder</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-rose-700 font-medium">
              {report.outOfStockCount > 0 ? `${report.outOfStockCount} out of stock` : 'None out of stock'}
            </span>
            <span className="text-amber-800 font-semibold flex items-center gap-0.5">
              <span>Review list</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Metric 4: Expiration Alerts */}
        <div
          onClick={() => onNavigateToItems('expiring')}
          className={`cursor-pointer bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors ${
            expirationAlerts.length > 0
              ? 'border-rose-300 hover:border-rose-400'
              : 'border-neutral-200 hover:border-neutral-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Expiration Alerts
              </span>
              <Clock className={`w-4 h-4 ${expirationAlerts.length > 0 ? 'text-rose-700' : 'text-neutral-400'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums">
                {expirationAlerts.length}
              </span>
              <span className="text-xs text-neutral-500">expired / near expiry</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              {report.expiredCount > 0 ? `${report.expiredCount} expired already` : 'No expired items'}
            </span>
            <span className="text-rose-700 font-semibold flex items-center gap-0.5">
              <span>Check dates</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Priority Attention (Low Stock & Expiration Tabs) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-base text-neutral-900">
                Action Items & Store Alerts
              </h2>
              <p className="text-xs text-neutral-500">
                Timely replenishment and spoilage prevention
              </p>
            </div>

            {/* Segmented Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
              <button
                onClick={() => setActiveAlertTab('low_stock')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeAlertTab === 'low_stock'
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Low Stock ({lowStockAlerts.length})
              </button>
              <button
                onClick={() => setActiveAlertTab('expiration')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeAlertTab === 'expiration'
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Expiration Watch ({expirationAlerts.length})
              </button>
            </div>
          </div>

          <div className="divide-y divide-neutral-100 max-h-[420px] overflow-y-auto">
            {activeAlertTab === 'low_stock' ? (
              lowStockAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900">Stock Levels Healthy</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    All items are currently above their minimum inventory threshold.
                  </p>
                </div>
              ) : (
                lowStockAlerts.map((alert) => (
                  <div
                    key={alert.item.id}
                    className="p-4 sm:px-5 flex items-center justify-between gap-3 hover:bg-neutral-50/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-400">
                          {alert.item.sku}
                        </span>
                        <span className="text-xs text-neutral-400">·</span>
                        <span className="text-xs text-neutral-500">
                          {alert.item.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-900 truncate mt-0.5">
                        {alert.item.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="font-medium text-neutral-600">
                          Current: <strong className="font-mono tabular-nums text-neutral-900">{alert.item.currentStock} {alert.item.unit}</strong>
                        </span>
                        <span className="text-neutral-300">|</span>
                        <span className="text-neutral-500">
                          Min required: <strong className="font-mono tabular-nums text-neutral-700">{alert.item.minStockThreshold} {alert.item.unit}</strong>
                        </span>
                        {alert.severity === 'out_of_stock' ? (
                          <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            Deficit: {alert.deficit} {alert.item.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => onOpenStockIn(alert.item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                        title="Quick Restock"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              expirationAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900">No Imminent Expirations</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    No products expiring in the next 30 days.
                  </p>
                </div>
              ) : (
                expirationAlerts.map((alert) => (
                  <div
                    key={alert.item.id}
                    className="p-4 sm:px-5 flex items-center justify-between gap-3 hover:bg-neutral-50/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-400">
                          {alert.item.sku}
                        </span>
                        <span className="text-xs text-neutral-400">·</span>
                        <span className="text-xs text-neutral-500">
                          {alert.item.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-900 truncate mt-0.5">
                        {alert.item.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <span className="text-neutral-500">
                          Expiry: <strong className="text-neutral-800 font-mono">{formatDate(alert.item.expiryDate || '')}</strong>
                        </span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-neutral-500">
                          Stock: <strong className="font-mono tabular-nums text-neutral-800">{alert.item.currentStock} {alert.item.unit}</strong>
                        </span>
                        <span className="text-neutral-300">·</span>
                        {alert.status === 'expired' ? (
                          <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            Expired {Math.abs(alert.daysRemaining)} days ago
                          </span>
                        ) : alert.status === 'critical' ? (
                          <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            Expires in {alert.daysRemaining} days!
                          </span>
                        ) : (
                          <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            {alert.daysRemaining} days remaining
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => onOpenStockOut(alert.item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                        title="Record Stock Out or Disposal"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Dispose / Issue</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-neutral-900">
                  Recent Stock Activity
                </h2>
                <p className="text-xs text-neutral-500">
                  Latest stock-ins and stock-outs
                </p>
              </div>
              <button
                onClick={onNavigateToTransactions}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
              >
                <span>View all logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-neutral-100 max-h-[420px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs">
                  No stock transactions recorded yet. Use the buttons above to record your first stock-in or stock-out.
                </div>
              ) : (
                transactions.slice(0, 6).map((tx) => (
                  <div key={tx.id} className="p-4 flex items-start gap-3 hover:bg-neutral-50/70 transition-colors">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        tx.type === 'stock_in'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {tx.type === 'stock_in' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-neutral-900 truncate">
                          {tx.itemName}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold tabular-nums ${
                            tx.type === 'stock_in' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {tx.type === 'stock_in' ? `+${tx.quantity}` : `-${tx.quantity}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                        <span className="capitalize">{tx.reason.replace(/_/g, ' ')}</span>
                        <span>·</span>
                        <span>Stock: {tx.previousStock} → {tx.newStock}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1 flex items-center justify-between">
                        <span>{tx.recordedBy}</span>
                        <span>{formatDateTime(tx.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
            <button
              onClick={onNavigateToReports}
              className="text-xs font-medium text-neutral-700 hover:text-neutral-900 flex items-center gap-1.5"
            >
              <span>View full inventory valuation report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onResetSeedData}
              className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700"
              title="Reset sample inventory data for demo"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>

      </div>

      {/* Category Breakdown Glance */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-base text-neutral-900">
              Inventory by Department / Category
            </h3>
            <p className="text-xs text-neutral-500">
              Stock distribution and valuation breakdown across categories
            </p>
          </div>
          <button
            onClick={onNavigateToReports}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
          >
            <span>Detailed report</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {report.categoryBreakdown.slice(0, 5).map((cat) => (
            <div
              key={cat.category}
              className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
            >
              <span className="text-xs font-semibold text-neutral-900 block truncate">
                {cat.category}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-bold text-neutral-900 font-mono tabular-nums">
                  {cat.totalStockUnits}
                </span>
                <span className="text-[11px] text-neutral-500">units</span>
              </div>
              <div className="mt-1 text-[11px] text-neutral-500 font-mono tabular-nums">
                Val: {formatPHP(cat.totalRetailValue)}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
