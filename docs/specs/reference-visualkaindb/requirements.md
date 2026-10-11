# Spesifikasi Persyaratan Sistem (Requirements Specification)
## VisualKain Database & Finance Management Revamp 2026

**Versi Dokumen:** 1.0  
**Status:** Draf Tinjauan Klien / Siap Implementasi  
**Metodologi:** Spec-Driven Development (SDD)  
**Target Sistem:** Next.js 14, TypeScript, Tailwind CSS, Firebase Firestore  

---

### 1. Ringkasan Eksekutif & Glosarium

Dokumen ini mendefinisikan persyaratan fungsional, logika akuntansi, dan antarmuka pengguna untuk pembaruan menyeluruh pada platform **VisualKain Management**. Pembaruan ini bertujuan menyelesaikan ambiguitas alur kas versus margin keuntungan, mendukung pencatatan pembayaran pelanggan bertahap (cicilan/parsial per invoice), merombak kartu ringkasan keuangan dan utang vendor global, menyelaraskan kategori pengeluaran kas, serta memodernisasi desain tabel, formulir penawaran, dan grafik analitik.

#### Glosarium Istilah Finansial:
* **Uang Masuk Parsial (Partial Inflow):** Pembayaran dari pelanggan yang diterima bertahap (DP, termin 1, termin 2, pelunasan) yang diakumulasikan per nomor invoice dan langsung diakui sebagai kas riil saat uang diterima.
* **Kantong Dana Pokok Vendor (Vendor Payable Escrow):** Porsi nilai invoice yang menjadi hak modal vendor/konveksi (HPP), yang dialokasikan khusus untuk membayar vendor dan tidak boleh dihitung sebagai profit VisualKain.
* **Saldo Kas VisualKain (Real Cash Balance):** Posisi kas riil di rekening bank VisualKain, dihitung dari seluruh uang masuk riil dikurangi seluruh uang keluar riil.
* **Profit Bersih VisualKain (Net Profit Margin):** Keuntungan bersih milik VisualKain (Harga Jual ke Customer dikurangi Modal Vendor dikurangi Biaya Operasional Spesifik Order).
* **Utang Vendor Global (Global Vendor Payable):** Akumulasi seluruh kewajiban pembayaran ke vendor yang masih belum dilunasi dari seluruh order aktif.
* **Piutang Pelanggan (Outstanding Receivable):** Selisih nilai tagihan invoice dikurangi seluruh akumulasi uang yang telah dibayarkan oleh pelanggan.

---

### 2. Kebutuhan Fungsional (RFC 2119 Acceptance Criteria)

#### 2.1 Modul Uang Masuk Bertahap & Akumulasi Parsial (Partial Payments)
* **REQ-1.1:** Sistem **SHALL** mendukung pencatatan pembayaran pelanggan secara parsial (cicilan/termin/DP) yang terikat langsung pada nomor invoice (`noInv`).
* **REQ-1.2:** **WHEN** pengguna menambahkan pembayaran baru (tanggal, nominal rupiah, metode/catatan, bukti bayar opsional), sistem **SHALL** mengkalkulasi ulang total akumulasi uang masuk secara real-time.
* **REQ-1.3:** **WHEN** total akumulasi uang masuk kurang dari total tagihan invoice, status pembayaran invoice **SHALL** berstatus `"Parsial / Belum Lunas"` dengan menampilkan sisa pelunasan.
* **REQ-1.4:** **WHEN** total akumulasi uang masuk sama dengan atau melebihi total tagihan, status pembayaran invoice **SHALL** otomatis berubah menjadi `"Lunas"`.
* **REQ-1.5:** Uang masuk parsial ini **SHALL** langsung menambah saldo kas masuk dashboard saat transaksi terjadi, tanpa harus menunggu status pesanan menjadi `"completed"` (Selesai).
* **REQ-1.6:** Sistem **SHALL** menyematkan **Badge Status Pembayaran Otomatis** pada tabel Data Customer, Invoice, dan Finance:
  - `[BELUM DP (0%)]` saat akumulasi pembayaran masih Rp 0.
  - `[DP 1 DITERIMA (Parsial)]` saat pembayaran masuk kurang dari ambang batas syarat produksi (DP 70%).
  - `[DP 2 DITERIMA (70% - SIAP PRODUKSI)]` saat pembayaran masuk telah memenuhi syarat DP 70%.
  - `[LUNAS TOTAL (100%)]` saat pembayaran mencapai 100%.
