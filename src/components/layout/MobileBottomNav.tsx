'use client';

import React from 'react';
import type { FinanceSubTab } from '@/types';
import {
  LayoutDashboard,
  Coins,
  WalletCards,
  Award,
  FileSpreadsheet,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: FinanceSubTab;
  onSelectTab: (tab: FinanceSubTab) => void;
  showHiddenTabs?: boolean;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  showHiddenTabs = false,
}: MobileBottomNavProps) {
  const tabs = [
    {
      id: 'dashboard' as FinanceSubTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Master',
    },
    {
      id: 'cashin' as FinanceSubTab,
      label: 'Dana Masuk',
      icon: Coins,
      badge: 'Masuk',
    },
    {
      id: 'cashout' as FinanceSubTab,
      label: 'Dana Keluar',
      icon: WalletCards,
      badge: 'Beban',
    },
    {
      id: 'vendor' as FinanceSubTab,
      label: 'Mitra Vendor',
      icon: Award,
      badge: 'Ranking',
    },
    ...(showHiddenTabs
      ? [
          {
            id: 'manual' as FinanceSubTab,
            label: 'Dev Manual',
            icon: FileSpreadsheet,
            badge: 'Dev',
          },
        ]
      : []),
  ];

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden select-none"
    >
      <div className="mx-auto flex max-w-md items-center justify-around gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-xl py-1 text-center transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-teal-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {/* Active Tab Glow Pill */}
              <div
                className={`relative flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 shadow-2xs border border-teal-200/60'
                    : 'text-slate-500'
                }`}
              >
                <Icon className="h-4 w-4" />
                {isActive && (
                  <span className="absolute -top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-teal-600" />
                )}
              </div>

              <span
                className={`mt-0.5 text-[10px] leading-tight transition-all duration-200 ${
                  isActive ? 'font-extrabold text-teal-800' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
