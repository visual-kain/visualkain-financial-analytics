# Requirements Specification — F-09: Client Feedback Refinements & Quality Bugfix Spec

## 1. Executive Context & Scope
Berdasarkan tinjauan langsung dari klien (Head of Finance & Accounting, Kak Glora) melalui 5 tangkapan layar pengujian, terdapat 6 poin perbaikan dan penyempurnaan antarmuka serta sinkronisasi data:

1. **Pembersihan Metrik Laporan Finansial (`US-9.1`)**:
   - Menghapus baris "Keuntungan Real (Manual)" pada cetak/tampilan laporan finansial (`FinanceReportPaper`), mempertahankan hanya estimasi profit bersih dan margin persentase agar tidak menimbulkan kebingungan interpretasi angka ganda.
2. **Aksi Edit pada Riwayat Pembayaran Termin Customer (`US-9.2`)**:
   - Menambahkan tombol aksi `Edit` (icon pensil) di kolom Aksi tabel cicilan customer pada modal `EditFinanceModal`, sehingga user dapat mengedit tanggal, jenis termin, rekening/keterangan, dan nominal jika terjadi salah input tanpa harus menghapus baris.
3. **Penyelesaian Bug Filter Periode Berubah-ubah (`US-9.3`)**:
   - Menyelaraskan filter bulan dan tahun pada header eksekutif `page.tsx` secara langsung dengan komponen `CashOutflowSection` dan `CashInflowSection`.
   - Memastikan grafik tren harian dan daftar transaksi hanya menampilkan mutasi pada bulan dan tahun yang dipilih (mengeliminasi data bulan lain yang meluber seperti pada tangkapan layar September vs Oktober).
4. **Transparansi Sumber Data Alokasi Escrow (`US-9.4`)**:
   - Menghubungkan Donut Chart "Alokasi Hak Dana (Escrow)" pada `AnalyticsCharts` dengan data dinamis real-time dari `filteredOrders` (menggantikan dummy mock data `Rp 1.120.000` / `686k vs 434k`).
   - Menyediakan tooltip/keterangan informatif eksplisit mengenai formula dan asal-usul data alokasi dana pokok vendor vs margin keuntungan.
5. **Kolom Pencarian Master Finansial Mobile & Desktop (`US-9.5`)**:
   - Menempatkan search bar yang selalu terlihat pada standard toolbar `MasterFinanceTable` (termasuk pada tampilan mobile HP) untuk mencari berdasarkan No. Invoice, Nama Customer, atau Nama Project.
6. **Paginasi Kartu & Tabel Master Finansial (`US-9.6`)**:
   - Menerapkan paginasi (page 1, 2, 3...) pada tampilan 2-grid kartu mobile dan tabel desktop (default 10 order per halaman), memotong beban scrolling panjang dari total 41+ order.

---

## 2. User Stories & Acceptance Criteria (RFC 2119)

- **US-9.1 (Remove Manual Profit Row)**:
  - **WHEN** komponen `FinanceReportPaper` dirender,
  - **THEN** sistem SHALL NOT menampilkan baris `Keuntungan Real (Manual)`.
  - **AND** sistem SHALL tetap menampilkan `Profit Bersih (Estimasi)` dan `Margin (%)`.

- **US-9.2 (Edit Action in Customer Payment History)**:
  - **WHEN** pengguna membuka modal `EditFinanceModal`,
  - **THEN** kolom Aksi pada tabel riwayat pembayaran termin customer SHALL menampilkan tombol `Edit` di samping tombol `Hapus`.
  - **WHEN** pengguna mengklik tombol `Edit`,
  - **THEN** sistem SHALL mengisi form input cicilan dengan data baris tersebut dan mengubah label tombol menjadi "Simpan Perubahan Termin".
  - **WHEN** form disimpan,
  - **THEN** data baris yang diedit SHALL diperbarui di dalam state `pembayaranList`.

- **US-9.3 (Period Filter Synchronization Bugfix)**:
  - **WHEN** pengguna mengubah filter Bulan atau Tahun pada header atas aplikasi,
  - **THEN** dataset dan grafik tren pada `CashOutflowSection` dan `CashInflowSection` SHALL secara instan memfilter hanya data pada periode terpilih.
  - **AND** grafik tren harian SHALL NOT menampilkan tanggal dari bulan lain di luar filter aktif.

- **US-9.4 (Dynamic Escrow Allocation & Source Transparency)**:
  - **WHEN** `AnalyticsCharts` dimuat di Dashboard,
  - **THEN** nilai Donut Chart "Alokasi Hak Dana (Escrow)" SHALL dihitung secara dinamis dari agregasi alokasi hak vendor dan alokasi margin seluruh order pada periode aktif (`calculateEscrowAllocation`).
  - **AND** sistem SHALL menyertakan teks keterangan transparansi audit sumber data di bawah grafik.

- **US-9.5 (Always-Visible Search Box)**:
  - **WHEN** pengguna berada di tab Dashboard pada tampilan mobile maupun desktop,
  - **THEN** `MasterFinanceTable` SHALL menampilkan kolom input pencarian dengan placeholder intuitif, icon search, dan tombol clear.
  - **AND** hasil kartu dan baris tabel SHALL terfilter secara instan saat pengguna mengetik.

- **US-9.6 (Client-Side Pagination for Mobile Cards & Table)**:
  - **WHEN** daftar order melebihi batas per halaman (10 order),
  - **THEN** sistem SHALL menampilkan tombol navigasi paginasi (`Prev`, `1`, `2`, `3...`, `Next`) di bagian bawah kartu/tabel.
  - **AND** kartu mobile hanya merender 10 kartu sesuai halaman aktif untuk kenyamanan scrolling di HP.
  - **AND** saat pencarian atau filter berubah, halaman aktif SHALL otomatis kembali ke halaman 1.
