# Requirements Specification — F-09: Client Feedback Refinements & Quality Bugfix Spec

## 1. Executive Context & Scope
Berdasarkan tinjauan langsung dan pengujian intensif dari klien (Head of Finance & Accounting, Kak Glora) melalui sesi pengujian aplikasi serta analisis terhadap 5 tangkapan layar terbaru (`media_1791815317457` s.d. `media_1791815940209`), spesifikasi F-09 diperluas mencakup perbaikan fundamental arsitektur dan akurasi data finansial:

### Batch 1 (Completed & Verified):
1. **Pembersihan Metrik Laporan Finansial (`US-9.1`)**: Hapus baris "Keuntungan Real (Manual)" pada cetak laporan (`FinanceReportPaper`).
2. **Aksi Edit pada Riwayat Pembayaran Customer (`US-9.2`)**: Tombol aksi Edit (pensil) pada baris pembayaran termin.
3. **Penyelesaian Bug Filter Periode (`US-9.3`)**: Sinkronisasi filter bulan/tahun antara top header dengan komponen Cash Inflow & Outflow.
4. **Transparansi Alokasi Escrow (`US-9.4`)**: Alokasi dinamis Hak Pokok Vendor vs Margin VisualKain dari `calculateEscrowAllocation`.
5. **Kolom Pencarian Master Finansial (`US-9.5`)**: Search bar input selalu terlihat di mobile card toolbar dan desktop table.
6. **Paginasi Kartu & Tabel (`US-9.6`)**: Paginasi client-side 10 order per halaman (Page 1/2/3).

### Batch 2 (New In-Depth Client Feedback & Requirements):
7. **Sinkronisasi Permanen Edit/Hapus DP ke Tabel & Firestore (`US-9.7`)**:
   - Memperbaiki bug di mana penghapusan atau pengeditan baris DP/termin customer tidak mengubah data pada Master Finance Table.
   - Mengatasi akar masalah kegagalan sinkronisasi Firestore di mana payload `pembayaranList` tidak memetakan balik ke field Firestore `riwayatPembayaran`, `dpNominal`, dan `totalUangMasukCustomer`, sehingga listener realtime `onSnapshot` me-reset kembali ke data lama.
8. **Transisi Modal Edit & Tambah Kas ke Dedicated Page (`US-9.8`)**:
   - Memperbaiki bug z-index di mana modal edit muncul di belakang container tabel saat mode expand (fullscreen).
   - Mengabulkan permintaan klien untuk mengubah alur dialog modal (`EditFinanceModal`, `AddIncomeModal`) menjadi **Dedicated Page** terisolasi (`/finance/orders/[id]/edit` dan `/finance/cash-in/new`), guna mencegah risiko kehilangan input data akibat terklik backdrop modal atau tombol ESC secara tidak sengaja.
9. **Dedicated Page & Rincian Detail Transaksi Kas Masuk (`US-9.9`)**:
   - Memperbaiki ketimpangan informasi di mana saat ini hanya ada rincian kas keluar, sedangkan kas masuk (`+Rp 121.047.500`) belum memiliki perincian transaksi pembentuk.
   - Menyediakan tampilan dedicated page / detail view komprehensif untuk pelacakan seluruh arus kas masuk (pembayaran DP, termin, pelunasan konsumen, dan kas masuk langsung) lengkap dengan pencarian real-time, filter kategori/periode, dan layout mobile yang ergonomis.
10. **Breakdown Informasi Sisa DP & Threshold 70% Produksi (`US-9.10`)**:
    - Mengganti tampilan badge sederhana pada form input/pilihan order menjadi kartu informasi finansial transparan yang mengadopsi standar VisualKainDB:
      * Nilai Total Tagihan Invoice (Net & Gross).
      * Akumulasi Uang Masuk yang Telah Dibayar Konsumen (Nominal & %).
      * **Threshold DP 70% Syarat Mulai Produksi**: Target nominal 70% dan nominal pasti kekurangan menuju 70% agar vendor dapat memulai proses jahit/potong.
      * Sisa Pelunasan Akhir (30%).
11. **Kelengkapan Kartu Rincian Transaksi Pembentuk Metric Drawer (`US-9.11`)**:
    - Melengkapi informasi kartu order pada `MetricDetailDrawer` (rincian pembentuk omzet, laba, dan saldo kas) sesuai tabel referensi VisualKainDB:
      * Menampilkan No Inv, Customer, Project, Tanggal Order, Revenue, Total ke Vendor (HPP), Biaya Operasional Order, Net Profit Bersih, Margin %, Status Order, dan Nama Vendor.
      * **Mengecualikan / TIDAK menyertakan kolom "Profit Aktual"** sesuai instruksi eksplisit klien.
      * Menjamin layout kartu responsif, padat informasi namun tidak sempit pada layar HP (standar `/antislop-layoutmobile`).

### Batch 3 (New Direct Client Feedback & Audit Points):
12. **Pembersihan Badge Navigasi Sidebar (`US-9.12`)**:
    - Menghapus badge teks (`Master`, `Pemasukan`, `Beban`, `Ranking`, `Dev`) pada item navigasi sidebar agar visual sidebar bersih, rapi, dan lapang sesuai standar `/antislop-ui`.
13. **Penyederhanaan Visualisasi Grafik Dashboard Utama (`US-9.13`)**:
    - Mengganti grafik Donut "Alokasi Hak Dana (Escrow)" yang membingungkan klien dengan visualisasi yang intuitif, aksi-nyata, dan langsung dipahami:
      * **Opsi Terpilih / Rekomendasi**: Perbandingan Kas Masuk vs Kas Keluar Periode Ini (atau Saldo Kas Bank saat ini vs Beban Pengeluaran) menggunakan bar chart / radial progress ringkas.
14. **Audit Tombol Follow-Up WhatsApp & Fix Header Bertumpuk (`US-9.14`)**:
    - Memperbaiki bug di mana tombol "Tagih WA" hilang secara otomatis saat DP mencapai $\ge 70\%$ atau status berubah, padahal masih ada kewajiban pelunasan 30% atau perlu follow-up status produksi.
    - Menghadirkan tombol aksi WhatsApp juga pada tampilan kartu mobile order di `MasterFinanceTable`.
    - Memperbaiki cacat tabel desktop di mana teks header kolom bertumpuk/tumpang tindih akibat background sticky header yang semi-transparan (`bg-slate-100/70`) sehingga teks di bawahnya bocor saat scroll horizontal.
15. **Kelengkapan & Sinkronisasi Master Mitra Vendor (`US-9.15`)**:
    - Mengatasi masalah daftar vendor yang tidak lengkap (hanya ada 5 vendor hardcoded).
    - Mengambil seluruh vendor riil dari koleksi Firestore `vendors` dan agregasi unik dari pesanan (seperti Vendor Wisnu, LAJUWARNA, dll.).
    - Memastikan form edit finansial order menginisialisasi `vendorNama` sesuai vendor pesanan yang sedang diedit (bukan selalu default ke AMRIN).
    - Menyimpan `vendorName` dan `vendorId` ke dokumen Firestore saat data finansial disimpan.
