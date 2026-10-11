# Rencana Tugas & Prioritas Eksekusi (Implementation Tasks & Roadmap)
## VisualKain Database & Finance Management Revamp 2026

**Metodologi:** Spec-Driven Development (SDD)  
**Aturan:** Setiap item tugas terpetakan ke nomor persyaratan (`_Requirements: REQ-X.Y_`).

---

### Fase 1: Fondasi Logika Finansial & Pembayaran Parsial (Prioritas 1 - Kritis)
*Fase ini menyelesaikan kebingungan perhitungan finansial dan membangun Single Source of Truth.*

- [ ] **Task 1.1: Pembaruan Tipe Data & Skema Pembayaran Parsial**
  - Mengupdate `src/types/index.ts` dengan interface `CustomerPayment` dan penambahan field pada `Order`.
  - Menghapus referensi `profitAktual` dan `hppAktual` dari tipe data order.
  - _Requirements: REQ-1.1, REQ-7.1, REQ-7.3_

- [ ] **Task 1.2: Refaktorisasi Perhitungan Finansial & Logika Saldo Kas**
  - Mengubah fungsi `computeFinance` dan `calculateTotals` pada `src/lib/finance.ts` dan `src/lib/calculations.ts`.
  - Mengimplementasikan rumus Saldo Kas Riil: `(Saldo Awal + Total Uang Masuk) - Total Uang Keluar`.
  - Menambahkan penghitungan real-time untuk akumulasi uang masuk cicilan/DP dan pemisahan jatah alokasi modal vendor.
  - _Requirements: REQ-1.2, REQ-1.5, REQ-2.1, REQ-2.2, REQ-2.4_

- [ ] **Task 1.3: Fitur Pencatatan Pembayaran Parsial, Badge Status, & Riwayat Invoice**
  - Menambahkan dialog/modal pencatatan cicilan (DP 1, DP 2, Pelunasan) berbasis invoice di halaman Data Customer (`src/app/database/page.tsx` & `src/app/order/[id]/page.tsx`).
  - Menyematkan **Badge Status Otomatis** (`[BELUM DP]`, `[DP 1 DITERIMA]`, `[DP 2 DITERIMA - SIAP PRODUKSI]`, `[LUNAS TOTAL]`) pada tabel data customer dan invoice.
  - Menghubungkan penyimpanan transaksi cicilan ke Firestore dan memperbarui status pelunasan invoice.
  - _Requirements: REQ-1.1, REQ-1.3, REQ-1.4, REQ-1.6, REQ-1.7_

- [ ] **Task 1.4: Fitur Input Saldo Awal / Penyesuaian Kas VisualKain**
  - Menambahkan hook dan modal input penyesuaian saldo kas awal di halaman Financial Dashboard.
  - _Requirements: REQ-2.3_

---

### Fase 2: Kategori Cash Outflow & Pembersihan Profit Aktual (Prioritas 2 - Tinggi)
*Fase ini menata aliran pengeluaran kas dan membuang fitur lama yang membingungkan.*

- [ ] **Task 2.1: Revamp Kategori Pengeluaran pada Cash Outflow**
  - Mengupdate array `KATEGORI_KELUAR` di `src/app/finance/cashout/page.tsx`:
    - Ganti `Perawatan Web/Sistem` -> `Operasional`.
    - Tambah `Marketing dan Penjualan`.
    - Ganti `Transport/Ongkir` -> `Logistik`.
    - Tambah `Keuangan`.
    - Ubah `Pajak` menjadi input nominal angka murni tanpa persen.
  - _Requirements: REQ-6.1, REQ-6.2_

- [ ] **Task 2.2: Penghapusan Menu & Fitur Profit Aktual (Manual)**
  - Menghapus sub-menu navigasi `Profit Aktual (Manual)` dari `src/lib/utils.ts` (`TAB_LIST`).
  - Menghapus kolom `Keuntungan Nominal` pada tabel utama `src/app/finance/page.tsx`.
  - Menghapus/mengarsipkan halaman `src/app/finance/manual/page.tsx`.
  - _Requirements: REQ-7.1, REQ-7.2, REQ-7.3_

---

### Fase 3: Revamp Kartu Metrik Dashboard & Outstanding (Prioritas 3 - Tinggi)
*Fase ini memperjelas informasi pada layar dashboard dan menambahkan transparansi angka.*

- [ ] **Task 3.1: Tambah Kartu Baru "Total Utang Vendor (Global)"**
  - Menambahkan kartu ringkasan utang vendor di `src/app/finance/page.tsx` yang menghitung sisa pembayaran ke seluruh vendor.
  - _Requirements: REQ-3.1, REQ-3.2_

