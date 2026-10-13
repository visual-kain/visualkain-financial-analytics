# Implementation Tasks — F-09: Client Feedback Refinements & Quality Bugfix Spec

## Phase 1: Batch 1 Feedback (Completed & Verified)
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

- [x] **7. Verifikasi Kualitas Batch 1**
  - Jalankan `npx tsc --noEmit` untuk memastikan nol error TypeScript.
  - Jalankan `npm test` untuk memastikan test suite lulus 100%.
  - Jalankan `npm run build` untuk memverifikasi Next.js production build.
  - _Requirements: US-9.1, US-9.2, US-9.3, US-9.4, US-9.5, US-9.6_

---

## Phase 2: Batch 2 Feedback & Architectural Refinements (Specs Defined - Awaiting Alignment)

- [x] **8. Sinkronisasi Mutasi DP Dua Arah (Firestore SSOT Mapping & Reactive Table)**
  - Ubah fungsi `updateOrderFinance` di `useFirebaseFinance.ts` agar memetakan `pembayaranList` ke field Firestore `riwayatPembayaran` format SSOT (`{ jumlah, tanggal, catatan, jenis }`).
  - Hitung ulang dan simpan `totalUangMasukCustomer`, `dpNominal`, dan `statusPembayaran` ke dokumen Firestore.
  - Pastikan listener `onSnapshot` tidak meng-overwrite state lokal dengan data lama setelah penghapusan/edit termin.
  - _Requirements: US-9.7_

- [x] **9. Transisi Modal Edit & Tambah Kas ke Dedicated Page**
  - Buat Dedicated Pageview / rute `/orders/[id]/edit` untuk edit finansial order yang terisolasi dari modal dialog.
  - Sediakan breadcrumb yang aman, tombol Simpan tegas, dan dirty-form guard (peringatan jika keluar tanpa simpan) untuk mencegah data terhapus/hilang secara tidak sengaja.
  - Pastikan tombol edit dari tabel (termasuk mode fullscreen expand) langsung membuka dedicated pageview tanpa kendala layer z-index.
  - _Requirements: US-9.8_

- [x] **10. Dedicated View & Rincian Detail Transaksi Kas Masuk**
  - Bangun rincian transaksi kas masuk di `MetricDetailDrawer.tsx` / dedicated view untuk melengkapi mutasi kas masuk konsumen (`+Rp 121.047.500`).
  - Agregasi seluruh cicilan konsumen (No Inv, Customer, Project, Nominal, Kategori DP/Termin/Pelunasan, Rekening) dan mutasi kas masuk langsung.
  - Sediakan live search, filter jenis pemasukan, dan format kartu mobile yang tidak sempit.
  - _Requirements: US-9.9_

- [x] **11. Kartu Alokasi Pembayaran & Threshold 70% Produksi (VisualKainDB Standard)**
  - Rancang kartu visual alokasi pembayaran order bertahap pada form input kas masuk / pemilihan order:
    * Total Invoice.
    * Akumulasi Terbayar (Nominal & %).
    * Target 70% Produksi Vendor.
    * Nominal Kekurangan Menuju 70% (dengan visual alert kuning jika belum memenuhi syarat potong/jahit vendor, hijau jika sudah siap).
    * Sisa Pelunasan Akhir (30%).
  - _Requirements: US-9.10_

- [x] **12. Redesain Kartu Rincian Transaksi Pembentuk (Tanpa Profit Aktual)**
  - Lengkapi kartu order pada `MetricDetailDrawer.tsx`: No Inv, Customer, Project, Tanggal Order, Revenue, HPP Vendor, Biaya Operasional Order, Net Profit, Margin %, Status Order, dan Nama Vendor.
  - Pastikan kolom "Profit Aktual" sama sekali TIDAK disertakan sesuai instruksi klien.
  - Terapkan layout 2-kolom metadata ringkas yang proporsional pada mobile screen tanpa horizontal overflow.
  - _Requirements: US-9.11_