16. **Eliminasi Total Modal-Modal Menjadi Dedicated Full-Page (`US-9.16`)**:
    - Menghilangkan modal dialog pop-up yang rawan tertutup tidak sengaja menjadi Dedicated Page mandiri (`/orders/[id]/edit`, `/cash-in/new`, `/cash-out/new`).
    - Menyediakan form mandiri yang nyaman digunakan di mobile dan desktop dengan perlindungan dirty-form.

### Batch 4 (Print Quality, 1-Page Constraint, Contextual Filename, Inflow Chart Revamp, Filter Audit & Date Clarity):
17. **Pemulihan Header & Background Hitam Tabel saat Print (`US-9.17`)**:
    - Mengatasi hilangnya warna hitam pada header tabel laporan finansial (`Rincian Modal vs Harga Jual`) saat dicetak/disimpan ke PDF akibat browser meniadakan warna background tanpa aturan `print-color-adjust: exact`.
18. **Penamaan File Export & Print Otomatis dan Kontekstual (`US-9.18`)**:
    - Mengganti nama default generik file cetak PDF (`VisualKain Financial Data & Analytics`) menjadi nama kontekstual otomatis: `[NO_INV] - [NAMA_PROJECT].pdf` (misal: `VK260039 - Seragam PDL Himpunan.pdf`) melalui manipulasi dinamis `document.title` saat cetak.
    - Menyesuaikan penamaan file ekspor Excel Master Finansial dan Cash Flow dengan konteks periode aktif (misal: `VisualKain_Master_Finance_Oktober_2026.xlsx`).
19. **Pembatasan Cetak Single-Page Presisi (`US-9.19`)**:
    - Memperbaiki bug di mana preview print memicu 4 hingga 8 halaman akibat pemakaian `visibility: hidden` pada elemen background `body *` yang tetap menyisakan flow layout DOM beribu-ribu pixel.
    - Menerapkan isolasi cetak ketat sehingga laporan finansial order pas (*single-page fit*) tepat dalam 1 lembar A4 portrait tanpa halaman kosong.
20. **Penyederhanaan Grafik Komposisi Pemasukan (`US-9.20`)**:
    - Mengganti Donut Chart "Komposisi Jenis Pemasukan" pada Cash Inflow (yang 97.6% didominasi satu warna DP saja) menjadi grafik yang actionable: **Pemasukan per Rekening / Kanal Pembayaran (BCA vs Mandiri vs Kasir)** untuk mempermudah rekonsiliasi bank harian, atau **Target Tagihan vs Realisasi Kas (Collection Rate)**.
21. **Audit & Penyelarasan Menyeluruh Seluruh Filter & Search (`US-9.21`)**:
    - Mengaudit dan memperbaiki seluruh filter di semua tab:
      * `CashOutflowSection`: Menegakkan filter `item.tipe === 'keluar'` agar penerimaan kas langsung tidak tercampur ke pengeluaran.
      * `MetricDetailDrawer`: Memastikan search box memfilter daftar mutasi pada drilldown saldo kas (sebelumnya hardcoded `transactions.slice(0, 8)`).
      * `VendorPerformanceSection`: Menambahkan kolom pencarian mitra vendor.
      * Menghilangkan konflik desinkronisasi antara filter periode header global dan toolbar lokal.
22. **Standarisasi Format Tanggal Anti-Ambiguitas & Header Rentang Waktu (`US-9.22`)**:
    - Mengganti format tanggal X-Axis `09-15`, `09-23`, `10-02` (yang disalahpahami klien sebagai tanggal "9 sampai 15") menjadi format eksplisit: `15 Sep`, `23 Sep`, `02 Okt`.
    - Menambahkan header/badge rentang waktu yang tegas (misal: *"Rentang: 15 Sep 2026 – 12 Okt 2026"*) dan tooltip tanggal lengkap bahasa Indonesia pada seluruh grafik harian.

### Batch 5 (Escrow Bar Elimination, Vendor Debt Filter Simplification, Fluid Full-Width Desktop, Dedicated Edit Flow & Inzta-Style Executive Excel Export):
23. **Eliminasi Total Escrow Liquidity Bar & Banner Defisit Sederhana (`US-9.23`)**:
    - Menghapus komponen `EscrowLiquidityBar` ("Kas Aman Ditarik") yang menampilkan visual bar 100% merah pekat dan angka Rp 0 membingungkan saat saldo bank riil defisit.
    - Menghilangkan beban visual dan jargon teknis ("2-Pocket Accounting", "Dana Terkunci Hak Vendor") dari dashboard agar tampilan lapang dan langsung terfokus pada kartu metrik finansial esensial.
    - Menggantikannya dengan peringatan status satu baris yang santun dan sederhana jika saldo kas bank berada dalam kondisi negatif/defisit.
24. **Penyederhanaan Filter Status Utang Vendor & Eliminasi Redundansi (`US-9.24`)**:
    - Mengeliminasi pilihan dropdown ganda yang bertumpuk ("Semua Utang Vendor" vs "Ada Sisa Utang Vendor").
    - Menyediakan 3 opsi filter status vendor yang jernih dan tegas: `Semua Order`, `Hanya yang Berutang ke Vendor` (menampilkan order dengan sisa utang vendor > 0), dan `Vendor Sudah Lunas`.
25. **Layout Responsif Fluid Full-Width untuk Monitor Desktop Besar (`US-9.25`)**:
    - Mengubah kontainer dashboard utama dari batasan kaku `max-w-7xl` (1280px) menjadi fluid responsive hingga `max-w-[1920px]` (atau `w-full`) pada layar monitor desktop PC besar.
    - Menjamin pemanfaatan ruang layar ultrawide/1080p secara optimal tanpa menyisakan ruang kosong lebar di margin kiri dan kanan.
    - **Proteksi Mutlak Mobile**: Menjaga padding, margin, dan grid 2-kolom pada perangkat layar kecil (< 768px) tetap utuh 100% tanpa memicu horizontal scrolling atau layout sempit.
26. **Rincian Termin DP Transparan & Dedicated Edit Order Page (`US-9.26`)**:
    - Menghadirkan informasi riwayat DP yang lengkap pada form finansial order: Tanggal Transaksi, Jenis Termin (DP 1 Booking, DP 2 70% Produksi, Pelunasan Akhir 30%), Rekening Tujuan (BCA/Mandiri/Tunai), Catatan, serta tombol **Edit** dan **Hapus** pada setiap baris.
    - Mengalihkan seluruh form edit finansial order dari modal pop-up ke **Dedicated Page** (`/orders/[id]/edit`) dengan navigasi breadcrumb, sticky action bar, dan proteksi dirty form.
27. **Audit Menyeluruh Copywriting — Standarisasi Bahasa Indonesia Baku Akuntansi Konveksi (`US-9.27`)**:
    - Mengaudit dan membersihkan seluruh istilah bahasa Inggris dan campuran asing di antarmuka web sesuai standar `/antislop-copywriting` dan `/copywriting`:
      * `Financial Dashboard` -> **Ringkasan Finansial**
      * `Cash Inflow` -> **Arus Kas Masuk (Penerimaan Kas)**
      * `Cash Outflow` -> **Arus Kas Keluar (Pengeluaran Kas)**
      * `Vendor Performance` -> **Kinerja Mitra Vendor**
      * `Escrow / Alokasi Hak Dana` -> **Komparasi Kas Masuk vs Kas Keluar**
      * `Gross Jual` -> **Nilai Tagihan Kotor (Subtotal)**
      * `OpEx` -> **Biaya Operasional**
      * `Outstanding Customer` -> **Sisa Piutang Pelanggan**
      * `Vendor Debt` -> **Sisa Utang ke Vendor**
      * `Net Profit` -> **Laba Bersih**
