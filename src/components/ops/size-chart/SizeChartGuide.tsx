'use client';

import React, { forwardRef } from 'react';
import { SIZES } from '@/lib/legacy/calculations';
import type { SizeChart } from '@/lib/legacy/types';

/**
 * Poster "Measurement Guide" mengikuti desain klien (sizechart.pdf, 17 Okt 2026). Gambar kaos, panah ukur, logo,
 * dan grid diambil dari PDF sebagai SVG statis; nama size chart dan tabel ukuran digambar ulang dari data.
 * Teks dinamis memakai Arial agar hasil unduhan JPG sama di semua perangkat (font web tidak ikut ke kanvas).
 */
export const GUIDE_BASE_URL = '/size-chart/guide-base.svg';
export const GUIDE_WIDTH = 792;
export const GUIDE_HEIGHT = 612;

const FONT = 'Arial, Helvetica, sans-serif';
const TABLE = { x: 40, y: 468, w: 712, h: 87, header: 26, labelX: 52, firstCol: 237, colGap: 60.5 };
const PILL_TEXT = { x: 42, y: 66.3, size: 8.9, maxWidth: 122 };

function cell(chart: SizeChart, size: string, key: 'panjang' | 'lebar'): string {
  const v = Number(chart.sizes?.[size]?.[key] ?? 0);
  return v > 0 ? String(v) : '-';
}

interface SizeChartGuideProps {
  chart: SizeChart;
  className?: string;
}

export const SizeChartGuide = forwardRef<SVGSVGElement, SizeChartGuideProps>(function SizeChartGuide({ chart, className }, ref) {
  const pillText = `SIZE CHART : ${chart.nama}`.toUpperCase();
  // Perkiraan lebar Arial Bold huruf besar; nama panjang dipadatkan agar tetap di dalam pill.
  const estimated = pillText.length * PILL_TEXT.size * 0.64;
  const rowY = [TABLE.y + TABLE.header + 15.5, TABLE.y + TABLE.header + 46];

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${GUIDE_WIDTH} ${GUIDE_HEIGHT}`}
      width={GUIDE_WIDTH}
      height={GUIDE_HEIGHT}
      role="img"
      aria-label={`Size chart ${chart.nama}`}
      className={className}
    >
      <defs>
        <clipPath id="guide-table-clip">
          <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.h} rx={9} />
        </clipPath>
      </defs>
      <image href={GUIDE_BASE_URL} x={0} y={0} width={GUIDE_WIDTH} height={GUIDE_HEIGHT} />

      <text
        x={PILL_TEXT.x}
        y={PILL_TEXT.y}
        fontFamily={FONT}
        fontWeight={700}
        fontSize={PILL_TEXT.size}
        fill="#111111"
        {...(estimated > PILL_TEXT.maxWidth ? { textLength: PILL_TEXT.maxWidth, lengthAdjust: 'spacingAndGlyphs' } : {})}
      >
        {pillText}
      </text>

      <g fontFamily={FONT}>
        <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.h} rx={9} fill="#ffffff" />
        <g clipPath="url(#guide-table-clip)">
          <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.header} fill="#eef3f9" />
          <line x1={TABLE.x} x2={TABLE.x + TABLE.w} y1={TABLE.y + TABLE.header + 30.5} y2={TABLE.y + TABLE.header + 30.5} stroke="#e8edf3" strokeWidth={0.8} />
        </g>
        <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.h} rx={9} fill="none" stroke="#e2e8f0" strokeWidth={0.8} />

        <text x={TABLE.labelX} y={TABLE.y + 16} fontSize={6} fontWeight={700} fill="#64748b" letterSpacing={0.3}>
          SIZE
        </text>
        {SIZES.map((s, i) => (
          <text key={s} x={TABLE.firstCol + i * TABLE.colGap} y={TABLE.y + 16} fontSize={6} fontWeight={700} fill="#64748b" textAnchor="middle" letterSpacing={0.3}>
            {s}
          </text>
        ))}

        {(['panjang', 'lebar'] as const).map((key, r) => (
          <g key={key}>
            <text x={TABLE.labelX} y={rowY[r]} fontSize={6.6} fontWeight={700} fill="#334155">
              {key === 'panjang' ? 'Panjang (cm)' : 'Lebar (cm)'}
            </text>
            {SIZES.map((s, i) => (
              <text key={s} x={TABLE.firstCol + i * TABLE.colGap} y={rowY[r] + 1} fontSize={9.2} fontWeight={700} fill="#0f172a" textAnchor="middle">
                {cell(chart, s, key)}
              </text>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
});

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
    img.src = src;
  });
}

/**
 * Gambar dasar (URL satu origin) dan lapisan data (SVG tanpa gambar dasar) digambar berurutan ke kanvas, lalu
 * diunduh sebagai JPG. Dua lapisan dipakai karena SVG yang dimuat sebagai gambar tidak boleh memuat gambar lain.
 */
export async function downloadSizeChartJpg(guide: SVGSVGElement, fileName: string, scale = 3): Promise<void> {
  const width = GUIDE_WIDTH * scale;
  const height = GUIDE_HEIGHT * scale;
  const overlay = guide.cloneNode(true) as SVGSVGElement;
  overlay.querySelectorAll('image').forEach((n) => n.remove());
  overlay.removeAttribute('class');
  const xml = new XMLSerializer().serializeToString(overlay);
  const [base, data] = await Promise.all([loadImage(GUIDE_BASE_URL), loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`)]);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(base, 0, 0, width, height);
  ctx.drawImage(data, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('JPG_ENCODE_FAILED');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function sizeChartFileName(chart: Pick<SizeChart, 'nama'>): string {
  const safe = chart.nama.trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-') || 'VisualKain';
  return `SizeChart-${safe}.jpg`;
}