- [x] **13. Quality Verification Gate Phase 2**
  - Verifikasi TypeScript `npx tsc --noEmit`.
  - Verifikasi Unit Test `npm test`.
  - Verifikasi Production Build `npm run build`.
  - _Requirements: US-9.7, US-9.8, US-9.9, US-9.10, US-9.11_

---

## Phase 3: Batch 3 Direct Feedback & Core Polish (Completed & Verified)

- [x] **14. Pembersihan Seluruh Badge Navigasi Sidebar**
  - Hapus seluruh elemen badge pill teks (`Master`, `Pemasukan`, `Beban`, `Ranking`, `Dev`) pada `src/components/layout/Sidebar.tsx`.
  - Bersihkan tipe data dan array `tabs` agar tampilan menu menjadi minimalis, lega, dan elegan.
  - _Requirements: US-9.12_

- [x] **15. Penyederhanaan Visualisasi Grafik Dashboard Finansial**
  - Ganti Donut Chart "Alokasi Hak Dana (Escrow)" pada `src/components/analytics/AnalyticsCharts.tsx` dengan kartu komparasi visual arus kas riil yang mudah dipahami eksekutif.
  - Tampilkan komparasi total kas masuk vs total beban kas keluar periode berjalan, net cash flow surplus/defisit, dan saldo kas bank tersisa.
  - _Requirements: US-9.13_

- [x] **16. Audit & Fix Tombol Follow-Up WhatsApp & Solid Sticky Header Table**
  - Perbaiki kondisi `MasterFinanceTable.tsx` agar tombol "Tagih WA" tidak hilang otomatis ketika DP mencapai $\ge 70\%$.
  - Jadikan tombol WA adaptif: Tagih DP 70% (jika DP < 70%), Tagih Pelunasan (jika DP 70-99%), Info WA (jika 100%).
  - Sambungkan tombol langsung ke URL `https://wa.me/` dengan nomor customer terformat dan pesan otomatis.
  - Hadirkan tombol aksi WA juga pada tampilan kartu mobile order di `MasterFinanceTable.tsx`.
  - Hapus background transparan `bg-slate-100/70` pada sticky header tabel menjadi warna solid `bg-slate-100` / `bg-white` untuk menghilangkan bug teks saling bertumpuk saat scroll horizontal.
  - _Requirements: US-9.14_

- [x] **17. Sinkronisasi Dinamis Master Mitra Vendor & Form Pre-Population**
  - Ambil dan agregasikan seluruh daftar vendor aktif secara dinamis dari koleksi Firestore `vendors` dan data `orders` (termasuk Vendor Wisnu, LAJUWARNA, dll.).
  - Teruskan daftar vendor lengkap ke form edit finansial order.
  - Inisialisasi input vendor form dari nilai aktual `order.vendorName`.
  - Simpan field `vendorName` dan `vendorId` terpilih ke dokumen Firestore saat submit.
  - _Requirements: US-9.15_

- [x] **18. Eliminasi Total Modal ke Dedicated Full-Pages**
  - Bangun rute Next.js dedicated pageview:
    * `/orders/[id]/edit`: Form edit finansial order mandiri.
    * `/cash-in/new`: Form pencatatan kas masuk & DP mandiri.
    * `/cash-out/new`: Form pengeluaran kas operasional & bayar vendor mandiri.
  - Lengkapi dengan header breadcrumb, sticky action bar, dan perlindungan *dirty-form guard*.
  - _Requirements: US-9.16_

- [x] **19. Quality Verification Gate Phase 3**
  - Verifikasi TypeScript `npx tsc --noEmit`.
  - Verifikasi Unit Test Vitest `npm test`.
  - Verifikasi Next.js Production Build `npm run build`.
  - _Requirements: US-9.12, US-9.13, US-9.14, US-9.15, US-9.16_

---

## Phase 4: Batch 4 Print, Export, Chart Revamp, Filter Audit & Date Clarity (Specs Implemented & Verified)

- [x] **20. Pemulihan Header & Background Hitam Tabel saat Print**
  - Terapkan `print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important;` pada seluruh elemen cetak di `src/app/globals.css`.
  - Kunci warna background `.invoice-items th` ke `#0f172a` solid dengan border kontras agar tidak pudar atau hilang saat dicetak ke PDF/kertas.
  - _Requirements: US-9.17_

