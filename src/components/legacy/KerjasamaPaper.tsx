'use client';

import React from 'react';
import Image from 'next/image';
import { renderLetterHtml, type KerjasamaFormState } from '@/lib/letters';

interface KerjasamaPaperProps {
  formData: KerjasamaFormState;
}

export function KerjasamaPaper({ formData }: KerjasamaPaperProps) {
  const tanggal = formData.tanggal
    ? new Date(formData.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

  return (
    <div id="ksPaper" className="letter-paper">
      <div className="kop-surat">
        <div className="kop-left">
          <div className="kop-logo">
            <Image
              src="/img/logo.jpg"
              alt="VisualKain"
              width={88}
              height={88}
              style={{ objectFit: 'cover', borderRadius: '2mm' }}
            />
          </div>
          <div className="kop-text">
            <h1>VISUALKAIN</h1>
            <p>Jl. Babakan, Kota Tangerang Selatan</p>
            <p>Telp: 0859 6644 4312 | Email: visualkainn@gmail.com</p>
          </div>
        </div>
        <div className="kop-right">
          <div className="kop-qr-text">
            Surat Pengajuan<br />Kerjasama
          </div>
        </div>
      </div>
      <div className="kop-garis" />

      <div className="ph-doc-header">
        <table className="ph-meta-table">
          <tbody>
            <tr>
              <td>No</td>
              <td>: <strong>{formData.noSurat || '-'}</strong></td>
              <td>Tanggal</td>
              <td>: <strong>{tanggal}</strong></td>
            </tr>
            <tr>
              <td>Lampiran</td>
              <td>: <strong>{formData.lampiran || '-'}</strong></td>
              <td>Perihal</td>
              <td>: <strong>{formData.perihal || '-'}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="ph-kepada">
        <p className="ph-kepada-label">Kepada Yth.</p>
        <p className="ph-kepada-nama">{formData.perusahaan || '-'}</p>
        <p>{formData.divisi || '-'}</p>
        <p>{formData.alamat || '-'}</p>
        <p>{formData.diTempat || '-'}</p>
      </div>

      <div className="ks-isi-surat">
        <p className="ph-salam">Dengan hormat,</p>
        <div className="ks-paragraph" dangerouslySetInnerHTML={{ __html: renderLetterHtml(formData.pembuka) || '<p>-</p>' }} />
        <div className="ks-paragraph" dangerouslySetInnerHTML={{ __html: renderLetterHtml(formData.profil) || '<p>-</p>' }} />
        <div className="ks-paragraph" dangerouslySetInnerHTML={{ __html: renderLetterHtml(formData.keunggulan) || '<p>-</p>' }} />
        <div className="ks-paragraph" dangerouslySetInnerHTML={{ __html: renderLetterHtml(formData.penutup) || '<p>-</p>' }} />
      </div>

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
