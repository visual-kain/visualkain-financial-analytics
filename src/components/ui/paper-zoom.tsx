'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MM_TO_PX = 96 / 25.4;
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Versi PaperViewport untuk kertas milik aplikasi ini (bukan kertas legacy): di layar di bawah `maxScreenPx`
 * kertas tetap selebar A4 lalu diperkecil dengan CSS `zoom`, sehingga tata letak dan ukuran font relatifnya tidak
 * berubah. Di desktop zoom tetap 1 agar tampilan lama tidak bergeser. Zoom dibatalkan saat cetak (globals.css).
 */
export function PaperZoom({ children, widthMm = 210, maxScreenPx = 768 }: { children: React.ReactNode; widthMm?: number; maxScreenPx?: number }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const paperPx = widthMm * MM_TO_PX;

  useIsoLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      // Lebar 0 (jsdom, tab tersembunyi) atau layar desktop tidak diperkecil.
      setZoom(window.innerWidth < maxScreenPx && width > 0 ? Math.min(1, Math.max(0.2, width / paperPx)) : 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [paperPx, maxScreenPx]);

  return (
    <div ref={frameRef} className="paper-zoom-frame w-full">
      <div className="paper-zoom mx-auto flex flex-col items-center" style={zoom < 1 ? { width: paperPx, zoom } : undefined}>
        {children}
      </div>
    </div>
  );
}
