/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { dbService, DEFAULT_USERS } from './services/db';
import {
  Item,
  StockTransaction,
  User,
  TransactionType,
} from './types/inventory';
import {
  generateStockSummaryReport,
  getLowStockAlerts,
  getExpirationAlerts,
} from './utils/inventoryRules';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ItemList } from './components/ItemList';
import { ReportsView } from './components/ReportsView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { ItemModal } from './components/ItemModal';
import { TransactionModal } from './components/TransactionModal';
import { LoginScreen } from './components/LoginScreen';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Check url param ?autostart=1 or existing session
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return DEFAULT_USERS[0];
    }
    return dbService.getCurrentUser() || DEFAULT_USERS[0]; // Default logged in for immediate store access
  });

  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'transactions' | 'reports'>('dashboard');
  const [itemFilter, setItemFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'expiring'>('all');

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txItem, setTxItem] = useState<Item | null>(null);
  const [txType, setTxType] = useState<TransactionType>('stock_in');

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      const loadedItems = await dbService.seedInitialData();
      const loadedTx = await dbService.getTransactions();
      setItems(loadedItems);
      setTransactions(loadedTx);
    } catch (err) {
      console.error('Failed to load database:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived summaries
  const report = useMemo(() => generateStockSummaryReport(items), [items]);
  const lowStockAlerts = useMemo(() => getLowStockAlerts(items), [items]);
  const expirationAlerts = useMemo(() => getExpirationAlerts(items), [items]);

  // Auth handlers
  const handleLogin = (user: User) => {
    dbService.setCurrentUser(user);
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    dbService.setCurrentUser(null);
    setCurrentUser(null);
    showToast('Signed out successfully', 'info');
  };

  // Item CRUD
  const handleOpenAddItem = () => {
    setEditItem(null);
    setItemModalOpen(true);
  };

  const handleOpenEditItem = (item: Item) => {
    setEditItem(item);
    setItemModalOpen(true);
  };

  const handleSaveItem = async (item: Item) => {
    try {
      await dbService.saveItem(item);
      const isNew = !items.some((i) => i.id === item.id);
      await loadData();
      showToast(isNew ? `Item "${item.name}" added successfully` : `Updated "${item.name}"`);
    } catch (err) {
      console.error('Failed to save item:', err);
      showToast('Error saving item to local database', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const target = items.find((i) => i.id === id);
      await dbService.deleteItem(id);
      await loadData();
      showToast(`Deleted ${target?.name || 'item'} from inventory`, 'info');
    } catch (err) {
      console.error('Failed to delete item:', err);
      showToast('Error deleting item', 'error');
    }
  };

  // Stock In / Stock Out
  const handleOpenStockIn = (item?: Item) => {
    setTxItem(item || null);
    setTxType('stock_in');
    setTxModalOpen(true);
  };

  const handleOpenStockOut = (item?: Item) => {
    setTxItem(item || null);
    setTxType('stock_out');
    setTxModalOpen(true);
  };

  const handleRecordTransaction = async (txRecord: StockTransaction, updatedItem: Item) => {
    try {
      await dbService.saveItem(updatedItem);
      await dbService.recordTransaction(txRecord);
      await loadData();
      showToast(
        txRecord.type === 'stock_in'
          ? `Recorded Stock In: +${txRecord.quantity} ${updatedItem.unit} of ${updatedItem.name}`
          : `Recorded Stock Out: -${txRecord.quantity} ${updatedItem.unit} of ${updatedItem.name}`
      );
    } catch (err) {
      console.error('Failed to record stock transaction:', err);
      showToast('Error saving stock transaction', 'error');
    }
  };

  // Seed data reset
  const handleResetSeedData = async () => {
    if (window.confirm('Reset all inventory and stock logs to Dueñas Store default demo items?')) {
      await dbService.seedInitialData(true);
      await loadData();
      showToast('Inventory reset to sample store items');
    }
  };

  const handleNavigateToItems = (filter: 'all' | 'low_stock' | 'out_of_stock' | 'expiring' = 'all') => {
    setItemFilter(filter);
    setActiveTab('items');
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-neutral-100/60 text-neutral-900 flex flex-col font-sans">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in border border-neutral-700">
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-neutral-400 hover:text-white p-1"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        onQuickStockIn={() => handleOpenStockIn()}
        onQuickStockOut={() => handleOpenStockOut()}
        onAddItem={handleOpenAddItem}
        lowStockCount={lowStockAlerts.length}
        expiringCount={expirationAlerts.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs">Loading local database...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                items={items}
                transactions={transactions}
                report={report}
                lowStockAlerts={lowStockAlerts}
                expirationAlerts={expirationAlerts}
                onNavigateToItems={handleNavigateToItems}
                onNavigateToTransactions={() => setActiveTab('transactions')}
                onNavigateToReports={() => setActiveTab('reports')}
                onOpenStockIn={handleOpenStockIn}
                onOpenStockOut={handleOpenStockOut}
                onOpenAddItem={handleOpenAddItem}
                onResetSeedData={handleResetSeedData}
              />
            )}

            {activeTab === 'items' && (
              <ItemList
                items={items}
                onAddItem={handleOpenAddItem}
                onEditItem={handleOpenEditItem}
                onDeleteItem={handleDeleteItem}
                onStockIn={handleOpenStockIn}
                onStockOut={handleOpenStockOut}
                initialFilter={itemFilter}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionHistoryView
                transactions={transactions}
                onOpenStockIn={() => handleOpenStockIn()}
                onOpenStockOut={() => handleOpenStockOut()}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                report={report}
                items={items}
                storeName="Dueñas Store"
              />
            )}
          </>
        )}
      </main>

      {/* Add / Edit Item Modal */}
      <ItemModal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSave={handleSaveItem}
        editItem={editItem}
        existingItemsCount={items.length}
      />

      {/* Stock In / Stock Out Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onRecord={handleRecordTransaction}
        items={items}
        preselectedItem={txItem}
        defaultType={txType}
        currentUser={currentUser}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-4 mt-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <div>
            <span className="font-semibold text-neutral-700">Dueñas Store</span> · Web Inventory Management System
          </div>
          <div className="flex items-center gap-3">
            <span>Offline-First (IndexedDB)</span>
            <span>·</span>
            <span>Version 1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
