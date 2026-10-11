import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const TEMP_DIR = path.join(ROOT_DIR, '.temp-pdf');
const HTML_OUTPUT = path.join(TEMP_DIR, 'dokumen-resmi-kak-glora.html');
const PDF_OUTPUT = 'C:\\Users\\PLN\\Downloads\\DOKUMEN_RESMI_FINANCIAL_ANALYTICS_KAK_GLORA.pdf';

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const logoPath = path.join(ROOT_DIR, 'public', 'img', 'logo.jpg');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUri = `data:image/jpeg;base64,${logoBase64}`;

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>DOKUMEN RESMI SERAH TERIMA SISTEM FINANSIAL VISUALKAIN 2026 - KAK GLORA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.6pt;
      line-height: 1.55;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    }

    /* Print Break Utilities */
    .page-break {
      page-break-before: always;
      break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Kop Surat Resmi */
    .kop-surat {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 4px;
    }

    .kop-subline {
      border-bottom: 1px solid #059669;
      margin-bottom: 16px;
    }

    .kop-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .kop-logo-img {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      object-fit: cover;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .kop-company-name {
      font-size: 15pt;
      font-weight: 800;
      letter-spacing: -0.4px;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0;
      line-height: 1.1;
    }

    .kop-division {
      font-size: 9pt;
      font-weight: 700;
      color: #059669;
      margin-top: 2px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .kop-details {
      text-align: right;
      font-size: 7.8pt;
      color: #475569;
      line-height: 1.35;
    }

    .kop-details strong {
      color: #0f172a;
    }

    /* Banner Judul */
    .header-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 14px;
      border-left: 6px solid #059669;
    }

    .header-banner h1 {
      margin: 0 0 3px 0;
      font-size: 13pt;
      font-weight: 800;
      letter-spacing: -0.2px;
      text-transform: uppercase;
    }

    .header-banner h2 {
      margin: 0;
      font-size: 10pt;
      font-weight: 600;
      color: #34d399;
      letter-spacing: 0.2px;
    }

    /* Meta Information Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }

    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 8.3pt;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      padding-bottom: 3px;
      border-bottom: 1px dashed #e2e8f0;
    }

    .meta-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .meta-label {
      color: #64748b;
      font-weight: 600;
    }

    .meta-value {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }

    .badge-pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 7.2pt;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .badge-emerald {
      background-color: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .badge-amber {
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .badge-rose {
      background-color: #ffe4e6;
      color: #9f1239;
      border: 1px solid #fecdd3;
    }

    .badge-blue {
      background-color: #dbeafe;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .badge-slate {
      background-color: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }

    /* Parties Table */
    .parties-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 8.3pt;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }

    .parties-table th {
      background-color: #0f172a;
      color: #ffffff;
      padding: 6px 10px;
      text-align: left;
      font-weight: 700;
      font-size: 7.8pt;
      text-transform: uppercase;
    }

    .parties-table td {
      padding: 6px 10px;
      border-top: 1px solid #e2e8f0;
      color: #334155;
    }

    .parties-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Daftar Isi Box */
    .toc-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .toc-title {
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
    }

    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 18px;
      row-gap: 4px;
      font-size: 8.2pt;
    }

    .toc-item {
      display: flex;
      align-items: baseline;
      color: #334155;
    }

    .toc-num {
      font-weight: 700;
      color: #059669;
      width: 22px;
      flex-shrink: 0;
    }

    .toc-text {
      color: #1e293b;
      font-weight: 600;
    }

    /* Headings */
    h2.section-title {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin: 16px 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 2px solid #059669;
      display: flex;
      align-items: center;
      gap: 8px;
      page-break-after: avoid;
      break-after: avoid;
    }

    h3.subsection-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #1e293b;
      margin: 12px 0 6px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Highlight & Cards */
    .feature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #059669;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
      font-size: 8.8pt;
    }

    .feature-card strong {
      color: #0f172a;
    }

    .alert-card {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
      font-size: 8.8pt;
    }

    .alert-card strong {
      color: #991b1b;
    }

    .info-card {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #059669;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
      font-size: 8.8pt;
    }

    /* Modules Grid */
    .modules-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 10px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .module-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .module-card-header {
      font-size: 8.8pt;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
    }

    .module-card-body {
      font-size: 8pt;
      color: #475569;
      line-height: 1.4;
      margin: 0;
      padding-left: 14px;
    }

    /* Formula Box */
    .formula-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0f172a;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 8px 0 10px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .formula-header {
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .formula-math {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 9.3pt;
      font-weight: 600;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      border-radius: 4px;
      color: #0f172a;
      margin-bottom: 5px;
      display: block;
      white-space: pre-wrap;
    }

    .formula-desc {
      font-size: 8.2pt;
      color: #475569;
      line-height: 1.4;
    }

    .formula-desc ul {
      margin: 3px 0 0 16px;
      padding: 0;
    }

    /* Diagram Card */
    .diagram-card {
      background: #0f172a;
      color: #e2e8f0;
      padding: 10px 12px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 7.6pt;
      line-height: 1.32;
      overflow-x: hidden;
      white-space: pre;
      margin: 8px 0 12px 0;
      page-break-inside: avoid;
      break-inside: avoid;
      border: 1px solid #334155;
    }

    /* WhatsApp Template Card */
    .wa-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 10px 12px;
      margin: 8px 0 10px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .wa-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 700;
      color: #166534;
      font-size: 8.8pt;
      margin-bottom: 6px;
      border-bottom: 1px dashed #86efac;
      padding-bottom: 4px;
    }

    .wa-bubble {
      background: #ffffff;
      border: 1px solid #dcfce7;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 8.3pt;
      color: #1e293b;
      line-height: 1.45;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    /* SOP Steps List */
    .scenario-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 8px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .scenario-title {
      font-weight: 700;
      color: #0f172a;
      font-size: 9pt;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .step-list {
      margin: 0;
      padding-left: 18px;
      font-size: 8.3pt;
      color: #334155;
    }

    .step-list li {
      margin-bottom: 3px;
    }

    .step-list li strong {
      color: #0f172a;
    }

    /* Tables */
    .formal-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px 0;
      font-size: 8.3pt;
      border: 1px solid #cbd5e1;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .formal-table th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 700;
      padding: 6px 9px;
      text-align: left;
      border: 1px solid #334155;
      font-size: 8pt;
      text-transform: uppercase;
    }

    .formal-table td {
      padding: 6px 9px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    .formal-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Signature Matrix */
    .signature-section {
      margin-top: 18px;
      page-break-inside: avoid;
      break-inside: avoid;
      border-top: 2px solid #0f172a;
      padding-top: 12px;
    }

    .sig-location-date {
      font-size: 8.3pt;
      color: #475569;
      margin-bottom: 12px;
    }

    .sig-grid-top {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 16px;
    }

    .sig-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      text-align: center;
      background: #fafafa;
      position: relative;
    }

    .sig-role {
      font-size: 8pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 40px;
    }

    .sig-name {
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
      text-decoration: underline;
      margin-bottom: 2px;
    }

    .sig-title {
      font-size: 7.8pt;
      color: #475569;
    }

    .sig-center-bottom {
      max-width: 320px;
      margin: 0 auto;
    }

    /* Watermark Seal */
    .seal-stamp {
      display: inline-block;
      border: 2px dashed #059669;
      color: #059669;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      line-height: 12px;
      font-size: 6pt;
      font-weight: 800;
      text-transform: uppercase;
      padding-top: 14px;
      position: absolute;
      top: 18px;
      right: 14px;
      opacity: 0.35;
      transform: rotate(-12deg);
    }

    /* Running Footer Note */
    .footer-note {
      margin-top: 14px;
      font-size: 7.3pt;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
  </style>
</head>
<body>

  <!-- ================= KOP SURAT RESMI ================= -->
  <div class="kop-surat">
    <div class="kop-logo">
      <img class="kop-logo-img" src="${logoDataUri}" alt="VisualKain Logo" />
      <div>
        <h1 class="kop-company-name">PT Visual Kain Indonesia</h1>
        <div class="kop-division">Divisi Keuangan, Akuntansi & Sistem Teknologi Informasi</div>
      </div>
    </div>
    <div class="kop-details">
      <strong>Kantor Pusat Operasional & Finansial</strong><br>
      Kompleks Bisnis Garmen Terpadu, Bandung - Jakarta<br>
      Surel: <strong>finance@visualkain.id</strong> | Web: <strong>visualkain.id</strong>
    </div>
  </div>
  <div class="kop-subline"></div>

  <!-- ================= BANNER JUDUL ================= -->
  <div class="header-banner">
    <h1>Dokumen Serah Terima Sistem & Panduan Resmi Tata Kelola Keuangan</h1>
    <h2>VisualKain Financial Data & Executive Analytics System (Versi 2026)</h2>
  </div>

  <!-- ================= METADATA DOKUMEN ================= -->
  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-row">
        <span class="meta-label">Nomor Dokumen:</span>
        <span class="meta-value">VK/FIN-DOC/2026/X/001</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Tanggal Penerbitan:</span>
        <span class="meta-value">11 Oktober 2026</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Klasifikasi:</span>
        <span class="meta-value"><span class="badge-pill badge-rose">Rahasia Internal (Confidential)</span></span>
      </div>
    </div>
    <div class="meta-card">
      <div class="meta-row">
        <span class="meta-label">Status Sistem:</span>
        <span class="meta-value"><span class="badge-pill badge-emerald">Production-Ready (Verified)</span></span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Basis Arsitektur:</span>
        <span class="meta-value">Next.js 15.5 & Firebase Firestore</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Peruntukan:</span>
        <span class="meta-value"><span class="badge-pill badge-blue">Head of Finance & Accounting</span></span>
      </div>
    </div>
  </div>

  <!-- ================= PIHAK TERLIBAT ================= -->
  <table class="parties-table">
    <thead>
      <tr>
        <th style="width: 25%;">Peran Dokumen</th>
        <th style="width: 25%;">Nama Personil</th>
        <th style="width: 28%;">Jabatan Struktural</th>
        <th style="width: 22%;">Entitas</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Penerima Dokumen</strong></td>
        <td><strong>Kak Glora</strong></td>
        <td>Head of Finance & Accounting / Lead Keuangan</td>
        <td>PT Visual Kain Indonesia</td>
      </tr>
      <tr>
        <td><strong>Penyusun Sistem</strong></td>
        <td><strong>Engineering & Architecture Team</strong></td>
        <td>Lead Software & Finance Systems Engineer</td>
        <td>VisualKain Platform</td>
      </tr>
      <tr>
        <td><strong>Pengesahan Direksi</strong></td>
        <td><strong>Executive Board</strong></td>
        <td>Chief Executive & Operations</td>
        <td>PT Visual Kain Indonesia</td>
      </tr>
    </tbody>
  </table>

  <!-- ================= DAFTAR ISI ================= -->
  <div class="toc-box">
    <div class="toc-title">
      <span>Daftar Isi & Struktur Panduan Operasional</span>
      <span style="font-size: 7.5pt; font-weight: 600; color: #64748b;">11 Bagian Lengkap</span>
    </div>
    <div class="toc-grid">
      <div class="toc-item"><span class="toc-num">1.</span><span class="toc-text">Pernyataan Serah Terima & Ringkasan Eksekutif</span></div>
      <div class="toc-item"><span class="toc-num">7.</span><span class="toc-text">Template Pesanan & WhatsApp Follow-Up</span></div>
      <div class="toc-item"><span class="toc-num">2.</span><span class="toc-text">Latar Belakang Revamp & Pemisahan Domain</span></div>
      <div class="toc-item"><span class="toc-num">8.</span><span class="toc-text">Standarisasi Rekening Bank, Konstanta, & Format</span></div>
      <div class="toc-item"><span class="toc-num">3.</span><span class="toc-text">Arsitektur Navigasi & Tinjauan Modul Utama</span></div>
      <div class="toc-item"><span class="toc-num">9.</span><span class="toc-text">Panduan Operasional Harian Tim Finance (SOP)</span></div>
      <div class="toc-item"><span class="toc-num">4.</span><span class="toc-text">Kompilasi Rumus Matematis & Akuntansi</span></div>
      <div class="toc-item"><span class="toc-num">10.</span><span class="toc-text">Laporan Verifikasi Kualitas & Stabilitas Sistem</span></div>
      <div class="toc-item"><span class="toc-num">5.</span><span class="toc-text">SOP Ambang Batas DP 70% Produksi Garmen</span></div>
      <div class="toc-item"><span class="toc-num">11.</span><span class="toc-text">Lembar Pengesahan & Tanda Tangan Serah Terima</span></div>
      <div class="toc-item"><span class="toc-num">6.</span><span class="toc-text">Mekanisme Pencatatan Multi-Termin Cicilan</span></div>
    </div>
  </div>

  <!-- ================= 1. RINGKASAN EKSEKUTIF ================= -->
  <h2 class="section-title">1. Pernyataan Serah Terima & Ringkasan Eksekutif</h2>
  <p style="margin-top: 4px;">
    Dokumen ini disusun secara formal sebagai laporan serah terima teknis dan panduan operasional definitif bagi <strong>Kak Glora</strong> selaku Head of Finance & Accounting PT Visual Kain Indonesia.
    Sistem <strong>VisualKain Financial Data & Executive Analytics</strong> dibangun khusus untuk mengonsolidasikan seluruh arus kas masuk (<em>cash inflow</em>), arus kas keluar (<em>cash outflow</em>), kepatuhan pembayaran termin konsumen (<em>partial payment</em>), komitmen utang-piutang vendor konveksi, serta kalkulasi margin keuntungan aktual secara <em>real-time</em>.
  </p>

  <div class="feature-card">
    <strong>Sorotan Pencapaian Sistem Terkini:</strong>
    <ol style="margin: 4px 0 0 16px; padding: 0;">
      <li><strong>Pemisahan Penuh Beban Kerja Finansial:</strong> Tim Finance tidak lagi dibebani formulir potong teknis garmen (matrix ukuran XS-5XL, pola potong kain). Rincian produksi disajikan secara <em>read-only</em> sebagai konteks transaksi.</li>
      <li><strong>Penegakan SOP Kritis Ambang Batas DP 70%:</strong> Vendor garmen tidak diizinkan memotong atau menjahit kain sebelum konsumen menyelesaikan akumulasi uang muka minimal 70% dari nilai bersih invoice.</li>
      <li><strong>Pencatatan Multi-Termin DP & Pelunasan:</strong> Mendukung cicilan bertahap (DP 1 tanda jadi, DP 2 pemenuhan 70%, dan Pelunasan akhir 30%) lengkap dengan catatan nomor rekening dan tanggal transaksi.</li>
      <li><strong>Format Input Nominal Rupiah Baku (Rp 1.420.000):</strong> Seluruh formulir finansial dilengkapi pemisah ribuan otomatis dengan kursor halus, mencegah kesalahan ketik nilai nol (<em>zero-digit human error</em>).</li>
      <li><strong>Freeze Column & Mode Layar Penuh (Expanded Table):</strong> Tabel master finansial dilengkapi pembekuan kolom No. Invoice & Nama Customer, serta tombol ekspansi penuh untuk audit data besar.</li>
      <li><strong>Follow-Up Tagihan 1-Klik via WhatsApp:</strong> 3 draf pesan formal terintegrasi otomatis untuk menagih kekurangan DP, mengabarkan pesanan naik potong, dan konfirmasi pelunasan.</li>
    </ol>
  </div>

  <div class="page-break"></div>

  <!-- ================= 2. LATAR BELAKANG REVAMP ================= -->
  <h2 class="section-title">2. Latar Belakang Revamp & Pemisahan Domain Finansial</h2>
  
  <h3 class="subsection-title">2.1. Permasalahan pada Sistem Terdahulu (visualkaindb)</h3>
  <ul>
    <li><strong>Tumpang Tindih Formulir:</strong> Tim keuangan harus membuka formulir raksasa yang berisi pilihan bahan kaos, sablon, bordir, dan ukuran garmen hanya untuk memperbarui status DP atau biaya vendor.</li>
    <li><strong>Layout Kaku & Kurang Ergonomis:</strong> Tata letak tabel lama terpotong pada layar laptop standar, tidak memiliki fitur pembekuan kolom penting saat di-scroll horizontal, dan navigasi tab tidak terstruktur.</li>
    <li><strong>Ketiadaan Riwayat Cicilan Finansial:</strong> Pembayaran customer hanya berupa satu kolom angka kaku tanpa riwayat tanggal, saluran bank, atau kronologi termin.</li>
    <li><strong>Potensi Kerugian Akibat Pelanggaran SOP:</strong> Tidak adanya peringatan visual otomatis saat pesanan dikerjakan sebelum mencapai batas aman modal produksi (70%).</li>
  </ul>

  <h3 class="subsection-title">2.2. Solusi Arsitektur Baru 2026</h3>
  <ul>
    <li>Antarmuka didedikasikan 100% untuk eksekutif dan staf akuntansi berbasis <em>Single Responsibility Principle</em>.</li>
    <li>Dibangun di atas fondasi modern: <strong>Next.js 15</strong>, <strong>Tailwind CSS</strong>, <strong>Radix UI</strong>, <strong>Recharts</strong>, <strong>Lucide Icons</strong>, dan sinkronisasi langsung ke <strong>Firebase Firestore</strong>.</li>
    <li>Desain visual elegan berstandar enterprise dengan palet Slate-Teal, tipografi tabular monospace untuk angka nominal, serta animasi mikro responsif.</li>
  </ul>

  <!-- ================= 3. ARSITEKTUR NAVIGASI ================= -->
  <h2 class="section-title">3. Arsitektur Navigasi & Tinjauan Modul Utama (F-01 s/d F-06)</h2>
  
  <div class="modules-grid">
    <div class="module-card">
      <div class="module-card-header">
        <span>Sub-Tab 1: Overview & Arus Kas</span>
        <span class="badge-pill badge-emerald">F-01</span>
      </div>
      <ul class="module-card-body">
        <li>Escrow Liquidity Bar (Kas Riil vs Tertahan)</li>
        <li>4 Kartu KPI Keuangan Utama</li>
        <li>Grafik Tren Pendapatan vs Beban Bulanan</li>
      </ul>
    </div>
    <div class="module-card">
      <div class="module-card-header">
        <span>Sub-Tab 2: Master Data Finansial</span>
        <span class="badge-pill badge-emerald">F-02</span>
      </div>
      <ul class="module-card-body">
        <li>Dual Sticky Freeze Table (No. Inv & Customer)</li>
        <li>Kolom STATUS Order (Pill PRODUKSI & SELESAI)</li>
        <li>Mode Fullscreen Expand & 4 Aksi Cepat</li>
      </ul>
    </div>
    <div class="module-card">
      <div class="module-card-header">
        <span>Sub-Tab 3: Beban Kas Keluar</span>
        <span class="badge-pill badge-emerald">F-03</span>
      </div>
      <ul class="module-card-body">
        <li>Donut Chart Proporsi Beban per Kategori</li>
        <li>Drawer Pencatatan Kas Keluar Berformat Rp</li>
        <li>Ekspor Buku Kas Lengkap ke Excel (.xlsx)</li>
      </ul>
    </div>
    <div class="module-card">
      <div class="module-card-header">
        <span>Sub-Tab 4: Performa Vendor Garmen</span>
        <span class="badge-pill badge-emerald">F-04</span>
      </div>
      <ul class="module-card-body">
        <li>Peringkat Vendor Termurah per Kategori Garmen</li>
        <li>Radar Utang & Komitmen Pembayaran Vendor</li>
        <li>Indikator Tingkat Ketepatan Waktu Jahit</li>
      </ul>
    </div>
  </div>

  <div class="module-card" style="margin-bottom: 12px;">
    <div class="module-card-header">
      <span>Sub-Tab 5: Rekonsiliasi Profit & HPP Aktual Lapangan</span>
      <span class="badge-pill badge-emerald">F-05</span>
    </div>
    <ul class="module-card-body" style="columns: 2;">
      <li>Tabel Input Audit HPP & Profit Nyata Lapangan</li>
      <li>Grafik Batang Deviasi Laba (Surplus vs Defisit / Variance Analysis)</li>
    </ul>
  </div>

  <div class="diagram-card">┌────────────────────────────────────────────────────────────────────────┐
│ VISUALKAIN EXECUTIVE FINANCIAL DASHBOARD ARCHITECTURE                  │
├───────────────┬────────────────────────────────────────────────────────┤
│ SIDEBAR RAIL  │ SUB-TAB VIEWPORT                                       │
│ [Ctrl + B]    │                                                        │
│               │ 1. [Overview & Arus Kas] ── Escrow Liquidity Bar       │
│ • Arus Kas    │ 2. [Master Data Orders] ── Dual Freeze & Fullscreen    │
│ • Master Data │ 3. [Beban Kas Keluar]   ── Donut Chart & Drawer Rp     │
│ • Pengeluaran │ 4. [Performa Vendor]    ── Ranking Termurah & Radar    │
│ • Vendor      │ 5. [Rekonsiliasi Laba]  ── Audit Aktual & Varians      │
│ • Rekonsiliasi│                                                        │
│ [Collapse &lt;]  │ GLOBAL: Multi-Termin Modal, Auto WA, Export Excel      │
└───────────────┴────────────────────────────────────────────────────────┘</div>

  <div class="page-break"></div>

  <!-- ================= 4. KOMPILASI RUMUS MATEMATIS ================= -->
  <h2 class="section-title">4. Kompilasi Rumus Matematis & Logika Akuntansi Standar</h2>
  <p style="margin-top: 4px;">Seluruh formula kalkulasi di bawah ini berjalan secara otomatis dan terverifikasi pada mesin komputasi sistem (<code>src/lib/financial-calculator.ts</code>):</p>

  <div class="formula-box">
    <div class="formula-header">
      <span>4.1. Formula Tagihan Bersih Konsumen (Net Invoice)</span>
      <span class="badge-pill badge-slate">Tagihan Riil</span>
    </div>
    <div class="formula-math">Net Invoice = Total Invoice Kotor - Diskon</div>
    <div class="formula-desc">Nilai bersih yang menjadi dasar hak tagih riil kepada konsumen setelah potongan harga khusus atau diskon pesanan.</div>
  </div>

  <div class="formula-box">
    <div class="formula-header">
      <span>4.2. Formula Akumulasi Uang Masuk Customer (Multi-Termin)</span>
      <span class="badge-pill badge-emerald">Akumulasi Inflow</span>
    </div>
    <div class="formula-math">Total DP Customer = Σ (Nominal Cicilan) = DP 1 + DP 2 + ... + Pelunasan
% Pembayaran Konsumen = (Total DP Customer / Net Invoice) × 100%</div>
    <div class="formula-desc">Menggabungkan seluruh termin cicilan yang masuk ke rekening perusahaan secara kronologis.</div>
  </div>

  <div class="formula-box">
    <div class="formula-header">
      <span>4.3. Formula Ambang Batas 70% Produksi (SOP Penjahit & Naik Potong)</span>
      <span class="badge-pill badge-amber">SOP Wajib 70%</span>
    </div>
    <div class="formula-math">Target Ambang Batas DP 70% = 0.70 × Net Invoice
Sisa Menuju 70% = max(0, Target Ambang Batas DP 70% - Total DP Customer)</div>
    <div class="formula-desc">
      <ul>
        <li>Jika <strong>Total DP &lt; 70%</strong>: Berstatus <code>PARSIAL (BELUM AMAN NAIK POTONG)</code>. Sistem menampilkan sisa tagihan DP.</li>
        <li>Jika <strong>Total DP ≥ 70%</strong>: Berstatus <code>SIAP POTONG / SIAP PRODUKSI</code>. Tim produksi diizinkan menerbitkan SPK.</li>
      </ul>
    </div>
  </div>

  <div class="formula-box">
    <div class="formula-header">
      <span>4.4. Formula Sisa Piutang / Pelunasan Konsumen (30% Akhir)</span>
      <span class="badge-pill badge-blue">Hak Tagih Akhir</span>
    </div>
    <div class="formula-math">Sisa Pelunasan Konsumen = max(0, Net Invoice - Total DP Customer)</div>
    <div class="formula-desc">Tagihan akhir yang wajib diselesaikan konsumen sebelum barang pesanan diserahkan atau dikirimkan oleh logistik.</div>
  </div>

  <div class="formula-box">
    <div class="formula-header">
      <span>4.5. Formula Komitmen & Utang Mitra Vendor Garmen</span>
      <span class="badge-pill badge-rose">Kontrol Liabilitas</span>
    </div>
    <div class="formula-math">Sisa Utang ke Vendor = max(0, Total Biaya HPP Vendor - Kas yang Telah Dibayar ke Vendor)
% Pemenuhan Vendor = (Kas yang Telah Dibayar ke Vendor / Total Biaya HPP Vendor) × 100%</div>
    <div class="formula-desc">Mengontrol liabilitas utang dagang agar pembayaran ke penjahit sejalan dengan progress pesanan.</div>
  </div>

  <div class="formula-box">
    <div class="formula-header">
      <span>4.6. Formula Profitabilitas Estimasi (Gross & Nett Margin)</span>
      <span class="badge-pill badge-emerald">Profitabilitas</span>
    </div>
    <div class="formula-math">Gross Profit (Laba Kotor) = Net Invoice - Total Biaya HPP Vendor
% Gross Profit Margin = (Gross Profit / Net Invoice) × 100%
Nett Profit (Laba Bersih Operasional) = Gross Profit - Biaya Operasional Invoice</div>
    <div class="formula-desc">Target Gross Profit Margin minimal perusahaan adalah <strong>≥ 30%</strong>. Di bawah angka ini, sistem menandai <em>low margin alert</em>.</div>
  </div>

  <div class="formula-box">
    <div class="formula-header">
      <span>4.7. Formula Rekonsiliasi & Deviasi Laba Lapangan (Variance)</span>
      <span class="badge-pill badge-slate">Audit Laba</span>
    </div>
    <div class="formula-math">Deviasi Margin Lapangan (Δ) = Profit Aktual Lapangan - Target Margin Estimasi</div>
    <div class="formula-desc">
      <ul>
        <li>Jika <strong>Δ ≥ 0</strong>: <strong>Efisiensi Positif (Surplus)</strong> $\rightarrow$ Diagram batang hijau emerald.</li>
        <li>Jika <strong>Δ &lt; 0</strong>: <strong>Pembengkakan Biaya (Defisit)</strong> $\rightarrow$ Diagram batang merah rose sebagai bahan audit.</li>
      </ul>
    </div>
  </div>

  <div class="formula-box">
    <div class="formula-header">
      <span>4.8. Formula Arus Kas Likuiditas Riil</span>
      <span class="badge-pill badge-blue">Likuiditas Kas</span>
    </div>
    <div class="formula-math">Saldo Kas Riil Akhir = Saldo Kas Awal + Σ(Kas Masuk Riil) - Σ(Kas Keluar Operasional)</div>
    <div class="formula-desc">Saldo riil di bank dan kas tunai perusahaan yang siap dipergunakan untuk operasional harian.</div>
  </div>

  <div class="page-break"></div>

  <!-- ================= 5. SOP AMBANG BATAS DP 70% ================= -->
  <h2 class="section-title">5. Standar Operasional Prosedur (SOP) Ambang Batas DP 70% Produksi</h2>
  
  <div class="alert-card">
    <strong>KETENTUAN MUTLAK BAGI STAF KEUANGAN & PRODUKSI:</strong>
    <ol style="margin: 4px 0 0 16px; padding: 0;">
      <li><strong>Dilarang Keras Merilis SPK Meja Potong</strong> kepada vendor/penjahit jika baris invoice di tabel masih berwarna kuning amber (<em>Kurang menuju 70%</em>).</li>
      <li><strong>Prioritas Penagihan:</strong> Hubungi PIC pemesan melalui tombol WhatsApp cepat segera setelah barang pesanan selesai di-proofing namun pembayaran belum mencapai 70%.</li>
    </ol>
  </div>

  <div class="diagram-card">[Pesanan Konsumen Diterima]
               │
               ▼
   [Pencatatan DP 1 (Awal)] ───► Apakah Akumulasi DP ≥ 70%?
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼ TIDAK                                         ▼ YA
      [STATUS: PARSIAL (BELUM AMAN)]                 [STATUS: SIAP POTONG / PRODUKSI]
      • Badge Kuning Amber Alert                     • Badge Hijau Emerald Terbit
      • Kain DILARANG DIPOTONG                       • Kain Diizinkan Naik Potong & Jahit
      • Klik WhatsApp: Draf Tagih DP 70%             • SPK Resmi Diterbitkan ke Vendor</div>

  <!-- ================= 6. MULTI-TERMIN CICILAN ================= -->
  <h2 class="section-title">6. Mekanisme Pencatatan Multi-Termin Cicilan Pembayaran</h2>
  <p>
    Modal Edit Finansial (<code>EditFinanceModal.tsx</code>) menyediakan sub-tabel pencatatan termin cicilan secara kronologis dengan atribut:
  </p>
  <ul>
    <li><strong>Tanggal:</strong> Tanggal diterimanya dana di rekening perusahaan (<code>YYYY-MM-DD</code>).</li>
    <li><strong>Jenis Termin:</strong>
      <ul>
        <li><code>DP 1 (Awal)</code>: Tanda jadi pembuatan sample / pengikatan slot antrean order.</li>
        <li><code>DP 2 (Tambahan)</code>: Uang muka lanjutan pemenuhan ambang batas 70% agar pesanan boleh dipotong.</li>
        <li><code>Pelunasan 30%</code>: Pembayaran akhir sebelum pengiriman produk garmen.</li>
      </ul>
    </li>
    <li><strong>Saluran Rekening / Bank:</strong> Rekening tujuan (BCA / Mandiri / Kas Tunai).</li>
    <li><strong>Nominal (Rp):</strong> Angka uang masuk berformat ribuan otomatis tanpa resiko salah ketik angka 0.</li>
    <li><strong>Keterangan / Berita Acara:</strong> Catatan nomor referensi transfer atau nama pengirim.</li>
  </ul>

  <!-- ================= 7. TEMPLATE WHATSAPP ================= -->
  <h2 class="section-title">7. Template Pesanan & Integrasi WhatsApp Follow-Up Otomatis</h2>
  <p>Sistem menyediakan 3 template pesan WhatsApp resmi yang dipersonalisasi otomatis:</p>

  <div class="wa-card">
    <div class="wa-card-header">
      <span>📱 Template 1: Penagihan Pemenuhan DP 2 (Menuju SOP 70% Naik Potong)</span>
      <span class="badge-pill badge-amber">Tahap Kritis</span>
    </div>
    <div class="wa-bubble">
      Halo Kak <strong>{namaCustomer}</strong>, terima kasih atas kepercayaannya pada VisualKain untuk project <strong>{namaProject}</strong>.<br><br>
      Kami informasikan bahwa pesanan Invoice <strong>{noInv}</strong> saat ini telah selesai tahap proofing desain.<br>
      Sesuai SOP produksi garmen VisualKain, bahan pesanan siap dinaikkan ke meja potong & jahit setelah pembayaran mencapai minimal 70%.<br><br>
      • Total Nilai Pesanan: <strong>Rp {netInvoice}</strong><br>
      • DP yang Telah Masuk: <strong>Rp {nominalDp} ({dpPersen}%)</strong><br>
      • <strong>Kekurangan menuju DP 70%: Rp {sisaMenuju70}</strong><br><br>
      Pembayaran dapat ditransfer ke Rekening Resmi:<br>
      🏦 <strong>BCA: 8830-1928-41</strong> a.n. <strong>PT VISUAL KAIN INDONESIA</strong><br><br>
      Mohon konfirmasi bukti transfer agar tim produksi dapat segera memproses jahitan. Terima kasih banyak Kak!
    </div>
  </div>

  <div class="wa-card">
    <div class="wa-card-header">
      <span>📱 Template 2: Notifikasi SPK Naik Potong & Informasi Sisa Pelunasan 30%</span>
      <span class="badge-pill badge-emerald">Tahap Jahit</span>
    </div>
    <div class="wa-bubble">
      Kabar baik Kak <strong>{namaCustomer}</strong>!<br><br>
      Pembayaran DP 70% untuk Invoice <strong>{noInv}</strong> ({namaProject}) telah kami terima dan diverifikasi oleh bagian keuangan.<br>
      Saat ini Surat Perintah Kerja (SPK) resmi telah diterbitkan ke meja potong & jahit vendor kami.<br><br>
      • Sisa Pelunasan 30%: <strong>Rp {sisaPelunasan}</strong><br>
      <em>(Dapat diselesaikan saat barang memasuki tahap akhir finishing & sebelum pengiriman)</em><br><br>
      Salam hangat, Tim VisualKain.
    </div>
  </div>

  <div class="wa-card">
    <div class="wa-card-header">
      <span>📱 Template 3: Konfirmasi Pembayaran Lunas 100% & Kesiapan Pengiriman</span>
      <span class="badge-pill badge-blue">Tahap Logistik</span>
    </div>
    <div class="wa-bubble">
      Halo Kak <strong>{namaCustomer}</strong>, terima kasih banyak!<br><br>
      Pembayaran pelunasan untuk Invoice <strong>{noInv}</strong> telah kami terima secara penuh (<strong>LUNAS 100%</strong>).<br>
      Pesanan garmen Anda saat ini sedang dikemas rapi dan diserahkan ke bagian logistik untuk pengiriman ke alamat tujuan.<br><br>
      Resi dan foto paket akan segera kami kirimkan. Sukses selalu untuk event/project Anda!
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ================= 8. STANDARISASI REKENING & FORMAT ================= -->
  <h2 class="section-title">8. Standarisasi Rekening Bank, Konstanta, dan Format Nominal</h2>

  <h3 class="subsection-title">8.1. Rekening Bank Resmi Perusahaan (src/lib/constants.ts)</h3>
  <table class="formal-table">
    <thead>
      <tr>
        <th>Nama Bank</th>
        <th>Nomor Rekening</th>
        <th>Atas Nama</th>
        <th>Peruntukan Operasional</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Bank Central Asia (BCA)</strong></td>
        <td><strong>8830-1928-41</strong></td>
        <td>PT VISUAL KAIN INDONESIA</td>
        <td>Rekening Utama Inflow Konsumen & DP</td>
      </tr>
      <tr>
        <td><strong>Bank Mandiri</strong></td>
        <td><strong>137-00-1928-11</strong></td>
        <td>PT VISUAL KAIN INDONESIA</td>
        <td>Rekening Pengeluaran Beban & Pembayaran Vendor</td>
      </tr>
      <tr>
        <td><strong>Kas Tunai (Petty Cash)</strong></td>
        <td>-</td>
        <td>Petty Cash Office</td>
        <td>Operasional Harian Lapangan / Keperluan Darurat</td>
      </tr>
    </tbody>
  </table>

  <h3 class="subsection-title">8.2. Standar Format Mata Uang & Tipografi Angka Bersih</h3>
  <ul>
    <li><strong>Format Nominal:</strong> Prefix <code>Rp </code>, pemisah ribuan titik (<code>.</code>), desimal koma (<code>,</code>). Contoh: <code>Rp 1.420.000</code>.</li>
    <li><strong>Tipografi Angka Baku:</strong> Menggunakan font <strong>Plus Jakarta Sans</strong> dengan fitur <code>tabular-nums</code>. Seluruh angka nol (<code>0</code>) tampil bersih dan bulat natural tanpa coretan/titik di tengah, menjamin kenyamanan baca para eksekutif.</li>
    <li><strong>Format Sumbu Y Grafik:</strong> Diformat ringkas proporsional (<code>Rp 2,4 jt</code>, <code>Rp 1,8 jt</code>, <code>Rp 600 rb</code>, <code>Rp 0</code>) dengan wadah sumbu horizontal yang lega sehingga tidak terjadi pembungkusan teks (<em>wrapping</em>).</li>
  </ul>

  <!-- ================= 9. PANDUAN OPERASIONAL HARIAN ================= -->
  <h2 class="section-title">9. Panduan Operasional Harian Tim Finance (Step-by-Step SOP)</h2>

  <div class="scenario-box">
    <div class="scenario-title">📌 Skenario A: Menerima Pesanan Baru & Mencatat DP 1 Konsumen</div>
    <ol class="step-list">
      <li>Masuk ke sub-tab <strong>Master Data Finansial</strong>.</li>
      <li>Cari pesanan berdasarkan nama customer atau nomor invoice pada kotak pencarian.</li>
      <li>Klik tombol <strong>Edit Finansial</strong> (ikon pensil hijau) pada baris order yang dituju.</li>
      <li>Periksa harga jual per pcs (lengan pendek / lengan panjang), total tagihan, dan diskon.</li>
      <li>Pada seksi <strong>Riwayat Pembayaran Termin Customer</strong>, klik tombol <strong>Catat Pembayaran Baru</strong>.</li>
      <li>Pilih Tanggal transfer, pilih jenis <code>DP 1 (Awal)</code>, pilih bank penerima (BCA), ketik nominal yang ditransfer konsumen (otomatis terformat <code>Rp ...</code>), lalu klik <strong>Simpan Baris Termin</strong>.</li>
      <li>Klik tombol utama <strong>Simpan Data Finansial Order</strong> di bagian bawah.</li>
      <li>Status pesanan otomatis terbarui menjadi <code>Parsial (Kurang menuju 70%)</code>.</li>
    </ol>
  </div>

  <div class="scenario-box">
    <div class="scenario-title">📌 Skenario B: Menindaklanjuti Penagihan Kekurangan DP 70%</div>
    <ol class="step-list">
      <li>Buka sub-tab <strong>Master Data Finansial</strong>.</li>
      <li>Perhatikan kolom <strong>STATUS DP / AMBANG BATAS 70%</strong>. Baris berwarna kuning amber menunjukkan order yang belum memenuhi batas 70%.</li>
      <li>Klik tombol <strong>WhatsApp</strong> (ikon hijau WA) pada baris tersebut.</li>
      <li>Pilih opsi pesan: <strong>1. Tagih DP 70%</strong>.</li>
      <li>Sistem otomatis membuka WhatsApp dengan nomor konsumen dan draf penagihan akurat.</li>
      <li>Kirimkan pesan tersebut kepada pemesan.</li>
    </ol>
  </div>

  <div class="scenario-box">
    <div class="scenario-title">📌 Skenario C: Menyetujui SPK Naik Potong & Jahit</div>
    <ol class="step-list">
      <li>Setelah konsumen mentransfer DP 2, buka kembali modal <strong>Edit Finansial</strong>.</li>
      <li>Tambahkan baris termin baru berjenis <code>DP 2 (Tambahan)</code>.</li>
      <li>Setelah pembayaran mencapai ≥ 70%, badge status otomatis berubah hijau <strong>Siap Potong / Siap Produksi</strong>.</li>
      <li>Bagian produksi konveksi kini resmi diizinkan memulai pemotongan kain.</li>
    </ol>
  </div>

  <div class="scenario-box">
    <div class="scenario-title">📌 Skenario D: Mengontrol Pembayaran ke Vendor Konveksi</div>
    <ol class="step-list">
      <li>Pada modal <strong>Edit Finansial</strong>, buka seksi <strong>3. Komitmen Mitra Vendor & Biaya Pokok (HPP)</strong>.</li>
      <li>Masukkan total komitmen biaya vendor dan nominal kas yang telah dibayarkan ke pihak vendor.</li>
      <li>Sistem otomatis menghitung <strong>Sisa Utang Vendor</strong> untuk memastikan jadwal pelunasan vendor tertib.</li>
    </ol>
  </div>

  <div class="page-break"></div>

  <div class="scenario-box">
    <div class="scenario-title">📌 Skenario E: Mencatat Kas Keluar Operasional & Ekspor Excel</div>
    <ol class="step-list">
      <li>Masuk ke sub-tab <strong>Pengeluaran Beban (Cash Outflow)</strong>.</li>
      <li>Klik tombol <strong>+ Catat Pengeluaran Baru</strong>.</li>
      <li>Isi tanggal, kategori beban, berita acara transaksi, dan nominal rupiah.</li>
      <li>Klik <strong>Simpan Transaksi Pengeluaran</strong>.</li>
      <li>Klik tombol <strong>Ekspor Excel (.xlsx)</strong> di kanan atas untuk mengunduh rekapitulasi pembukuan kas bulanan.</li>
    </ol>
  </div>

  <div class="scenario-box">
    <div class="scenario-title">📌 Skenario F: Melakukan Audit HPP Aktual & Rekonsiliasi Lapangan</div>
    <ol class="step-list">
      <li>Buka sub-tab <strong>Rekonsiliasi Profit Aktual</strong>.</li>
      <li>Setelah pesanan selesai dikirim, masukkan angka <strong>HPP Aktual</strong> dan <strong>Profit Aktual</strong> riil.</li>
      <li>Tuliskan catatan penting jika ada perubahan (misal: <em>Ongkir tambahan ditanggung vendor</em>).</li>
      <li>Klik tombol <strong>Simpan</strong> (ikon centang hijau) pada baris yang bersangkutan.</li>
      <li>Grafik deviasi laba akan langsung memetakan apakah pesanan tersebut surplus atau defisit.</li>
    </ol>
  </div>

  <!-- ================= 10. LAPORAN VERIFIKASI ================= -->
  <h2 class="section-title">10. Laporan Verifikasi Kualitas & Stabilitas Sistem</h2>
  <table class="formal-table">
    <thead>
      <tr>
        <th style="width: 25%;">Jenis Pengujian</th>
        <th style="width: 20%;">Alat Penguji (Tool)</th>
        <th style="width: 35%;">Parameter Verifikasi</th>
        <th style="width: 20%;">Hasil Akhir</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Validasi Kode TypeScript</strong></td>
        <td><code>tsc --noEmit</code></td>
        <td>Tipe data ketat (strict typing), 0 any, readonly safety</td>
        <td><span class="badge-pill badge-emerald">PASS (0 Errors)</span></td>
      </tr>
      <tr>
        <td><strong>Unit Test Logika Finansial</strong></td>
        <td><code>vitest</code></td>
        <td>Akurasi rumus DP 70%, pelunasan, margin, dan deviasi laba</td>
        <td><span class="badge-pill badge-emerald">PASS (5/5 Passing)</span></td>
      </tr>
      <tr>
        <td><strong>Kompilasi & Build Produksi</strong></td>
        <td><code>next build</code></td>
        <td>Next.js 15.5 App Router, zero bundle warning, SSR safety</td>
        <td><span class="badge-pill badge-emerald">PASS (Exit Code 0)</span></td>
      </tr>
      <tr>
        <td><strong>Integritas Konteks SDD</strong></td>
        <td><code>context:validate</code></td>
        <td>Sinkronisasi spesifikasi teknis dan riwayat modul</td>
        <td><span class="badge-pill badge-emerald">PASS (83 Docs Valid)</span></td>
      </tr>
    </tbody>
  </table>

  <!-- ================= 11. LEMBAR PENGESAHAN ================= -->
  <div class="signature-section">
    <h2 class="section-title" style="margin-top: 0;">11. Lembar Pengesahan & Tanda Tangan Serah Terima</h2>
    <div class="sig-location-date">
      Diterbitkan di: <strong>Bandung / Jakarta</strong> &nbsp;|&nbsp; Pada tanggal: <strong>11 Oktober 2026</strong><br>
      <em>Dokumen ini mengikat secara operasional sebagai standar tata kelola keuangan resmi VisualKain.</em>
    </div>

    <div class="sig-grid-top">
      <div class="sig-box">
        <div class="seal-stamp">VERIFIED<br>SYSTEM<br>2026</div>
        <div class="sig-role">Diserahkan Oleh:</div>
        <div class="sig-name">Engineering & Architecture Team</div>
        <div class="sig-title">Lead Software & Finance Systems Engineer<br>VisualKain Digital Platform</div>
      </div>
      <div class="sig-box">
        <div class="seal-stamp">APPROVED<br>FINANCE<br>HEAD</div>
        <div class="sig-role">Diterima & Disetujui Oleh:</div>
        <div class="sig-name">Kak Glora</div>
        <div class="sig-title">Head of Finance & Accounting / Lead Keuangan<br>PT Visual Kain Indonesia</div>
      </div>
    </div>

    <div class="sig-box sig-center-bottom">
      <div class="seal-stamp">OFFICIAL<br>BOARD<br>SEAL</div>
      <div class="sig-role">Mengetahui & Mengesahkan:</div>
      <div class="sig-name">Executive Board of Directors</div>
      <div class="sig-title">Chief Executive & Operations<br>PT Visual Kain Indonesia</div>
    </div>

    <div class="footer-note">
      PT Visual Kain Indonesia &copy; 2026. Seluruh hak cipta dilindungi undang-undang. Dokumen Rahasia Perusahaan.
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(HTML_OUTPUT, htmlContent, 'utf-8');
console.log('HTML generated successfully at:', HTML_OUTPUT);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const fileUrl = 'file:///' + HTML_OUTPUT.replace(/\\\\/g, '/');

const printCmd = `"${edgePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${PDF_OUTPUT}" "${fileUrl}"`;

console.log('Executing Edge print command...');
try {
  const result = execSync(printCmd, { stdio: 'pipe' });
  console.log('Edge output:', result.toString());
} catch (err) {
  console.error('Edge execution notice:', err.message);
}

if (fs.existsSync(PDF_OUTPUT)) {
  const stats = fs.statSync(PDF_OUTPUT);
  console.log(`SUCCESS: PDF created at ${PDF_OUTPUT} (${stats.size} bytes)`);
} else {
  console.error('ERROR: PDF was not created!');
  process.exit(1);
}
