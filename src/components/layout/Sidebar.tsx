'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FinanceSubTab } from '@/types';
import {
  LayoutDashboard,
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
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const tabs = [
    {
      id: 'dashboard' as FinanceSubTab,
      label: 'Financial Dashboard',
      icon: LayoutDashboard,
      badge: 'Master',
    },
    {
      id: 'cashout' as FinanceSubTab,
      label: 'Cash Outflow',
      icon: WalletCards,
      badge: 'Beban',
    },
    {
      id: 'vendor' as FinanceSubTab,
      label: 'Vendor Performance',
      icon: Award,
      badge: 'Ranking',
    },
    {
      id: 'manual' as FinanceSubTab,
      label: 'Profit Aktual (Manual)',
      icon: FileSpreadsheet,
      badge: 'Audit',
    },
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
        <div
          className={`flex items-center border-b border-slate-100 pb-4 pt-1 ${
            isCollapsed ? 'justify-center' : 'justify-between px-1'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <img
                src="/img/logo.jpg"
                alt="VisualKain Logo"
                className="h-full w-full object-cover"
              />
            </div>

            <AnimatePresence>
              {!isCollapsed && (
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
                    Financial & Analytics 2026
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Perluas Sidebar (Ctrl+B)' : 'Perkecil Sidebar (Ctrl+B)'}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all ${
              isCollapsed ? 'mt-3' : ''
            }`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

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

                  {!isCollapsed && (
                    <span
                      className={`relative z-10 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
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
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shadow-sm">
              RP
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 leading-none">
                  Raja Purnama
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Owner & Director
                </div>
              </div>
            )}
          </div>

          <button
            title="Keluar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
