import React, { useState } from 'react';
import { Package, Lock, User as UserIcon, ShieldCheck, Database, ArrowRight, Store } from 'lucide-react';
import { User } from '../types/inventory';
import { DEFAULT_USERS } from '../services/db';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = DEFAULT_USERS.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (user) {
      onLogin(user);
    } else {
      // Allow custom store staff username if entered
      if (username.trim()) {
        const customUser: User = {
          id: `u-${Date.now()}`,
          username: username.trim(),
          name: username.trim().replace(/^./, (c) => c.toUpperCase()),
          role: 'staff',
          storeName: 'Dueñas Store',
        };
        onLogin(customUser);
      } else {
        setError('Please enter a valid username');
      }
    }
  };

  const handleQuickLogin = (user: User) => {
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-neutral-100/60">
      <div className="w-full max-w-md">
        
        {/* Brand Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
          
          {/* Header banner */}
          <div className="bg-amber-600 px-6 pt-8 pb-6 text-white text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 backdrop-blur-xs mb-3 border border-white/20 shadow-xs">
              <Store className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display font-bold text-2xl tracking-tight text-white">
              Dueñas Store
            </h1>
            <p className="text-amber-100 text-sm mt-1 font-medium">
              Inventory & Stock Management System
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-neutral-900">
                Sign in to your account
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Manage stock, record transactions, and check alerts
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-neutral-700 mb-1"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    placeholder="e.g. admin or staff"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-neutral-700 mb-1"
                >
                  Password / PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                <span>Enter Store Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Access */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <span className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Quick Demo Access:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin(DEFAULT_USERS[0])}
                  className="flex flex-col items-start p-2.5 text-left border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 rounded-lg transition-colors group"
                >
                  <span className="text-xs font-semibold text-amber-950 group-hover:text-amber-900">
                    Owner Login
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium">
                    Christiabelle (Admin)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin(DEFAULT_USERS[1])}
                  className="flex flex-col items-start p-2.5 text-left border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors group"
                >
                  <span className="text-xs font-semibold text-neutral-900 group-hover:text-neutral-950">
                    Staff Login
                  </span>
                  <span className="text-[10px] text-neutral-600 font-medium">
                    Store Cashier
                  </span>
                </button>
              </div>
            </div>

            {/* Local DB reassurance */}
            <div className="mt-5 p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 flex items-start gap-2.5 text-neutral-600">
              <Database className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                <span className="font-semibold text-neutral-800">Browser-based local database:</span> Your inventory data and stock logs are stored directly and safely in your local IndexedDB storage.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          Dueñas Store &copy; {new Date().getFullYear()} · Local Offline-First Ready
        </p>
      </div>
    </div>
  );
};