- [x] **21. Penamaan File Export & Print Otomatis dan Kontekstual**
  - Implementasikan manipulasi dinamis `document.title` sebelum memicu `window.print()` pada invoice sehingga file PDF default bernama `[NO_INV] - [NAMA_PROJECT].pdf` (misal: `VK260039 - Seragam PDL Himpunan.pdf`).
  - Sesuaikan nama file ekspor Excel Master Finansial, Cash Inflow, dan Cash Outflow agar menyertakan periode aktif (contoh: `VisualKain_Master_Finance_Oktober_2026.xlsx`).
  - _Requirements: US-9.18_

- [x] **22. Pembatasan Cetak Single-Page Presisi (1 Halaman A4)**
  - Ganti aturan cetak `body * { visibility: hidden; }` di `src/app/globals.css` dengan `display: none !important;` pada elemen di luar kontainer cetak untuk menghilangkan layout flow vertikal ribuan pixel.
  - Batasi `#financeReportPaper` dengan `max-height: 282mm`, `page-break-inside: avoid;`, dan margin cetak ringkas agar pas dalam 1 lembar halaman A4 tanpa menghasilkan 4 s.d. 8 halaman kosong.
  - _Requirements: US-9.19_

- [x] **23. Revamp Grafik Komposisi Pemasukan (Perbandingan Termin Pembayaran)**
  - Ganti Donut Chart "Komposisi Jenis Pemasukan" pada `src/components/finance/CashInflowSection.tsx` yang 97.6% monoton menjadi grafik **Komposisi Perbandingan Termin Pembayaran Konsumen**:
    * DP 1 Booking / Uang Muka Awal (Teal)
    * DP 2 Termin 70% Syarat Mulai Produksi (Amber)
    * Pelunasan Akhir 30% Sebelum Kirim (Emerald)
  - Tampilkan nominal rupiah tabular dan persentase yang jelas guna memantau kesiapan pesanan masuk lini produksi konveksi.
  - _Requirements: US-9.20_

- [x] **24. Audit & Penyelarasan Menyeluruh Seluruh Filter & Search**
  - Pastikan `CashOutflowSection.tsx` memfilter secara ketat `item.tipe === 'keluar'`.
  - Hubungkan `searchQuery` pada `MetricDetailDrawer.tsx` agar memfilter daftar transaksi kas riil saat melihat rincian saldo kas.
  - Tambahkan live search bar mitra vendor pada `VendorPerformanceSection.tsx`.
  - Pastikan filter periode bulan & tahun pada header global sinkron dengan toolbar lokal.
  - _Requirements: US-9.21_

- [x] **25. Standarisasi Format Tanggal Anti-Ambiguitas & Header Rentang Waktu**
  - Buat helper `formatDateTick` di `src/lib/utils.ts` untuk memformat tanggal sumbu X menjadi `15 Sep`, `23 Sep`, `02 Okt` (menghilangkan format membingungkan `09-15`).
  - Tambahkan badge/header rentang tanggal yang eksplisit (misal: *"Rentang: 15 Sep 2026 – 12 Okt 2026"*) pada seluruh grafik harian di `CashOutflowSection`, `CashInflowSection`, dan `AnalyticsCharts`.
  - Tampilkan tanggal formal lengkap Indonesia pada tooltip chart.
  - _Requirements: US-9.22_

- [x] **26. Quality Verification Gate Phase 4**
  - Verifikasi TypeScript `npx tsc --noEmit`.
  - Verifikasi Unit Test Vitest `npm test`.
  - Verifikasi Next.js Production Build `npm run build`.
  - _Requirements: US-9.17, US-9.18, US-9.19, US-9.20, US-9.21, US-9.22_

---

## Phase 5: Batch 5 Feedback (Escrow Removal, Filter Cleanup, Fluid Full-Width, Dedicated DP Page, Indonesian Copywriting, Inzta ExcelJS)

