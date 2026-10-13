'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { formatRupiah, formatCompactRupiah } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';
import type { Order, ManualFinanceDraft } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Search,
  Save,
  CheckCircle,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';

interface ProfitAktualSectionProps {
  orders?: Order[];
  onSave?: (orderId: string, draft: ManualFinanceDraft) => Promise<void> | void;
}

export function ProfitAktualSection({ orders = [], onSave }: ProfitAktualSectionProps) {
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, ManualFinanceDraft>>(() => {
    const map: Record<string, ManualFinanceDraft> = {};
    orders.forEach((o) => {
      map[o.id] = {
        orderId: o.id,
        hppAktual: o.hppAktual != null ? String(o.hppAktual) : '',
        profitAktual: o.profitAktual != null ? String(o.profitAktual) : '',
        catatanFinance: o.catatanFinance || '',
      };
    });
    return map;
  });

  const [savingId, setSavingId] = useState<string | null>(null);

  // Sync state if orders prop changes
  React.useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      orders.forEach((o) => {
        if (!next[o.id]) {
          next[o.id] = {
            orderId: o.id,
            hppAktual: o.hppAktual != null ? String(o.hppAktual) : '',
            profitAktual: o.profitAktual != null ? String(o.profitAktual) : '',
            catatanFinance: o.catatanFinance || '',
          };
        }
      });
      return next;
    });
  }, [orders]);

  const [filterMode, setFilterMode] = useState<'all' | 'deviated'>('all');

  // Variance & Analytics Calculations
  const varianceData = useMemo(() => {
    return orders.map((o) => {
      const estimasi = o.targetMargin ?? 0;
      const hasManual = o.profitAktual != null && (o.profitAktual as unknown) !== '';
      const aktual = hasManual ? Number(o.profitAktual) : estimasi;
      const delta = aktual - estimasi;
      return {
        id: o.id,
        noInv: o.noInv,
        customer: o.customerName,
        estimasi,
        aktual,
        delta,
        isPositive: delta >= 0,
        hasManual,
      };
    });
  }, [orders]);

  const totalEstimasi = useMemo(() => varianceData.reduce((acc, v) => acc + v.estimasi, 0), [varianceData]);
  const totalAktual = useMemo(() => varianceData.reduce((acc, v) => acc + v.aktual, 0), [varianceData]);
  const netDelta = totalAktual - totalEstimasi;
  const deviatedItems = useMemo(() => varianceData.filter((v) => v.delta !== 0), [varianceData]);

  const chartData = useMemo(() => {
    if (filterMode === 'deviated' && deviatedItems.length > 0) {
      return deviatedItems;
    }
    return varianceData;
  }, [varianceData, filterMode, deviatedItems]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.noInv.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.projectName && o.projectName.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const updateDraft = (id: string, partial: Partial<ManualFinanceDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...partial,
      },
    }));
  };

  const handleSave = async (id: string) => {
    setSavingId(id);
    const draft = drafts[id];
    try {
      if (onSave && draft) {
        await onSave(id, draft);
      } else {
        toast.success(`Data aktual untuk ${draft?.orderId || id} berhasil disimpan!`);
      }
    } catch {
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Variance Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double">
          <span className="text-xs font-semibold text-slate-400">Total Profit Estimasi</span>
          <div className="mt-2 text-xl font-extrabold text-slate-800 font-mono tabular-num">
            {formatRupiah(totalEstimasi)}
          </div>
          <p className="mt-1 text-xs text-slate-400">Target laba bersih estimasi SPK ({orders.length} order)</p>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 shadow-card-double">
          <span className="text-xs font-semibold text-teal-800">Total Profit Aktual (Realisasi)</span>
          <div className="mt-2 text-xl font-extrabold text-teal-700 font-mono tabular-num">
            {formatRupiah(totalAktual)}
          </div>
          <p className="mt-1 text-xs text-teal-800 font-medium">Realisasi bersih setelah belanja riil lapangan</p>
        </div>

        <div
          className={`rounded-2xl border p-5 shadow-card-double ${
            netDelta >= 0
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-rose-200 bg-rose-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold ${
                netDelta >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              Net Deviasi Margin (Audit Delta)
            </span>
            {netDelta >= 0 ? (
              <Sparkles className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
          </div>
          <div
            className={`mt-2 text-xl font-extrabold font-mono tabular-num ${
              netDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {netDelta >= 0 ? `+ ${formatRupiah(netDelta)}` : `- ${formatRupiah(Math.abs(netDelta))}`}
          </div>
          <p
            className={`mt-1 text-xs font-semibold ${
              netDelta >= 0 ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            {deviatedItems.length > 0
              ? `Penyesuaian riil: ${deviatedItems.length} invoice (${deviatedItems.map((d) => d.noInv).join(', ')})`
              : '100% On-Track: Sesuai estimasi SPK'}
          </p>
        </div>
      </div>

      {/* 🆕 VARIANCE DELTA WATERFALL BAR CHART */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card-double">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Visualisasi Deviasi Margin (Surplus vs Kebocoran Biaya per Invoice)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Grafik selisih keuntungan: Bar hijau = Surplus efisiensi &bull; Bar merah = Kebocoran biaya (ongkir/sablon tambahan)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({varianceData.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('deviated')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  filterMode === 'deviated'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hanya Berdeviasi ({deviatedItems.length})
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs pl-2">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="h-3 w-3 rounded bg-emerald-500" />
                Surplus (+Rp)
              </span>
              <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                <span className="h-3 w-3 rounded bg-rose-500" />
                Defisit (-Rp)
              </span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 20, left: 15, bottom: 0 }}>
              <XAxis dataKey="noInv" tick={{ fontSize: 11, fill: '#334155' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis
                width={68}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={formatCompactRupiah}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  const isPositive = data.delta >= 0;
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-sm text-xs min-w-[210px]">
                      <div className="font-semibold text-slate-300 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                        <span className="font-mono text-teal-400 font-bold">{data.noInv}</span>
                        <span className="text-slate-400 truncate max-w-[120px]">{data.customer}</span>
                      </div>
                      <div className="space-y-1.5 text-slate-300">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Profit Estimasi:</span>
                          <span className="font-mono font-medium text-slate-200">{formatRupiah(data.estimasi)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Profit Aktual:</span>
                          <span className="font-mono font-medium text-teal-300">{formatRupiah(data.aktual)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-800 pt-1.5 font-bold">
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>Deviasi Laba:</span>
                          <span className={`font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{formatRupiah(data.delta)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Bar dataKey="delta" maxBarSize={36} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.delta === 0 ? '#cbd5e1' : entry.delta > 0 ? '#10b981' : '#f43f5e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Editable Reconciliation Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card-double">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                Tabel Input Audit Rekonsiliasi Lapangan
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-400 max-w-2xl">
              Isi HPP aktual & profit real setelah semua potongan lapangan. Klik tombol centang hijau untuk menyimpan langsung ke database Firestore.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No. Invoice / customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">NO. INVOICE</th>
                <th className="px-4 py-3">TANGGAL</th>
                <th className="px-4 py-3">CUSTOMER</th>
                <th className="px-4 py-3">REVENUE</th>
                <th className="px-4 py-3">HPP ESTIMASI</th>
                <th className="px-4 py-3 bg-teal-50/50 text-teal-900">HPP AKTUAL (INPUT)</th>
                <th className="px-4 py-3">PROFIT ESTIMASI</th>
                <th className="px-4 py-3 bg-emerald-50/50 text-emerald-900">PROFIT AKTUAL (INPUT)</th>
                <th className="px-4 py-3">CATATAN FINANCE</th>
                <th className="px-4 py-3 text-center">SIMPAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((o) => {
                const draft = drafts[o.id] || {
                  orderId: o.id,
                  hppAktual: '',
                  profitAktual: '',
                  catatanFinance: '',
                };
                const isSaving = savingId === o.id;

                return (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-teal-700 font-mono">{o.noInv}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">{o.tanggalOrder}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{o.customerName}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900 tabular-num">
                      {formatRupiah(o.totalInvoice)}
                    </td>
                    <td className="px-4 py-3.5 font-mono tabular-num text-slate-500">
                      {formatRupiah(o.totalHpp)}
                    </td>
                    <td className="px-4 py-2 bg-teal-50/30">
                      <CurrencyInput
                        value={draft.hppAktual !== '' ? Number(draft.hppAktual) : ''}
                        onValueChange={(val) => updateDraft(o.id, { hppAktual: String(val) })}
                        placeholder={formatRupiah(o.totalHpp)}
                        className="h-8 w-32 rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs tabular-num text-slate-800 focus:border-teal-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-mono tabular-num text-emerald-600 font-semibold">
                      {formatRupiah(o.targetMargin)}
                    </td>
                    <td className="px-4 py-2 bg-emerald-50/30">
                      <CurrencyInput
                        value={draft.profitAktual !== '' ? Number(draft.profitAktual) : ''}
                        onValueChange={(val) => updateDraft(o.id, { profitAktual: String(val) })}
                        placeholder={formatRupiah(o.targetMargin)}
                        className="h-8 w-32 rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs tabular-num text-emerald-700 font-bold focus:border-teal-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={draft.catatanFinance}
                        onChange={(e) => updateDraft(o.id, { catatanFinance: e.target.value })}
                        placeholder="Catatan..."
                        className="h-8 w-44 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button
                        size="sm"
                        disabled={isSaving}
                        onClick={() => handleSave(o.id)}
                        className="h-8 gap-1 rounded-lg bg-teal-600 px-2.5 text-[11px] font-bold text-white hover:bg-teal-700 active:scale-95 transition-all"
                      >
                        <Save className="h-3 w-3" />
                        <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
