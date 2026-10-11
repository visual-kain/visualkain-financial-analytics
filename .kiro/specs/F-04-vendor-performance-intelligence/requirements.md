# Requirements Specification — F-04: Vendor Performance Intelligence & Cost Ranking

## 1. Executive Context & Scope
Modul Vendor Performance menyajikan analisis intelijen mitra konveksi dan vendor cetak/bordir VisualKain:
1. **Highlight Keunggulan Vendor**:
   - Vendor paling banyak dipakai berdasarkan volume pesanan dan total pcs.
   - Vendor termurah per kategori pakaian (Hoodie, Jaket, Jersey, Kemeja PDH, Kemeja PDL, Kemeja Workshirt, Polo Shirt, T Shirt, Topi).
2. **Tabel Perbandingan & Ranking Vendor**:
   - Membandingkan volume pesanan, total pcs, rata-rata variasi lengan, HPP quotation (harga order dibuat), HPP aktual (realisasi belanja), selisih quotation, total profit yang dihasilkan, dan rasio margin.

## 2. User Stories & Acceptance Criteria (RFC 2119)
- **US-4.1**: Sistem SHALL mengidentifikasi vendor paling banyak digunakan dan vendor dengan biaya terendah per kategori produk secara otomatis dari riwayat order.
- **US-4.2**: Sistem SHALL menghitung selisih quotation (`HPP Aktual - HPP Quotation`) untuk memantau apakah vendor mengalami pembengkakan biaya (overbudget).
- **US-4.3**: Tabel perbandingan SHALL mendukung sorting berdasarkan jumlah pesanan, total pcs, atau margin keuntungan.