- [x] **27. Eliminasi Total Escrow Liquidity Bar & Banner Defisit Sederhana**
  - Hapus komponen `<EscrowLiquidityBar />` dari `src/app/page.tsx` sehingga dashboard langsung menyajikan KPI cards esensial.
  - Tambahkan banner status 1-baris minimalis jika saldo kas bank berada dalam posisi defisit (negatif) tanpa bar persentase yang membingungkan.
  - Hapus import dan helper yang sudah tidak dipakai.
  - _Requirements: US-9.23_

- [x] **28. Perbaikan & Simplifikasi Filter Status Utang Vendor**
  - Perbarui opsi dropdown filter vendor di `src/components/finance/MasterFinanceTable.tsx` menjadi 3 opsi bersih:
    * `Semua Status Vendor` (`'all'`)
    * `Hanya Utang Vendor` (`'has_debt'`)
    * `Vendor Lunas` (`'settled'`)
  - Hilangkan label duplikat `"Ada Sisa Utang Vendor [Utang]"` yang membingungkan kasir.
  - _Requirements: US-9.24_

- [x] **29. Fluid Full-Width Desktop Layout Container & Proteksi Mobile**
  - Ubah kontainer `mx-auto max-w-7xl` di `src/app/page.tsx` menjadi `w-full max-w-[1920px] mx-auto` agar mengisi layar monitor desktop PC besar tanpa ada ruang kosong lebar di kiri dan kanan.
  - Pastikan padding mobile (`px-3.5`) dan tampilan kartu mobile tetap terjaga presisi dan anti-overflow horizontal sesuai standar `/antislop-layoutmobile`.
  - _Requirements: US-9.25_

- [x] **30. Dedicated Page Edit Finansial Order & Detail Riwayat DP (VisualKainDB Standard)**
  - Bangun rute mandiri `/orders/[id]/edit` mengadopsi standar VisualKainDB:
    * Rincian riwayat termin DP (DP 1 Booking, DP 2 70% Produksi, Pelunasan 30%) lengkap dengan tanggal, akun bank, catatan, serta tombol **Edit** dan **Hapus**.
    * Indikator threshold 70% syarat mutlak vendor mulai potong/jahit.
    * Form input biaya jual, diskon, biaya operasional, dan vendor terisi otomatis (*pre-populated*).
    * Sticky action bar di bawah dan *dirty form guard*.
  - _Requirements: US-9.26_

- [x] **31. Audit Menyeluruh Copywriting — Standarisasi Bahasa Indonesia Baku Formal**
  - Lakukan audit dan refactor seluruh teks antarmuka di `Sidebar.tsx`, `page.tsx`, `MasterFinanceTable.tsx`, `CashInflowSection.tsx`, `CashOutflowSection.tsx`, dan `MetricDetailDrawer.tsx`.
  - Ganti seluruh campuran istilah bahasa Inggris/asing menjadi istilah baku akuntansi konveksi:
    * `Financial Dashboard` $\rightarrow$ **Ringkasan Finansial**
    * `Cash Inflow` $\rightarrow$ **Arus Kas Masuk (Penerimaan Kas)**
    * `Cash Outflow` $\rightarrow$ **Arus Kas Keluar (Pengeluaran Kas)**
    * `Vendor Performance` $\rightarrow$ **Kinerja Mitra Vendor**
    * `Gross Jual` $\rightarrow$ **Nilai Tagihan Kotor (Subtotal)**
    * `OpEx` $\rightarrow$ **Biaya Operasional**
    * `Outstanding Customer` $\rightarrow$ **Sisa Piutang Pelanggan**
    * `Vendor Debt` $\rightarrow$ **Sisa Utang ke Vendor**
  - _Requirements: US-9.27_

