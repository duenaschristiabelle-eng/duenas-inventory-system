import React, { useState, useEffect } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { Item, ItemCategory, ItemUnit } from '../types/inventory';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  editItem?: Item | null;
  existingItemsCount: number;
}

const CATEGORIES: ItemCategory[] = [
  'Beverages',
  'Canned Goods',
  'Instant Noodles & Pasta',
  'Grains & Rice',
  'Condiments & Sauces',
  'Snacks & Confectionery',
  'Dairy & Bakery',
  'Personal Care',
  'Household & Cleaning',
  'General Merchandise',
];

const UNITS: ItemUnit[] = [
  'pcs',
  'pack',
  'bottle',
  'can',
  'sachet',
  'kg',
  'sack',
  'box',
];

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  existingItemsCount,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Beverages');
  const [unit, setUnit] = useState<ItemUnit>('pcs');
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [minStockThreshold, setMinStockThreshold] = useState<number>(5);
  const [costPrice, setCostPrice] = useState<number>(20);
  const [sellingPrice, setSellingPrice] = useState<number>(25);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [supplier, setSupplier] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setSku(editItem.sku);
      setBarcode(editItem.barcode || '');
      setCategory(editItem.category);
      setUnit(editItem.unit);
      setCurrentStock(editItem.currentStock);
      setMinStockThreshold(editItem.minStockThreshold);
      setCostPrice(editItem.costPrice);
      setSellingPrice(editItem.sellingPrice);
      setExpiryDate(editItem.expiryDate || '');
      setSupplier(editItem.supplier || '');
      setLocation(editItem.location || '');
      setNotes(editItem.notes || '');
    } else {
      // Default new item values
      setName('');
      // Auto-generate a friendly SKU
      const nextNum = String(existingItemsCount + 1).padStart(3, '0');
      setSku(`DS-GEN-${nextNum}`);
      setBarcode('');
      setCategory('Beverages');
      setUnit('pcs');
      setCurrentStock(12);
      setMinStockThreshold(5);
      setCostPrice(20);
      setSellingPrice(25);
      setExpiryDate('');
      setSupplier('');
      setLocation('');
      setNotes('');
    }
    setError(null);
  }, [editItem, existingItemsCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!sku.trim()) {
      setError('SKU is required');
      return;
    }
    if (currentStock < 0) {
      setError('Current stock cannot be negative');
      return;
    }
    if (minStockThreshold < 0) {
      setError('Minimum stock threshold cannot be negative');
      return;
    }
    if (costPrice < 0 || sellingPrice < 0) {
      setError('Prices cannot be negative');
      return;
    }

    const now = new Date().toISOString();
    const itemData: Item = {
      id: editItem ? editItem.id : `ds-item-${Date.now()}`,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || undefined,
      category,
      unit,
      currentStock: Number(currentStock),
      minStockThreshold: Number(minStockThreshold),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      expiryDate: expiryDate ? expiryDate : undefined,
      supplier: supplier.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editItem ? editItem.createdAt : now,
      updatedAt: now,
    };

    onSave(itemData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-neutral-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-neutral-900 leading-tight">
                {editItem ? 'Edit Store Item' : 'Add New Inventory Item'}
              </h2>
              <p className="text-xs text-neutral-500">
                {editItem ? `Updating SKU ${editItem.sku}` : 'Register a new product in Dueñas Store inventory'}
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

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Item Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. San Miguel Pale Pilsen 320ml"
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. DS-BEV-001"
                className="w-full px-3 py-2 text-sm font-mono bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Barcode / EAN (Optional)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 4800016551201"
                className="w-full px-3 py-2 text-sm font-mono bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Unit of Measure *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ItemUnit)}
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Stock */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Initial / Current Stock *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Min Stock Threshold */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Low Stock Threshold (Min) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Triggers alert when stock drops to or below this count
              </span>
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Purchase / Cost Price (₱) *
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Selling / Retail Price (₱) *
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {sellingPrice < costPrice && (
                <span className="text-[10px] text-rose-600 mt-0.5 block">
                  Warning: Retail price is lower than cost price.
                </span>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Used for expiration countdown and alerts
              </span>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Storage Location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Chiller 1, Shelf B2, Rice Pallet"
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Supplier */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Supplier / Distributor (Optional)
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. San Miguel Brewery Distributor, NutriAsia Inc."
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Store Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions or notes..."
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
            >
              {editItem ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
