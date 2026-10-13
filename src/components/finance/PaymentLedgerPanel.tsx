'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pencil, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CustomSelect } from '@/components/ui/custom-select';
import { formatRupiah, cn } from '@/lib/utils';
import { FINANCE_START_DATE, isFromFinanceStartDate } from '@/lib/constants';
import {
  type LedgerEntry,
  type LedgerKind,
  nextTerminNumber,
  outstandingAmount,
  suggestTerminLabel,
  summarizeLedger,
  validateEntryNominal,
  normalizeLedger,
  resolveEditTarget,
  isAutoLabel,
  isUnitemizedPaymentId,
  TARGET_DP_PERCENT,
} from '@/lib/payment-ledger';

export interface LedgerRow extends LedgerEntry {
  terminKe: number;
  label: string;
  keterangan?: string;
}

export interface LedgerDraftState {
  nominal: number;
  error: string | null;
  previewEntries: LedgerRow[];
}

interface AccountOption {
  value: string;
  label: string;
  badge?: string;
}

interface PaymentLedgerPanelProps {
  variant: LedgerKind;
  totalTagihan: number;
  diskon?: number;
  entries: LedgerRow[];
  onChange: (rows: LedgerRow[]) => void;
  accountOptions: ReadonlyArray<AccountOption>;
  defaultTanggal: string;
  defaultRekening: string;
  initialEditId?: string | null;
  onPendingChange?: (hasPending: boolean) => void;
  onDraftChange?: (draft: LedgerDraftState) => void;
  disabled?: boolean;
}

const COPY = {
  customer: {
    title: 'Riwayat Termin Pembayaran Konsumen',
    hint: 'Semua cicilan konsumen untuk pesanan ini. Jumlah termin mengikuti kesepakatan, tanpa batas tetap.',
    total: 'Total Tagihan',
    paid: 'Sudah Dibayar Konsumen',
    remain: 'Sisa Pelunasan',
    add: 'Tambah Termin',
    rowNoun: 'termin',
    accountLabel: 'Rekening Tujuan',
    totalFooter: 'Total Uang Masuk Konsumen',
    accent: 'teal',
  },
  vendor: {
    title: 'Riwayat Pembayaran ke Vendor',
    hint: 'Semua pembayaran ke vendor untuk pesanan ini. Sisa utang berkurang otomatis setiap baris ditambahkan.',
    total: 'Total HPP Vendor',
    paid: 'Sudah Dibayar ke Vendor',
    remain: 'Sisa Utang Vendor',
    add: 'Tambah Pembayaran',
    rowNoun: 'pembayaran',
    accountLabel: 'Sumber Rekening Pencairan',
    totalFooter: 'Total Dibayar ke Vendor',
    accent: 'rose',
  },
} as const;

function splitKeterangan(raw: string | undefined, accounts: ReadonlyArray<AccountOption>, fallback: string) {
  const text = (raw || '').trim();
  if (!text) return { rekening: fallback, catatan: '' };
  const hit = accounts.find((a) => a.value && (text === a.value || text.startsWith(`${a.value} - `)));
  if (!hit) return { rekening: '', catatan: text };
  const extracted = text === hit.value ? '' : text.slice(hit.value.length + 3).trim();
  return { rekening: hit.value, catatan: extracted === hit.value ? '' : extracted };
}

function formatKeterangan(rekening: string, catatan: string): string {
  const cleanCat = catatan.trim();
  const cleanRek = rekening.trim();
  if (!cleanRek) return cleanCat || 'Transfer BCA';
  return cleanCat ? `${cleanRek} - ${cleanCat}` : cleanRek;
}

