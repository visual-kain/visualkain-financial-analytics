'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { groupedNavItems, resolveActiveNavId } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const COLLAPSE_KEY = 'vk.sidebar.collapsed';

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
  } catch {
    // Mode privat atau storage diblokir: status ciut tetap berlaku sampai halaman ditutup.
  }
}

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profile, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeId = resolveActiveNavId(pathname, searchParams.get('tab'));
  const groups = groupedNavItems();

  useEffect(() => {
    setIsCollapsed(readCollapsed());
  }, []);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      writeCollapsed(!prev);
      return !prev;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const userName = profile?.name || 'Pengguna VisualKain';
  const userSub = profile?.email || profile?.role || '';
  const initials = profile?.initials || 'VK';

  return (
    <aside
      className={cn(
        'sticky top-0 z-30 hidden h-screen shrink-0 select-none flex-col justify-between border-r border-[#CBD5E1] bg-white shadow-sm transition-all duration-300 ease-in-out md:flex',
        isCollapsed ? 'w-[72px] p-2.5' : 'w-64 p-4 lg:w-72'
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2.5 border-b border-slate-100 pb-3 pt-1">
            <button
              onClick={toggle}
              title="Perluas Sidebar (Ctrl+B)"
              className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs transition-all hover:border-teal-500 hover:shadow-sm active:scale-95"
            >
              <img src="/img/logo.jpg" alt="VisualKain Logo" className="h-full w-full object-cover" />
            </button>
            <button
              onClick={toggle}
              title="Perluas Sidebar (Ctrl+B)"
              aria-label="Perluas sidebar"
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-800 active:scale-95"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-slate-100 px-1 pb-4 pt-1">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
                <img src="/img/logo.jpg" alt="VisualKain Logo" className="h-full w-full object-cover" />
              </div>
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="text-sm font-bold leading-none tracking-tight text-slate-900">VisualKain</h1>
                <p className="mt-1 text-[11px] font-medium text-slate-400">Operasional &amp; Finansial 2026</p>
              </div>
            </div>
            <button
              onClick={toggle}
              title="Perkecil Sidebar (Ctrl+B)"
              aria-label="Perkecil sidebar"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-800 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        <nav className="-mx-1 mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto px-1 pb-2" aria-label="Navigasi utama">
          {groups.map((group) => (
            <div key={group.group}>
              {isCollapsed ? (
                <div className="mx-auto mb-1.5 h-px w-6 bg-slate-200" aria-hidden />
              ) : (
                <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.label}</div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeId === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group relative flex w-full items-center rounded-xl text-xs font-semibold transition-colors duration-150 active:scale-[0.98]',
                        isCollapsed ? 'h-10 justify-center px-0' : 'px-3 py-2.5',
                        isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActivePill"
                          className="absolute inset-0 rounded-xl bg-teal-600 shadow-md"
                          transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                        />
                      )}
                      <span className={cn('relative z-10 flex items-center', isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0')}>
                        <Icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-100 pt-3">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              title={`${userName} (${userSub})`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-xs font-bold text-white shadow-sm"
            >
              {initials}
            </div>
            <button
              onClick={logout}
              title="Keluar Sesi"
              aria-label="Keluar"
              className="cursor-pointer rounded-lg p-1 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-xs font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="truncate">
                <div className="truncate text-xs font-bold leading-none text-slate-800">{userName}</div>
                <div className="mt-0.5 truncate text-[10px] font-medium text-teal-700">{userSub}</div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Keluar Sesi"
              aria-label="Keluar"
              className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[#CBD5E1] bg-white md:flex lg:w-72" />}>
      <SidebarInner />
    </Suspense>
  );
}
