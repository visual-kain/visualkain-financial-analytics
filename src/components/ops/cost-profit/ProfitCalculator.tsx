'use client';

import React, { useId, useMemo, useState } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { BTN_SECONDARY, CARD, FIELD_ERROR, FIELD_INPUT, FIELD_LABEL } from '@/components/ops/cost-profit/styles';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { NegativeAwareValue } from '@/components/ui/negative-value';
import { Shimmer } from '@/components/ui/shimmer';
import {
  DEFAULT_QTY,
  calculateCostProfit,
  formatMarkupPersen,
  formatQtyRange,
  parseNumericField,
  type BahanDoc,
  type MarkupDoc,
} from '@/lib/cost-profit';
import type { KategoriDoc } from '@/lib/legacy/types';
import { cn, formatRupiah } from '@/lib/utils';

interface ProfitCalculatorProps {
  kategoriList: KategoriDoc[];
  bahanList: BahanDoc[];
  markupList: MarkupDoc[];
  loading: boolean;
  onOpenDatabase: () => void;
}

const SELECT_CLASS = 'h-11 w-full text-sm sm:h-10 sm:text-xs';

function ResultTile({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3', className)}>
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 break-words font-mono text-lg font-extrabold tabular-nums text-slate-900">{children}</p>
    </div>
  );
}