28. **Standarisasi Format Ekspor Excel Rapi Standar Eksekutif (Referensi Proyek Inzta) (`US-9.28`)**:
    - Memodernisasi fungsi ekspor Excel Master Finansial dan Arus Kas dari dump plain `json_to_sheet` menjadi format tabel profesional berbasis `ExcelJS`:
      * Banner metadata header di bagian atas (Judul Laporan, Nama VisualKain, Periode Aktif, Tanggal Unduh, Jumlah Transaksi).
      * Ringkasan KPI terformat (Total Transaksi, Total Qty, Total Omzet, Total Laba Bersih).
      * Header tabel berwarna gelap/teal VisualKain (`#0f766e` / `#0f172a`) dengan teks tebal putih kontras, tinggi baris 26, dan border tipis.
      * Format angka mata uang standar Excel (`"Rp" #,##0`), format quantity integer (`#,##0`), dan format tanggal tengah.
      * Lebar kolom adaptif otomatis (auto-fit width) agar tidak ada teks terpotong atau cell berkarakter `###`.
      * Baris Total/Summary di akhir tabel dengan garis ganda atas/bawah.

### Batch 6 (Direct Client Mobile Usability: Dedicated "Data Table" Tab & Scroll Elimination):
29. **Pemisahan Master Data Order ke Tab Mandiri "Data Table" pada Navigasi Bawah & Sidebar (`US-9.29`)**:
    - Menambahkan tab ke-5 `"Data Table"` pada Bottom Navigation Mobile (sehingga menjadi 5 tab: Dashboard, Data Table, Dana Masuk, Dana Keluar, Mitra Vendor) dan Sidebar Desktop.
    - Memindahkan komponen `MasterFinanceTable` (kartu order mobile & tabel desktop) dari tab `Dashboard` ke tab dedicated `Data Table`.
    - **Tujuan Ergonomi Mobile**: Menghilangkan kebutuhan scrolling berlebihan (hingga ribuan pixel) melewati 6 KPI card dan 2 grafik analitik hanya untuk melihat atau mencari data order.
    - Pada tab `Dashboard`, fokuskan tampilan murni untuk ringkasan eksekutif dan analitik performa dengan tombol pintasan cepat menuju Data Table.

---

## 2. User Stories & Acceptance Criteria (RFC 2119)

### Batch 1 Acceptance Criteria (Retained & Verified):
- **US-9.1 (Remove Manual Profit Row)**:
  - **WHEN** komponen `FinanceReportPaper` dirender,
  - **THEN** sistem SHALL NOT menampilkan baris `Keuntungan Real (Manual)`.
  - **AND** sistem SHALL tetap menampilkan `Profit Bersih (Estimasi)` dan `Margin (%)`.

- **US-9.2 (Edit Action in Customer Payment History)**:
  - **WHEN** pengguna membuka modal/halaman edit finansial order,
  - **THEN** kolom Aksi pada tabel riwayat pembayaran termin customer SHALL menampilkan tombol `Edit` di samping tombol `Hapus`.

- **US-9.3 (Period Filter Synchronization Bugfix)**:
  - **WHEN** pengguna mengubah filter Bulan atau Tahun pada header atas aplikasi,
  - **THEN** dataset dan grafik tren pada `CashOutflowSection` dan `CashInflowSection` SHALL secara instan memfilter hanya data pada periode terpilih.

- **US-9.4 (Dynamic Escrow Allocation & Source Transparency)**:
  - **WHEN** `AnalyticsCharts` dimuat di Dashboard,
  - **THEN** nilai Donut Chart "Alokasi Hak Dana (Escrow)" SHALL dihitung secara dinamis dari agregasi alokasi hak vendor dan alokasi margin seluruh order pada periode aktif (`calculateEscrowAllocation`).
  - **AND** sistem SHALL menyertakan teks keterangan transparansi audit sumber data di bawah grafik.

- **US-9.5 (Always-Visible Search Box)**:
  - **WHEN** pengguna berada di tab Dashboard pada tampilan mobile maupun desktop,
  - **THEN** `MasterFinanceTable` SHALL menampilkan kolom input pencarian dengan placeholder intuitif, icon search, dan tombol clear.

- **US-9.6 (Client-Side Pagination for Mobile Cards & Table)**:
  - **WHEN** daftar order melebihi batas per halaman (10 order),
  - **THEN** sistem SHALL menampilkan tombol navigasi paginasi (`Prev`, `1`, `2`, `3...`, `Next`) di bagian bawah kartu/tabel.

---

### Batch 2 Acceptance Criteria (New Client Requirements):

- **US-9.7 (Bidirectional DP Mutation & Reactive Table Update)**:
  - **WHEN** pengguna mengubah atau menghapus satu atau lebih baris cicilan/DP pada pesanan,
  - **THEN** sistem SHALL menghitung ulang secara instan:
    * `totalUangMasukCustomer` = akumulasi total nominal dari baris pembayaran aktif.
    * `dpPersenCustomer` = `(totalUangMasukCustomer / totalInvoice) * 100`.
    * `sisaPelunasanCustomer` = `max(0, totalInvoice - totalUangMasukCustomer)`.
    * `statusDpThreshold` = `lunas_total` (>=100%), `dp2_siap_produksi` (>=70%), `dp1_parsial` (>0%), atau `belum_dp` (0%).
  - **AND** saat disimpan, payload SHALL disinkronkan ke dokumen Firestore:
    * Array `riwayatPembayaran`: `pembayaranList.map(p => ({ jumlah: p.nominal, tanggal: p.tanggal, catatan: p.keterangan, jenis: p.jenis }))`.
    * Fields legacy `dpNominal`, `dp1Nominal`, `dp2Nominal`, `totalUangMasukCustomer`, dan `statusPembayaran`.
  - **AND** Master Finance Table dan Summary Dashboard SHALL langsung merefleksikan perubahan angka tanpa memerlukan refresh browser manual.

- **US-9.8 (Dedicated Page Architecture for Order Edit & Income Entry)**:
  - **WHEN** pengguna menekan tombol "Edit" pada baris order (baik di mode normal maupun mode fullscreen expand),
  - **THEN** sistem SHALL mengarahkan navigasi ke **Dedicated Page** terisolasi (misalnya rute `/orders/[id]/edit` atau tab sub-pageview mandiri).
  - **AND** sistem SHALL TIDAK menggunakan modal floating yang rawan tertutup tidak sengaja atau terhalang z-index `isExpanded`.
  - **AND** Dedicated Page SHALL menyediakan tombol "Simpan Perubahan", konfirmasi perubahan unsaved, dan tombol navigasi kembali ("Kembali ke Master Finansial").

