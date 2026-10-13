'use client';

import React from 'react';
import type { Order } from '@/types';
import { formatDate } from '@/lib/formatters';
import { calculateTotals, SIZES, CATEGORIES, getSizeExtraPrice } from '@/lib/calculations';

const CAT_LABEL: Record<string, string> = { pendek: 'Pendek', panjang: 'Panjang', tanpaLengan: 'Tanpa Lengan' };
const JUAL_KEY: Record<string, string> = { pendek: 'hargaPendek', panjang: 'hargaPanjang', tanpaLengan: 'hargaTanpaLengan' };
const VENDOR_KEY: Record<string, string> = { pendek: 'hargaVendorPendek', panjang: 'hargaVendorPanjang', tanpaLengan: 'hargaVendorTanpaLengan' };
const STATUS_TEXT: Record<string, string> = { production: 'Sedang Produksi', waiting: 'Menunggu Pembayaran', completed: 'Selesai' };

interface FinanceReportPaperProps {
  order?: Order | any;
  getVendorById?: (id: string) => { nama?: string; pic?: string } | undefined;
}

export default function FinanceReportPaper({ order, getVendorById }: FinanceReportPaperProps) {
  if (!order) {
    return (
      <div className="techpack-paper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Order tidak ditemukan</p>
      </div>
    );
  }

  const t = calculateTotals(order);
  const opEx = order.biayaOperasional || 0;
  const hpp = t.jumlahSemua - opEx - t.profit;
  const vendor = (order.vendorId && getVendorById ? getVendorById(order.vendorId) : undefined) || {
    nama: order.vendorName || (order as any).namaVendor || 'Tanpa Vendor',
    pic: (order as any).picVendor || (order as any).pic || '-',
  };
  const dp = order.dpNominal && order.dpNominal > 0 ? order.dpNominal : t.nominalDP;

  let dateStr = '-';
  if (order.createdAt) {
    const d = typeof order.createdAt.toDate === 'function'
      ? order.createdAt.toDate()
      : new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt);
    dateStr = formatDate(d);
  } else if (order.tanggalInv || order.tanggalOrder) {
    const rawDate = order.tanggalInv || order.tanggalOrder;
    const d = new Date(rawDate);
    dateStr = isNaN(d.getTime()) ? rawDate : formatDate(d);
  }

  // Rincian item: modal & jual per size
  const items: Array<{ name: string; qty: number; modalPcs: number; jualPcs: number }> = [];
  CATEGORIES.forEach((cat) => {
    const baseJual = (order as any)[JUAL_KEY[cat]] || 0;
    const baseModal = (order as any)[VENDOR_KEY[cat]] || 0;
    SIZES.forEach((s) => {
      const qty = (order as any)[`${cat}${s}`] || 0;
      if (qty > 0) {
        const extra = getSizeExtraPrice(s);
        items.push({
          name: `${order.kategoriOrder || 'T Shirt'} ${CAT_LABEL[cat]} (${s})`,
          qty,
          modalPcs: baseModal + extra,
          jualPcs: baseJual + extra,
        });
      }
    });
  });

  return (
    <div className="techpack-paper" id="financeReportPaper">
      <div className="tp-header">
        <div className="tp-logo">
          <h1>VisualKain</h1>
          <p>Laporan Finansial Order</p>
        </div>
        <div className="tp-info">
          <div className="tp-id"><span>No. Invoice:</span> <strong>{order.noInv}</strong></div>
          <div className="tp-date"><span>Tanggal:</span> <strong>{dateStr}</strong></div>
          <div className="tp-deadline"><span>Status:</span> <strong>{STATUS_TEXT[order.status] || order.statusOrder || order.status || 'Sedang Produksi'}</strong></div>
        </div>
      </div>

      <div className="tp-grid-info">
        <div className="tp-section">
          <h3>Identitas Customer</h3>
          <div className="tp-row"><span>Nama:</span> <strong>{order.namaCustomer || order.customerName || '-'}</strong></div>
          <div className="tp-row"><span>No. HP/WA:</span> <strong>{order.noWaCustomer || '-'}</strong></div>
          <div className="tp-row"><span>Project:</span> <strong>{order.namaProject || order.projectName || '-'}</strong></div>
        </div>
        <div className="tp-section">
          <h3>Vendor &amp; Produksi</h3>
          <div className="tp-row"><span>Vendor:</span> <strong>{vendor?.nama || 'Tanpa Vendor'}</strong></div>
          <div className="tp-row"><span>PIC Vendor:</span> <strong>{vendor?.pic || '-'}</strong></div>
          <div className="tp-row"><span>Metode:</span> <strong>{order.jenisMetodeProduksi || '-'}</strong></div>
          <div className="tp-row"><span>Kategori/Bahan:</span> <strong>{order.kategoriOrder || 'T Shirt'} / {order.jenisBahan || '-'}</strong></div>
        </div>
      </div>

      <div className="tp-section full-width">
        <h3>Rincian Modal vs Harga Jual</h3>
        <table className="invoice-items">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', backgroundColor: '#0f172a', color: '#ffffff' }}>Item</th>
              <th style={{ textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff' }}>Qty</th>
              <th style={{ textAlign: 'right', backgroundColor: '#0f172a', color: '#ffffff' }}>Modal/pcs</th>
              <th style={{ textAlign: 'right', backgroundColor: '#0f172a', color: '#ffffff' }}>Subtotal Modal</th>
              <th style={{ textAlign: 'right', backgroundColor: '#0f172a', color: '#ffffff' }}>Jual/pcs</th>
              <th style={{ textAlign: 'right', backgroundColor: '#0f172a', color: '#ffffff' }}>Subtotal Jual</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.name}>
                <td style={{ textAlign: 'left' }}>{it.name}</td>
                <td style={{ textAlign: 'center' }}>{it.qty}</td>
                <td style={{ textAlign: 'right' }}>{it.modalPcs.toLocaleString('id-ID')}</td>
                <td style={{ textAlign: 'right' }}>{(it.modalPcs * it.qty).toLocaleString('id-ID')}</td>
                <td style={{ textAlign: 'right' }}>{it.jualPcs.toLocaleString('id-ID')}</td>
                <td style={{ textAlign: 'right' }}>{(it.jualPcs * it.qty).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tp-grid-info">
        <div className="tp-section">
          <h3>Ringkasan Biaya</h3>
          <div className="tp-row"><span>HPP Vendor (Modal):</span> <strong>{formatIdr(hpp)}</strong></div>
          <div className="tp-row"><span>Biaya Operasional:</span> <strong>{formatIdr(opEx)}</strong></div>
          <div className="tp-row"><span>Total Modal:</span> <strong>{formatIdr(hpp + opEx)}</strong></div>
          {order.dpNominalPO && order.dpNominalPO > 0 && (
            <div className="tp-row"><span>DP Vendor:</span> <strong>{formatIdr(order.dpNominalPO)}</strong></div>
          )}
        </div>
        <div className="tp-section">
          <h3>Ringkasan Pendapatan</h3>
          <div className="tp-row"><span>Nilai Tagihan Kotor (Subtotal):</span> <strong>{formatIdr(t.grossTotal)}</strong></div>
          <div className="tp-row"><span>Diskon:</span> <strong>- {formatIdr(t.diskon)}</strong></div>
          <div className="tp-row"><span>Total Tagihan:</span> <strong>{formatIdr(t.jumlahSemua)}</strong></div>
          <div className="tp-row"><span>DP Konsumen ({order.dpPersen || 0}%):</span> <strong>{formatIdr(dp)}</strong></div>
          <div className="tp-row"><span>Sisa Pelunasan:</span> <strong>{formatIdr(t.jumlahSemua - dp)}</strong></div>
        </div>
      </div>

      <div className="tp-section full-width">
        <h3>Laba Bersih</h3>
        <div className="tp-row"><span>Laba Bersih (Estimasi):</span> <strong>{formatIdr(t.profit)}</strong></div>
        <div className="tp-row"><span>Margin:</span> <strong>{t.profitPercent.toFixed(1)}%</strong></div>
        {order.catatanFinance && (
          <div className="tp-row"><span>Catatan Finansial:</span> <strong>{order.catatanFinance}</strong></div>
        )}
      </div>

      <div className="tp-footer-print">
        <p>Dicetak otomatis oleh Sistem Finansial VisualKain (Laporan Finansial)</p>
      </div>
    </div>
  );
}

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}
