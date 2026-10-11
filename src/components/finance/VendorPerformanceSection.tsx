'use client';

import React, { useState, useMemo } from 'react';
import { formatRupiah, formatCompactRupiah } from '@/lib/utils';
import type { VendorPerformanceItem, CheapestByCategory } from '@/types';
import { Award, Crown, Tag, ArrowUpDown, BarChart2, TrendingUp, Sparkles, Building2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface VendorPerformanceSectionProps {
  vendors?: VendorPerformanceItem[];
  cheapestList?: CheapestByCategory[];
  mostUsedVendor?: { nama: string; orderCount: number; pcsTotal: number };
  cheapestBySleeve?: {
    pendek?: VendorPerformanceItem;
    panjang?: VendorPerformanceItem;
    tanpaLengan?: VendorPerformanceItem;
  };
  tanpaOrder?: Array<{ vendorId: string; vendorNama: string }>;
}

const defaultCheapest: CheapestByCategory[] = [
  { kategori: 'Hoodie', vendorNama: 'CITITEX', avgCost: 176000 },
  { kategori: 'Jaket', vendorNama: 'FJ MERCHANDISE', avgCost: 175469 },
  { kategori: 'Jersey', vendorNama: 'FJ MERCHANDISE', avgCost: 70833 },
  { kategori: 'Kemeja PDH', vendorNama: 'CAHAYA BORDIR', avgCost: 92059 },
  { kategori: 'Kemeja PDL', vendorNama: 'CAHAYA BORDIR', avgCost: 136667 },
  { kategori: 'Kemeja Workshirt', vendorNama: 'CAHAYA BORDIR', avgCost: 110000 },
  { kategori: 'Polo Shirt', vendorNama: 'CAHAYA BORDIR', avgCost: 63268 },
  { kategori: 'T Shirt', vendorNama: 'AMRIN', avgCost: 54335 },
  { kategori: 'Topi', vendorNama: 'VENDOR TOPI PK UCI', avgCost: 30000 },
];

const defaultVendors: VendorPerformanceItem[] = [
  {
    vendorId: 'v-1',
    vendorNama: 'AMRIN',
    orderCount: 11,
    pcsTotal: 462,
    avgLenganPendek: 60000,
    avgLenganPanjang: 63571,
    avgTanpaLengan: 0,
    hppQuotation: 26840000,
    hppAktual: 26840000,
    selisihQuotation: 0,
    profit: 9266000,
    marginPercent: 25.6,
  },
  {
    vendorId: 'v-2',
    vendorNama: 'LAJUWARNA',
    orderCount: 8,
    pcsTotal: 169,
    avgLenganPendek: 71250,
    avgLenganPanjang: 81100,
    avgTanpaLengan: 73500,
    hppQuotation: 12670500,
    hppAktual: 12670500,
    selisihQuotation: 0,
    profit: 5405500,
    marginPercent: 30.0,
  },
  {
    vendorId: 'v-3',
    vendorNama: 'FJ MERCHANDISE',
    orderCount: 7,
    pcsTotal: 163,
    avgLenganPendek: 85000,
    avgLenganPanjang: 92500,
    avgTanpaLengan: 0,
    hppQuotation: 16995000,
    hppAktual: 16995000,
    selisihQuotation: 0,
    profit: 5467000,
    marginPercent: 24.2,
  },
  {
    vendorId: 'v-4',
    vendorNama: 'Vendor Wisnu',
    orderCount: 5,
    pcsTotal: 102,
    avgLenganPendek: 120000,
    avgLenganPanjang: 166667,
    avgTanpaLengan: 0,
    hppQuotation: 13395000,
    hppAktual: 13395000,
    selisihQuotation: 0,
    profit: 5590000,
    marginPercent: 29.3,
  },
  {
    vendorId: 'v-5',
    vendorNama: 'CAHAYA BORDIR',
    orderCount: 5,
    pcsTotal: 289,
    avgLenganPendek: 115500,
    avgLenganPanjang: 100667,
    avgTanpaLengan: 0,
    hppQuotation: 20705000,
    hppAktual: 20705000,
    selisihQuotation: 0,
    profit: 4393000,
    marginPercent: 17.4,
  },
  {
    vendorId: 'v-6',
    vendorNama: "INDI'S COLLECTION",
    orderCount: 2,
    pcsTotal: 20,
    avgLenganPendek: 135000,
    avgLenganPanjang: 145000,
    avgTanpaLengan: 320000,
    hppQuotation: 2915000,
    hppAktual: 2915000,
    selisihQuotation: 0,
    profit: 75000,
    marginPercent: 2.0,
  },
  {
    vendorId: 'v-7',
    vendorNama: 'VENDOR TOPI PK UCI',
    orderCount: 1,
    pcsTotal: 20,
    avgLenganPendek: 30000,
    avgLenganPanjang: 0,
    avgTanpaLengan: 0,
    hppQuotation: 600000,
    hppAktual: 600000,
    selisihQuotation: 0,
    profit: 600000,
    marginPercent: 50.0,
  },
  {
    vendorId: 'v-8',
    vendorNama: 'FITRA F',
    orderCount: 1,
    pcsTotal: 16,
    avgLenganPendek: 130000,
    avgLenganPanjang: 0,
    avgTanpaLengan: 0,
    hppQuotation: 2100000,
    hppAktual: 2100000,
    selisihQuotation: 0,
    profit: 220000,
    marginPercent: 9.1,
  },
  {
    vendorId: 'v-9',
    vendorNama: 'CITITEX',
    orderCount: 1,
    pcsTotal: 1,
    avgLenganPendek: 0,
    avgLenganPanjang: 176000,
    avgTanpaLengan: 0,
    hppQuotation: 176000,
    hppAktual: 176000,
    selisihQuotation: 0,
    profit: 54000,
    marginPercent: 23.0,
  },
];

export function VendorPerformanceSection({
  vendors = defaultVendors,
  cheapestList = defaultCheapest,
  mostUsedVendor = { nama: 'AMRIN', orderCount: 11, pcsTotal: 462 },
  cheapestBySleeve,
  tanpaOrder = [{ vendorId: 'mQKvwQPf4eXLin4aaK9z', vendorNama: 'HARMONY INDUSTRY' }],
}: VendorPerformanceSectionProps) {
  const [sortField, setSortField] = useState<keyof VendorPerformanceItem>('orderCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Chart data: HPP Quotation vs HPP Aktual
  const chartData = useMemo(() => {
    return vendors.map((v) => ({
      name: v.vendorNama,
      quotation: v.hppQuotation,
      aktual: v.hppAktual,
      selisih: v.selisihQuotation,
      margin: v.marginPercent,
    }));
  }, [vendors]);

  const handleSort = (field: keyof VendorPerformanceItem) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedVendors = useMemo(() => {
    return [...vendors].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [vendors, sortField, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Top Highlights: Unified White Cards (2-Grid Mobile, 3-Col Desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Card 1: Mitra Terbanyak */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-card-double flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate pr-1">
              Mitra Terbanyak
            </span>
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-sm sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
            {mostUsedVendor ? mostUsedVendor.nama : '-'}
          </div>
          <p className="mt-1 text-[10px] sm:text-xs text-slate-400 font-medium font-mono truncate">
            {mostUsedVendor ? `${mostUsedVendor.orderCount} Order • ${mostUsedVendor.pcsTotal} Pcs` : '-'}
          </p>
        </div>

        {/* Card 2: Efisiensi Belanja */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-card-double flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate pr-1">
              Efisiensi Belanja
            </span>
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-sm sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
            CAHAYA BORDIR
          </div>
          <p className="mt-1 text-[10px] sm:text-xs text-emerald-600 font-semibold font-mono truncate">
            Hemat Rp 170k dari estimasi
          </p>
        </div>

        {/* Card 3: Rata-rata Margin Mitra */}
        <div className="col-span-2 md:col-span-1 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-card-double flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate pr-1">
              Rata-rata Margin Mitra
            </span>
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-sm sm:text-xl font-extrabold text-slate-900 tracking-tight font-mono truncate">
            32.8%
          </div>
          <p className="mt-1 text-[10px] sm:text-xs text-slate-400 font-medium truncate">
            Standar margin di atas target 30%
          </p>
        </div>
      </div>

      {/* 🆕 DUAL HYBRID VIEW: GROUPED BAR CHART (HPP QUOTATION VS AKTUAL) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card-double">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Komparasi HPP Quotation vs Realisasi Belanja Aktual
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mendeteksi mitra vendor yang overbudget (membengkak) vs hemat biaya belanja
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="h-3 w-3 rounded bg-slate-400" />
              Quotation Awal
            </span>
            <span className="flex items-center gap-1.5 text-teal-700 font-bold">
              <span className="h-3 w-3 rounded bg-teal-600" />
              HPP Realisasi
            </span>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis
                width={68}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={formatCompactRupiah}
              />
              <Tooltip
                formatter={(val: unknown) => [formatRupiah(Number(val)), 'Total Biaya']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="quotation" name="Quotation Awal" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="aktual" name="Realisasi Aktual" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid Mitra Termurah per Kategori Pakaian */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card-double">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Tag className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Rekomendasi Mitra Termurah Berdasarkan Kategori Produk
          </h3>
        </div>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Gunakan sebagai acuan rujukan quotation saat menawarkan harga ke konsumen baru
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cheapestList.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:border-teal-300 hover:bg-teal-50/20 transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {item.kategori}
              </span>
              <div className="mt-1 text-xs font-extrabold text-slate-800 truncate" title={item.vendorNama}>
                {item.vendorNama}
              </div>
              <div className="mt-1 font-mono text-xs font-bold text-teal-700">
                {formatRupiah(item.avgCost)}/pcs
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED AUDIT TABLE PER PCS (LENGAN PENDEK, PANJANG, TANPA LENGAN) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-card-double overflow-hidden">
        <div className="border-b border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Tabel Audit Harga & Kinerja Mitra Vendor
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rincian ongkos produksi rata-rata per pcs untuk bahan evaluasi negosiasi vendor
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {vendors.length} Vendor Terdaftar
          </span>
        </div>

        {/* Mobile View: 2-Grid Vendor Cards (< 768px) */}
        <div className="md:hidden grid grid-cols-2 gap-2 sm:gap-2.5 p-2 sm:p-3 bg-slate-50/40">
          {sortedVendors.map((item) => (
            <div
              key={item.vendorId}
              className="rounded-xl border border-slate-200/90 bg-white p-2 sm:p-2.5 shadow-2xs flex flex-col justify-between gap-1.5 overflow-hidden"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 text-[8.5px] font-bold">
                    {item.vendorNama.slice(0, 2)}
                  </span>
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate" title={item.vendorNama}>
                    {item.vendorNama}
                  </h4>
                </div>
                <p className="mt-0.5 text-[9px] sm:text-[9.5px] text-slate-500 font-semibold font-mono truncate">
                  {item.orderCount} Order &bull; {item.pcsTotal} Pcs
                </p>
              </div>

              <div className="rounded-lg bg-slate-50/90 p-1.5 sm:p-2 space-y-0.5 text-[9px] sm:text-[9.5px]">
                <div className="flex justify-between items-center text-slate-500 min-w-0">
                  <span className="truncate">HPP:</span>
                  <span className="font-mono font-bold text-slate-800 truncate text-[9px] sm:text-[9.5px]">
                    {formatRupiah(item.hppAktual > 0 ? item.hppAktual : item.hppQuotation)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-800 font-semibold min-w-0">
                  <span className="truncate">Profit:</span>
                  <span className="font-mono font-bold text-emerald-600 truncate text-[9px] sm:text-[9.5px]">
                    {formatRupiah(item.profit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-0.5 border-t border-slate-200/60 min-w-0">
                  <span className="truncate">Margin:</span>
                  <span className={`font-mono font-bold text-[9px] sm:text-[9.5px] ${item.marginPercent < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {item.marginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Wide Spreadsheet Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th
                  onClick={() => handleSort('vendorNama')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    NAMA VENDOR
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('orderCount')}
                  className="px-4 py-3 text-center cursor-pointer hover:text-slate-800"
                >
                  ORDER
                </th>
                <th
                  onClick={() => handleSort('pcsTotal')}
                  className="px-4 py-3 text-center cursor-pointer hover:text-slate-800"
                >
                  TOTAL PCS
                </th>
                <th className="px-4 py-3">RERATA PENDEK</th>
                <th className="px-4 py-3">RERATA PANJANG</th>
                <th className="px-4 py-3">TANPA LENGAN</th>
                <th className="px-4 py-3">HPP QUOTATION</th>
                <th className="px-4 py-3">HPP AKTUAL</th>
                <th className="px-4 py-3 text-center">SELISIH BIAYA</th>
                <th className="px-4 py-3 bg-emerald-50 text-emerald-800">PROFIT DIHASILKAN</th>
                <th className="px-4 py-3 bg-emerald-50 text-emerald-800 text-center">MARGIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedVendors.map((item) => (
                <tr key={item.vendorId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-teal-700 text-[10px] font-bold">
                      {item.vendorNama.slice(0, 2)}
                    </span>
                    {item.vendorNama}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                    {item.orderCount}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono text-slate-600">
                    {item.pcsTotal}
                  </td>
                  <td className="px-4 py-3.5 font-mono tabular-num">
                    {item.avgLenganPendek > 0 ? (
                      <>
                        {formatRupiah(item.avgLenganPendek)}
                        {cheapestBySleeve?.pendek?.vendorId === item.vendorId ? ' 🏆' : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono tabular-num">
                    {item.avgLenganPanjang > 0 ? (
                      <>
                        {formatRupiah(item.avgLenganPanjang)}
                        {cheapestBySleeve?.panjang?.vendorId === item.vendorId ? ' 🏆' : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono tabular-num">
                    {item.avgTanpaLengan > 0 ? (
                      <>
                        {formatRupiah(item.avgTanpaLengan)}
                        {cheapestBySleeve?.tanpaLengan?.vendorId === item.vendorId ? ' 🏆' : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono tabular-num text-slate-500">
                    {formatRupiah(item.hppQuotation)}
                  </td>
                  <td className="px-4 py-3.5 font-mono tabular-num font-bold text-slate-800">
                    {item.hppAktual > 0 ? formatRupiah(item.hppAktual) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono tabular-num font-bold">
                    {item.selisihQuotation < 0 ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Hemat {formatRupiah(Math.abs(item.selisihQuotation))}
                      </span>
                    ) : item.selisihQuotation > 0 ? (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        + {formatRupiah(item.selisihQuotation)}
                      </span>
                    ) : (
                      <span className="text-slate-400">Sesuai Budget</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono tabular-num font-bold">
                    {item.profit < 0 ? (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {formatRupiah(item.profit)}
                      </span>
                    ) : (
                      <span className="text-emerald-600">{formatRupiah(item.profit)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono tabular-num text-center font-bold">
                    {item.marginPercent < 0 ? (
                      <span className="text-rose-600">{item.marginPercent.toFixed(1)}%</span>
                    ) : (
                      <span className="text-slate-800">{item.marginPercent.toFixed(1)}%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note: Vendor tanpa order */}
        {tanpaOrder && tanpaOrder.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 flex items-center gap-2">
            <span className="font-medium">Vendor tanpa order:</span>
            <span className="font-semibold text-slate-700">
              {tanpaOrder.map((v) => v.vendorNama).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
