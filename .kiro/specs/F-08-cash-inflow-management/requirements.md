# Requirements Specification — F-08: Cash Inflow Management & Payment Tracking (Dana Masuk)

## 1. Executive Context & Scope
Modul Cash Inflow (Dana Masuk) bertanggung jawab memonitor seluruh penerimaan kas masuk bisnis VisualKain secara real-time, transparan, dan terperinci, menjawab kebutuhan klien (Head of Finance & Accounting, Kak Glora) untuk melacak asal-usul uang masuk:
1. **Navigasi Mandiri (Desktop & Mobile)**:
   - Tab khusus `cashin` ("Dana Masuk") di Desktop Sidebar dan Mobile Bottom Navigation (sejajar dengan Dashboard, Dana Keluar, dan Mitra Vendor).
2. **Agregasi Dual-Source**:
   - **Sumber A (Order Payments)**: Pembayaran bertahap pesanan konsumen (DP 1, DP 2 / Siap Produksi, Pelunasan Penuh) dengan keterlacakan nomor invoice (`noInv`), nama customer, nama proyek, tanggal, dan nominal.
   - **Sumber B (Direct Cash Inflow)**: Transaksi kas masuk non-order / langsung dari koleksi Firestore `kas` (`tipe === 'masuk'`) seperti modal, refund, atau pendapatan lainnya.
3. **4 KPI Metrik Kas Masuk**:
   - Total Dana Masuk (Periode Terpilih)
   - Uang Masuk dari Order Konsumen (DP & Pelunasan)
   - Kas Masuk Non-Order (Koleksi Kas)
   - Rata-rata per Transaksi Masuk
4. **Visualisasi Analitik Modern**:
   - Donut Chart: Komposisi Jenis Penerimaan (DP vs Termin vs Pelunasan vs Kas Masuk Lain).
   - Daily Trend Bar Chart: Tren Penerimaan Kas Harian untuk mendeteksi arus likuiditas per tanggal.
5. **Dedicated Filter Toolbar & Pencarian**:
   - Live Search Box untuk mencari berdasarkan No. Invoice, Nama Customer, atau Keterangan.
   - CustomSelect Filter Jenis/Kategori (Semua, DP, Termin, Pelunasan, Kas Lain).
   - Filter Periode Bulan & Tahun reaktif.
   - Counter pill jumlah data dan nominal terfilter.
6. **Riwayat Mutasi Dana Masuk (Tampilan Adaptif)**:
   - Desktop (>= 768px): Spreadsheet table lengkap dengan badge jenis, identitas order, keterangan, dan nominal.
   - Mobile (< 768px): Tampilan 2-Grid Card ergonomis sesuai kaidah `/antislop-layoutmobile` dan `/antislop-ui` (badge anti-overflow, padding proporsional, font hierarkis, aksi inspeksi order detail / hapus kas manual).
7. **Input Transaksi & Ekspor**:
   - Tombol `+ Catat Kas Masuk` yang membuka `AddIncomeModal` dan tersimpan ke Firestore.
   - Tombol `Export Excel (.xlsx)` untuk rekapan mutasi dana masuk yang tersaring.

## 2. User Stories & Acceptance Criteria (RFC 2119)
- **US-8.1 (Dual-Source Inflow Aggregation)**:
  - **WHEN** halaman memuat data order dan transaksi kas,
  - **THEN** sistem SHALL mengagregasi seluruh riwayat pembayaran konsumen (`order.pembayaranList`) dan transaksi kas masuk (`kas.tipe === 'masuk'`) menjadi satu array terpadu `InflowEntry[]`.
  - **AND** sistem SHALL mengurutkan feed secara kronologis descending berdasarkan tanggal terbaru.
- **US-8.2 (Navigation & Symmetrical Tab Layout)**:
  - **WHEN** pengguna berada di perangkat desktop atau mobile,
  - **THEN** sistem SHALL menampilkan opsi navigasi "Dana Masuk" dengan icon representatif (`Coins` / `ArrowDownLeft`).
  - **AND** pada Mobile Bottom Nav, sistem SHALL merender 4 tab seimbang (`Dashboard`, `Dana Masuk`, `Dana Keluar`, `Mitra Vendor`).
- **US-8.3 (4 KPI Summary Cards Calculation)**:
  - **WHEN** filter periode atau pencarian diterapkan,
  - **THEN** sistem SHALL menghitung 4 metrik: (1) Total Dana Masuk tersaring, (2) Total Uang Masuk Order, (3) Total Kas Masuk Non-Order, (4) Rata-rata Nominal per Transaksi.
- **US-8.4 (Interactive Analytics Charts)**:
  - **WHEN** dataset kas masuk memiliki minimal satu entri,
  - **THEN** sistem SHALL merender Donut Chart komposisi jenis pembayaran dan Bar Chart tren nominal harian.
- **US-8.5 (Search & Filter Reactivity)**:
  - **WHEN** pengguna mengetikkan kata kunci pencarian atau memilih filter jenis,
  - **THEN** tabel dan kartu mutasi SHALL memfilter hasil secara instan tanpa reload halaman.
- **US-8.6 (Ergonomic Mobile 2-Grid Layout)**:
  - **WHEN** dibuka pada viewport mobile (< 768px),
  - **THEN** daftar mutasi SHALL tampil dalam grid 2 kolom dengan padding `p-2 sm:p-2.5`, badge status compact bebas overflow, teks terpotong rapi (`truncate`), dan tombol aksi `Detail` / `Hapus`.
- **US-8.7 (Inspection & Action Modals)**:
  - **WHEN** pengguna mengklik tombol "Detail" pada item transaksi yang berasal dari order,
  - **THEN** sistem SHALL membuka `OrderInspectionDrawer` untuk pesanan tersebut.
  - **WHEN** pengguna mengklik "Hapus" pada kas masuk manual,
  - **THEN** sistem SHALL menghapus dokumen dari koleksi `kas` Firestore dengan konfirmasi toast.
- **US-8.8 (Excel Spreadsheet Export)**:
  - **WHEN** pengguna mengklik "Export Excel",
  - **THEN** sistem SHALL mengunduh file `.xlsx` berisi seluruh kolom data transaksi kas masuk yang sesuai filter aktif.