- [x] **32. Mesin Ekspor Excel Eksekutif Mengadopsi Standar Inzta via ExcelJS**
  - Pasang dependensi `exceljs` atau buat modul `src/lib/excel-export.ts`.
  - Terapkan format ekspor spreadsheet profesional mengacu standar `inztamoto-erp-dashboard`:
    * Banner metadata header di bagian atas (Judul Laporan, Periode, Tanggal Unduh, Total Data).
    * Kartu ringkasan KPI (Total Transaksi, Total Qty, Total Omzet, Total Laba).
    * Header tabel warna Dark Teal VisualKain (`#0F766E`) dengan teks tebal putih kontras dan border tipis.
    * Format cell mata uang `"Rp" #,##0`, kuantitas `#,##0`, tanggal tengah, dan teks kiri.
    * Auto-width kolom agar teks tidak terpotong atau menghasilkan cell `###`.
    * Baris Total/Summary di bagian bawah dengan border ganda.
  - Hubungkan ke tombol ekspor di Master Finansial dan Arus Kas.
  - _Requirements: US-9.28_

- [x] **33. Quality Verification Gate Phase 5**
  - Jalankan `npx tsc --noEmit` untuk memastikan integritas tipe data TypeScript.
  - Jalankan `npm test` untuk memastikan test suite Vitest lulus 100%.
  - Jalankan `npm run build` untuk memvalidasi Next.js production build.
  - _Requirements: US-9.23, US-9.24, US-9.25, US-9.26, US-9.27, US-9.28_

---

## Phase 6: Batch 6 Feedback (Mobile Usability: Dedicated "Data Table" Tab & Scroll Elimination)

- [x] **34. Tambah Sub-Tab 'datatable' ke Kontrak Tipe & Navigasi Antarmuka**
  - Perluas union `FinanceSubTab` di `src/types/index.ts` dengan menyertakan opsi `'datatable'`.
  - Tambahkan tab ke-5 `"Data Table"` pada `src/components/layout/MobileBottomNav.tsx` dengan ikon `Table2` (atau `FileSpreadsheet`) berposisi tepat di samping tab Dashboard.
  - Tambahkan item menu `"Data Table"` pada `src/components/layout/Sidebar.tsx` untuk tampilan desktop.
  - Pastikan grid/flex 5 tab di mobile memiliki touch target $\ge 48\text{ px}$ dan label proporsional tanpa teks terpotong.
  - _Requirements: US-9.29_

- [x] **35. Pemindahan Render MasterFinanceTable ke Tab Dedicated & Pintasan Cepat Dashboard**
  - Di `src/app/page.tsx`, pindahkan blok komponen `<MasterFinanceTable rows={masterRows} ... />` dari kondisi `tab === 'dashboard'` ke kondisi baru `tab === 'datatable'`.
  - Pada `tab === 'dashboard'`, batasi konten hanya untuk Banner Defisit (jika ada), Banner Periode, `<FinanceStatsGrid />` (KPI cards), dan `<AnalyticsCharts />`.
  - Tambahkan tombol aksi/link pintasan cepat di bawah grafik dashboard: *"Buka Master Data Order (Data Table) →"* yang memicu `setTab('datatable')`.
  - Pastikan saat user mengklik tab "Data Table" di mobile maupun desktop, tabel/kartu pesanan langsung berada di paling atas layar tanpa perlu scrolling ribuan pixel.
  - _Requirements: US-9.29_

- [x] **36. Quality Verification Gate Phase 6**
  - Jalankan `npx tsc --noEmit` untuk memvalidasi kompatibilitas tipe union `FinanceSubTab` di seluruh aplikasi.
  - Jalankan `npm test` untuk memastikan test suite Vitest lulus 100%.
  - Jalankan `npm run build` untuk memvalidasi Next.js production build.
  - _Requirements: US-9.29_

---

## Phase 7: Batch 7 Feedback (Cutoff Oktober 2026 `>= 2026-10-01`, Dual-Source Cash Outflow Aggregator & Dashboard Berorientasi Klien)

