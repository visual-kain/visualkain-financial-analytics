'use client';

import React, { useRef } from 'react';
import { Calculator, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export const COST_PROFIT_TABS = ['kalkulator', 'database'] as const;
export type CostProfitTab = (typeof COST_PROFIT_TABS)[number];

export const tabId = (tab: CostProfitTab) => `cp-tab-${tab}`;
export const panelId = (tab: CostProfitTab) => `cp-panel-${tab}`;

const TAB_META: Record<CostProfitTab, { label: string; shortLabel: string; icon: React.ReactNode }> = {
  kalkulator: { label: 'Kalkulator', shortLabel: 'Kalkulator', icon: <Calculator className="h-4 w-4" /> },
  database: { label: 'Database Bahan & Aturan', shortLabel: 'Database', icon: <Database className="h-4 w-4" /> },
};

interface CostProfitTabsProps {
  value: CostProfitTab;
  onChange: (tab: CostProfitTab) => void;
}

/** Tab dengan navigasi panah/Home/End sesuai pola WAI-ARIA; tiap tab setinggi 44 px di HP. */
export function CostProfitTabs({ value, onChange }: CostProfitTabsProps) {
  const refs = useRef<Record<CostProfitTab, HTMLButtonElement | null>>({ kalkulator: null, database: null });

  const move = (e: React.KeyboardEvent, current: CostProfitTab) => {
    const index = COST_PROFIT_TABS.indexOf(current);
    let next: CostProfitTab | null = null;
    if (e.key === 'ArrowRight') next = COST_PROFIT_TABS[(index + 1) % COST_PROFIT_TABS.length];
    else if (e.key === 'ArrowLeft') next = COST_PROFIT_TABS[(index - 1 + COST_PROFIT_TABS.length) % COST_PROFIT_TABS.length];
    else if (e.key === 'Home') next = COST_PROFIT_TABS[0];
    else if (e.key === 'End') next = COST_PROFIT_TABS[COST_PROFIT_TABS.length - 1];
    if (!next) return;
    e.preventDefault();
    onChange(next);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label="Bagian Cost & Profit" className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1 sm:w-fit sm:grid-cols-[auto_auto]">
      {COST_PROFIT_TABS.map((tab) => {
        const active = tab === value;
        const meta = TAB_META[tab];
        return (
          <button
            key={tab}
            ref={(el) => {
              refs.current[tab] = el;
            }}
            id={tabId(tab)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId(tab)}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab)}
            onKeyDown={(e) => move(e, tab)}
            className={cn(
              'inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 sm:h-10 sm:px-5',
              active ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {meta.icon}
            <span className="sm:hidden">{meta.shortLabel}</span>
            <span className="hidden sm:inline">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}
