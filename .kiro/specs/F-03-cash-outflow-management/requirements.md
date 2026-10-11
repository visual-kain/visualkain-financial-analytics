# Requirements Specification — F-03: Cash Outflow Management & Category Breakdown

## 1. Executive Context & Scope
Modul Cash Outflow (Dana Keluar) bertanggung jawab memonitor seluruh pengeluaran kas operasional dan non-vendor VisualKain:
1. **4 KPI Metrik Pengeluaran**:
   - Total Dana Keluar (Periode Terpilih)
   - Kategori Terbesar (e.g., Gaji/Upah)
   - Jumlah Kategori Aktif
   - Rata-rata per Transaksi
2. **Visualisasi Analitik Modern**:
   - Donut Chart: Komposisi Beban per Pos Pengeluaran.
   - Daily Trend Bar Chart: Tren Pengeluaran Harian untuk mendeteksi spike pencairan/payroll.
3. **Dedicated Filter Toolbar & Pencarian**:
   - Live Search Box untuk mencari berdasarkan keterangan, nomor voucher, atau tanggal.
   - CustomSelect Kategori Beban untuk menyaring transaksi per divisi.
   - Tombol Reset Filter dan metric counter pill yang reaktif.
4. **Riwayat Dana Keluar (Mutasi Kas Keluar)**:
   - Tabel: `TANGGAL`, `KATEGORI`, `KETERANGAN`, `JUMLAH`, `AKSI (Hapus)` dengan empty state ilustratif.
5. **Input Transaksi & Ekspor**:
   - Form drawer `+ Catat Pengeluaran` dengan CustomSelect kategori beban.
   - Ekspor laporan Excel formatted `.xlsx`.

## 2. User Stories & Acceptance Criteria (RFC 2119)
- **US-3.1**: Sistem SHALL menghitung total dana keluar dan mengidentifikasi kategori terbesar secara deterministik dari dataset kas keluar yang tersaring.
- **US-3.2**: Pengguna SHALL dapat memfilter mutasi pengeluaran melalui search bar dan dropdown kategori dengan pembaruan otomatis pada chart dan KPI cards.
- **US-3.3**: Pengguna SHALL dapat menghapus transaksi kas keluar dengan feedback toast instan.
- **US-3.4**: Pengguna SHALL dapat menambahkan mutasi pengeluaran kas baru melalui form drawer ber-CustomSelect.
- **US-3.5**: Tombol `Export Excel` SHALL menghasilkan file spreadsheet berisi tabel transaksi yang difilter.
