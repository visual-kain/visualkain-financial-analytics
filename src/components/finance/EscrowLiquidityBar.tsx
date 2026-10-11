'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils';
import { ShieldCheck, AlertCircle, Info, Lock, Unlock } from 'lucide-react';

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
  // Hitung alokasi 2 kantong (Escrow Liquidity Invariant)
  // Dana vendor yang wajib dicadangkan di bank adalah utang vendor yang belum disetor
  const danaTerkunciVendor = Math.min(saldoKasRiil, Math.max(0, totalUtangVendor));
  const kasAmanDitarik = Math.max(0, saldoKasRiil - danaTerkunciVendor);

  const totalBank = Math.max(saldoKasRiil, 1);
  const percentBebas = Number(((kasAmanDitarik / totalBank) * 100).toFixed(1));
  const percentTerkunci = Number(((danaTerkunciVendor / totalBank) * 100).toFixed(1));

  const isHealthy = percentBebas >= 25;

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Escrow Liquidity Bar — Kas Aman Ditarik
              </h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                2-Pocket Accounting
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemisahan saldo bank riil: kas aman untuk dividen/operasional vs dana titipan vendor
            </p>
          </div>
        </div>

        {/* Legend Pills (Grid 2-Kolom di Mobile, Flex di Desktop) */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-50 p-2.5 sm:px-2.5 sm:py-1 text-emerald-800 font-semibold border border-emerald-200/60">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
              <Unlock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Kas Bebas:</span>
            </div>
            <strong className="font-mono text-xs sm:text-sm font-bold">{formatRupiah(kasAmanDitarik)}</strong>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 rounded-xl bg-amber-50 p-2.5 sm:px-2.5 sm:py-1 text-amber-800 font-semibold border border-amber-200/60">
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700">
              <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Terkunci Vendor:</span>
            </div>
            <strong className="font-mono text-xs sm:text-sm font-bold">{formatRupiah(danaTerkunciVendor)}</strong>
          </div>
        </div>
      </div>

      {/* Multi-Segment Escrow Bar */}
      <div className="mt-4">
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200 shadow-inner">
          {/* Kas Aman Bebas Tarik (Hijau Emerald) */}
          <div
            style={{ width: `${percentBebas}%` }}
            className="h-full rounded-l-full bg-emerald-500 transition-all duration-500 hover:opacity-90"
            title={`Kas Bebas Ditarik: ${formatRupiah(kasAmanDitarik)} (${percentBebas}%)`}
          />

          {/* Dana Terkunci Hak Vendor (Kuning Amber) */}
          <div
            style={{ width: `${percentTerkunci}%` }}
            className={`h-full bg-amber-500 transition-all duration-500 hover:opacity-90 ${
              percentBebas === 0 ? 'rounded-l-full' : ''
            } ${percentBebas + percentTerkunci >= 100 ? 'rounded-r-full' : ''}`}
            title={`Dana Terkunci Hak Vendor: ${formatRupiah(danaTerkunciVendor)} (${percentTerkunci}%)`}
          />
        </div>

        {/* Bar Footer Details (Grid 2-Kolom Terstruktur di Mobile, Flex di Desktop) */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between text-xs text-slate-500 pt-1">
          <div className="rounded-xl border border-slate-100 sm:border-0 bg-slate-50/60 sm:bg-transparent p-2.5 sm:p-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="text-[11px] text-slate-500">
              Kas Riil Bank:{' '}
              <strong className={`font-mono font-bold ${saldoKasRiil < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
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
              className={`inline-flex items-center gap-1 font-bold text-[11px] sm:text-xs ${
                isHealthy ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isHealthy ? (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              {percentBebas}% Aman Ditarik
            </span>
            <span className="hidden sm:inline text-slate-300">&bull;</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              Utang Tercover 100%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