- [x] **37. Penerapan Cutoff Oktober 2026 (`>= '2026-10-01'`), Perbaikan Pembacaan `pembayaranList` & Sinkronisasi `seed-data.ts`**
  - Tambahkan konstanta `FINANCE_START_DATE = '2026-10-01'` di `src/lib/constants.ts`.
  - Di `src/hooks/useFirebaseFinance.ts`, terapkan filter otomatis `tanggalOrder >= FINANCE_START_DATE` pada koleksi `orders` dan `tanggal >= FINANCE_START_DATE` pada koleksi `kas` (tanpa menghapus dokumen historis di Firestore `appkonveksi`).
  - Di `src/hooks/useFirebaseFinance.ts`, perbaiki pembacaan `pembayaranList` vs `riwayatPembayaran` agar ketika `riwayatPembayaran` bernilai `[]` (kosong) seperti pada `VK260041`, sistem tetap mengekstrak `pembayaranList` (4 termin = `Rp 982.000`).
  - Perbarui `initialOrdersData` (3 order Oktober 2026: `VK260041`, `VK260040`, `VK260039` dengan nilai autentik Firebase) dan `initialCashTransactions` (10 transaksi `kas` keluar Oktober 2026 senilai `Rp 1.779.000`) di `src/lib/seed-data.ts` serta `defaultOutflow` di `src/components/finance/CashOutflowSection.tsx`.
  - _Requirements: US-9.30_

- [x] **38. Ekspansi Kontrak Tipe `CashOutflowCategory` & `CashOutflowEntry` serta Kalkulator `buildCashOutflowEntries`**
  - Di `src/types/index.ts`, perluas `CashOutflowCategory` dengan menyertakan `'Pembayaran Vendor'`, `'Biaya Operasional Order'`, `'Perawatan Web/Sistem'`, `'Transport/Ongkir'`, dan `'Pajak/Retribusi'`.
  - Di `src/types/index.ts`, tambahkan interface `CashOutflowEntry` yang mendukung field `sumber: 'order' | 'manual'`, `noInv?: string`, `orderId?: string`, `vendorOrTargetName?: string`, `projectName?: string`, dan `rawOrder?: Order`.
  - Di `src/lib/financial-calculator.ts`, implementasikan fungsi `buildCashOutflowEntries(orders: Order[], transactions: CashTransaction[]): CashOutflowEntry[]` yang menggabungkan:
    1. Pembayaran HPP/DP/Pelunasan ke Vendor dari setiap order (`totalDibayarKeVendor > 0` atau `vendorPembayaranList`).
    2. Biaya Operasional Pesanan dari setiap order (`biayaOperasional > 0`).
    3. Pengeluaran Kas Langsung dari koleksi `kas` (`tipe === 'keluar'`).
  - Di `src/lib/financial-calculator.ts`, selaraskan `totalKasKeluar` pada `calculateFinancialSummary` agar mencakup total pengeluaran menyeluruh (`totalDibayarKeVendor + totalBiayaOperasionalOrders + bebanOperasionalKas`), sehingga kartu KPI `Dana Tersedia (Saldo Kas)` dan `Dana Keluar` 100% konsisten (`Dana Masuk - Dana Keluar = Saldo Kas`).
  - _Requirements: US-9.31, US-9.32_

- [x] **39. Pembaruan `FinanceStatsGrid.tsx` & `src/app/page.tsx` (6 Kartu Berorientasi Klien, Status Cover Hutang Vendor & Tombol Cepat Input)**
  - Di `src/components/analytics/FinanceStatsGrid.tsx`, susun ulang 6 Kartu KPI menjadi:
    1. **Dana Masuk** (`summary.totalKasMasuk` -> buka drawer `'cashin'`)
    2. **Dana Keluar** (`summary.totalKasKeluar` -> buka drawer `'cashout'`)
    3. **Dana Tersedia (Saldo Kas)** (`summary.saldoKasRiil` -> buka drawer `'saldo'`)
    4. **Sisa Customer (Piutang)** (`summary.totalPiutangCustomer` -> buka drawer `'outstanding'`)
    5. **Sisa Hutang ke Vendor** (`summary.totalUtangVendor` -> buka drawer `'vendor_debt'`)
    6. **Profit & Omzet (Realtime)** (`summary.totalProfitRealtime` & `summary.omzetTotal` -> buka drawer `'profit'`)
  - Di `src/components/analytics/FinanceStatsGrid.tsx`, tambahkan panel **"Status Cover Hutang Vendor & Sisa Dana"** yang menampilkan perbandingan langsung antara **Dana yang Ada (`saldoKasRiil`)** dan **Sisa Hutang ke Vendor (`totalUtangVendor`)**, status **`TERCOVER PENUH`** / **`BELUM TERCOVER PENUH`**, serta **Sisa Dana Bersih** (atau **Kekurangan Dana** beserta info **Sisa Tagihan Customer**).
  - Di `src/app/page.tsx`, tambahkan tombol cepat **`+ Dana Masuk`** (`/cash-in/new`) dan **`+ Dana Keluar`** (`/cash-out/new`) berdampingan di Header Dashboard, serta batasi opsi dropdown Bulan untuk tahun 2026 menjadi Oktober–Desember.
  - _Requirements: US-9.30, US-9.34_