* **REQ-1.7:** Lembar cetak Invoice (`InvoicePreview`) **SHALL** menyertakan tabel **Riwayat Pembayaran Diterima (Payment History)** yang memuat rincian DP 1, DP 2, sisa kekurangan DP untuk naik produksi (sebagai acuan Follow-Up), dan sisa pelunasan akhir saat barang selesai.

#### 2.2 Modul Rekonsiliasi Saldo Kas vs Margin VisualKain
* **REQ-2.1:** Nilai pada kartu **Saldo VisualKain** **SHALL NOT** dihitung dari rumus lama `(Profit - Uang Keluar)`.
* **REQ-2.2:** Kartu **Saldo VisualKain** **SHALL** dihitung dengan rumus kas murni:  
  $$\text{Saldo Kas} = (\text{Saldo Awal Kas} + \text{Total Uang Masuk Riil}) - \text{Total Uang Keluar Riil}$$
* **REQ-2.3:** Sistem **SHALL** menyediakan fitur input `"Saldo Awal / Penyesuaian Kas VisualKain"` agar saldo sistem dapat disinkronkan secara presisi dengan saldo rekening bank riil.
* **REQ-2.4:** Pembayaran ke vendor (baik DP vendor maupun sisa pelunasan vendor) **SHALL** dibebankan dari alokasi kas pokok invoice (Kantong HPP Vendor) dan **SHALL NOT** memotong margin profit bersih yang menjadi hak pemilik.

#### 2.3 Modul Kartu Utang Vendor Global (Global Vendor Debt Card)
* **REQ-3.1:** Dashboard Finansial **SHALL** menampilkan kartu metrik baru: **Total Utang Vendor (Global)**.
* **REQ-3.2:** Nilai Total Utang Vendor **SHALL** dihitung dari akumulasi:  
  $$\sum (\text{Total HPP Vendor} - \text{Total DP/Pelunasan Vendor yang Sudah Dibayar})$$ untuk seluruh order yang belum lunas ke vendor.
* **REQ-3.3:** **WHEN** pengguna mengklik kartu Utang Vendor, sistem **SHALL** menampilkan rincian vendor beserta invoice yang belum lunas.

#### 2.4 Modul Transparansi Kartu (Audit Drilldown / Tracking Detail)
* **REQ-4.1:** Setiap kartu metrik utama (Omzet, Profit, Saldo Kas, Uang Masuk, Uang Keluar, Utang Vendor, Piutang) **SHALL** memiliki indikator tracking interaktif (ikon info `(?)` atau kartu dapat diklik).
* **REQ-4.2:** **WHEN** pengguna mengklik indikator tracking pada kartu, sistem **SHALL** memunculkan modal/drawer penjelasan rinci yang memuat:
  1. Rumus kalkulasi matematis yang digunakan.
  2. Daftar transaksi sumber data pembentuk angka tersebut.
  3. Tanggal pembaruan terakhir.

#### 2.5 Modul Revamp UI/UX Outstanding
* **REQ-5.1:** Tampilan panel **Outstanding** **SHALL** direvamp dari sekadar baris teks menjadi komponen analitik visual yang jelas dan terstruktur.
* **REQ-5.2:** Komponen Outstanding **SHALL** memisahkan secara tegas antara:
  - Total Nilai Proyek Berjalan.
  - Total DP / Uang Masuk yang Sudah di Tangan.
  - Sisa Piutang yang Masih Belum Diterima.
* **REQ-5.3:** Komponen **SHALL** menyertakan visual progress bar rasio penerimaan kas vs piutang tertahan.

#### 2.6 Modul Kategori Pengeluaran (Cash Outflow) & Pajak Nominal
* **REQ-6.1:** Pilihan kategori pada formulir Catat Pengeluaran **SHALL** diubah menjadi:
  1. `Gaji/Upah`
  2. `Operasional` *(menggantikan Perawatan Web/Sistem)*
  3. `Marketing dan Penjualan` *(baru)*
  4. `Logistik` *(menggantikan Transport/Ongkir)*
  5. `Keuangan` *(biaya admin bank, fee transfer, potongan merchant)*
  6. `Pajak` *(input angka nominal rupiah langsung, bukan persen)*
  7. `Biaya Lain`