- **US-9.9 (Dedicated View & Comprehensive Breakdown of Cash Inflows)**:
  - **WHEN** pengguna mengakses rincian kas masuk (dari klik KPI Kas Masuk atau tombol detail),
  - **THEN** sistem SHALL menyajikan tampilan komprehensif yang merinci seluruh transaksi pembentuk kas masuk:
    * Daftar seluruh cicilan customer yang masuk (No Inv, Customer, Tanggal, Nominal, Kategori DP/Termin/Pelunasan, Rekening Penerima).
    * Transaksi kas masuk langsung non-order dari koleksi `kas`.
  - **AND** antarmuka SHALL menyediakan search bar live, filter kategori pemasukan, dan pagination/scroll yang optimal di mobile screen.

- **US-9.10 (70% Production Threshold Flow & Transparent DP Breakdown)**:
  - **WHEN** pengguna memilih pesanan pada form pencatatan kas masuk / termin DP,
  - **THEN** sistem SHALL menampilkan kartu rincian alokasi bertahap:
    * `Total Nilai Invoice`: Rp X.
    * `Sudah Dibayar Konsumen`: Rp Y (Z%).
    * `Target DP 70% Siap Produksi`: Rp (0.7 × X).
    * `Status & Kekurangan Produksi`: Jika pembayaran < 70%, tampilkan alert jelas: "⚠️ Kurang Rp (70% - Y) untuk mencapai syarat produksi vendor". Jika >= 70%, tampilkan status hijau: "✅ Syarat 70% terpenuhi, pesanan siap diproduksi".
    * `Sisa Pelunasan Akhir (30%)`: Rp (X - Y).

- **US-9.11 (Full Transaction Metric Card Layout Without Profit Aktual)**:
  - **WHEN** `MetricDetailDrawer` menampilkan kartu "Rincian Transaksi Pembentuk",
  - **THEN** setiap kartu order SHALL memuat informasi lengkap:
    * Header: Badge No Inv, Nama Customer, Tanggal Order, Status Order Badge.
    * Subheader: Nama Project & Nama Mitra Vendor.
    * Grid Metrik Finansial:
      - Total Revenue / Invoice.
      - Modal Vendor (HPP Pokok).
      - Biaya Operasional Order.
      - Net Profit Bersih.
      - Margin (%).
  - **AND** kartu SHALL NOT menyertakan baris atau field "Profit Aktual".
  - **AND** layout pada layar mobile (< 768px) SHALL menggunakan 2-kolom tile ringkas dengan typography hierarkis yang bersih tanpa horizontal overflow.

---

### Batch 3 Acceptance Criteria (New User Stories):

- **US-9.12 (Sidebar Badge Removal)**:
  - **WHEN** komponen `Sidebar` dirender baik pada tampilan desktop maupun tablet,
  - **THEN** tombol navigasi tab SHALL NOT menampilkan elemen badge teks (`Master`, `Pemasukan`, `Beban`, `Ranking`, `Dev`).
  - **AND** tombol navigasi SHALL hanya menampilkan ikon dan label judul dengan ruang pandang yang lega dan minimalis.

- **US-9.13 (Simplified Intuitive Dashboard Financial Chart)**:
  - **WHEN** `AnalyticsCharts` dimuat di tab Financial Dashboard,
  - **THEN** grafik Donut "Alokasi Hak Dana (Escrow)" SHALL diganti dengan komponen grafik yang intuitif dan mudah dipahami oleh pemilik bisnis dan kasir:
    * Memvisualisasikan **Perbandingan Kas Masuk vs Kas Keluar Periode Ini** (atau **Uang Riil Saldo Kas saat ini vs Beban Pengeluaran**).
    * Menyajikan label dan angka nominal yang jelas tanpa jargon teknis akuntansi yang membingungkan.
  - **AND** layout grid grafik dashboard tetap proporsional dan responsif di seluruh ukuran layar.

- **US-9.14 (Persistent WhatsApp Follow-Up & Header Collision Fix)**:
  - **WHEN** pesanan memiliki sisa piutang konsumen (`sisaPelunasanCustomer > 0`) atau sedang dalam status produksi/pembayaran,
  - **THEN** tombol "Tagih WA" SHALL tetap dapat diakses oleh kasir dan TIDAK menghilang secara otomatis hanya karena pesanan telah mencapai 70%.
  - **AND** label dan aksi tombol WA SHALL bersifat adaptif:
    * Jika DP $< 70\%$: `Tagih DP 70%` (Pesan penagihan syarat produksi).
    * Jika DP $\ge 70\%$ dan $< 100\%$: `Tagih Pelunasan` (Pesan penagihan pelunasan akhir).
    * Jika Lunas ($100\%$): Tombol berubah menjadi `Notif WA` (Konfirmasi lunas / info progress).
  - **AND** tombol WA SHALL juga dihadirkan pada kartu mobile order view di `MasterFinanceTable`.
  - **AND** background sticky header tabel desktop pada "Komitmen Vendor (HPP)" dan "Aksi Cepat & Status" SHALL menggunakan warna solid (`bg-slate-100` / `bg-white` tanpa opacity pecahan seperti `/70`) agar teks di bawahnya tidak menembus (bleed-through) saat tabel digeser horizontal.

- **US-9.15 (Comprehensive Dynamic Vendor Directory & Pre-Population)**:
  - **WHEN** formulir edit finansial order dimuat,
  - **THEN** pilihan "Mitra Vendor" SHALL memuat daftar lengkap seluruh vendor yang terdaftar di Firestore (`vendors` collection) digabungkan dengan vendor riil yang tercatat pada order aktif (termasuk AMRIN, CAHAYA BORDIR, FJ MERCHANDISE, CITITEX, VENDOR TOPI PK UCI, Vendor Wisnu, LAJUWARNA, dan vendor lainnya).
  - **AND** field vendor pada form SHALL secara otomatis terisi (*pre-populated*) dengan vendor yang saat ini terikat pada pesanan tersebut (`order.vendorName`), bukan selalu default ke vendor pertama.
  - **AND** saat perubahan finansial disimpan, `vendorName` dan `vendorId` terpilih SHALL disertakan ke dalam payload update ke Firestore.

- **US-9.16 (Comprehensive Modal Elimination to Dedicated Pages)**:
  - **WHEN** pengguna menekan tombol aksi "Edit Finansial", "Catat Kas Masuk", atau "Catat Kas Keluar",
  - **THEN** sistem SHALL membuka Dedicated Page mandiri (`/orders/[id]/edit`, `/cash-in/new`, `/cash-out/new`), BUKAN modal pop-up dialog yang mengambang.
  - **AND** setiap dedicated page SHALL memiliki:
    * Header form dengan breadcrumb dan status order/transaksi.
    * Desain halaman yang memanfaatkan ruang layar penuh dengan nyaman (ramah input formulir panjang).
    * Sticky footer bar berisi tombol "Batal / Kembali" dan "Simpan".
    * Dirty form protection (dialog konfirmasi jika pengguna mencoba meninggalkan halaman saat ada perubahan yang belum disimpan).

---

### Batch 4 Acceptance Criteria (New User Stories):

- **US-9.17 (Exact Print Color & Table Header Restoration)**:
  - **WHEN** pengguna mencetak invoice atau laporan finansial order (Print / Save as PDF),
  - **THEN** header tabel (`.invoice-items th`, `#financeReportPaper th`) SHALL mempertahankan background hitam gelap (`#0f172a`) dan teks putih kontras tanpa memudar menjadi abu-abu atau transparan.
  - **AND** seluruh aturan stylesheet cetak SHALL menyertakan `print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important;`.

