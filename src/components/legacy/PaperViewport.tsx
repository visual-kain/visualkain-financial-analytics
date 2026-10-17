'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '@/styles/legacy-base.css';
import '@/styles/legacy-papers.css';
import '@/styles/legacy-overrides.css';
import { cn } from '@/lib/utils';

const MM_TO_PX = 96 / 25.4;
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface PaperViewportProps {
  children: React.ReactNode;
  paperWidthMm?: number;
  className?: string;
}

/**
 * Merender kertas legacy pada lebar A4 aslinya lalu memperkecil dengan CSS `zoom` agar muat di HP,
 * sehingga tata letak kertas tidak pernah berubah (K-10).
 */
export function PaperViewport({ children, paperWidthMm = 210, className }: PaperViewportProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const paperPx = paperWidthMm * MM_TO_PX;

  useIsoLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const styles = window.getComputedStyle(el);
      const padding = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
      const inner = el.clientWidth - padding;
      // clientWidth 0 (jsdom, tab tersembunyi) tidak boleh menghasilkan zoom tidak valid.
      setZoom(inner > 0 ? Math.min(1, Math.max(0.2, inner / paperPx)) : 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [paperPx]);

  return (
    <div ref={outerRef} className={cn('w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-200/70 p-2 sm:p-4', className)}>
      <div className="vk-legacy mx-auto flex flex-col items-center gap-4" style={{ width: paperPx, zoom }}>
        {children}
      </div>
    </div>
  );
}

// Margin halaman milik visualkaindb; disuntikkan hanya selama kertas legacy terpasang supaya laporan finansial tetap memakai @page aplikasi ini.
const LEGACY_PAGE_CSS = '@media print { @page { size: A4 portrait; margin: 18mm 15mm; } }';

/**
 * Salinan kertas untuk dicetak. Dirender di luar `main` karena CSS print aplikasi menyembunyikan `main`.
 */
export function PrintPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div className="vk-legacy vk-print-root" aria-hidden>
      {children}
      <style>{LEGACY_PAGE_CSS}</style>
    </div>,
    document.body
  );
}

/** Mengganti judul dokumen sementara agar nama file PDF bawaan browser sesuai nomor dokumen. */
export function printWithTitle(title: string) {
  const originalTitle = document.title;
  document.title = title.replace(/[/\\?%*:|"<>]/g, '-').trim();
  const restore = () => {
    document.title = originalTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
  setTimeout(restore, 1500);
}