* **REQ-6.2:** Input kategori Pajak **SHALL** menerima nominal angka rupiah langsung tanpa kalkulasi persentase otomatis.

#### 2.7 Modul Penghapusan Fitur Profit Aktual (Manual)
* **REQ-7.1:** Sub-menu navigasi `"Profit Aktual (Manual)"` (`/finance/manual`) **SHALL** dihapus dari dropdown header.
* **REQ-7.2:** Kolom `"Keuntungan Nominal / Profit Aktual"` pada tabel utama Financial Dashboard **SHALL** dihapus.
* **REQ-7.3:** Seluruh ketergantungan logika kode pada `profitAktual` **SHALL** dibersihkan untuk menjaga kejelasan arsitektur.

#### 2.8 Modul Revamp UI Penawaran Harga & Pengajuan Kerjasama
* **REQ-8.1:** Layout formulir `Daftar Barang / Jasa` pada halaman Penawaran Harga **SHALL** diperbaiki sehingga teks header kolom tidak mengalami text-wrap vertikal (`N O`, `D E S K R I P S I`).
* **REQ-8.2:** Kotak rincian `Subtotal / Diskon / PPN / Total` pada lembar cetak penawaran harga **SHALL** dihilangkan atau dijadikan opsional sesuai instruksi coretan klien.
* **REQ-8.3:** Lembar pratinjau dokumen surat kerjasama **SHALL** mempertahankan tata letak kop surat resmi VisualKain dan format cetak A4 yang presisi.

#### 2.9 Modul Optimalisasi Format Gambar (WebP)
* **REQ-9.1:** Komponen pengunggah gambar (`AccImageUpload.tsx`) **SHALL** mengonversi seluruh gambar yang diunggah pelanggan/tim menjadi format `.webp` menggunakan Canvas API sebelum dikirim ke server Cloudinary.
* **REQ-9.2:** Kualitas kompresi WebP **SHALL** diatur pada rasio optimal (quality 0.85) dengan batas dimensi proporsional maksimum 1600px.

#### 2.10 Modul Pembaruan Rekening Bank / ATM
* **REQ-10.1:** Rincian pembayaran pada dokumen invoice cetak (`InvoicePreview.tsx`) **SHALL** diperbarui dengan nomor rekening / nomor ATM baru yang dikonfirmasikan oleh klien.

#### 2.11 Modul Tipografi Data Tabel
* **REQ-11.1:** Seluruh font pada sel tabel data (`.data-table`) **SHALL** diganti dengan tipografi tabular profesional (`font-mono` dengan `tabular-nums` untuk angka finansial, dan font sans-serif modern berbobot proporsional untuk nama dan deskripsi).

#### 2.12 Modul Penyesuaian Color System Tema
* **REQ-12.1:** Variabel CSS `--bg-primary` (background abu-abu muda) **SHALL** digelapkan sedikit (misal dari `#f1f5f9` ke `#e6ecf2` / `#e2e8f0`).
* **REQ-12.2:** Variabel CSS `--bg-secondary` / `--bg-card` (background kartu putih) **SHALL** disesuaikan menjadi off-white yang lebih teduh (misal `#f8fafc` atau `#f9fbfd`) dengan kontras border yang lebih tegas.

#### 2.13 Modul Modernisasi Grafik Analitik (Klinik Style)
* **REQ-13.1:** Seluruh komponen grafik pada Beranda (`AnalyticsCharts.tsx` dan `MiniAnalytics.tsx`) **SHALL** dimodernisasi mengadopsi standar visual project klinik (`klinik-cikidang-medika`):
  - AreaChart dengan gradient fill halus untuk tren finansial.
  - Donut Chart dengan label angka metrik total di bagian tengah lingkaran.
  - Micro-proportion progress bar horizontal untuk peringkat customer dan bahan.
  - Dark frosted-glass tooltip (`bg-slate-900/95 backdrop-blur-md text-white rounded-2xl`).
  - Badge duotone dan dot indicator status.
