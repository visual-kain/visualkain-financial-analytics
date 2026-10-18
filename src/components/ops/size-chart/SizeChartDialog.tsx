'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { SIZES } from '@/lib/legacy/calculations';
import { addSizeChart, emptySizeChartSizes, updateSizeChart } from '@/lib/firestore/master-repo';
import type { SizeChart, SizeChartData } from '@/lib/legacy/types';

export function SizeChartDialog({ open, chart, onClose }: { open: boolean; chart: SizeChart | null; onClose: () => void }) {
  const [nama, setNama] = useState('');
  const [sizes, setSizes] = useState<Record<string, SizeChartData>>(emptySizeChartSizes());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Diisi ulang hanya saat dialog dibuka; bug legacy mereset form setiap DataProvider render ulang.
  useEffect(() => {
    if (!open) return;
    setNama(chart?.nama ?? '');
    const base = emptySizeChartSizes();
    SIZES.forEach((s) => {
      const d = chart?.sizes?.[s];
      if (d) base[s] = { panjang: Number(d.panjang) || 0, lebar: Number(d.lebar) || 0 };
    });
    setSizes(base);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setValue = (size: string, key: keyof SizeChartData, raw: string) => {
    const value = Math.max(0, Number(raw) || 0);
    setSizes((prev) => ({ ...prev, [size]: { ...prev[size], [key]: value } }));
  };

  const save = async () => {
    const clean = nama.trim();
    if (!clean) {
      setError('Nama size chart wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (chart) await updateSizeChart(chart.id, clean, sizes);
      else await addSizeChart(clean, sizes);
      toast.success(chart ? `Size chart "${clean}" diperbarui` : `Size chart "${clean}" dibuat`);
      onClose();
    } catch (err) {
      console.error('[size-chart] Gagal menyimpan:', err);
      toast.error('Gagal menyimpan size chart');
    } finally {
      setSaving(false);
    }
  };

  const input =
    'h-11 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-semibold tabular-nums focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:h-10';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={chart ? 'Edit Size Chart' : 'Buat Size Chart'}
      description="Ukuran dalam satuan centimeter (cm)."
      busy={saving}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs text-slate-700 hover:bg-slate-50 sm:h-10 shadow-btn-secondary font-medium">
            Batal
          </button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-teal-600 px-4 text-xs text-white hover:bg-teal-700 disabled:opacity-60 sm:h-10 border border-teal-700 shadow-btn-primary font-medium">
            {saving ? 'Menyimpan...' : 'Simpan Size Chart'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="sc-nama" className="mb-1.5 block text-xs font-bold text-slate-700">
            Nama Size Chart <span className="text-rose-500">*</span>
          </label>
          <input
            id="sc-nama"
            autoFocus
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Kaos Reguler Dewasa"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold focus:border-teal-500 sm:text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:h-10"
          />
          {error && <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>}
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-wide text-slate-500">
              <th className="pb-2 text-left">Size</th>
              <th className="pb-2">Panjang (cm)</th>
              <th className="pb-2">Lebar (cm)</th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map((s) => (
              <tr key={s}>
                <td className="py-1 pr-2 font-bold text-slate-800">{s}</td>
                <td className="px-1 py-1">
                  <input type="number" inputMode="decimal" min={0} step={0.5} value={sizes[s]?.panjang || ''} placeholder="0" onChange={(e) => setValue(s, 'panjang', e.target.value)} aria-label={`Panjang ${s}`} className={input} />
                </td>
                <td className="py-1 pl-1">
                  <input type="number" inputMode="decimal" min={0} step={0.5} value={sizes[s]?.lebar || ''} placeholder="0" onChange={(e) => setValue(s, 'lebar', e.target.value)} aria-label={`Lebar ${s}`} className={input} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