- [ ] **Task 3.2: Implementasi Tracking Detail Angka pada Kartu (Audit Drilldown Popover/Modal)**
  - Menambahkan tombol info `(?)` / klik interaktif pada setiap kartu nominal di financial dashboard.
  - Menampilkan modal transparansi rumus dan rincian transaksi pembentuk angka.
  - _Requirements: REQ-4.1, REQ-4.2_

- [ ] **Task 3.3: Revamp Komponen Kartu Outstanding**
  - Mendesain ulang komponen Outstanding dengan indikator visual modern (split ratio nilai berjalan, DP di tangan, dan sisa piutang).
  - _Requirements: REQ-5.1, REQ-5.2, REQ-5.3_

---

### Fase 4: Revamp Penawaran, Kerjasama & Info Invoice (Prioritas 4 - Sedang)
*Fase ini merapikan dokumen legal dan komersial.*

- [x] **Task 4.1: Bugfix Layout Daftar Barang / Jasa pada Form Penawaran**
  - Memperbaiki CSS grid/tabel di `src/components/penawaran/PenawaranForm.tsx` agar tidak terjadi pembungkusan teks vertikal.
  - _Requirements: REQ-8.1_

- [x] **Task 4.2: Penyesuaian Lembar Cetak Penawaran & Surat Kerjasama**
  - Menghilangkan rincian subtotal/diskon/PPN pada preview cetak penawaran sesuai coretan klien di screenshot.
  - Menyelaraskan tampilan surat kerjasama `src/components/kerjasama/KerjasamaPreview.tsx`.
  - _Requirements: REQ-8.2, REQ-8.3_

- [x] **Task 4.3: Pembaruan Nomor Rekening / ATM pada Dokumen Invoice**
  - Memperbarui rincian bank dan nomor rekening penerima pada `src/components/invoice/InvoicePreview.tsx` dengan slot dinamis.
  - _Requirements: REQ-10.1_

- [x] **Task 4.4: Tabel Riwayat Pembayaran (Payment History) pada Lembar Invoice Cetak**
  - Menambahkan tabel riwayat pembayaran (DP 1, DP 2, pelunasan) di `src/components/invoice/InvoicePreview.tsx`.
  - Menampilkan highlight tebal sisa kekurangan DP untuk naik produksi (sebagai bahan FU ke customer) dan sisa pelunasan saat barang selesai.
  - _Requirements: REQ-1.7_

---

### Fase 5: Format Gambar WebP, Tipografi Tabel, & Color System (Prioritas 5 - Sedang)
*Fase ini mempercantik estetika sistem dan performa aset.*

- [x] **Task 5.1: Konversi Upload Gambar ke WebP**
  - Memperbarui `src/components/ui/AccImageUpload.tsx` agar fungsi kompresi Canvas menghasilkan format `image/webp`.
  - _Requirements: REQ-9.1, REQ-9.2_

- [x] **Task 5.2: Standardisasi Tipografi Data Tabel**
  - Mengupdate `.data-table` di `src/app/globals.css` menggunakan font tabular monospaced untuk angka nominal/invoice dan sans-serif bersih untuk teks.
  - _Requirements: REQ-11.1_

- [x] **Task 5.3: Penyesuaian Color System Tema**
  - Menyesuaikan variabel warna background di `src/app/globals.css` (`--bg-primary` menjadi abu-abu yang lebih berkontras dan `--bg-card` menjadi off-white teduh).
  - _Requirements: REQ-12.1, REQ-12.2_

---

### Fase 6: Modernisasi Grafik Beranda (Klinik Style) (Prioritas 6 - Visual Enhancement)
*Fase ini mempercantik Beranda mengadopsi standar Recharts dari project klinik.*

- [x] **Task 6.1: Instalasi & Konfigurasi Library Recharts**
  - Menginstal paket `recharts` dan Phosphor icons jika diperlukan untuk styling grafik modern.
  - _Requirements: REQ-13.1_

- [x] **Task 6.2: Refaktorisasi Grafik Analitik Beranda**
  - Merombak `AnalyticsCharts.tsx` dan `MiniAnalytics.tsx` menjadi format modern:
    - AreaChart Spline dengan gradient fill untuk kas & omzet.
    - Donut Chart dengan metrik total di tengah untuk distribusi kategori.
    - Micro-proportion progress bars untuk Top Customer dan Top Bahan.
    - Tooltip dark frosted glass bergaya modern.
  - _Requirements: REQ-13.1_

---

### Fase 7: Verifikasi Kualitas & Quality Gate
- [x] **Task 7.1: Validasi Kompilasi & Linting (`npm run build`)**
  - Memastikan tidak ada kesalahan tipe TypeScript atau linting error.
- [ ] **Task 7.2: Verifikasi Alur Finansial Menyeluruh (ON HOLD: Menunggu feedback istri klien)**
  - Melakukan simulasi input pembayaran parsial, penyesuaian kas, dan verifikasi rekonsiliasi saldo kas.
