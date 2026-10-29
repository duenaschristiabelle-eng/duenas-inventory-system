import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Package,
  Layers,
  CheckCircle,
} from 'lucide-react';
import {
  Item,
  StockTransaction,
  TransactionType,
  TransactionReason,
  User,
} from '../types/inventory';
import { validateStockTransaction, formatPHP } from '../utils/inventoryRules';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (tx: StockTransaction, updatedItem: Item) => void;
  items: Item[];
  preselectedItem?: Item | null;
  defaultType?: TransactionType;
  currentUser: User | null;
}

const STOCK_IN_REASONS: { value: TransactionReason; label: string }[] = [
  { value: 'supplier_delivery', label: 'Supplier Delivery / PO Arrival' },
  { value: 'restock', label: 'Store Replenishment / Restock' },
  { value: 'customer_return', label: 'Customer Return / Exchange' },
  { value: 'audit_adjustment', label: 'Inventory Audit (+ Found Stock)' },
];

const STOCK_OUT_REASONS: { value: TransactionReason; label: string }[] = [
  { value: 'sale', label: 'Store Sale / Retail Customer Purchase' },
  { value: 'damaged', label: 'Damaged / Spoilage / Broken' },
  { value: 'expired', label: 'Expired Product Disposal' },
  { value: 'personal_use', label: 'Personal Use / Owner Consumption' },
  { value: 'loss_theft', label: 'Loss / Shrinkage / Missing' },
  { value: 'audit_adjustment', label: 'Inventory Audit (- Discrepancy)' },
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onRecord,
  items,
  preselectedItem,
  defaultType = 'stock_in',
  currentUser,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<TransactionReason>('supplier_delivery');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Sync state when opened
  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id);
      setUnitPrice(defaultType === 'stock_in' ? preselectedItem.costPrice : preselectedItem.sellingPrice);
    } else if (items.length > 0) {
      setSelectedItemId(items[0].id);
      setUnitPrice(defaultType === 'stock_in' ? items[0].costPrice : items[0].sellingPrice);
    }
    setType(defaultType);
    setReason(defaultType === 'stock_in' ? 'supplier_delivery' : 'sale');
    setQuantity(1);
    setReferenceNumber('');
    setNotes('');
    setError(null);
  }, [isOpen, preselectedItem, defaultType, items]);

  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId);
  }, [items, selectedItemId]);

  // Adjust unit price default when item or type changes
  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setUnitPrice(type === 'stock_in' ? item.costPrice : item.sellingPrice);
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'stock_in') {
      setReason('supplier_delivery');
      if (selectedItem) setUnitPrice(selectedItem.costPrice);
    } else {
      setReason('sale');
      if (selectedItem) setUnitPrice(selectedItem.sellingPrice);
    }
  };

  if (!isOpen) return null;

  // Validation
  const validation = selectedItem
    ? validateStockTransaction(selectedItem, type, quantity)
    : { valid: false, newStock: 0, error: 'No item selected' };

  const totalAmount = quantity * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedItem) {
      setError('Please select an item');
      return;
    }

    if (!validation.valid) {
      setError(validation.error || 'Invalid transaction values');
      return;
    }

    const now = new Date().toISOString();
    const txRecord: StockTransaction = {
      id: `tx-${Date.now()}`,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemSku: selectedItem.sku,
      type,
      quantity,
      previousStock: selectedItem.currentStock,
      newStock: validation.newStock,
      unitPrice,
      totalAmount,
      reason,
      referenceNumber: referenceNumber.trim() || undefined,
      recordedBy: currentUser?.name || 'Store Staff',
      notes: notes.trim() || undefined,
      timestamp: now,
    };

    const updatedItem: Item = {
      ...selectedItem,
      currentStock: validation.newStock,
      updatedAt: now,
    };

    onRecord(txRecord, updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                type === 'stock_in'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {type === 'stock_in' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-neutral-900 leading-tight">
                {type === 'stock_in' ? 'Record Stock In (+)' : 'Record Stock Out (-)'}
              </h2>
              <p className="text-xs text-neutral-500">
                {type === 'stock_in'
                  ? 'Receive inventory and increase store stock'
                  : 'Deduct sold, damaged, or expired stock'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Segmented Switch */}
        <div className="mt-4 p-1 bg-neutral-100 rounded-lg flex gap-1">
          <button
            type="button"
            onClick={() => handleTypeChange('stock_in')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              type === 'stock_in'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Stock In (Receive)</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('stock_out')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              type === 'stock_out'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Stock Out (Deduct)</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Select Item */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Select Store Item *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.currentStock} {item.unit} in stock) · {item.sku}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview Card */}
          {selectedItem && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-500 block">Current Available Stock:</span>
                <span className="font-bold text-neutral-900 font-mono text-sm">
                  {selectedItem.currentStock} {selectedItem.unit}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 block">Projected New Stock:</span>
                <span
                  className={`font-bold font-mono text-sm ${
                    !validation.valid
                      ? 'text-rose-600'
                      : type === 'stock_in'
                      ? 'text-emerald-700'
                      : 'text-neutral-900'
                  }`}
                >
                  {validation.newStock} {selectedItem.unit}
                </span>
              </div>
            </div>
          )}

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {!validation.valid && validation.error && (
                <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                  {validation.error}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                {type === 'stock_in' ? 'Cost Price per Unit (₱)' : 'Selling Price (₱)'}
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Transaction Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as TransactionReason)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {(type === 'stock_in' ? STOCK_IN_REASONS : STOCK_OUT_REASONS).map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference # */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Reference / Receipt / PO # (Optional)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={type === 'stock_in' ? 'e.g. PO-8821, DR-104' : 'e.g. OR-992, POS-01'}
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional comments..."
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Transaction Summary Footer */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-neutral-500 block">Total Value:</span>
              <span className="font-bold text-neutral-900 font-mono text-sm tabular-nums">
                {formatPHP(totalAmount)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!validation.valid}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors ${
                  !validation.valid
                    ? 'bg-neutral-300 cursor-not-allowed text-neutral-500'
                    : type === 'stock_in'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {type === 'stock_in' ? 'Confirm Stock In' : 'Confirm Stock Out'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
