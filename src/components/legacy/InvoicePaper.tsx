'use client';

import React from 'react';
import { STATUS_LABELS, type BankAccountInfo, type LegacyOrder } from '@/lib/legacy/types';
import { formatDate, formatCurrency, timestampToDate } from '@/lib/legacy/formatters';
import { calculateTotals, getInvoiceItems } from '@/lib/legacy/calculations';
import { invoicePaymentDateLabel, type InvoicePaymentSummary } from '@/lib/invoice-payments';

/**
 * Salinan apa adanya `visualkaindb/src/components/invoice/InvoicePreview.tsx` (K-10). Perubahan hanya pada sumber
 * pembayaran: DP 1/DP 2/pelunasan dibaca dari pembayaran customer modul finansial (K-15), dirender dengan gaya baris yang sama.
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
  const targetDpPersen = order.targetDpPersen || 70;
  const targetDpNominal = Math.round(netTotal * (targetDpPersen / 100));

  // Akumulasi riwayat pembayaran bertahap (DP 1, DP 2, Pelunasan)
  const dp1 = payments?.dp1 ?? 0;
  const dp2 = payments?.dp2 ?? 0;
  const totalDpDiterima = payments?.totalDpDiterima ?? 0;
  const totalUangMasuk = payments?.totalUangMasuk ?? 0;

  const sisaKekuranganDp = Math.max(0, targetDpNominal - totalDpDiterima);
  const sisaPelunasanAkhir = Math.max(0, netTotal - totalUangMasuk);

  // Status Badge Penagihan
  let badgeLabel = 'Menunggu DP (70%)';
  let badgeStyle = {
    color: '#991b1b',
    background: '#fee2e2',
    border: '1px solid #fca5a5',
  };

  if (totalUangMasuk >= netTotal || order.status === 'completed') {
    badgeLabel = 'Lunas 100%';
    badgeStyle = {
      color: '#065f46',
      background: '#d1fae5',
      border: '1px solid #6ee7b7',
    };
  } else if (totalDpDiterima >= targetDpNominal) {
    badgeLabel = `DP Target (${targetDpPersen}%) Terpenuhi`;
    badgeStyle = {
      color: '#0369a1',
      background: '#e0f2fe',
      border: '1px solid #7dd3fc',
    };
  } else if (dp1 > 0 && dp2 === 0) {
    const dp1Persen = netTotal > 0 ? Math.round((dp1 / netTotal) * 100) : 0;
    badgeLabel = `DP 1 Diterima (${dp1Persen}%) - Menunggu DP 2`;
    badgeStyle = {
      color: '#92400e',
      background: '#fef3c7',
      border: '1px solid #fde68a',
    };
  } else if (totalDpDiterima > 0) {
    const akumulasiPersen = netTotal > 0 ? Math.round((totalDpDiterima / netTotal) * 100) : 0;
    badgeLabel = `DP Diterima (${akumulasiPersen}%) - Belum Cukup Target`;
    badgeStyle = {
      color: '#b45309',
      background: '#ffedd5',
      border: '1px solid #fed7aa',
    };
  }

  const activeBank = {
    bankName: bankInfo?.bankName || DEFAULT_BANK_INFO.bankName,
    noRekening: bankInfo?.noRekening || DEFAULT_BANK_INFO.noRekening,
    atasNama: bankInfo?.atasNama || DEFAULT_BANK_INFO.atasNama,
  };

  return (
    <div id="invoicePaper" className="invoice-paper" style={{ fontFamily: "var(--font-sans), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div className="invoice-header">
        <div className="company-info">
          <h1>VISUAL KAIN</h1>
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
          <p style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{order.noInv}</p>
          <p>Tanggal: {dateStr}</p>
        </div>
      </div>

      <div className="invoice-client">
        <div className="client-col-left">
          <strong>Bill To:</strong>
          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{order.namaCustomer}</p>
          <div className="client-detail-row">
            <strong style={{ display: 'inline-block', width: '85px' }}>WA:</strong> <span>{order.noWaCustomer || '-'}</span>
          </div>
          <div className="client-detail-row">
            <strong style={{ display: 'inline-block', width: '85px' }}>KATEGORI:</strong> <span>{order.kategoriOrder || '-'}</span>
          </div>
        </div>
        <div className="client-col-right">
          <strong>Project:</strong>
          <p style={{ color: '#0d9488', fontWeight: 700 }}>{order.namaProject || '-'}</p>
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

      <table className="invoice-items" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr>
            <th>Item Deskripsi</th>
            <th style={{ width: '60px', textAlign: 'center' }}>Qty</th>
            <th style={{ width: '130px', textAlign: 'right' }}>Harga</th>
            <th style={{ width: '130px', textAlign: 'right' }}>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{item.name}</td>
              <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.qty}</td>
              <td style={{ textAlign: 'right', fontFamily: "'Open Sans', sans-serif" }}>{formatCurrency(item.price)}</td>
              <td style={{ textAlign: 'right', fontFamily: "'Open Sans', sans-serif", fontWeight: 600 }}>{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem' }}>
        <div className="invoice-footer-left" style={{ flex: 1, maxWidth: '330px', minWidth: 0 }}>
          <div
            className="invoice-pay-box"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '8px 12px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '315px',
              boxSizing: 'border-box',
              marginBottom: '10px',
            }}
          >
            {/* Header: Label + Bank Tag Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '5px',
                borderBottom: '1px dashed #cbd5e1',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Pembayaran Transfer Bank
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: '#0d9488',
                  color: '#ffffff',
                  letterSpacing: '0.02em',
                }}
              >
                {activeBank.bankName}
              </span>
            </div>

            {/* Rekening & Pemilik */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  fontFamily: "'Open Sans', sans-serif",
                  color: '#0f172a',
                  letterSpacing: '0.5px',
                  lineHeight: '1.25',
                }}
              >
                {activeBank.noRekening}
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  color: '#475569',
                  lineHeight: '1.3',
                }}
              >
                a.n. <strong style={{ color: '#0f172a' }}>{activeBank.atasNama}</strong>
              </div>
            </div>

            {/* WA Konfirmasi */}
            <div
              style={{
                fontSize: '0.68rem',
                color: '#64748b',
                marginTop: '6px',
                paddingTop: '5px',
                borderTop: '1px dashed #cbd5e1',
                lineHeight: '1.35',
              }}
            >
              Konfirmasi transfer via WhatsApp: <strong>0859 6644 4312</strong>
            </div>
          </div>

          <div className="invoice-notes" style={{ marginTop: '4px' }}>
            <strong style={{ fontSize: '0.75rem', color: '#334155' }}>Catatan &amp; Ketentuan:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', lineHeight: '1.45', color: '#475569' }}>
              <li>Order akan diproses jahit/produksi setelah pembayaran akumulasi DP minimal 70% diterima.</li>
              <li>Pelunasan dilakukan maksimal H-1 setelah produksi selesai dan sebelum pengiriman ke lokasi customer.</li>
              <li>Detail/identitas proyek dikirim setelah DP masuk.</li>
              <li>Komplain dapat diajukan setelah pembayaran dilakukan secara penuh (maks. 3 hari setelah barang tiba).</li>
            </ul>
          </div>
        </div>

        <div className="invoice-totals" style={{ width: '280px', minWidth: '280px', flexShrink: 0 }}>
          <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem' }}>
            <span style={{ color: '#475569' }}>Subtotal</span>
            <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600 }}>{formatCurrency(totals.grossTotal)}</span>
          </div>

          {totals.diskon > 0 && (
            <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem', color: '#dc2626' }}>
              <span>Diskon</span>
              <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600 }}>- {formatCurrency(totals.diskon)}</span>
            </div>
          )}

          <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: 800, borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', marginTop: '4px', fontSize: '0.92rem' }}>
            <span>Total Tagihan</span>
            <span style={{ fontFamily: "'Open Sans', sans-serif", color: '#0f172a' }}>{formatCurrency(netTotal)}</span>
          </div>

          {/* ── Status & Riwayat Pembayaran Bertahap ── */}
          <div style={{ marginTop: '8px', paddingTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Status Pembayaran
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  ...badgeStyle,
                }}
              >
                {badgeLabel}
              </span>
            </div>

            {(payments?.rows ?? []).map((row) => (
              <div key={row.key} className="total-row" style={{ display: 'flex', justifyContent: 'space-between', color: '#0d9488', fontSize: '0.78rem', padding: '2px 0' }}>
                <span>{row.label} Diterima {row.tanggal ? `(${invoicePaymentDateLabel(row.tanggal)})` : ''}</span>
                <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600 }}>{formatCurrency(row.nominal)}</span>
              </div>
            ))}

            {/* Sisa DP yang harus ditagih (Target 70% Produksi) */}
            {sisaKekuranganDp > 0 ? (
              <div
                className="total-row grand-total"
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#92400e' }}>
                    Sisa DP (Target 70% Produksi)
                  </span>
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#b45309', fontFamily: "'Open Sans', sans-serif" }}>
                    {formatCurrency(sisaKekuranganDp)}
                  </span>
                </div>
                <div style={{ fontSize: '0.64rem', fontWeight: 500, color: '#b45309', lineHeight: '1.3' }}>
                  * Wajib transfer sebelum pesanan naik meja jahit
                </div>
              </div>
            ) : sisaPelunasanAkhir > 0 ? (
              <div
                className="total-row grand-total"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>
                    Sisa Pelunasan (100%)
                  </span>
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Open Sans', sans-serif" }}>
                    {formatCurrency(sisaPelunasanAkhir)}
                  </span>
                </div>
                <div style={{ fontSize: '0.64rem', fontWeight: 500, color: '#64748b', lineHeight: '1.3' }}>
                  * Pelunasan wajib dilakukan saat produksi selesai &amp; sebelum pengiriman
                </div>
              </div>
            ) : (
              <div
                className="total-row grand-total"
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#065f46' }}>
                    Status Pelunasan (100%)
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669', fontFamily: "'Open Sans', sans-serif" }}>
                    LUNAS
                  </span>
                </div>
                <div style={{ fontSize: '0.64rem', fontWeight: 500, color: '#047857', lineHeight: '1.3' }}>
                  ✓ Seluruh pembayaran tagihan telah selesai diterima
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}