- **US-9.18 (Dynamic Contextual Export & Print Filename)**:
  - **WHEN** pengguna menekan tombol print laporan finansial order,
  - **THEN** judul dokumen (`document.title`) SHALL secara instan diubah menjadi `[NO_INV] - [NAMA_PROJECT]` (contoh: `VK260039 - Seragam PDL Himpunan`) sehingga dialog penyimpanan browser mengusulkan nama file yang relevan dan tepat konteks.
  - **AND** saat pengguna mengekspor Excel di Master Finansial atau Arus Kas, nama file yang diunduh SHALL mencerminkan konteks periode aktif (contoh: `VisualKain_Master_Finance_Oktober_2026.xlsx` atau `VisualKain_Cash_Inflow_Oktober_2026.xlsx`).

- **US-9.19 (Strict Single-Page Print Layout Constraint)**:
  - **WHEN** pratinjau cetak browser dibuka untuk laporan finansial order,
  - **THEN** dokumen cetak SHALL строго dibatasi tepat 1 halaman A4 portrait (single-page fit) tanpa menghasilkan halaman kedua atau halaman 4-8 kosong.
  - **AND** elemen luar halaman aplikasi (`body > *:not(#printRoot)`) SHALL disembunyikan menggunakan `display: none !important;` (bukan `visibility: hidden`) untuk mencegah layout overflow vertikal.

- **US-9.20 (Actionable Inflow Composition Chart Revamp)**:
  - **WHEN** grafik komposisi kas masuk dirender pada tab Arus Kas Masuk (Cash Inflow),
  - **THEN** sistem SHALL mengganti Donut Chart "Komposisi Jenis Pemasukan" menjadi **Komposisi Perbandingan Termin Pembayaran Konsumen**:
    * **DP 1 Booking / Uang Muka Awal** (Warna Teal / Biru Muda)
    * **DP 2 Termin 70% Syarat Produksi** (Warna Amber / Emas)
    * **Pelunasan Akhir 30% Sebelum Kirim** (Warna Emerald / Hijau)
  - **AND** grafik baru SHALL menampilkan proporsi nominal rupiah dan persentase yang jelas guna memantau kesiapan pesanan masuk lini produksi konveksi.

- **US-9.21 (Universal Filter & Search Bugfix and Audit Gate)**:
  - **WHEN** pengguna memfilter data pada sub-modul mana pun (`dashboard`, `cashin`, `cashout`, `vendor`, `MetricDetailDrawer`),
  - **THEN** seluruh kontrol filter dan search box SHALL berfungsi secara akurat:
    * Pada `CashOutflowSection`, hanya transaksi dengan `tipe === 'keluar'` yang diikutsertakan.
    * Pada `MetricDetailDrawer` untuk metrik saldo kas, pencarian kata kunci (`searchQuery`) SHALL secara reaktif memfilter daftar transaksi kas.
    * Pada `VendorPerformanceSection`, input pencarian nama vendor SHALL tersedia dan responsif.
    * Pengubahan filter periode pada header atas SHALL selalu tersinkronisasi dua arah dengan toolbar lokal sub-modul tanpa perbedaan hasil hitung.

- **US-9.22 (Unambiguous Date Formats & Explicit Date Range Badges)**:
  - **WHEN** grafik tren harian dirender pada `CashOutflowSection`, `CashInflowSection`, atau `AnalyticsCharts`,
  - **THEN** label sumbu X (X-Axis) SHALL menggunakan format nama bulan singkatan eksplisit: `15 Sep`, `23 Sep`, `02 Okt`, `06 Okt` (BUKAN `09-15` atau `10-02` yang menyerupai rentang tanggal).
  - **AND** kartu grafik SHALL menampilkan keterangan rentang waktu yang tegas (misal: *"Rentang Waktu: 15 Sep 2026 – 12 Okt 2026"*).
  - **AND** tooltip interaktif grafik SHALL menampilkan tanggal lengkap formal Indonesia: *"15 September 2026"*.

---

### Batch 5 Acceptance Criteria (New User Stories):

- **US-9.23 (Total Elimination of Escrow Liquidity Bar & Clean Deficit Handling)**:
  - **WHEN** pengguna membuka dashboard finansial utama,
  - **THEN** sistem SHALL NOT merender komponen `EscrowLiquidityBar` maupun visual bar persentase alokasi kantong kas.
  - **AND** dashboard SHALL langsung menampilkan KPI Cards esensial (`FinanceStatsGrid`) tanpa halangan visual yang membingungkan.
  - **AND** IF saldo kas bank berada dalam posisi negatif/defisit (contoh: `-Rp 224.500`), sistem SHALL menampilkan alert strip minimalis satu baris di bawah header: *"Perhatian: Saldo Kas Bank saat ini berada pada posisi defisit ([nominal])"*, tanpa memicu visual bar merah pekat atau label Rp 0 yang aneh.

- **US-9.24 (Vendor Debt Filter Simplification & Redundancy Removal)**:
  - **WHEN** pengguna memfilter status utang vendor pada `MasterFinanceTable`,
  - **THEN** dropdown filter SHALL menyediakan tepat 3 opsi yang tidak ambigu:
    * `Semua Status Vendor` (value: `'all'`): Menampilkan seluruh order tanpa memandang status utang.
    * `Hanya Utang Vendor` (value: `'has_debt'`): Hanya menampilkan order yang memiliki sisa utang vendor > 0 (`sisaPembayaranVendor > 0`).
    * `Vendor Lunas` (value: `'settled'`): Hanya menampilkan order di mana kewajiban vendor telah lunas 100% (`sisaPembayaranVendor === 0` dan `totalBiayaVendor > 0`).
  - **AND** sistem SHALL mengeliminasi teks ganda "Ada Sisa Utang Vendor [Utang]" yang sebelumnya membingungkan kasir.

- **US-9.25 (Fluid Full-Width Responsive Container for Desktop Monitors)**:
  - **WHEN** aplikasi dibuka pada monitor desktop resolusi besar (lebar $\ge 1280\text{ px}$ hingga $1920\text{ px}+$ / ultrawide),
  - **THEN** kontainer layout dashboard (`main > div`) SHALL melebar secara fluid hingga `max-w-[1920px]` (atau `w-full`), memanfaatkan seluruh ruang pandang horizontal tanpa meninggalkan whitespace kosong yang tidak berguna di sisi kiri dan kanan.
  - **AND** WHEN aplikasi dibuka pada perangkat mobile (< 768px), padding kontainer SHALL tetap terkunci pada `px-3.5` dan card layout SHALL tetap 100% responsif tanpa horizontal overflow atau teks terpotong (mematuhi prinsip `/antislop-layoutmobile`).

