'use client';

import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import type { CashCoverageProjection } from '@/lib/cash-ledger';

interface CashCoveragePanelProps {
  coverage: CashCoverageProjection;
  variant?: 'banner' | 'compact';
}

function signed(value: number): string {
  return value >= 0 ? `+${formatRupiah(value)}` : formatRupiah(value);
}

/** Jawaban untuk "uang sekarang + pelunasan customer cukup menutup utang vendor dan dana investor?" (US-12.14). */
export function CashCoveragePanel({ coverage, variant = 'banner' }: CashCoveragePanelProps) {
  const cukup = coverage.proyeksiSisa >= 0;
  const cukupTanpaPelunasan = coverage.sisaTanpaPelunasan >= 0;

  const rows: Array<{ label: string; value: string; tone: string }> = [
    { label: 'Kas saat ini', value: formatRupiah(coverage.saldoKas), tone: coverage.saldoKas < 0 ? 'text-rose-700' : 'text-slate-900' },
    { label: '+ Pelunasan customer (akan masuk)', value: formatRupiah(coverage.piutangCustomer), tone: 'text-indigo-700' },
    { label: '− Sisa utang vendor', value: formatRupiah(coverage.utangVendor), tone: 'text-amber-700' },
    { label: '− Dana investor (wajib kembali)', value: formatRupiah(coverage.kewajibanInvestor), tone: 'text-violet-700' },
  ];

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
        cukup ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : 'border-rose-300 bg-rose-100 text-rose-800'
      )}
    >
      {cukup ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
      {cukup ? 'CUKUP' : 'MINUS'}
    </span>
  );

  const catatanTanpaPelunasan = cukupTanpaPelunasan ? (
    <>Kas saat ini sudah cukup menutup semua kewajiban tanpa menunggu pelunasan customer.</>
  ) : (
    <>
      Tanpa menunggu pelunasan customer, kas kurang{' '}
      <span className="font-mono font-semibold tabular-nums">{formatRupiah(Math.abs(coverage.sisaTanpaPelunasan))}</span> untuk
      menutup semua kewajiban, jadi sebagian pelunasan vendor atau investor perlu menunggu tagihan customer cair.
    </>
  );

  if (variant === 'compact') {
    return (
      <div className={cn('rounded-xl border p-3.5 space-y-2 text-xs', cukup ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70')}>
        <div className="flex items-center justify-between gap-2 font-bold text-slate-900">
          <span>Proyeksi Kecukupan Dana</span>
          {badge}
        </div>
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2 text-slate-600">
            <span>{r.label}</span>
            <span className={cn('font-mono font-bold tabular-nums', r.tone)}>{r.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-1.5 font-bold">
          <span>= Proyeksi sisa dana</span>
          <span className={cn('font-mono tabular-nums', cukup ? 'text-emerald-700' : 'text-rose-600')}>{signed(coverage.proyeksiSisa)}</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">{catatanTanpaPelunasan}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border p-3.5 sm:p-4 shadow-card-double',
        cukup
          ? 'border-emerald-200/90 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/30'
          : 'border-rose-200/90 bg-gradient-to-r from-rose-50/70 via-white to-amber-50/30'
      )}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Proyeksi Kecukupan Dana</span>
          {badge}
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          Kas saat ini ditambah pelunasan customer yang akan masuk{' '}
          {cukup ? 'cukup' : <span className="font-semibold text-rose-700">belum cukup</span>} untuk melunasi sisa utang vendor
          dan mengembalikan dana investor. Proyeksi sisa dana{' '}
          <span className={cn('font-mono font-bold tabular-nums', cukup ? 'text-emerald-700' : 'text-rose-600')}>
            {signed(coverage.proyeksiSisa)}
          </span>
          .
        </p>
        <p className="text-[11px] leading-relaxed text-slate-500">{catatanTanpaPelunasan}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-5">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{r.label}</div>
            <div className={cn('mt-0.5 font-mono text-sm font-bold tabular-nums', r.tone)}>{r.value}</div>
          </div>
        ))}
        <div
          className={cn(
            'col-span-2 rounded-xl border px-3 py-2 lg:col-span-1',
            cukup ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'
          )}
        >
          <div className={cn('text-[10px] font-semibold uppercase tracking-wider', cukup ? 'text-emerald-700' : 'text-rose-700')}>
            = Proyeksi sisa dana
          </div>
          <div className={cn('mt-0.5 font-mono text-sm font-bold tabular-nums', cukup ? 'text-emerald-800' : 'text-rose-700')}>
            {signed(coverage.proyeksiSisa)}
          </div>
        </div>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
        Pelunasan customer dan sisa utang vendor dihitung dari semua order sejak 1 Okt 2026 sampai akhir periode, jadi bisa
        berbeda dari kartu Piutang dan Utang Vendor yang hanya memuat order bulan terpilih.
      </p>
    </div>
  );
}
