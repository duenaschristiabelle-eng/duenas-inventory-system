import React, { useState } from 'react';
import {
  Package,
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  FileBarChart2,
  LogOut,
  AlertTriangle,
  Menu,
  X,
  Plus,
  TrendingDown,
} from 'lucide-react';
import { User } from '../types/inventory';

interface HeaderProps {
  currentUser: User | null;
  activeTab: 'dashboard' | 'items' | 'transactions' | 'reports';
  onSelectTab: (tab: 'dashboard' | 'items' | 'transactions' | 'reports') => void;
  onLogout: () => void;
  onQuickStockIn: () => void;
  onQuickStockOut: () => void;
  onAddItem: () => void;
  lowStockCount: number;
  expiringCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
  onQuickStockIn,
  onQuickStockOut,
  onAddItem,
  lowStockCount,
  expiringCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalAlerts = lowStockCount + expiringCount;

  const handleTabClick = (tab: 'dashboard' | 'items' | 'transactions' | 'reports') => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      {/* Desktop & Main Header bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleTabClick('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-xs">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-neutral-900 tracking-tight whitespace-nowrap block leading-tight">
                  Dueñas Store
                </span>
                <span className="text-[11px] text-neutral-500 block leading-none font-medium">
                  Inventory System
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
              {totalAlerts > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-100 text-amber-800 tabular-nums">
                  {totalAlerts}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('items')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'items'
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Items & Stock</span>
            </button>

            <button
              onClick={() => handleTabClick('transactions')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'transactions'
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Stock Logs</span>
            </button>

            <button
              onClick={() => handleTabClick('reports')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'reports'
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <FileBarChart2 className="w-4 h-4" />
              <span>Summary Report</span>
            </button>
          </nav>

          {/* Zone 3: Quick Actions & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick stock in / out buttons */}
            <div className="hidden lg:flex items-center gap-1.5 border-r border-neutral-200 pr-3">
              <button
                onClick={onQuickStockIn}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors whitespace-nowrap"
                title="Receive Goods / Supplier Delivery"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Stock In</span>
              </button>
              <button
                onClick={onQuickStockOut}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors whitespace-nowrap"
                title="Record Retail Sale / Stock Out"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Stock Out</span>
              </button>
            </div>

            {/* Primary Action: Add item */}
            <button
              onClick={onAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden">Item</span>
            </button>

            {/* User Profile & Logout */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-neutral-200">
                <div className="text-right">
                  <div className="text-xs font-semibold text-neutral-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 capitalize leading-tight">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-4 space-y-2 shadow-lg">
          <div className="flex gap-2 pb-2 border-b border-neutral-100">
            <button
              onClick={() => {
                onQuickStockIn();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-md border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Stock In</span>
            </button>
            <button
              onClick={() => {
                onQuickStockOut();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-rose-800 bg-rose-50 rounded-md border border-rose-200"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Stock Out</span>
            </button>
          </div>

          <button
            onClick={() => handleTabClick('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg ${
              activeTab === 'dashboard' ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-600'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
            {totalAlerts > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-800 tabular-nums">
                {totalAlerts} alerts
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick('items')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg ${
              activeTab === 'items' ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-600'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Items & Stock Inventory</span>
          </button>

          <button
            onClick={() => handleTabClick('transactions')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg ${
              activeTab === 'transactions' ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-600'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Stock In / Stock Out Logs</span>
          </button>

          <button
            onClick={() => handleTabClick('reports')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg ${
              activeTab === 'reports' ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-600'
            }`}
          >
            <FileBarChart2 className="w-4 h-4" />
            <span>Stock Summary Report</span>
          </button>

          {currentUser && (
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-900">{currentUser.name}</p>
                <p className="text-[11px] text-neutral-500 capitalize">{currentUser.role} · Dueñas Store</p>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
