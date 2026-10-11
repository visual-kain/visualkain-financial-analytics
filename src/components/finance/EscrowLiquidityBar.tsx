'use client';

import React from 'react';
import { formatRupiah, cn } from '@/lib/utils';
import { ShieldCheck, AlertCircle, Lock, Unlock } from 'lucide-react';
import { calculateEscrowLiquidity } from '@/lib/financial-calculator';

interface EscrowLiquidityBarProps {
  saldoKasRiil?: number;
  totalUtangVendor?: number;
  totalKasKeluar?: number;
  className?: string;
}

export function EscrowLiquidityBar({
  saldoKasRiil = 5605000,
  totalUtangVendor = 3455000,
  totalKasKeluar = 1379000,
  className = '',
}: EscrowLiquidityBarProps) {
  const calc = calculateEscrowLiquidity(saldoKasRiil, totalUtangVendor);

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              calc.isDefisit ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'
            )}
          >
            {calc.isDefisit ? <AlertCircle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Escrow Liquidity Bar — Kas Aman Ditarik
              </h3>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold border',
                  calc.isDefisit
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}
              >
                {calc.isDefisit ? 'Defisit Bank' : '2-Pocket Accounting'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemisahan saldo bank riil: kas aman untuk dividen/operasional vs dana titipan vendor
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-50 p-2.5 sm:px-2.5 sm:py-1 text-emerald-800 font-semibold border border-emerald-200/60">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
              <Unlock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Kas Bebas:</span>
            </div>
            <strong className="font-mono text-xs sm:text-sm font-bold">{formatRupiah(calc.kasAmanDitarik)}</strong>
          </div>

          <div
            className={cn(
              'flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 rounded-xl p-2.5 sm:px-2.5 sm:py-1 font-semibold border',
              calc.isDefisit
                ? 'bg-rose-50 text-rose-800 border-rose-200/60'
                : 'bg-amber-50 text-amber-800 border-amber-200/60'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-1.5 text-[11px]',
                calc.isDefisit ? 'text-rose-700' : 'text-amber-700'
              )}
            >
              <Lock className={cn('h-3.5 w-3.5 shrink-0', calc.isDefisit ? 'text-rose-600' : 'text-amber-600')} />
              <span>Terkunci Vendor:</span>
            </div>
            <strong className="font-mono text-xs sm:text-sm font-bold">{formatRupiah(calc.danaTerkunciVendor)}</strong>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200 shadow-inner">
          {calc.isDefisit ? (
            <div
              style={{ width: '100%' }}
              className="h-full rounded-full bg-rose-500 transition-all duration-500 hover:opacity-90"
              title={`Defisit Kas Riil: ${formatRupiah(saldoKasRiil)} (Saldo Bank Tidak Mencukupi)`}
            />
          ) : (
            <>
              <div
                style={{ width: `${calc.percentBebas}%` }}
                className={cn(
                  'h-full bg-emerald-500 transition-all duration-500 hover:opacity-90',
                  calc.percentTerkunci === 0 ? 'rounded-full' : 'rounded-l-full'
                )}
                title={`Kas Bebas Ditarik: ${formatRupiah(calc.kasAmanDitarik)} (${calc.percentBebas}%)`}
              />

              <div
                style={{ width: `${calc.percentTerkunci}%` }}
                className={cn(
                  'h-full bg-amber-500 transition-all duration-500 hover:opacity-90',
                  calc.percentBebas === 0 ? 'rounded-full' : 'rounded-r-full'
                )}
                title={`Dana Terkunci Hak Vendor: ${formatRupiah(calc.danaTerkunciVendor)} (${calc.percentTerkunci}%)`}
              />
            </>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between text-xs text-slate-500 pt-1">
          <div className="rounded-xl border border-slate-100 sm:border-0 bg-slate-50/60 sm:bg-transparent p-2.5 sm:p-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="text-[11px] text-slate-500">
              Kas Riil Bank:{' '}
              <strong className={cn('font-mono font-bold', saldoKasRiil < 0 ? 'text-rose-600' : 'text-slate-800')}>
                {formatRupiah(saldoKasRiil)}
              </strong>
            </div>
            <span className="hidden sm:inline text-slate-300">&bull;</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">
              BCA Terverifikasi
            </span>
          </div>

          <div className="rounded-xl border border-slate-100 sm:border-0 bg-slate-50/60 sm:bg-transparent p-2.5 sm:p-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-right sm:text-left">
            <span
              className={cn(
                'inline-flex items-center gap-1 font-bold text-[11px] sm:text-xs',
                calc.isDefisit
                  ? 'text-rose-700'
                  : calc.isHealthy
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              )}
            >
              {calc.isDefisit ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
              ) : calc.isHealthy ? (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              {calc.statusLabel}
            </span>
            <span className="hidden sm:inline text-slate-300">&bull;</span>
            <span
              className={cn(
                'text-[10px] sm:text-[11px] font-medium',
                calc.isDefisit ? 'text-rose-500' : 'text-slate-400'
              )}
            >
              {calc.coverageLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
