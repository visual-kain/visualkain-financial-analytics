# Requirements Specification — F-05: Profit & HPP Aktual Reconciliation (Manual Override)

## 1. Executive Context & Scope
Modul Profit Aktual menyediakan antarmuka rekonsiliasi manual bagi staf finance VisualKain untuk:
1. Memasukkan angka **HPP Aktual** dan **Profit Aktual** yang sesungguhnya terjadi di lapangan setelah potongan atau biaya tak terduga (misal revisi sablon, kain tambahan, ongkir dadakan).
2. Memberikan catatan audit per pesanan (`Catatan Finance`).
3. Memperbarui kalkulasi laba riil secara instan dengan feedback tombol simpan per baris.

## 2. User Stories & Acceptance Criteria (RFC 2119)
- **US-5.1**: Tabel SHALL menampilkan daftar order dengan kolom `NO. INVOICE`, `TANGGAL`, `CUSTOMER`, `REVENUE`, `HPP ESTIMASI`, `HPP AKTUAL` (input), `PROFIT ESTIMASI`, `PROFIT AKTUAL` (input), `CATATAN` (input), dan `ACTION` (Simpan).
- **US-5.2**: Pengguna SHALL dapat mengedit nilai `HPP AKTUAL` dan `PROFIT AKTUAL` secara inline dengan format angka rupiah.
- **US-5.3**: Ketika tombol "Simpan" diklik, sistem SHALL memperbarui state dan menampilkan notifikasi toast keberhasilan (`sonner`).
- **US-5.4**: Sistem SHALL menyediakan filter input pencarian instan berdasarkan Nomor Invoice atau Nama Customer.