function CalculatorSkeleton() {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-6" aria-busy="true" aria-label="Memuat kalkulator">
      <div className={cn(CARD, 'space-y-4 p-4 sm:p-5')}>
        <Shimmer className="h-5 w-48 rounded" />
        <Shimmer className="h-11 w-full rounded-xl" />
        <Shimmer className="h-11 w-full rounded-xl" />
        <Shimmer className="h-11 w-full rounded-xl" />
        <Shimmer className="h-11 w-full rounded-xl" />
      </div>
      <div className={cn(CARD, 'space-y-4 p-4 sm:p-5')}>
        <Shimmer className="h-5 w-40 rounded" />
        <Shimmer className="h-16 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Shimmer className="h-20 w-full rounded-xl" />
          <Shimmer className="h-20 w-full rounded-xl" />
          <Shimmer className="h-20 w-full rounded-xl" />
        </div>
        <Shimmer className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ProfitCalculator({ kategoriList, bahanList, markupList, loading, onOpenDatabase }: ProfitCalculatorProps) {
  const uid = useId();
  const [kategoriId, setKategoriId] = useState('');
  const [bahanId, setBahanId] = useState('');
  const [qtyInput, setQtyInput] = useState(String(DEFAULT_QTY));

  // Pilihan yang datanya sudah dihapus (di tab lain atau perangkat lain) dianggap belum dipilih.
  const activeKategoriId = kategoriList.some((k) => k.id === kategoriId) ? kategoriId : '';
  const filteredBahan = useMemo(() => (activeKategoriId ? bahanList.filter((b) => b.kategoriId === activeKategoriId) : []), [bahanList, activeKategoriId]);
  const bahan = filteredBahan.find((b) => b.id === bahanId) ?? null;

  const qty = parseNumericField(qtyInput);
  const qtyValid = Number.isFinite(qty) && qty >= 1;
  const result = useMemo(() => calculateCostProfit(bahan ? bahan.harga : null, qty, markupList), [bahan, qty, markupList]);

  if (loading) return <CalculatorSkeleton />;

  if (kategoriList.length === 0 || bahanList.length === 0) {
    return (
      <EmptyState
        className="min-h-[300px] bg-white"
        title="Belum ada data bahan"
        description="Tambahkan kategori dan bahan di tab Database Bahan & Aturan sebelum memakai kalkulator."
        action={
          <button type="button" onClick={onOpenDatabase} className={cn(BTN_SECONDARY, 'mt-1')}>
            Buka Database Bahan & Aturan <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      />
    );
  }

  const ready = !!bahan && qtyValid;
  const muted = ready ? '' : 'opacity-60';

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-6">
      <section className={cn(CARD, 'p-4 sm:p-5')} aria-labelledby={`${uid}-form-title`}>
        <h2 id={`${uid}-form-title`} className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
          Kalkulator Estimasi Profit
        </h2>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500 sm:text-xs">Pilih bahan dan jumlah pesanan. Harga jual mengikuti aturan markup yang cocok dengan Qty.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <span id={`${uid}-kategori`} className={FIELD_LABEL}>
              Pilih Kategori
            </span>
            <div role="group" aria-labelledby={`${uid}-kategori`}>
              <CustomSelect
                value={activeKategoriId}
                onValueChange={(value) => {
                  setKategoriId(value);
                  setBahanId('');
                }}
                placeholder="Pilih kategori"
                options={kategoriList.map((k) => ({ value: k.id, label: k.nama }))}
                className={SELECT_CLASS}
              />
            </div>
          </div>

          <div>
            <span id={`${uid}-bahan`} className={FIELD_LABEL}>
              Pilih Bahan
            </span>
            {/* fieldset disabled menonaktifkan tombol Radix di dalamnya; CustomSelect belum punya prop disabled. */}
            <fieldset disabled={!activeKategoriId} className={cn('m-0 min-w-0 border-0 p-0', !activeKategoriId && 'opacity-60 [&_button]:cursor-not-allowed')}>
              <div role="group" aria-labelledby={`${uid}-bahan`}>
                <CustomSelect
                  value={bahan ? bahan.id : ''}
                  onValueChange={setBahanId}
                  placeholder={!activeKategoriId ? 'Pilih kategori dulu' : filteredBahan.length === 0 ? 'Belum ada bahan di kategori ini' : 'Pilih bahan'}
                  options={filteredBahan.map((b) => ({ value: b.id, label: b.nama }))}
                  className={SELECT_CLASS}
                />
              </div>
            </fieldset>
          </div>

          <div>
            <label htmlFor={`${uid}-qty`} className={FIELD_LABEL}>
              Qty (Jumlah Pesanan)
            </label>
            <input
              id={`${uid}-qty`}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              aria-invalid={!qtyValid}
              aria-describedby={!qtyValid ? `${uid}-qty-error` : undefined}
              className={cn(FIELD_INPUT, 'font-mono')}
            />
            {!qtyValid && (
              <p id={`${uid}-qty-error`} className={FIELD_ERROR}>
                Qty minimal 1 pcs
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${uid}-modal`} className={FIELD_LABEL}>
              Harga Modal / Pcs
            </label>
            <input
              id={`${uid}-modal`}
              readOnly
              value={formatRupiah(result.hargaModal)}
              className={cn(FIELD_INPUT, 'cursor-default bg-slate-100 font-mono font-bold focus:border-slate-200 focus:ring-0')}
            />
          </div>
        </div>
      </section>

      <section className={cn(CARD, 'p-4 sm:p-5')} aria-labelledby={`${uid}-result-title`}>
        <h2 id={`${uid}-result-title`} className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
          Hasil Perhitungan
        </h2>

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
          <p className="text-[11px] font-semibold text-slate-500">Aturan Markup Diterapkan</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1" aria-live="polite">
            {!bahan || !qtyValid ? (
              <span className="text-lg font-extrabold text-slate-400">-</span>
            ) : result.rule ? (
              <>
                <span className="rounded-lg border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-base font-extrabold tabular-nums text-teal-800">
                  {formatMarkupPersen(result.rule.persen)}
                </span>
                <span className="text-xs font-semibold text-slate-600">{formatQtyRange(result.rule.qtyMin, result.rule.qtyMax)}</span>
              </>
            ) : (
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900">Tidak ada aturan, +0%</span>
            )}
          </div>
          {!bahan && <p className="mt-2 text-[11px] text-slate-500">Pilih kategori dan bahan untuk melihat hasil.</p>}
          {bahan && qtyValid && !result.rule && (
            <p className="mt-2 flex flex-wrap items-center gap-x-1 text-[11px] text-slate-600">
              <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
              {markupList.length === 0 ? 'Belum ada aturan markup, harga jual sama dengan harga modal.' : `Qty ${qty} tidak masuk rentang aturan mana pun, harga jual sama dengan harga modal.`}
              <button type="button" onClick={onOpenDatabase} className="inline-flex min-h-[44px] cursor-pointer items-center font-bold text-teal-700 underline-offset-2 hover:underline sm:min-h-0">
                Kelola aturan
              </button>
            </p>
          )}
        </div>

        <div className={cn('mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3', muted)}>
          <ResultTile label="Harga Jual / Pcs">
            <NegativeAwareValue value={result.hargaJual} reason="Harga jual minus">
              {formatRupiah(result.hargaJual)}
            </NegativeAwareValue>
          </ResultTile>
          <ResultTile label="Total Modal">
            <NegativeAwareValue value={result.totalModal} reason="Total modal minus">
              {formatRupiah(result.totalModal)}
            </NegativeAwareValue>
          </ResultTile>
          <ResultTile label="Total Penjualan">
            <NegativeAwareValue value={result.totalJual} reason="Total penjualan minus">
              {formatRupiah(result.totalJual)}
            </NegativeAwareValue>
          </ResultTile>
        </div>

        <div className={cn('mt-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3.5', muted)}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-teal-800">Estimasi Profit</p>
          <p className="mt-1 break-words font-mono text-2xl font-extrabold tabular-nums text-teal-900 sm:text-3xl" aria-live="polite">
            <NegativeAwareValue value={result.profit} reason="Estimasi profit minus">
              {formatRupiah(result.profit)}
            </NegativeAwareValue>
          </p>
          {ready && (
            <p className="mt-1 text-[11px] text-teal-800/80">
              Total Penjualan dikurangi Total Modal untuk {qty} pcs.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
