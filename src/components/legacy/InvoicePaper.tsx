'use client';

import React from 'react';
import { STATUS_LABELS, type BankAccountInfo, type LegacyOrder } from '@/lib/legacy/types';
import { formatCurrency, formatDate, timestampToDate } from '@/lib/legacy/formatters';
import { calculateTotals, getInvoiceItems } from '@/lib/legacy/calculations';
import { invoicePaymentDateLabel, type InvoicePaymentSummary } from '@/lib/invoice-payments';

/**
 * Kertas invoice formal versi visualkaindb sebelum redesain 9 Okt 2026 (commit d34f192), atas permintaan klien
 * 17 Okt 2026 (K-22). Gaya memakai kelas CSS bersama kertas PO/penawaran/surat. Perubahan dari aslinya:
 * rekening mengikuti pilihan rekening invoice, DP diambil dari pembayaran yang sudah diterima di modul finansial,
 * status memakai label 8 tahap, dan detail DP (status, riwayat pembayaran, sisa) ditampilkan dengan gaya total yang sama.
 */
export const DEFAULT_BANK_INFO: BankAccountInfo = {
  bankName: 'BCA',
  noRekening: '2820246767',
  atasNama: 'GLORA SAWITA BR PANJAITAN',
};

interface InvoicePaperProps {
  order: LegacyOrder | undefined;
  payments?: InvoicePaymentSummary;
  bankInfo?: BankAccountInfo;
}

