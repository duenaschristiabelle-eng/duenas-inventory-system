import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  ArrowUpDown,
  TrendingDown,
  AlertTriangle,
  Clock,
  MoreVertical,
  Check,
  Package,
  Layers,
} from 'lucide-react';
import { Item, ItemCategory } from '../types/inventory';
import {
  formatPHP,
  formatDate,
  calculateStockStatus,
  calculateExpirationStatus,
  calculateDaysRemaining,
} from '../utils/inventoryRules';

interface ItemListProps {
  items: Item[];
  onAddItem: () => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  onStockIn: (item: Item) => void;
  onStockOut: (item: Item) => void;
  initialFilter?: 'all' | 'low_stock' | 'out_of_stock' | 'expiring';
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onStockIn,
  onStockOut,
  initialFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'expiring'>(
    initialFilter
  );
  const [sortBy, setSortBy] = useState<'name' | 'stock_asc' | 'stock_desc' | 'price' | 'expiry'>('name');
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const categories = useMemo(() => {
    const list: string[] = ['All'];
    const cats = new Set<string>();
    items.forEach((item) => cats.add(item.category));
    return list.concat(Array.from(cats).sort());
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const today = new Date();

    return items
      .filter((item) => {
        // Search filter
        if (query) {
          const matchName = item.name.toLowerCase().includes(query);
          const matchSku = item.sku.toLowerCase().includes(query);
          const matchBarcode = item.barcode ? item.barcode.toLowerCase().includes(query) : false;
          const matchSupplier = item.supplier ? item.supplier.toLowerCase().includes(query) : false;
          if (!matchName && !matchSku && !matchBarcode && !matchSupplier) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (statusFilter === 'out_of_stock') {
          return item.currentStock <= 0;
        }
        if (statusFilter === 'low_stock') {
          return item.currentStock <= item.minStockThreshold;
        }
        if (statusFilter === 'expiring') {
          if (!item.expiryDate) return false;
          const days = calculateDaysRemaining(item.expiryDate, today);
          return days !== null && days <= 30;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'stock_asc') {
          return a.currentStock - b.currentStock;
        }
        if (sortBy === 'stock_desc') {
          return b.currentStock - a.currentStock;
        }
        if (sortBy === 'price') {
          return b.sellingPrice - a.sellingPrice;
        }
        if (sortBy === 'expiry') {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        }
        return 0;
      });
  }, [items, searchQuery, selectedCategory, statusFilter, sortBy]);

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Controls bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-neutral-900">
              Inventory Catalog
            </h1>
            <p className="text-xs text-neutral-500">
              Showing {filteredItems.length} of {items.length} total products
            </p>
          </div>

          <button
            onClick={onAddItem}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search name, SKU, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Category Select */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'low_stock' | 'out_of_stock' | 'expiring')
              }
              className="w-full py-2 px-3 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Status: All Items</option>
              <option value="low_stock">Status: Low Stock (below threshold)</option>
              <option value="out_of_stock">Status: Out of Stock (0 units)</option>
              <option value="expiring">Status: Expiring soon or expired</option>
            </select>
          </div>

          {/* Sort By Select */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="name">Sort by: Name (A to Z)</option>
              <option value="stock_asc">Sort by: Stock (Lowest First)</option>
              <option value="stock_desc">Sort by: Stock (Highest First)</option>
              <option value="price">Sort by: Selling Price</option>
              <option value="expiry">Sort by: Expiration Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Item Table / Cards Container */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">No items match your criteria</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query or reset the filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setStatusFilter('all');
              }}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">In Stock</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Retail Price</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredItems.map((item) => {
                    const stockStatus = calculateStockStatus(item.currentStock, item.minStockThreshold);
                    const expStatus = calculateExpirationStatus(item.expiryDate);
                    const daysRemaining = calculateDaysRemaining(item.expiryDate);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-neutral-50/80 transition-colors group"
                      >
                        {/* Name & SKU */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-neutral-900 leading-snug">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono">{item.sku}</span>
                            {item.barcode && (
                              <>
                                <span>·</span>
                                <span>Barcode: {item.barcode}</span>
                              </>
                            )}
                            {item.location && (
                              <>
                                <span>·</span>
                                <span>{item.location}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-neutral-600 whitespace-nowrap">
                          {item.category}
                        </td>

                        {/* Stock Level & Status */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="font-bold text-neutral-900 font-mono tabular-nums text-sm">
                            {item.currentStock}{' '}
                            <span className="text-[11px] font-normal text-neutral-500">
                              {item.unit}
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            {stockStatus === 'out_of_stock' ? (
                              <span className="font-semibold text-rose-700">Out of Stock</span>
                            ) : stockStatus === 'low_stock' ? (
                              <span className="font-semibold text-amber-700">
                                Low Stock (Min: {item.minStockThreshold})
                              </span>
                            ) : (
                              <span className="text-neutral-500">Min: {item.minStockThreshold}</span>
                            )}
                          </div>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-600 whitespace-nowrap">
                          {formatPHP(item.costPrice)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-neutral-900 whitespace-nowrap">
                          {formatPHP(item.sellingPrice)}
                        </td>

                        {/* Expiry Date */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.expiryDate ? (
                            <div>
                              <div className="font-mono text-neutral-800 text-[11px]">
                                {formatDate(item.expiryDate)}
                              </div>
                              <div className="text-[10px] mt-0.5">
                                {expStatus === 'expired' ? (
                                  <span className="font-semibold text-rose-700">
                                    Expired {Math.abs(daysRemaining || 0)}d ago
                                  </span>
                                ) : expStatus === 'critical' ? (
                                  <span className="font-semibold text-rose-600">
                                    Expires in {daysRemaining} days
                                  </span>
                                ) : expStatus === 'warning' ? (
                                  <span className="font-medium text-amber-700">
                                    {daysRemaining} days left
                                  </span>
                                ) : (
                                  <span className="text-neutral-500">Good condition</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-xs">No expiry</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onStockIn(item)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                              title="Stock In (+)"
                            >
                              + In
                            </button>
                            <button
                              onClick={() => onStockOut(item)}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                              title="Stock Out (-)"
                            >
                              - Out
                            </button>
                            <button
                              onClick={() => onEditItem(item)}
                              className="p-1 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors"
                              title="Edit Item Details"
                              aria-label={`Edit ${item.name}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setItemToDelete(item)}
                              className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Item"
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-neutral-100">
              {filteredItems.map((item) => {
                const stockStatus = calculateStockStatus(item.currentStock, item.minStockThreshold);
                const expStatus = calculateExpirationStatus(item.expiryDate);
                const daysRemaining = calculateDaysRemaining(item.expiryDate);

                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                          <span className="font-mono">{item.sku}</span>
                          <span>·</span>
                          <span>{item.category}</span>
                        </div>
                        <h4 className="font-semibold text-neutral-900 text-sm mt-0.5">
                          {item.name}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
                          {item.currentStock} {item.unit}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {stockStatus === 'out_of_stock' ? (
                            <span className="font-bold text-rose-700">Out of Stock</span>
                          ) : stockStatus === 'low_stock' ? (
                            <span className="font-semibold text-amber-700">Low Stock</span>
                          ) : (
                            <span className="text-neutral-500">In Stock</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-50 p-2 rounded-lg">
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Retail Price:</span>
                        <span className="font-bold text-neutral-900 font-mono">{formatPHP(item.sellingPrice)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Cost Price:</span>
                        <span className="text-neutral-700 font-mono">{formatPHP(item.costPrice)}</span>
                      </div>
                      {item.expiryDate && (
                        <div className="col-span-2 pt-1 border-t border-neutral-200/60">
                          <span className="text-neutral-500 text-[10px] mr-2">Expiry: {formatDate(item.expiryDate)}</span>
                          {expStatus === 'expired' && (
                            <span className="text-[10px] font-bold text-rose-700">Expired!</span>
                          )}
                          {expStatus === 'critical' && (
                            <span className="text-[10px] font-bold text-rose-600">{daysRemaining}d left</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onStockIn(item)}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md"
                        >
                          + Stock In
                        </button>
                        <button
                          onClick={() => onStockOut(item)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md"
                        >
                          - Stock Out
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-neutral-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                Delete "{itemToDelete.name}"?
              </h3>
              <p className="text-xs text-neutral-600 mt-1">
                Are you sure you want to remove this item from the store inventory? This will permanently delete the item record from your local database.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
