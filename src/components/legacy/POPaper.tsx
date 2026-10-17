'use client';

import React from 'react';
import { formatPoNumber } from '@/lib/document-number';
import {
  CATEGORIES,
  CATEGORY_TECHPACK_LABELS,
  SIZES,
  getSizeExtraPrice,
  qtyKey,
  vendorPriceKey,
} from '@/lib/legacy/calculations';
import { formatCurrency, formatDate, timestampToDate } from '@/lib/legacy/formatters';
import { poFigures } from '@/lib/document-figures';
import type { LegacyOrder, VendorDoc } from '@/lib/legacy/types';

interface POPaperProps {
  order: LegacyOrder | undefined;
  vendor: VendorDoc | undefined;
}

export interface POItem {
  no: number;
  desc: string;
  qty: number;
  price: number;
  total: number;
}

function numberField(order: LegacyOrder, key: string): number {
  return (order[key] as number) || 0;
}

/**
 * Item PO dari harga modal vendor + tambahan ukuran besar, urutan dan deskripsi sama dengan POPaper
 * `visualkaindb` ("Lengan Pendek", "Lengan Panjang", "Tanpa Lengan"). `getVendorItems` di lib/legacy
 * memakai label invoice ("Pendek"), jadi sengaja tidak dipakai di sini agar teks kertas PO tidak berubah.
 */
export function getPoItems(order: LegacyOrder): { items: POItem[]; grandTotal: number } {
  const items: POItem[] = [];
  let grandTotal = 0;
  let no = 1;

  CATEGORIES.forEach((cat) => {
    const basePrice = numberField(order, vendorPriceKey(cat));
    SIZES.forEach((size) => {
      const qty = numberField(order, qtyKey(cat, size));
      if (qty > 0) {
        const extra = getSizeExtraPrice(size);
        const finalPrice = basePrice + extra;
        const total = qty * finalPrice;
        grandTotal += total;
        items.push({
          no: no++,
          desc: `${order.kategoriOrder ?? ''} ${CATEGORY_TECHPACK_LABELS[cat]} (${size})`.trim(),
          qty,
          price: finalPrice,
          total,
        });
      }
    });
  });

  return { items, grandTotal };
}

export function POPaper({ order, vendor }: POPaperProps) {
  if (!order) {
    return (
      <div id="poPaper" className="invoice-paper po-paper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Pilih order untuk menampilkan Purchase Order</p>
      </div>
    );
  }

  const poNo = formatPoNumber(order.noInv);
  const dateStr = formatDate(timestampToDate(order.createdAt));

  const { items, grandTotal: itemsTotal } = getPoItems(order);
  // Total, biaya tambahan vendor, dan pembayaran ke vendor mengikuti modul finansial (K-32).
  const fig = poFigures(order, itemsTotal);
  const hasExtra = fig.biayaTambahan !== 0 || fig.penyesuaian !== 0;
  const hasDp = fig.sudahDibayar > 0;
  const dpPersenDisplay = fig.total > 0 ? ((fig.sudahDibayar / fig.total) * 100).toFixed(2) : '0.00';

  return (
    <div id="poPaper" className="invoice-paper po-paper">
      <div className="invoice-header">
        <div className="company-info">
          <h1>VisualKain</h1>
          <p><span className="po-kop-label">Alamat</span> : Jl. Babakan, Kota Tangerang Selatan</p>
          <p><span className="po-kop-label">WhatsApp</span> : 0823 2153 2226</p>
          <p><span className="po-kop-label">Email</span> : visualkainn@gmail.com</p>
        </div>
        <div className="invoice-meta">
          <h2 style={{ color: '#000000', fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.15, letterSpacing: '1px' }}>PURCHASE<br/>ORDER</h2>
          <p>{poNo}</p>
          <p>Tanggal: {dateStr}</p>
        </div>
      </div>

      <div className="po-vendor-bar">
        <span><strong>Vendor:</strong> {vendor?.nama || 'BELUM DIPILIH'}</span>
        <span className="po-vbar-sep">|</span>
        <span><strong>Alamat:</strong> {vendor?.alamat || '-'}</span>
        <span className="po-vbar-sep">|</span>
        <span><strong>Telp:</strong> {vendor?.wa || '-'}</span>
      </div>

      <div className="po-identity-bar">
        <span><strong>Kategori:</strong> {order.kategoriOrder || '-'}</span>
        <span className="po-vbar-sep">|</span>
        <span><strong>Bahan:</strong> {order.jenisBahan || '-'}</span>
        <span className="po-vbar-sep">|</span>
        <span><strong>Warna:</strong> {order.warna || '-'}</span>
      </div>

      <table className="invoice-items po-items-compact">
        <thead>
          <tr>
            <th style={{ width: '35px' }}>No</th>
            <th>Deskripsi Barang</th>
            <th style={{ width: '50px' }}>Qty</th>
            <th style={{ width: '100px' }}>Harga</th>
            <th style={{ width: '100px' }}>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.no}>
              <td style={{ textAlign: 'center' }}>{item.no}</td>
              <td style={{ textAlign: 'left' }}>{item.desc}</td>
              <td style={{ textAlign: 'center' }}>{item.qty}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-footer po-paper-footer">
        <div className="invoice-footer-left">
          <p className="po-note-line">
            <strong>Catatan:</strong> Harga termasuk biaya produksi. Deadline sesuai kesepakatan. Pembayaran sesuai termin.
          </p>
          <div className="po-sig-row">
            <div className="po-sig-block">
              <p className="po-sig-label">Hormat Kami,</p>
              <p className="po-sig-company">VisualKain</p>
              <div className="po-sig-space"></div>
              <p className="po-sig-name">( ___________________ )</p>
            </div>
            <div className="po-sig-block">
              <p className="po-sig-label">Disetujui Oleh,</p>
              <p className="po-sig-company">{vendor?.nama || 'Vendor'}</p>
              <div className="po-sig-space"></div>
              <p className="po-sig-name">( ___________________ )</p>
            </div>
          </div>
        </div>

        <div className="invoice-totals">
          {hasExtra && (
            <>
              <div className="total-row">
                <span>Subtotal</span>
                <span>{formatCurrency(fig.itemsTotal)}</span>
              </div>
              {fig.biayaTambahan !== 0 && (
                <div className="total-row">
                  <span>
                    Biaya Tambahan
                    {fig.biayaTambahanNotes && <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>{fig.biayaTambahanNotes}</span>}
                  </span>
                  <span style={{ whiteSpace: 'nowrap' }}>{formatCurrency(fig.biayaTambahan)}</span>
                </div>
              )}
              {fig.penyesuaian !== 0 && (
                <div className="total-row">
                  <span>Penyesuaian</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{formatCurrency(fig.penyesuaian)}</span>
                </div>
              )}
            </>
          )}
          {hasDp ? (
            <>
              <div className="total-row">
                <span>Total Tagihan</span>
                <span>{formatCurrency(fig.total)}</span>
              </div>
              <div className="total-row po-dp-row">
                <span>Sudah Dibayar ({dpPersenDisplay}%)</span>
                <span>- {formatCurrency(fig.sudahDibayar)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Sisa Tagihan</span>
                <span>{formatCurrency(fig.sisa)}</span>
              </div>
            </>
          ) : (
            <div className="total-row grand-total">
              <span>Total Tagihan</span>
              <span>{formatCurrency(fig.total)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