- **US-9.26 (Complete DP Installment History & Dedicated Order Edit Page)**:
  - **WHEN** pengguna mengakses halaman edit finansial order (`/orders/[id]/edit`),
  - **THEN** halaman SHALL menyediakan kartu rincian riwayat pembayaran termin konsumen yang lengkap mengadopsi standar VisualKainDB:
    * Tabel riwayat termin dengan kolom: Tanggal Pembayaran, Jenis Termin (`DP 1 Booking`, `DP 2 70% Produksi`, `Pelunasan 30%`), Rekening Tujuan Pembayaran, Catatan/Keterangan, Nominal, dan Kolom Aksi berisi tombol **Edit** dan **Hapus**.
    * Kartu kalkulasi target DP 70% sebagai syarat mulai produksi, menampilkan sisa kekurangan menuju 70% secara presisi.
    * Form input/edit termin yang mudah digunakan dengan proteksi dirty-form (konfirmasi jika navigasi keluar sebelum menyimpan).
    * Navigasi Breadcrumb kembali ke Master Finansial tanpa risiko data tertutup tidak sengaja seperti modal pop-up.

- **US-9.27 (Comprehensive Copywriting Audit & Formal Indonesian Standardization)**:
  - **WHEN** pengguna menavigasi seluruh antarmuka web,
  - **THEN** seluruh teks antarmuka, judul menu, metrik, dan tabel SHALL menggunakan **Bahasa Indonesia Baku & Formal Akuntansi Konveksi** tanpa percampuran bahasa asing yang janggal (`/antislop-copywriting`):
    * Tab Sidebar: `Ringkasan Finansial`, `Arus Kas Masuk`, `Arus Kas Keluar`, `Kinerja Mitra Vendor`, `Laporan Finansial`.
    * Metrik: `Estimasi Omzet`, `Penerimaan Kas (Kas Masuk)`, `Pengeluaran Kas (Kas Keluar)`, `Sisa Piutang Pelanggan`, `Sisa Utang ke Vendor`, `Estimasi Laba Bersih`.
    * Laporan & Filter: `Nilai Tagihan Kotor (Subtotal)`, `Biaya Operasional`, `Komparasi Kas Masuk vs Kas Keluar`.
  - **AND** sistem SHALL meniadakan seluruh istilah rancu seperti "Escrow Liquidity", "Donut Escrow", "OpEx", dan "Real Profit manual".

- **US-9.28 (Executive Styled Excel Export Engine — Inzta Reference Standards)**:
  - **WHEN** pengguna menekan tombol "Export Excel" pada Master Finansial atau Arus Kas,
  - **THEN** berkas spreadsheet yang diunduh SHALL di-generate menggunakan `ExcelJS` dengan struktur tabel eksekutif rapi mengadopsi standar Inzta:
    * **Blok Header Metadata**: Baris 1-6 memuat Judul Laporan (Arial 14 Bold), Nama Entitas (VisualKain Konveksi), Periode Laporan, Tanggal Unduh, dan Jumlah Baris Transaksi.
    * **Kartu Ringkasan KPI**: Baris 8-10 memuat tabel ringkasan metrik (Total Transaksi, Total Qty, Total Omzet/Revenue, Total Laba Bersih) dengan background abu-abu lembut (`#E0E0E0`), border rapi, dan format angka terpusat.
    * **Header Kolom Tabel**: Warna background gelap elegan VisualKain Teal (`#0F766E`) dengan teks tebal putih (`#FFFFFF`), tinggi baris 26 pt, alignment tengah, dan border tipis.
    * **Formatting Cell**: Kolom nominal mata uang diformat sebagai `"Rp" #,##0` rata kanan; kolom kuantitas diformat sebagai `#,##0` rata tengah; kolom tanggal dan nomor invoice rata tengah.
    * **Column Auto-Width**: Setiap kolom dihitung otomatis berdasarkan panjang teks maksimum + 4 padding karakter agar tidak ada teks terpotong atau cell berkarakter `###`.
    * **Baris Total / Summary**: Baris paling bawah tabel menampilkan akumulasi total dengan font tebal dan garis batas ganda (double-line bottom border).

---

### Batch 6 Acceptance Criteria (New User Stories):

- **US-9.29 (Dedicated "Data Table" Navigation Tab & Scroll Elimination)**:
  - **WHEN** pengguna mengakses aplikasi pada perangkat mobile maupun desktop,
  - **THEN** bar navigasi (MobileBottomNav dan Sidebar) SHALL menampilkan 5 tab menu utama:
    1. `Dashboard` (Ringkasan Finansial Eksekutif)
    2. `Data Table` (Master Data Finansial Order)
    3. `Dana Masuk` (Arus Kas Masuk / Cash Inflow)
    4. `Dana Keluar` (Arus Kas Keluar / Cash Outflow)
    5. `Mitra Vendor` (Kinerja Mitra Vendor)
  - **AND** WHEN pengguna memilih tab `Data Table`,
  - **THEN** sistem SHALL secara langsung merender komponen `MasterFinanceTable` (lengkap dengan search box, filter status DP, filter status vendor, view kartu mobile, dan view tabel desktop) di bagian paling atas viewport tanpa mengharuskan pengguna melakukan scroll vertikal melewati KPI cards atau grafik.
  - **AND** WHEN pengguna berada di tab `Dashboard`,
  - **THEN** halaman SHALL memuat kartu metrik KPI (`FinanceStatsGrid`) dan grafik komparasi kas (`AnalyticsCharts`) tanpa memuat daftar 26 kartu order di bawahnya, menjaga halaman tetap ringkas dan tidak memicu lag scrolling pada layar HP.
  - **AND** pada tab `Dashboard` di bawah grafik, sistem SHALL menyertakan tombol aksi cepat: *"Buka Master Data Order (Data Table) →"* yang secara instan mengarahkan pengguna ke tab `Data Table`.

---

### Batch 7 Acceptance Criteria (New User Stories — Complete Cash Outflow Data, October 2026 Cutoff & Client Core Workflow):

- **US-9.30 (October 2026 Cutoff `>= '2026-10-01'`, Payment Array Resolution & Seed Data Sync)**:
  - **WHEN** sistem memuat data pesanan (`orders`) dan transaksi kas (`kas`) dari Firebase `appkonveksi` maupun dari fallback (`src/lib/seed-data.ts`),
  - **THEN** sistem SHALL menyaring secara otomatis seluruh data keuangan sehingga hanya menampilkan dan menghitung transaksi mulai **1 Oktober 2026 dan bulan-bulan selanjutnya (`>= '2026-10-01'`)**, tanpa menghapus dokumen historis sebelum Oktober 2026 di database Firebase `appkonveksi`.
  - **AND** pada `useFirebaseFinance.ts`, ketika sebuah dokumen order memiliki `riwayatPembayaran: []` (array kosong) namun memiliki data valid di `pembayaranList` (seperti `VK260041` dengan 4 termin pembayaran senilai `Rp 982.000`), sistem SHALL membaca array pembayaran yang tidak kosong sehingga tidak ada pembayaran konsumen yang terlewat menjadi `Rp 0`.
  - **AND** `initialOrdersData` serta `initialCashTransactions` di `src/lib/seed-data.ts` SHALL memuat data autentik mulai Oktober 2026 (3 order Oktober 2026: `VK260041`, `VK260040`, `VK260039` serta 10 transaksi `kas` keluar Oktober 2026 senilai `Rp 1.779.000`).
  - **AND** dropdown filter Bulan ketika tahun `2026` dipilih (atau saat seluruh data berada di tahun 2026 mulai Oktober) SHALL hanya menampilkan opsi bulan mulai Oktober (`Oktober`, `November`, `Desember`) agar klien tidak bingung dengan bulan-bulan sebelum Oktober 2026.

