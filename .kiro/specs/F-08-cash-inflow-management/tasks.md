# Implementation Tasks — F-08: Cash Inflow Management & Payment Tracking (Dana Masuk)

- [x] **1. Type Contracts & Dual-Source Data Aggregator Helper**
  - Definisikan tipe `CashInflowEntry` dan perbarui union `FinanceSubTab` dengan menambahkan `'cashin'`.
  - Buat helper aggregator untuk mengekstrak riwayat pembayaran order konsumen (`order.pembayaranList`) dan transaksi kas masuk (`kas.tipe === 'masuk'`) serta mengurutkannya descending berdasarkan tanggal.
  - _Requirements: US-8.1_

- [x] **2. Navigasi Sidebar & Mobile Bottom Nav**
  - Tambahkan tab `cashin` ("Cash Inflow") pada `Sidebar.tsx` desktop.
  - Tambahkan tab `cashin` ("Dana Masuk") pada `MobileBottomNav.tsx` sehingga 4 tombol di mobile tersusun simetris dan ergonomis.
  - Tambahkan judul dan subtitle view di `page.tsx`.
  - _Requirements: US-8.2_

- [x] **3. Implementasi 4 KPI Summary Cards di CashInflowSection**
  - Buat komponen `src/components/finance/CashInflowSection.tsx`.
  - Hitung dan render 4 KPI Cards: (1) Total Dana Masuk, (2) Pembayaran Order Konsumen, (3) Kas Masuk Non-Order, (4) Rata-rata per Transaksi.
  - _Requirements: US-8.3_

- [x] **4. Visualisasi Analitik Tren Harian & Komposisi Pembayaran**
  - Implementasikan Bar Chart Recharts untuk tren kas masuk harian.
  - Implementasikan Donut Chart Recharts untuk proporsi jenis pembayaran (DP vs Termin vs Pelunasan vs Kas Masuk Lain).
  - _Requirements: US-8.4_

- [x] **5. Toolbar Pencarian & Filter Reaktif**
  - Tambahkan live search bar (No Inv, Customer, Keterangan).
  - Tambahkan CustomSelect filter jenis pembayaran.
  - Hubungkan filter periode bulan dan tahun.
  - Tampilkan counter pill data & nominal terfilter.
  - _Requirements: US-8.5_

- [x] **6. Tampilan Mutasi Desktop & Mobile 2-Grid Ergonomis**
  - Desktop view (>= 768px): Tabel spreadsheet dengan kolom tanggal, no invoice, customer, jenis badge, keterangan, dan nominal emerald.
  - Mobile view (< 768px): Layout 2-grid card ergonomis dengan badge anti-overflow dan tipografi rapi sesuai `/antislop-layoutmobile` dan `/antislop-ui`.
  - _Requirements: US-8.6_

- [x] **7. Integrasi Aksi Interaktif (Inspeksi Order & Hapus Kas Manual)**
  - Tombol `Detail` pada item order membuka `OrderInspectionDrawer`.
  - Tombol `Hapus` pada item kas manual memanggil `deleteKas(id)` dengan feedback toast.
  - Tombol `+ Catat Kas Masuk` membuka `AddIncomeModal`.
  - _Requirements: US-8.7_

- [x] **8. Ekspor Excel Spreadsheet (.xlsx)**
  - Implementasikan fungsi ekspor mutasi dana masuk yang tersaring ke format spreadsheet `.xlsx` menggunakan library `xlsx`.
  - _Requirements: US-8.8_

- [x] **9. Integrasi ke `page.tsx` & Quality Verification Gate**
  - Hubungkan `CashInflowSection` ke dalam conditional tab render `page.tsx`.
  - Jalankan verifikasi statis `npx tsc --noEmit`.
  - Jalankan unit tests `npm test`.
  - Jalankan build `npm run build` untuk memastikan nol regresi dan performa optimal.
  - _Requirements: US-8.1, US-8.2, US-8.3, US-8.4, US-8.5, US-8.6, US-8.7, US-8.8_