export function PaymentLedgerPanel({
  variant,
  totalTagihan,
  diskon = 0,
  entries,
  onChange,
  accountOptions,
  defaultTanggal,
  defaultRekening,
  initialEditId = null,
  onPendingChange,
  onDraftChange,
  disabled = false,
}: PaymentLedgerPanelProps) {
  const copy = COPY[variant];
  const uid = useId();
  const isCustomer = variant === 'customer';

  const [isFormOpen, setIsFormOpen] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState<string>(defaultTanggal);
  const [nominal, setNominal] = useState<number>(0);
  const [rekening, setRekening] = useState<string>(defaultRekening);
  const [catatan, setCatatan] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [labelTouched, setLabelTouched] = useState<boolean>(false);
  const [editTargetMissing, setEditTargetMissing] = useState<boolean>(false);
  const consumedEditIdRef = useRef<string | null>(null);

  const effectiveAccountOptions = useMemo<ReadonlyArray<AccountOption>>(() => {
    if (accountOptions.some((a) => a.value === '')) return accountOptions;
    return [
      ...accountOptions,
      { value: '', label: 'Tanpa Prefix Rekening (Sesuai Catatan)' },
    ];
  }, [accountOptions]);

  const editingRow = useMemo(() => entries.find((e) => e.id === editingId) || null, [entries, editingId]);
  const terminKe = editingRow ? editingRow.terminKe : nextTerminNumber(entries);
  const sisaBoleh = outstandingAmount(totalTagihan, entries, editingId);
  const settles = nominal > 0 && nominal === sisaBoleh;
  const suggestedLabel = suggestTerminLabel(terminKe, settles, variant);
  const effectiveLabel = labelTouched ? label : suggestedLabel;

  const preview = summarizeLedger(totalTagihan, entries, nominal, editingId);
  const summary = summarizeLedger(totalTagihan, entries);

  const nominalError = nominal > 0 ? validateEntryNominal(nominal, sisaBoleh, formatRupiah) : null;
  const dateError = !isFromFinanceStartDate(tanggal) ? 'Tanggal harus mulai 1 Oktober 2026' : null;
  const draftError = nominal > 0 ? nominalError || dateError : null;
  const canSubmit = !disabled && nominal > 0 && !draftError;
  const hasPending = nominal > 0;

  const previewEntries = useMemo<LedgerRow[]>(() => {
    if (!canSubmit) return entries;
    const keterangan = formatKeterangan(rekening, catatan);
    if (editingRow) {
      const next = entries.map((row) =>
        row.id === editingRow.id
          ? { ...row, tanggal, nominal, label: effectiveLabel.trim() || suggestedLabel, keterangan }
          : row
      );
      return normalizeLedger(next, totalTagihan, variant) as LedgerRow[];
    }
    const created: LedgerRow = {
      id: `${variant === 'customer' ? 'pay' : 'vp'}-draft`,
      tanggal,
      nominal,
      terminKe,
      label: effectiveLabel.trim() || suggestedLabel,
      keterangan,
      createdAt: new Date().toISOString(),
    };
    return normalizeLedger([...entries, created], totalTagihan, variant) as LedgerRow[];
  }, [canSubmit, catatan, rekening, editingRow, entries, tanggal, nominal, effectiveLabel, suggestedLabel, totalTagihan, variant, terminKe]);

  useEffect(() => {
    onPendingChange?.(hasPending);
  }, [hasPending, onPendingChange]);

  useEffect(() => {
    onDraftChange?.({
      nominal,
      error: draftError,
      previewEntries,
    });
  }, [nominal, draftError, previewEntries, onDraftChange]);

  const focusNominalInput = () => {
    setTimeout(() => {
      const el = document.getElementById(`${uid}-nom`);
      el?.focus();
    }, 0);
  };

  const resetForm = () => {
    setEditingId(null);
    setNominal(0);
    setCatatan('');
    setLabel('');
    setLabelTouched(false);
    setRekening(defaultRekening);
    setTanggal(defaultTanggal);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const keterangan = formatKeterangan(rekening, catatan);

    if (editingRow) {
      const next = entries.map((row) =>
        row.id === editingRow.id
          ? { ...row, tanggal, nominal, label: effectiveLabel.trim() || suggestedLabel, keterangan }
          : row
      );
      onChange(normalizeLedger(next, totalTagihan, variant) as LedgerRow[]);
    } else {
      const created: LedgerRow = {
        id: `${variant === 'customer' ? 'pay' : 'vp'}-${Date.now()}`,
        tanggal,
        nominal,
        terminKe,
        label: effectiveLabel.trim() || suggestedLabel,
        keterangan,
        createdAt: new Date().toISOString(),
      };
      onChange(normalizeLedger([...entries, created], totalTagihan, variant) as LedgerRow[]);
    }
    resetForm();
  };

  const startEdit = (row: LedgerRow) => {
    const parts = splitKeterangan(row.keterangan, accountOptions, defaultRekening);
    setEditingId(row.id);
    setTanggal(row.tanggal);
    setNominal(row.nominal);
    setRekening(parts.rekening);
    setCatatan(parts.catatan);
    setLabel(row.label);
    setLabelTouched(!isAutoLabel(row.label));
    setIsFormOpen(true);
    focusNominalInput();
  };

  // Edit dari tabel dibuka sekali per ID; baris yang berubah setelahnya tidak boleh membuka form lagi.
  useEffect(() => {
    if (!initialEditId || entries.length === 0 || consumedEditIdRef.current === initialEditId) return;
    consumedEditIdRef.current = initialEditId;
    const target = resolveEditTarget(entries, initialEditId);
    if (target) {
      startEdit(target);
    } else {
      setEditTargetMissing(true);
    }
  }, [initialEditId, entries]);

  // Enter di input baris menambah/memperbarui baris panel, bukan men-submit form halaman.
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' || (e.target as HTMLElement).tagName !== 'INPUT') return;
    e.preventDefault();
    handleSubmit();
  };

  const removeRow = (id: string) => {
    if (editingId === id) resetForm();
    onChange(normalizeLedger(entries.filter((e) => e.id !== id), totalTagihan, variant) as LedgerRow[]);
  };

  const labelChips = useMemo(() => {
    const base = isCustomer
      ? [`DP ${terminKe}`, `Termin ${terminKe}`, 'Pelunasan']
      : [`Pembayaran ke-${terminKe}`, 'DP Vendor', 'Pelunasan'];
    return base.filter((v, i, arr) => arr.indexOf(v) === i);
  }, [isCustomer, terminKe]);

  const tone = isCustomer
    ? { solid: 'bg-teal-600 hover:bg-teal-700', soft: 'bg-teal-50 border-teal-100 text-teal-800', ring: 'focus:ring-teal-500/20 focus:border-teal-500' }
    : { solid: 'bg-rose-600 hover:bg-rose-700', soft: 'bg-rose-50 border-rose-100 text-rose-800', ring: 'focus:ring-rose-500/20 focus:border-rose-500' };

  const barPct = Math.min(100, Math.max(0, preview.persen));
  const statusLabel = isCustomer
    ? preview.isReady70
      ? 'Siap Produksi (70% terpenuhi)'
      : 'Menunggu DP 70%'
    : preview.isLunas
    ? 'Lunas ke vendor'
    : 'Masih ada utang vendor';

  const inputBase = cn(
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2',
    tone.ring
  );

  const isSettledNoEdit = summary.isLunas && !editingRow;
  const isFormHidden = disabled || isSettledNoEdit;

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-card-double space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">{copy.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{copy.hint}</p>
        </div>
        {!isFormOpen && !isFormHidden && (
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              focusNominalInput();
            }}
            className={cn(
              'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white active:scale-[0.96] transition-transform duration-150 cursor-pointer shrink-0',
              tone.solid
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{copy.add}</span>
          </button>
        )}
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
          <span className="block text-[11px] text-slate-500 leading-tight">{copy.total}</span>
          <div className="mt-1 font-mono text-sm font-extrabold text-slate-900 tabular-nums">{formatRupiah(summary.total)}</div>
          {isCustomer && diskon > 0 && (
            <span className="text-[11px] text-slate-500">Diskon {formatRupiah(diskon)}</span>
          )}
        </div>
        <div className={cn('rounded-xl p-3 border', tone.soft)}>
          <span className="block text-[11px] leading-tight opacity-80">{copy.paid}</span>
          <div className="mt-1 font-mono text-sm font-extrabold tabular-nums">{formatRupiah(summary.dibayar)}</div>
          <span className="text-[11px] font-semibold">{summary.persen.toFixed(1)}% terbayar</span>
        </div>
        {isCustomer ? (
          <div className="rounded-xl bg-blue-50 p-3 border border-blue-100">
            <span className="block text-[11px] text-blue-800 leading-tight">Target DP {TARGET_DP_PERCENT}%</span>
            <div className="mt-1 font-mono text-sm font-extrabold text-blue-900 tabular-nums">{formatRupiah(summary.target70)}</div>
            <span className="text-[11px] text-blue-800">
              {summary.isReady70 ? 'Terpenuhi' : `Kurang ${formatRupiah(summary.sisaMenuju70)}`}
            </span>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <span className="block text-[11px] text-slate-500 leading-tight">Jumlah Pembayaran</span>
            <div className="mt-1 font-mono text-sm font-extrabold text-slate-900 tabular-nums">{entries.length}x</div>
            <span className="text-[11px] text-slate-500">tercatat</span>
          </div>
        )}
        <div className="rounded-xl bg-purple-50 p-3 border border-purple-100">
          <span className="block text-[11px] text-purple-800 leading-tight">{copy.remain}</span>
          <div className="mt-1 font-mono text-sm font-extrabold text-purple-900 tabular-nums">{formatRupiah(summary.sisa)}</div>
          <span className="text-[11px] text-purple-800">{summary.isLunas ? 'Lunas' : 'Belum lunas'}</span>
        </div>
      </div>

      {/* Progres */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-600 gap-2">
          <span>Progres pembayaran{nominal > 0 ? ' (termasuk nominal yang sedang diisi)' : ''}</span>
          <span className="font-mono font-bold text-slate-900">{preview.persen.toFixed(1)}%</span>
        </div>
        <div className="relative h-3.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200" role="progressbar" aria-valuenow={Math.round(barPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progres pembayaran">
          {isCustomer && (
            <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10" style={{ left: `${TARGET_DP_PERCENT}%` }} title={`Batas ${TARGET_DP_PERCENT}%`} />
          )}
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-300',
              preview.isOverpay ? 'bg-rose-500' : isCustomer ? (preview.isReady70 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-rose-500'
            )}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
          {preview.isLunas || (isCustomer && preview.isReady70) ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden />
          )}
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Form baris */}
      {editTargetMissing && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          Transaksi tidak ditemukan, mungkin sudah diubah atau dihapus. Pilih baris di daftar bawah untuk mengedit.
        </div>
      )}

      {isFormOpen && !isFormHidden && (
        <div onKeyDown={handleFormKeyDown} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-900">
              {editingRow ? `Edit ${copy.rowNoun} ke-${terminKe}` : `${copy.rowNoun === 'termin' ? 'Termin' : 'Pembayaran'} ke-${terminKe}`}
            </h3>
            {(entries.length > 0 || editingRow) && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsFormOpen(false);
                }}
                className="inline-flex h-10 items-center rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Tutup form
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor={`${uid}-tgl`} className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal</label>
              <input
                id={`${uid}-tgl`}
                type="date"
                min={FINANCE_START_DATE}
                value={tanggal}
                onChange={(e) => {
                  setTanggal(e.target.value);
                }}
                className={inputBase}
              />
              {dateError && <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-700">{dateError}</p>}
            </div>

            <div>
              <label htmlFor={`${uid}-nom`} className="block text-[11px] font-bold text-slate-700 mb-1">Nominal (Rp)</label>
              <CurrencyInput
                id={`${uid}-nom`}
                value={nominal}
                onValueChange={(val) => {
                  setNominal(val);
                }}
                placeholder="Rp 0"
                className="h-11 text-sm font-bold font-mono"
              />
              {nominalError && <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-700">{nominalError}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={sisaBoleh <= 0}
                  onClick={() => {
                    setNominal(sisaBoleh);
                  }}
                  className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  Sisa penuh ({formatRupiah(sisaBoleh)})
                </button>
                {isCustomer && !summary.isReady70 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNominal(Math.min(sisaBoleh, Math.max(0, summary.target70 - outstandingPaid(entries, editingId))));
                    }}
                    className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Sisa menuju 70% ({formatRupiah(Math.max(0, summary.target70 - outstandingPaid(entries, editingId)))})
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor={`${uid}-lbl`} className="block text-[11px] font-bold text-slate-700 mb-1">Nama {copy.rowNoun}</label>
              <input
                id={`${uid}-lbl`}
                type="text"
                value={effectiveLabel}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setLabelTouched(true);
                }}
                className={inputBase}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {labelChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setLabel(chip);
                      setLabelTouched(true);
                    }}
                    className={cn(
                      'inline-flex h-10 items-center rounded-lg border px-3 text-[11px] font-bold cursor-pointer',
                      effectiveLabel === chip ? tone.soft : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-bold text-slate-700 mb-1">{copy.accountLabel}</span>
              <CustomSelect
                value={rekening}
                onValueChange={(val) => {
                  setRekening(val);
                }}
                options={effectiveAccountOptions.map((a) => ({ value: a.value, label: a.label, badge: a.badge }))}
                className="h-11 w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-cat`} className="block text-[11px] font-bold text-slate-700 mb-1">Catatan / bukti referensi</label>
            <input
              id={`${uid}-cat`}
              type="text"
              value={catatan}
              onChange={(e) => {
                setCatatan(e.target.value);
              }}
              placeholder="Contoh: Transfer BCA, ref #8271"
              className={inputBase}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            {editingRow && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal edit
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'flex-1 sm:flex-none inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-bold text-white active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                tone.solid
              )}
            >
              {editingRow ? 'Perbarui baris' : 'Tambahkan baris'}
            </button>
          </div>
        </div>
      )}

      {isFormHidden && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          Pesanan sudah lunas. Input baris baru dinonaktifkan, namun baris yang ada tetap dapat diedit atau dihapus.
        </div>
      )}

      {/* Mobile: kartu */}
      <div className="sm:hidden space-y-2.5">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">
            Belum ada {copy.rowNoun} tercatat.
          </div>
        ) : (
          entries.map((row) => (
            <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{row.terminKe}. {row.label}</div>
                  {isUnitemizedPaymentId(row.id) && (
                    <span className="mt-1 inline-flex rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                      Belum dirinci per termin
                    </span>
                  )}
                  <div className="text-[11px] text-slate-500">{row.tanggal}</div>
                </div>
                <div className="font-mono text-sm font-extrabold text-slate-900 tabular-nums shrink-0">{formatRupiah(row.nominal)}</div>
              </div>
              {row.keterangan && <p className="text-[11px] text-slate-600 break-words">{row.keterangan}</p>}
              {!disabled && (
                <div className="flex items-center gap-2 pt-1">
                  <button type="button" onClick={() => startEdit(row)} aria-label={`Edit ${row.label}`} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => removeRow(row.id)} aria-label={`Hapus ${row.label}`} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs">
          <span className="font-bold text-slate-800">{copy.totalFooter}</span>
          <span className="font-mono font-extrabold text-slate-900 tabular-nums">{formatRupiah(summary.dibayar)}</span>
        </div>
      </div>

      {/* Desktop: tabel */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold w-14">No</th>
              <th scope="col" className="px-4 py-3 font-bold">Tanggal</th>
              <th scope="col" className="px-4 py-3 font-bold">Nama {copy.rowNoun}</th>
              <th scope="col" className="px-4 py-3 font-bold">Rekening dan catatan</th>
              <th scope="col" className="px-4 py-3 font-bold text-right">Nominal (Rp)</th>
              {!disabled && <th scope="col" className="px-4 py-3 font-bold text-center w-28">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 5 : 6} className="py-8 text-center text-xs text-slate-500">
                  Belum ada {copy.rowNoun} tercatat. Isi form di atas lalu tekan Tambahkan baris.
                </td>
              </tr>
            ) : (
              entries.map((row) => (
                <tr key={row.id} className={cn('hover:bg-slate-50/70', editingId === row.id && 'bg-amber-50/60')}>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{row.terminKe}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{row.tanggal}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {row.label}
                    {isUnitemizedPaymentId(row.id) && (
                      <span className="ml-2 inline-flex rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 whitespace-nowrap">
                        Belum dirinci per termin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[280px] break-words">{row.keterangan || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">{formatRupiah(row.nominal)}</td>
                  {!disabled && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" onClick={() => startEdit(row)} aria-label={`Edit ${row.label}`} title="Edit" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => removeRow(row.id)} aria-label={`Hapus ${row.label}`} title="Hapus" className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right font-bold text-slate-800">{copy.totalFooter}:</td>
              <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900 tabular-nums">{formatRupiah(summary.dibayar)}</td>
              {!disabled && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function outstandingPaid(entries: ReadonlyArray<LedgerEntry>, excludeId: string | null): number {
  return entries.reduce((sum, e) => (e.id === excludeId ? sum : sum + (Number(e.nominal) || 0)), 0);
}
