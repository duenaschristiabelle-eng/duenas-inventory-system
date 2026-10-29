import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  Plus,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { StockTransaction, TransactionType } from '../types/inventory';
import { formatPHP, formatDateTime } from '../utils/inventoryRules';

interface TransactionHistoryViewProps {
  transactions: StockTransaction[];
  onOpenStockIn: () => void;
  onOpenStockOut: () => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions,
  onOpenStockIn,
  onOpenStockOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'stock_in' | 'stock_out'>('all');

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }
      if (q) {
        const matchName = t.itemName.toLowerCase().includes(q);
        const matchSku = t.itemSku.toLowerCase().includes(q);
        const matchRef = t.referenceNumber ? t.referenceNumber.toLowerCase().includes(q) : false;
        const matchRecorded = t.recordedBy.toLowerCase().includes(q);
        const matchReason = t.reason.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchRef && !matchRecorded && !matchReason) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, searchQuery, typeFilter]);

  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date & Time',
      'Type',
      'Item Name',
      'SKU',
      'Quantity',
      'Previous Stock',
      'New Stock',
      'Unit Price (PHP)',
      'Total Amount (PHP)',
      'Reason',
      'Reference #',
      'Recorded By',
      'Notes',
    ];

    const rows = filteredTransactions.map((t) => [
      `"${t.id}"`,
      `"${t.timestamp}"`,
      `"${t.type}"`,
      `"${t.itemName.replace(/"/g, '""')}"`,
      `"${t.itemSku}"`,
      t.quantity,
      t.previousStock,
      t.newStock,
      t.unitPrice.toFixed(2),
      t.totalAmount.toFixed(2),
      `"${t.reason}"`,
      `"${t.referenceNumber || ''}"`,
      `"${t.recordedBy}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Duenas_Store_Transactions_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Controls Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-neutral-900">
              Stock In & Stock Out Ledger
            </h1>
            <p className="text-xs text-neutral-500">
              Complete audit history of inventory movements ({filteredTransactions.length} records)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenStockIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Stock In</span>
            </button>
            <button
              onClick={onOpenStockOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors shadow-xs"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Stock Out</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by product name, SKU, PO/receipt #, staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Movements (Stock In & Out)</option>
              <option value="stock_in">Stock In (Deliveries & Restock)</option>
              <option value="stock_out">Stock Out (Sales & Disposals)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-xs">
            No stock movement records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Stock Impact</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4">Reason / Ref #</th>
                  <th className="py-3 px-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-neutral-600 whitespace-nowrap font-mono text-[11px]">
                      {formatDateTime(tx.timestamp)}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.type === 'stock_in' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Stock In</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Stock Out</span>
                        </span>
                      )}
                    </td>

                    {/* Item */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900 leading-snug">
                        {tx.itemName}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {tx.itemSku}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-mono tabular-nums font-bold text-sm ${
                          tx.type === 'stock_in' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {tx.type === 'stock_in' ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                    </td>

                    {/* Stock Impact */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums text-neutral-600 text-[11px]">
                      {tx.previousStock} → <strong className="text-neutral-900">{tx.newStock}</strong>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums text-neutral-800">
                      {formatPHP(tx.totalAmount)}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4">
                      <div className="capitalize text-neutral-900 font-medium">
                        {tx.reason.replace(/_/g, ' ')}
                      </div>
                      {tx.referenceNumber && (
                        <div className="text-[11px] text-neutral-500 font-mono">
                          Ref: {tx.referenceNumber}
                        </div>
                      )}
                      {tx.notes && (
                        <div className="text-[10px] text-neutral-400 italic">
                          "{tx.notes}"
                        </div>
                      )}
                    </td>

                    {/* Recorded By */}
                    <td className="py-3 px-4 text-neutral-600 whitespace-nowrap text-[11px]">
                      {tx.recordedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
