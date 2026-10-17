'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, LogOut, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NAV_SECTION_LABELS, groupedNavItems, mobileNavItemsFor, resolveActiveNavId, sectionOfNavId } from '@/lib/navigation';
import { cn } from '@/lib/utils';

function MenuSheet({ open, activeId, onClose }: { open: boolean; activeId: string; onClose: () => void }) {
  const { profile, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', duration: 0.32, bounce: 0 }}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" aria-hidden />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-xs font-bold text-white">
                  {profile?.initials || 'VK'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{profile?.name || 'Pengguna VisualKain'}</p>
                  <p className="truncate text-[11px] text-slate-500">{profile?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup menu"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {groupedNavItems().map((group) => (
                <section key={group.group}>
                  <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.label}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.id === activeId;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={onClose}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-2.5 text-center text-[11px] font-semibold leading-tight transition-colors active:scale-[0.97]',
                            isActive
                              ? 'border-teal-300 bg-teal-50 text-teal-800'
                              : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                          )}
                        >
                          <Icon className={cn('h-5 w-5', isActive ? 'text-teal-700' : 'text-slate-500')} />
                          <span>{item.shortLabel}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                void logout();
              }}
              className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-700 active:scale-[0.98] shadow-btn-secondary font-medium"
            >
              <LogOut className="h-4 w-4" />
              Keluar dari Sesi
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function MobileBottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeId = resolveActiveNavId(pathname, searchParams.get('tab'));
  const primary = mobileNavItemsFor(activeId);
  const activeInMenu = !primary.some((item) => item.id === activeId);
  const section = NAV_SECTION_LABELS[sectionOfNavId(activeId)];
  const gridCols = { 1: 'grid-cols-2', 2: 'grid-cols-3', 3: 'grid-cols-4', 4: 'grid-cols-5' }[primary.length] ?? 'grid-cols-5';

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        aria-label="Navigasi bawah"
        className="no-print fixed bottom-0 left-0 right-0 z-40 select-none border-t border-slate-200/90 bg-white/95 px-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden"
      >
        {section && (
          <p className="mx-auto mb-0.5 max-w-md px-2 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{section}</p>
        )}
        <div className={cn('mx-auto grid max-w-md items-center gap-0.5', gridCols)}>
          {primary.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[48px] flex-col items-center justify-center rounded-xl px-0.5 py-1 text-center transition-all duration-200 active:scale-95',
                  isActive ? 'font-bold text-teal-700' : 'font-medium text-slate-500'
                )}
              >
                <span
                  className={cn(
                    'relative flex h-7 w-10 items-center justify-center rounded-full transition-all duration-200',
                    isActive ? 'border border-teal-200/60 bg-teal-50 text-teal-700 shadow-2xs' : 'text-slate-500'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className={cn('mt-0.5 max-w-full truncate text-[10px] leading-tight', isActive ? 'font-extrabold text-teal-800' : 'text-slate-500')}>
                  {item.tabLabel ?? item.shortLabel}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className={cn(
              'relative flex min-h-[48px] cursor-pointer flex-col items-center justify-center rounded-xl px-0.5 py-1 text-center transition-all duration-200 active:scale-95',
              activeInMenu ? 'font-bold text-teal-700' : 'font-medium text-slate-500'
            )}
          >
            <span
              className={cn(
                'relative flex h-7 w-10 items-center justify-center rounded-full transition-all duration-200',
                activeInMenu ? 'border border-teal-200/60 bg-teal-50 text-teal-700 shadow-2xs' : 'text-slate-500'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              {activeInMenu && <span className="absolute -top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-teal-600" />}
            </span>
            <span className={cn('mt-0.5 text-[10px] leading-tight', activeInMenu ? 'font-extrabold text-teal-800' : 'text-slate-500')}>
              Menu
            </span>
          </button>
        </div>
      </nav>
      <MenuSheet open={menuOpen} activeId={activeId} onClose={() => setMenuOpen(false)} />
    </>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  );
}