- **US-9.31 (Dual-Source Cash Outflow Aggregator: `kas` + `orders` Vendor & Operational Expenses)**:
  - **WHEN** pengguna membuka tab `Dana Keluar` (`CashOutflowSection`), menekan kartu KPI `Dana Keluar` (`MetricDetailDrawer`), atau melihat grafik komparasi kas di `Dashboard`,
  - **THEN** sistem SHALL mengagregasi **seluruh sumber uang keluar riil dari Firebase** (sebagaimana tab `Dana Masuk` mengagregasi pembayaran `orders` + `kas`), yang terdiri dari 3 sumber terverifikasi:
    1. **Sumber A - Pembayaran HPP / DP & Pelunasan ke Mitra Vendor (`orders`)**:
       * Setiap order aktif (`>= '2026-10-01'`) yang memiliki `totalDibayarKeVendor > 0` SHALL menghasilkan entri pengeluaran berkategori **`Pembayaran Vendor`** dengan referensi Nomor Invoice (`noInv`), Nama Mitra Vendor (`vendorName`), dan Nama Proyek/Pelanggan (`customerName` - `projectName`).
    2. **Sumber B - Biaya Operasional Pesanan (`orders.biayaOperasional`)**:
       * Setiap order aktif (`>= '2026-10-01'`) yang memiliki `biayaOperasional > 0` SHALL menghasilkan entri pengeluaran berkategori **`Biaya Operasional Order`** dengan referensi Nomor Invoice (`noInv`) dan keterangan operasional pesanan.
    3. **Sumber C - Pengeluaran Kas Langsung / Non-Order (`kas`)**:
       * Seluruh dokumen di koleksi `kas` Firebase (`>= '2026-10-01'`) dengan `jenis === 'keluar'` (seperti `Gaji/Upah`, `Perawatan Web/Sistem`, `Biaya Lain`, dll.).
  - **AND** metrik `totalKasKeluar` pada `calculateFinancialSummary` (`src/lib/financial-calculator.ts`) SHALL mencerminkan total akumulasi uang keluar menyeluruh (`totalDibayarKeVendor + totalBiayaOperasionalOrders + bebanOperasionalKas`), sehingga rumus pada kartu KPI **Dana Tersedia (Saldo Kas)** (`Dana Masuk - Dana Keluar = Saldo`) 100% konsisten secara matematis dengan angka pada kartu KPI **Dana Keluar** dan tab **Kas Keluar**.

- **US-9.32 (Complete Outflow Category Taxonomy & Filter Alignment with Firebase)**:
  - **WHEN** pengguna memfilter atau mencatat pengeluaran pada `CashOutflowSection` maupun `/cash-out/new`,
  - **THEN** kontrak tipe `CashOutflowCategory` (`src/types/index.ts`), palet warna grafik Donut (`CATEGORY_COLORS`), dropdown filter kategori (`CATEGORY_FILTER_OPTIONS`), dan opsi form input SHALL mendukung seluruh kategori yang ada di Firebase `appkonveksi` dan `visualkaindb`:
    * `Pembayaran Vendor` (DP & Pelunasan Produksi ke Mitra Vendor)
    * `Biaya Operasional Order` (Biaya Operasional Melekat pada Invoice Pesanan)
    * `Gaji/Upah`
    * `Perawatan Web/Sistem`
    * `Operasional`
    * `Transport/Ongkir`
    * `Pajak/Retribusi` (serta alias `Pajak`)
    * `Marketing dan Penjualan`
    * `Logistik`
    * `Keuangan`
    * `Biaya Lain`
  - **AND** pengguna SHALL dapat memfilter sumber pengeluaran berdasarkan tipe sumber: `Semua Sumber Pengeluaran`, `Pengeluaran Order (Vendor & Operasional PO)`, atau `Pengeluaran Kas Umum (Non-Order)` selain filter per kategori pos biaya.

- **US-9.33 (Order Reference Column, Detail Inspection Action & Complete Excel Export in Cash Outflow Table)**:
  - **WHEN** pengguna melihat daftar transaksi pada tabel/kartu `Riwayat Mutasi Dana Keluar` di `CashOutflowSection` maupun `MetricDetailDrawer`,
  - **THEN** setiap baris/kartu pengeluaran SHALL menampilkan informasi yang lengkap dan kaya konteks (setara dengan tab `Dana Masuk`):
    * **Tanggal Transaksi** (`YYYY-MM-DD`).
    * **Kategori Pos Beban** (Badge berwarna sesuai kategori).
    * **Referensi Order / Penerima Dana**: Menampilkan badge Nomor Invoice (`noInv`, misal `VK260039`) + Nama Mitra Vendor / Pelanggan untuk pengeluaran yang berasal dari `orders`, atau badge `KAS UMUM` untuk pengeluaran dari koleksi `kas`.
    * **Keterangan Rinci**: Rincian pembayaran atau keterangan kas manual.
    * **Jumlah (Rp)**: Nominal pengeluaran terformat Rupiah.
    * **Kolom Aksi Kontekstual**:
      - Jika pengeluaran berasal dari `orders` (`sumber === 'order'`), tampilkan tombol **`Detail Order`** (`Eye` icon) yang membuka `OrderInspectionDrawer` untuk menginspeksi pesanan terkait.
      - Jika pengeluaran berasal dari koleksi `kas` manual (`sumber === 'manual'`), tampilkan tombol **`Hapus`** (`Trash2` icon).
  - **AND** fungsi **Ekspor Excel** pada tab `Dana Keluar` (`exportCashOutflowToExcel` di `src/lib/excel-export.ts`) SHALL menyertakan kolom `No. Referensi / Invoice` dan `Mitra Vendor / Tujuan`.

- **US-9.34 (Client-First Dashboard Workflow: Quick Input Buttons, 6 Direct KPI Cards & Vendor Debt Coverage Status)**:
  - **WHEN** klien membuka halaman utama `Dashboard`,
  - **THEN** sistem SHALL menyediakan alur kerja yang menjawab langsung 2 kebutuhan utama klien:
    1. **Kemudahan Input Dana Masuk & Dana Keluar**:
       * Pada Header utama Dashboard, tampilkan tombol **`+ Dana Masuk`** (mengarahkan ke `/cash-in/new`) dan **`+ Dana Keluar`** (mengarahkan ke `/cash-out/new`) secara berdampingan dengan ukuran tap target ramah HP (`>= 40px`).
    2. **Kejelasan 6 Angka Utama & Status Cover Hutang Vendor**:
       * Susun 6 kartu metrik pada `FinanceStatsGrid.tsx` menjadi:
         1. **Dana Masuk** (`summary.totalKasMasuk` - membuka rincian seluruh uang masuk customer & kas masuk).
         2. **Dana Keluar** (`summary.totalKasKeluar` - membuka rincian seluruh uang keluar vendor, operasional order, & kas keluar).
         3. **Dana Tersedia (Saldo Kas)** (`summary.saldoKasRiil` - selisih `Dana Masuk - Dana Keluar`).
         4. **Sisa Customer (Piutang)** (`summary.totalPiutangCustomer` - sisa tagihan customer yang belum dibayar).
         5. **Sisa Hutang ke Vendor** (`summary.totalUtangVendor` - sisa kewajiban HPP ke vendor yang belum dilunasi).
         6. **Profit & Omzet (Realtime)** (`summary.totalProfitRealtime` beserta informasi nilai `Omzet` dan persentase margin).
       * Tampilkan panel ringkas **"Status Kecukupan Dana Terhadap Hutang Vendor"** tepat di bawah 6 kartu KPI yang menampilkan secara eksplisit:
         - **Dana yang Ada Saat Ini**: `formatRupiah(summary.saldoKasRiil)`
         - **Sisa Hutang ke Vendor**: `formatRupiah(summary.totalUtangVendor)`
         - **Status Kecukupan**: Badge jelas **`TERCOVER PENUH`** (jika `saldoKasRiil >= totalUtangVendor`) atau **`BELUM TERCOVER PENUH`** (jika `saldoKasRiil < totalUtangVendor`).
         - **Sisa / Kekurangan Dana**: Menampilkan nominal **`Sisa Dana Setelah Bayar Hutang Vendor (+Rp ...)`** jika tercover, atau **`Kekurangan Dana untuk Hutang Vendor (-Rp ...)`** beserta informasi bahwa masih ada **`Sisa Tagihan Customer (Rp ...)`** yang dapat ditagih untuk menutup kekurangan tersebut.


