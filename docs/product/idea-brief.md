---
status: approved
owner: "Pengembang & Manajemen Klinik Cikidang Medika"
created: "2026-09-18"
last_updated: "2026-09-18"
last_verified_commit: initial-scaffold
---

# Idea Brief: Sistem Informasi Manajemen Klinik Cikidang Medika

## Problem Statement

Klinik Cikidang Medika mengelola operasional kunjungan pasien, rekam medis harian, dan pembukuan kas menggunakan Google Sheets. Dengan riwayat yang telah mencapai **7.493 transaksi kunjungan (4.238 pasien unik)** dan terus bertambah, spreadsheet menjadi lambat, tidak memiliki validasi data input, rawan terhapus/tertimpa sel kasir secara tidak sengaja, dan memaksa petugas loket mengetik ulang identitas pasien lama yang datang berobat berulang kali.

## Affected Users

- **Petugas Pendaftaran & Kasir:** Menghadapi antrian di jam sibuk, kesulitan mencari nomor rekam medis lama dengan cepat, serta mencatat transaksi tunai/transfer.
- **Dokter Pemeriksa (dr. Ovan & dr. Neneng):** Butuh melihat riwayat berobat pasien sebelumnya dan mencatat diagnosa ICD-10 serta resep obat secara ringkas.
- **Pemilik / Pimpinan Klinik:** Memerlukan akses aman dari smartphone saat sedang berada di luar klinik untuk memantau omzet, pencairan kapitasi BPJS, pengeluaran operasional, dan saldo kas.

## Evidence

- 4 Berkas Spreadsheet Ekspor CSV per 18 September 2026 (`DASHBOARD - DATAUTAMA.csv`, `ANALISA.csv`, `QUERY.csv`, `DASHBOARD.csv`).
- 7.493 data transaksi aktual sejak 10 Agustus 2023 hingga 18 September 2026.
- Permintaan langsung dari pimpinan klinik melalui pesan WhatsApp untuk mencegah data "kececer" dengan batasan anggaran minim.

## Desired Outcome

Tersedianya aplikasi web terintegrasi yang:
1. Mengamankan seluruh data pasien dan riwayat periksa di database cloud terpusat.
2. Memangkas waktu pendaftaran pasien lama hingga di bawah 10 detik via fitur pencarian cepat.
3. Mengeliminasi kesalahan pengetikan nominal dan jenis pembayaran melalui kontrol antarmuka berbasis formulir klik (dropdown).
4. Menyediakan dashboard keuangan dan tombol ekspor laporan ke Excel (.xlsx) dengan 1 kali klik.
5. Biaya pemeliharaan server cloud adalah **Rp 0 / Bulan**.