export default function InvoicePaper({ order, payments, bankInfo = DEFAULT_BANK_INFO }: InvoicePaperProps) {
  if (!order) {
    return (
      <div id="invoicePaper" className="invoice-paper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Pilih order untuk menampilkan invoice</p>
      </div>
    );
  }

  const totals = calculateTotals(order);
  const items = getInvoiceItems(order);

  const createdDate = timestampToDate(order.createdAt);
  const dateStr = createdDate ? formatDate(createdDate) : '-';

  const netTotal = totals.jumlahSemua;
  const targetDpPersen = Number(order.targetDpPersen) || 70;
  const targetDpNominal = Math.round(netTotal * (targetDpPersen / 100));
  const dp1 = payments?.dp1 ?? 0;
  const dp2 = payments?.dp2 ?? 0;
  const totalDpDiterima = payments?.totalDpDiterima ?? 0;
  const totalUangMasuk = payments?.totalUangMasuk ?? 0;
  const sisaKekuranganDp = Math.max(0, targetDpNominal - totalDpDiterima);
  const sisaPelunasanAkhir = Math.max(0, netTotal - totalUangMasuk);

  // Status penagihan versi redesain (rumus sama), ditampilkan sebagai teks formal tanpa pill berwarna.
  let statusPembayaran = `Menunggu DP (${targetDpPersen}%)`;
  if (totalUangMasuk >= netTotal || order.status === 'completed') {
    statusPembayaran = 'Lunas 100%';
  } else if (totalDpDiterima >= targetDpNominal) {
    statusPembayaran = `DP Target (${targetDpPersen}%) Terpenuhi`;
  } else if (dp1 > 0 && dp2 === 0) {
    statusPembayaran = `DP 1 Diterima (${netTotal > 0 ? Math.round((dp1 / netTotal) * 100) : 0}%) - Menunggu DP 2`;
  } else if (totalDpDiterima > 0) {
    statusPembayaran = `DP Diterima (${netTotal > 0 ? Math.round((totalDpDiterima / netTotal) * 100) : 0}%) - Belum Cukup Target`;
  }

  const sisa =
    sisaKekuranganDp > 0
      ? { label: `Sisa DP (Target ${targetDpPersen}% Produksi)`, value: formatCurrency(sisaKekuranganDp), note: '* Wajib transfer sebelum pesanan naik meja jahit' }
      : sisaPelunasanAkhir > 0
        ? { label: 'Sisa Pelunasan (100%)', value: formatCurrency(sisaPelunasanAkhir), note: '* Pelunasan wajib dilakukan saat produksi selesai & sebelum pengiriman' }
        : { label: 'Status Pelunasan (100%)', value: 'LUNAS', note: 'Seluruh pembayaran tagihan telah diterima' };
  const bank = {
    bankName: bankInfo?.bankName || DEFAULT_BANK_INFO.bankName,
    noRekening: bankInfo?.noRekening || DEFAULT_BANK_INFO.noRekening,
    atasNama: bankInfo?.atasNama || DEFAULT_BANK_INFO.atasNama,
  };

  return (
    <div id="invoicePaper" className="invoice-paper">
      <div className="invoice-header">
        <div className="company-info">
          <h1>VisualKain</h1>
          <p>Jl. Babakan, Kota Tangerang Selatan</p>
          <p>
            <span style={{ display: 'inline-block', width: '80px' }}>WhatsApp</span> 
            : 0859 6644 4312
          </p>
          <p>
            <span style={{ display: 'inline-block', width: '80px' }}>Email</span> 
            : visualkainn@gmail.com
          </p>
        </div>
        <div className="invoice-meta">
          <h2>INVOICE</h2>
          <p>{order.noInv}</p>
          <p>Tanggal: {dateStr}</p>
        </div>
      </div>

      <div className="invoice-client">
        <div className="client-col-left">
          <strong>Bill To:</strong>
          <p>{order.namaCustomer}</p>
          <div className="client-detail-row">
            <strong style={{ display: 'inline-block', width: '85px' }}>WA:</strong> <span>{order.noWaCustomer || '-'}</span>
          </div>
          <div className="client-detail-row">
            <strong style={{ display: 'inline-block', width: '85px' }}>KATEGORI:</strong> <span>{order.kategoriOrder || '-'}</span>
          </div>
        </div>
        <div className="client-col-right">
          <strong>Project:</strong>
          <p style={{ color: '#0d9488', fontWeight: 600 }}>{order.namaProject || '-'}</p>
          <div className="client-detail-row">
            <strong style={{ display: 'inline-block', width: '85px' }}>BAHAN:</strong> <span>{order.jenisBahan || '-'}</span>
          </div>
          <div className="client-detail-row">
            <strong style={{ display: 'inline-block', width: '85px' }}>STATUS:</strong> <span>
              {order.status === 'production' ? 'Sedang Produksi' : order.status === 'completed' ? 'Selesai' : STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
        </div>
      </div>

      <table className="invoice-items">
        <thead>
          <tr>
            <th>Item Deskripsi</th>
            <th style={{ width: '50px' }}>Qty</th>
            <th style={{ width: '120px' }}>Harga</th>
            <th style={{ width: '120px' }}>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{item.name}</td>
              <td style={{ textAlign: 'center' }}>{item.qty}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-footer">
        <div className="invoice-footer-left">
          <div className="invoice-pay-box">
            <strong>Pembayaran:</strong>
            <p>{bank.bankName} &mdash; <span style={{ fontWeight: 600 }}>{bank.noRekening}</span> <br></br><span style={{ fontWeight: 600 }}>{bank.atasNama}</span></p>
            <p>Konfirmasi bukti pembayaran melalui WhatsApp</p>
          </div>
          <div className="invoice-notes">
            <strong>Catatan:</strong>
            <ul>
              <li>Order akan diproses setelah pembayaran DP sebesar 70% diterima.</li>
              <li>Pelunasan dilakukan maksimal H-1 setelah produksi selesai dan sebelum pengiriman ke lokasi customer.</li>
              <li>Detail/identitas proyek akan dikirim setelah DP masuk.</li>
              <li>Komplain dapat diajukan setelah pembayaran dilakukan secara penuh.</li>
            </ul>
          </div>
        </div>
        <div className="invoice-totals">
          <div className="total-row">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.grossTotal)}</span>
          </div>
          <div className="total-row">
            <span>Diskon</span>
            <span>{formatCurrency(totals.diskon)}</span>
          </div>
          <div className="total-row" style={{ fontWeight: 700, borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem' }}>
            <span>Total Tagihan</span>
            <span>{formatCurrency(netTotal)}</span>
          </div>
          <div className="total-row" style={{ flexDirection: 'column', gap: '0.1rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Status Pembayaran</span>
            <span style={{ fontWeight: 600 }}>{statusPembayaran}</span>
          </div>
          {(payments?.rows ?? []).map((row) => (
            <div key={row.key} className="total-row" style={{ fontSize: '0.8rem', gap: '0.5rem' }}>
              <span>
                {row.label} Diterima{row.tanggal ? ` (${invoicePaymentDateLabel(row.tanggal)})` : ''}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>{formatCurrency(row.nominal)}</span>
            </div>
          ))}
          <div className="total-row grand-total">
            <span>{sisa.label}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{sisa.value}</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '-0.25rem' }}>{sisa.note}</p>
        </div>
      </div>
    </div>
  );
}