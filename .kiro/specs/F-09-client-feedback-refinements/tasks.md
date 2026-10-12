# Implementation Tasks — F-09: Client Feedback Refinements & Quality Bugfix Spec

- [x] **1. Hapus Baris Keuntungan Real (Manual) pada Laporan Finansial**
  - Hapus baris `order.profitAktual != null` "Keuntungan Real (Manual)" pada `src/components/finance/FinanceReportPaper.tsx`.
  - _Requirements: US-9.1_

- [x] **2. Aksi Edit pada Riwayat Pembayaran Termin Customer**
  - Tambahkan tombol Edit (Pencil) di kolom Aksi tabel cicilan customer pada `src/components/finance/EditFinanceModal.tsx`.
  - Implementasikan handler pemilihan baris pembayaran untuk di-edit ke form input termin dan simpan perubahan ke `pembayaranList`.
  - _Requirements: US-9.2_

- [x] **3. Perbaikan Sinkronisasi Filter Periode Bulan & Tahun**
  - Sinkronkan `CashOutflowSection.tsx` dan `CashInflowSection.tsx` agar filter periode dari top header `page.tsx` langsung mengontrol dataset dan visualisasi grafik harian tanpa kebocoran data bulan lain.
  - _Requirements: US-9.3_

- [x] **4. Transparansi & Data Dinamis Alokasi Hak Dana (Escrow)**
  - Hitung proporsi dinamis Hak Pokok Vendor (HPP) vs Margin Bersih dari order aktif di `page.tsx` menggunakan `calculateEscrowAllocation`.
  - Teruskan data dinamis ke `<AnalyticsCharts donutData={...} />`.
  - Tambahkan keterangan penjelasan sumber data formula pada kartu grafik alokasi escrow di `AnalyticsCharts.tsx`.
  - _Requirements: US-9.4_

- [x] **5. Kolom Pencarian Master Finansial Mobile & Desktop**
  - Tambahkan search bar input box yang selalu terlihat di standard header toolbar `MasterFinanceTable.tsx`.
  - Sambungkan ke state `searchQuery` yang memfilter No Inv, Customer, dan Project secara instan.
  - _Requirements: US-9.5_

- [x] **6. Paginasi Kartu Mobile & Tabel Master Finansial (Page 1/2/3)**
  - Implementasikan client-side pagination (10 order per halaman) pada `MasterFinanceTable.tsx`.
  - Render kontrol paginasi (`Prev`, tombol angka halaman `1`, `2`, `3...`, `Next`) di bagian bawah kartu mobile dan tabel.
  - Reset `currentPage` ke 1 jika filter atau pencarian berubah.
  - _Requirements: US-9.6_

- [x] **7. Verifikasi Kualitas & Quality Verification Gate**
  - Jalankan `npx tsc --noEmit` untuk memastikan nol error TypeScript.
  - Jalankan `npm test` untuk memastikan test suite lulus 100%.
  - Jalankan `npm run build` untuk memverifikasi Next.js production build.
  - _Requirements: US-9.1, US-9.2, US-9.3, US-9.4, US-9.5, US-9.6_
