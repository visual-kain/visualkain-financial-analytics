'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { DEFAULT_BANK_INFO } from '@/components/legacy/InvoicePaper';
import { useRekeningMaster } from '@/hooks/useRekeningMaster';
import { DEFAULT_REKENING, type RekeningAccount } from '@/lib/rekening-master';
import type { BankAccountInfo } from '@/lib/legacy/types';
import { cn } from '@/lib/utils';

export const BANK_STORAGE_KEY = 'vk_invoice_bank_info';

/** Tiga rekening yang tercetak di invoice visualkaindb (`app/invoice/page.tsx`). */
export const INVOICE_BANK_PRESETS: Array<{ id: string; name: string; tag: string; info: BankAccountInfo }> = [
  { id: 'bca-utama', name: 'BCA (Utama)', tag: 'Default', info: { bankName: 'BCA', noRekening: '2820246767', atasNama: 'GLORA SAWITA BR PANJAITAN' } },
  { id: 'mandiri', name: 'Mandiri Visual Kain', tag: 'Cadangan', info: { bankName: 'Mandiri', noRekening: '1640003829102', atasNama: 'VISUAL KAIN APPAREL' } },
  { id: 'bri', name: 'BRI Operasional', tag: 'Operasional', info: { bankName: 'BRI', noRekening: '034101002345508', atasNama: 'GLORA SAWITA BR PANJAITAN' } },
];

export function readStoredBank(): BankAccountInfo {
  try {
    const saved = window.localStorage.getItem(BANK_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<BankAccountInfo>;
      if (parsed.bankName && parsed.noRekening) {
        return { bankName: parsed.bankName, noRekening: parsed.noRekening, atasNama: parsed.atasNama || '' };
      }
    }
  } catch {
    // Storage diblokir atau data rusak: pakai rekening default invoice.
  }
  return DEFAULT_BANK_INFO;
}

function storeBank(info: BankAccountInfo) {
  try {
    window.localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(info));
  } catch {
    // Pilihan tetap berlaku untuk sesi ini walau tidak tersimpan.
  }
}

/**
 * Rekening master yang benar-benar diisi klien. Default bawaan master rekening yang belum pernah diubah
 * disembunyikan karena nomornya belum dikonfirmasi klien (K-20).
 */
export function verifiedMasterAccounts(accounts: ReadonlyArray<RekeningAccount>): RekeningAccount[] {
  return accounts.filter((acc) => {
    if (!acc.nomor.trim() || !acc.atasNama.trim()) return false;
    const builtIn = DEFAULT_REKENING.find((d) => d.kode === acc.kode);
    return !(builtIn && builtIn.nomor === acc.nomor && builtIn.atasNama === acc.atasNama);
  });
}

function sameBank(a: BankAccountInfo, b: BankAccountInfo): boolean {
  return a.bankName === b.bankName && a.noRekening === b.noRekening && a.atasNama === b.atasNama;
}

interface BankAccountModalProps {
  open: boolean;
  active: BankAccountInfo;
  onClose: () => void;
  onApply: (info: BankAccountInfo) => void;
}

const FIELD = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:h-10';

export function BankAccountModal({ open, active, onClose, onApply }: BankAccountModalProps) {
  const { accounts, saveRekening } = useRekeningMaster();
  const masterAccounts = useMemo(() => verifiedMasterAccounts(accounts), [accounts]);
  const [form, setForm] = useState<BankAccountInfo>(active);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(active);
  }, [open, active]);

  const apply = (info: BankAccountInfo) => {
    storeBank(info);
    onApply(info);
    onClose();
    toast.success(`Rekening ${info.bankName} dipakai di invoice`);
  };

  const submitManual = async () => {
    const info = { bankName: form.bankName.trim(), noRekening: form.noRekening.trim(), atasNama: form.atasNama.trim() };
    if (!info.bankName || !info.noRekening || !info.atasNama) {
      toast.error('Nama bank, nomor rekening, dan atas nama wajib diisi');
      return;
    }
    setSaving(true);
    const exists = masterAccounts.some((a) => a.namaBank.trim() === info.bankName && a.nomor.trim() === info.noRekening) || INVOICE_BANK_PRESETS.some((p) => sameBank(p.info, info));
    if (!exists) {
      try {
        await saveRekening({ namaBank: info.bankName, nomor: info.noRekening, atasNama: info.atasNama });
      } catch (err) {
        // Nama bank bentrok dengan rekening lain: tetap dipakai di invoice tanpa ditambahkan ke master.
        toast.info(err instanceof Error ? `${err.message}. Rekening tetap dipakai di invoice.` : 'Rekening tidak ditambahkan ke master.');
      }
    }
    setSaving(false);
    apply(info);
  };

  const option = (key: string, title: string, info: BankAccountInfo, tag?: string) => {
    const selected = sameBank(info, active);
    return (
      <button
        key={key}
        type="button"
        onClick={() => apply(info)}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors',
          selected ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-300'
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-bold text-slate-900">{title}</span>
            {tag && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600">{tag}</span>}
          </div>
          <p className="mt-0.5 truncate text-[11px] tabular-nums text-slate-600">
            {info.noRekening} • a.n. {info.atasNama}
          </p>
        </div>
        {selected && <Check className="h-4 w-4 shrink-0 text-teal-700" />}
      </button>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rekening Bank Invoice"
      description="Pilihan disimpan di perangkat ini. Rekening manual ikut masuk ke master rekening."
      size="lg"
      busy={saving}
      footer={
        <>
          <button
            type="button"
            onClick={() => apply(DEFAULT_BANK_INFO)}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:mr-auto sm:h-10"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Default BCA
          </button>
          <button type="button" onClick={onClose} className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:h-10">
            Tutup
          </button>
          <button type="button" onClick={submitManual} disabled={saving} className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 sm:h-10">
            {saving ? 'Menyimpan...' : 'Simpan & Terapkan'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-900">
          Aktif: <strong>{active.bankName}</strong> {active.noRekening} a.n. {active.atasNama}
        </div>
        <section className="space-y-2">
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Rekening Invoice</h3>
          {INVOICE_BANK_PRESETS.map((p) => option(p.id, p.name, p.info, p.tag))}
        </section>
        {masterAccounts.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Dari Master Rekening</h3>
            {masterAccounts.map((a) => option(a.kode, a.namaBank, { bankName: a.namaBank, noRekening: a.nomor, atasNama: a.atasNama }, a.badge))}
          </section>
        )}
        <section className="space-y-2.5 rounded-xl border border-slate-200 p-3">
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Rekening Manual</h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div>
              <label htmlFor="bank-nama" className="mb-1 block text-[11px] font-bold text-slate-700">Nama Bank <span className="text-rose-500">*</span></label>
              <input id="bank-nama" value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} placeholder="BCA" className={FIELD} />
            </div>
            <div>
              <label htmlFor="bank-nomor" className="mb-1 block text-[11px] font-bold text-slate-700">Nomor Rekening <span className="text-rose-500">*</span></label>
              <input id="bank-nomor" inputMode="numeric" value={form.noRekening} onChange={(e) => setForm((f) => ({ ...f, noRekening: e.target.value }))} className={FIELD} />
            </div>
            <div>
              <label htmlFor="bank-an" className="mb-1 block text-[11px] font-bold text-slate-700">Atas Nama <span className="text-rose-500">*</span></label>
              <input id="bank-an" value={form.atasNama} onChange={(e) => setForm((f) => ({ ...f, atasNama: e.target.value }))} className={FIELD} />
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