- [x] **40. Pembaruan Komponen `CashOutflowSection.tsx`, `CashInflowSection.tsx`, `MetricDetailDrawer.tsx`, `/cash-out/new` & `excel-export.ts`**
  - Di `src/components/finance/CashOutflowSection.tsx`, tambahkan props `orders?: Order[]` dan `onSelectOrder?: (order: Order) => void`, lalu gunakan `buildCashOutflowEntries(orders, entries)` sebagai sumber data utama.
  - Tambahkan filter **Sumber Pengeluaran** (`Semua Sumber`, `Pengeluaran Order & Vendor`, `Kas Umum Non-Order`) dan lengkapi dropdown **Kategori Beban** serta warna donut chart (`Pembayaran Vendor`, `Biaya Operasional Order`, `Gaji/Upah`, `Perawatan Web/Sistem`, `Operasional`, `Transport/Ongkir`, `Pajak/Retribusi`, `Biaya Lain`).
  - Tambahkan kolom **`REFERENSI / VENDOR`** pada tabel desktop dan informasi badge `noInv` + `vendorOrTargetName` pada kartu mobile 2-grid, serta tombol **`Detail Order`** (`Eye`) untuk entri `order` dan **`Hapus`** (`Trash2`) untuk entri `manual`.
  - Di `src/components/analytics/MetricDetailDrawer.tsx`, gunakan `buildCashOutflowEntries(orders, transactions)` pada drawer `cashout` dan sub-view `outflow` pada drawer `saldo` serta bersihkan dekorasi emoji sesuai standar `antislop-ui`.
  - Di `src/lib/excel-export.ts`, perbarui `exportCashOutflowToExcel` agar mengekspor kolom `No. Invoice / Ref` dan `Mitra Vendor / Tujuan`.
  - _Requirements: US-9.31, US-9.32, US-9.33_

- [x] **41. Unit Testing Phase 7 (October 2026 Cutoff, Dual-Source Cash Outflow & Client Coverage Invariants)**
  - Buat unit test `src/lib/phase-7-cash-outflow.test.ts` menggunakan Vitest untuk menguji:
    * Cutoff Oktober 2026 (`>= '2026-10-01'`) pada `initialOrdersData` dan `initialCashTransactions`.
    * `buildCashOutflowEntries` menggabungkan pembayaran vendor (`orders`), biaya operasional (`orders`), dan kas keluar (`kas`) secara akurat tanpa duplikasi.
    * Konsistensi `calculateFinancialSummary`: `saldoAwal + totalKasMasuk - totalKasKeluar === saldoKasRiil`.
    * Kalkulasi kecukupan dana terhadap hutang vendor (`saldoKasRiil - totalUtangVendor`).
  - _Requirements: US-9.30, US-9.31, US-9.32, US-9.33, US-9.34_

- [x] **42. Quality Verification Gate Phase 7**
  - Jalankan `npx tsc --noEmit` untuk memvalidasi tipe TypeScript (`0 errors`).
  - Jalankan `npm test` untuk memastikan seluruh unit test Vitest lulus 100%.
  - Jalankan `npm run build` untuk memastikan Next.js production build berhasil.
  - _Requirements: US-9.30, US-9.31, US-9.32, US-9.33, US-9.34_

