'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FinanceSubTab } from '@/types';
import {
  LayoutDashboard,
  Table2,
  Coins,
  WalletCards,
  Award,
  FileSpreadsheet,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: FinanceSubTab;
  onSelectTab: (tab: FinanceSubTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  showHiddenTabs?: boolean;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  userName = 'Glora Sawita Br Panjaitan',
  userRole = 'Head of Finance & Accounting',
  onLogout,
  showHiddenTabs = false,
}: SidebarProps) {
  const tabs = [
    {
      id: 'dashboard' as FinanceSubTab,
      label: 'Ringkasan Finansial',
      icon: LayoutDashboard,
    },
    {
      id: 'datatable' as FinanceSubTab,
      label: 'Data Table (Master Order)',
      icon: Table2,
    },
    {
      id: 'cashin' as FinanceSubTab,
      label: 'Arus Kas Masuk',
      icon: Coins,
    },
    {
      id: 'cashout' as FinanceSubTab,
      label: 'Arus Kas Keluar',
      icon: WalletCards,
    },
    {
      id: 'vendor' as FinanceSubTab,
      label: 'Kinerja Mitra Vendor',
      icon: Award,
    },
    ...(showHiddenTabs
      ? [
          {
            id: 'manual' as FinanceSubTab,
            label: 'Realisasi Laba Bersih',
            icon: FileSpreadsheet,
          },
        ]
      : []),
  ];

  // Shortcut Ctrl+B / Cmd+B listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCollapse]);

  return (
    <aside
      className={`sticky top-0 hidden h-screen flex-col justify-between border-r border-[#CBD5E1] bg-white transition-all duration-300 ease-in-out md:flex select-none z-30 ${
        isCollapsed ? 'w-[72px] p-2.5' : 'w-64 lg:w-72 p-4'
      } shadow-sm`}
    >
      <div>
        {/* Brand Logo, Title & Collapse Toggle */}
        {isCollapsed ? (
          <div className="flex flex-col items-center border-b border-slate-100 pb-3 pt-1 gap-2.5">
            <button
              onClick={onToggleCollapse}
              title="Perluas Sidebar (Ctrl+B)"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs hover:border-teal-500 hover:shadow-sm transition-all active:scale-95 group cursor-pointer"
            >
              <img
                src="/img/logo.jpg"
                alt="VisualKain Logo"
                className="h-full w-full object-cover"
              />
            </button>
            <button
              onClick={onToggleCollapse}
              title="Perluas Sidebar (Ctrl+B)"
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 pt-1 px-1">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
                <img
                  src="/img/logo.jpg"
                  alt="VisualKain Logo"
                  className="h-full w-full object-cover"
                />
              </div>

              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                  VisualKain
                </h1>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  Financial &amp; Analytics 2026
                </p>
              </motion.div>
            </div>

            <button
              onClick={onToggleCollapse}
              title="Perkecil Sidebar (Ctrl+B)"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation Group */}
        <div className="mt-6">
          {!isCollapsed && (
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Sub-Modul Finansial
            </div>
          )}

          <nav className="space-y-1.5 relative">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  title={isCollapsed ? tab.label : undefined}
                  className={`group relative flex w-full items-center rounded-xl text-xs font-semibold transition-colors duration-150 active:scale-[0.98] ${
                    isCollapsed
                      ? 'h-11 justify-center px-0'
                      : 'justify-between px-3 py-2.5'
                  } ${
                    isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {/* Emil Kowalski Floating Pill Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute inset-0 rounded-xl bg-teal-600 shadow-md"
                      transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                    />
                  )}

                  <div
                    className={`relative z-10 flex items-center ${
                      isCollapsed ? 'justify-center' : 'gap-2.5'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate">{tab.label}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bank Reconciliation Status Box */}
        {!isCollapsed ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800">
                Rekening Bank Terhubung
              </span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-700 leading-snug">
              Sinkron BCA: Kas Riil tidak terpotong biaya pokok vendor.
            </p>
          </div>
        ) : (
          <div
            title="Rekening Bank Terhubung: Sinkron BCA aktif"
            className="mt-6 flex justify-center"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* User Profile & Logout */}
      <div className="border-t border-slate-100 pt-3">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              title={`${userName} (${userRole})`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-white font-bold text-xs shadow-sm"
            >
              GS
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Keluar Sesi"
                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-white font-bold text-xs shadow-sm">
                GS
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 leading-none truncate">
                  {userName}
                </div>
                <div className="text-[10px] text-teal-700 font-medium mt-0.5 truncate">
                  {userRole}
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Keluar Sesi"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>

  );
}
