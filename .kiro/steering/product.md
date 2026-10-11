# Product Steering — VisualKain Financial Data & Analytics 2026

## 1. Product Vision & Identity
`visualkain-financial-analytics` adalah platform intelijen data keuangan, rekonsiliasi kas bank, dan analitik eksekutif VisualKain 2026. Fokus eksklusif pada:
- **Arus Kas Riil (Real Cash Flow)**: `Saldo Kas Riil = (Saldo Awal + Total Kas Masuk) - Total Kas Keluar`.
- **Alokasi Kantong Pokok Vendor (HPP / Escrow) vs Margin VisualKain**: Memastikan dana pokok untuk melunasi vendor dialokasikan proporsional dari pembayaran customer (DP / termin) tanpa memotong laba operasional bersih.
- **Monitoring Piutang Customer & Utang Vendor**: Pelacakan komitmen pembayaran berjalan dan sisa hak tagih secara transparan.
- **Bebas dari Modul Produksi**: Tidak mencakup pelacakan produksi, inventory pabrik, atau operasional bengkel kain. Hanya data finansial, rekonsiliasi, dan analitik.

## 2. Core Personas
- **Executive / Owner**: Memantau kesehatan arus kas harian, margin bersih aktual, runway likuiditas, dan dividen.
- **Finance Officer / Kasir**: Melakukan input rekonsiliasi kas awal, pencatatan termin pembayaran pelanggan, pengeluaran kas operasional, dan ekspor spreadsheet.

## 3. Financial Principles & Invariants
- **Non-Regression Akuntansi**: Pembayaran ke vendor tidak boleh dianggap memotong margin profit kotor. Pembayaran vendor berasal dari alokasi HPP customer.
- **Presisi Tabular**: Seluruh angka keuangan ditampilkan dengan font monospaced tabular (`JetBrains Mono`), pemisah ribuan titik Indonesia, dan prefix `Rp`.
- **Zero AI-Slop**: Data metrik dan grafik selalu berdasar formula matematika akuntansi deterministik yang teruji via Vitest.