---

## Phase 8: Order-First Payment Ledger (Dana Masuk & Dana Keluar Vendor)

Sumber: feedback klien (13 Okt 2026). Layar `/cash-in/new` dan `/cash-out/new` harus selengkap halaman `/orders/[id]/edit` ketika terkait pesanan, jumlah termin mengikuti kebutuhan tiap proyek (bisa sampai 5x DP atau lebih), dan pembayaran vendor selalu bertumpu pada pesanan.

Prinsip praktik terbaik (subledger piutang/hutang per dokumen): pembayaran selalu dialokasikan ke satu dokumen (pesanan), outstanding terlihat sebelum input, tiap cicilan bernomor urut, dan pembayaran tidak boleh melebihi outstanding.

- **US-9.35 (Panel Ledger Lengkap pada Dana Masuk Mode Pesanan)**:
  - **WHEN** pengguna memilih mode `Pembayaran DP / Termin Pesanan` pada `/cash-in/new` dan memilih sebuah pesanan,
  - **THEN** sistem SHALL menampilkan, selain form nominal, tiga blok yang sama lengkapnya dengan bagian edit di tabel master:
    1. **Ringkasan Tagihan**: Total Invoice, Diskon, Sudah Dibayar, Sisa Pelunasan, dan Target 70% (sebagai indikator SOP, bukan pembatas jumlah termin).
    2. **Riwayat Termin**: daftar seluruh pembayaran pesanan terurut tanggal (kolom: No Termin, Tanggal, Label, Rekening dan Catatan, Nominal, Aksi) dengan total terkumpul. Tampil sebagai tabel di desktop dan kartu di layar < 640px.
    3. **Progres Pembayaran**: bar akumulasi dengan marker 70% dan badge `Siap Produksi` / `Menunggu 70%` yang ikut berubah saat nominal baru diketik (simulasi).
  - **AND** baris riwayat SHALL bisa diedit dan dihapus inline; perubahan hanya tersimpan ke Firestore saat tombol `Simpan Penerimaan` ditekan (indikator `Belum Disimpan` aktif selama ada perubahan).

- **US-9.36 (Termin Dinamis Tanpa Batas Tetap)**:
  - **WHEN** pengguna menambah pembayaran pada pesanan,
  - **THEN** sistem SHALL menomori otomatis `Termin ke-N` (N = jumlah pembayaran yang ada + 1) tanpa batas atas.
  - **AND** kolom `Label` SHALL berupa input teks dengan saran cepat (`DP 1`, `DP 2`, `DP 3`, `Termin 4`, `Pelunasan`) yang dihasilkan dari N, dan boleh diganti bebas oleh pengguna.
  - **AND** dropdown tetap tiga pilihan (`DP 1`, `DP 2 70%`, `Pelunasan 30%`) SHALL dihapus dari `/cash-in/new` dan dari form tambah termin di `/orders/[id]/edit`.
  - **AND** bila nominal yang diinput sama dengan sisa pelunasan, label saran SHALL otomatis menjadi `Pelunasan`.
  - **AND** field lama `jenis` (`dp` | `termin` | `pelunasan`) SHALL tetap diisi untuk kompatibilitas: termin pertama `dp`, termin yang melunasi `pelunasan`, lainnya `termin`.

- **US-9.37 (Guard Kelebihan Bayar dan Isian Cepat)**:
  - **WHEN** nominal pembayaran customer melebihi sisa pelunasan pesanan (atau nominal pembayaran vendor melebihi sisa HPP),
  - **THEN** tombol simpan SHALL diblokir dan pesan inline `Nominal melebihi sisa Rp ...` ditampilkan di bawah input.
  - **AND** tersedia tombol isian cepat: `Sisa penuh` (outstanding) dan, khusus customer yang belum mencapai 70%, `Sisa menuju 70%`.
  - **AND** pada pesanan yang sudah lunas, form input SHALL dinonaktifkan dengan keterangan `Pesanan sudah lunas`.

- **US-9.38 (Dana Keluar Vendor Berbasis Pesanan)**:
  - **WHEN** pengguna memilih mode `Pembayaran Mitra Vendor` pada `/cash-out/new`,
  - **THEN** langkah pertama SHALL berupa pilihan pesanan (wajib), dan `Mitra Vendor` terisi otomatis dari pesanan (read-only, tanpa dropdown vendor lepas).
  - **AND** sistem SHALL menampilkan ringkasan pesanan (Total HPP, Sudah Dibayar ke Vendor, Sisa Utang), riwayat pembayaran vendor bernomor urut (`Pembayaran ke-N`) dengan aksi edit dan hapus inline, progres pembayaran, serta aturan termin dinamis dan guard kelebihan bayar yang sama dengan US-9.36 dan US-9.37.
  - **AND** pembayaran vendor di luar pesanan SHALL dicatat lewat mode `Beban Operasional` dengan kategori `Pembayaran Vendor Lainnya`.
  - **AND** pesanan tanpa vendor (`vendorName` kosong atau `-`) SHALL tampil dengan peringatan dan tautan ke halaman edit order untuk menetapkan vendor sebelum pembayaran dicatat.

- **US-9.39 (Integritas Data dan Kompatibilitas)**:
  - **THEN** `CustomerPayment` dan `VendorPayment` SHALL memiliki field opsional `terminKe` dan `label`; data lama tanpa field tersebut tetap tampil dengan nomor dan label turunan dari urutan.
  - **AND** saat simpan, `totalUangMasukCustomer` dan `totalDibayarKeVendor` SHALL dihitung ulang sebagai jumlah daftar, dan `statusPembayaran` / `statusPembayaranVendor` diturunkan dari jumlah tersebut.
  - **AND** tanggal setiap baris SHALL `>= 2026-10-01` (US-9.30).
  - **AND** seluruh angka di dashboard (Dana Masuk, Dana Keluar, Sisa Customer, Sisa Hutang Vendor) SHALL berubah konsisten setelah penyimpanan.
