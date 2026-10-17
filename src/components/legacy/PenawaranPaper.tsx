'use client';

import React from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/legacy/formatters';
import type { PenawaranFormState, PenawaranItem } from '@/lib/letters';

interface PenawaranPaperProps {
  formData: PenawaranFormState;
  items: PenawaranItem[];
}

export function PenawaranPaper({ formData, items }: PenawaranPaperProps) {
  const tanggal = formData.tanggal
    ? new Date(formData.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

  return (
    <div id="phPaper" className="letter-paper">
      <div className="kop-surat">
        <div className="kop-left">
          <div className="kop-logo">
            <Image src="/img/logo.jpg" alt="VisualKain" width={88} height={88} style={{ objectFit: 'cover', borderRadius: '2mm' }} />
          </div>
          <div className="kop-text">
            <h1>VISUALKAIN</h1>
            <p>Jl. Babakan, Kota Tangerang Selatan</p>
            <p>Telp: 0859 6644 4312 | Email: visualkainn@gmail.com</p>
          </div>
        </div>
        <div className="kop-right">
          <div className="kop-qr-text">Penawaran Harga</div>
        </div>
      </div>
      <div className="kop-garis" />

      <div className="ph-doc-header">
        <table className="ph-meta-table">
          <tbody>
            <tr>
              <td>No</td>
              <td>: <strong>{formData.noPenawaran || '-'}</strong></td>
              <td>Tanggal</td>
              <td>: <strong>{tanggal}</strong></td>
            </tr>
            <tr>
              <td>Perihal</td>
              <td colSpan={3}>: <strong>{formData.perihal || '-'}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="ph-kepada">
        <p className="ph-kepada-label">Kepada Yth.</p>
        <p className="ph-kepada-nama">{formData.perusahaan || '-'}</p>
        <p>{formData.alamat || '-'}</p>
        <p>Up. <strong>{formData.cp || '-'}</strong></p>
        <p>{formData.telpEmail || '-'}</p>
      </div>

      <p className="ph-salam">Dengan hormat,</p>
      <p className="ph-isi-awal">
        Bersama ini kami dari <strong>VisualKain</strong> bermaksud menyampaikan penawaran harga untuk kebutuhan <strong>{formData.perihal || '-'}</strong> sebagai berikut:
      </p>

      <table className="ph-items-print">
        <thead>
          <tr>
            <th style={{ width: '30px' }}>No</th>
            <th>Deskripsi Barang / Jasa</th>
            <th style={{ width: '55px' }}>Qty</th>
            <th style={{ width: '65px' }}>Satuan</th>
            <th style={{ width: '110px' }}>Harga Satuan</th>
            <th style={{ width: '110px' }}>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '4mm' }}>
                Belum ada item
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.no}>
                <td style={{ textAlign: 'center' }}>{item.no}</td>
                <td>{item.desc || '-'}</td>
                <td style={{ textAlign: 'center' }}>{item.qty}</td>
                <td style={{ textAlign: 'center' }}>{item.satuan}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.harga)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.jumlah)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="ph-catatan-box">
        <p><strong>Catatan:</strong></p>
        {formData.catatan ? (
          formData.catatan.split('\n').filter((l: string) => l.trim()).map((l: string, i: number) => (
            <p key={i}>{l}</p>
          ))
        ) : (
          <p>-</p>
        )}
      </div>

      <p className="ph-penutup">Demikian penawaran ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>

      <div className="ph-ttd-layout">
        <div className="ph-ttd-spacer" />
        <div className="ph-ttd-block">
          <p>Hormat Kami,</p>
          <p className="ph-ttd-company">VisualKain</p>
          <div className="ph-ttd-space" />
          <p className="ph-ttd-line">( ___________________ )</p>
          <p className="ph-ttd-sub">Glora Sawita Br Panjaitan</p>
        </div>
      </div>

      <div className="letter-footer-print">
        <p>Dokumen ini sah tanpa tanda tangan basah jika dikirim secara elektronik.</p>
      </div>
    </div>
  );
}
