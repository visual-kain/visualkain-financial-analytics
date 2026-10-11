# Product Requirements Document (PRD) — VisualKain Financial Data & Analytics 2026

## 1. Executive Summary
VisualKain Financial Data & Analytics adalah sistem dasbor intelijen keuangan terpadu untuk mengevaluasi likuiditas kas riil, melacak alokasi pembayaran bertahap (DP, termin, pelunasan) dari konsumen, memonitor kewajiban utang vendor (HPP) tanpa menggerus margin laba kotor, dan menyajikan laporan eksekutif yang akurat. Modul ini sepenuhnya terpisah dari sistem inventori dan mesin produksi pabrik.

## 2. Core Functional Requirements
1. **Arus Kas Riil & Saldo Rekening Bank**:
   - Menghitung kas masuk riil dari seluruh pembayaran konsumen.
   - Menghitung kas keluar riil dari pengeluaran operasional dan pembayaran vendor.
   - Sinkronisasi saldo kas awal bank melalui entitas `KasAdjustment`.
2. **Alokasi Escrow Pokok Vendor vs Margin VisualKain**:
   - Pemisahan kantong dana otomatis pada setiap pembayaran masuk.
   - Bukti visual bahwa pembayaran vendor tidak mengurangi saldo margin keuntungan.
3. **Pelacakan Piutang Konsumen & Utang Vendor**:
   - Real-time outstanding debt per order & per vendor.
   - Outstanding receivables per konsumen invoice.
4. **Visualisasi Data & Grafik**:
   - Area chart spline interaktif untuk tren arus kas harian/bulanan.
   - Donut chart alokasi hak vendor vs margin bersih VisualKain.
5. **Ekspor & Pelaporan**:
   - Ekspor lembar kerja Excel (`.xlsx`) via SheetJS.
   - Lembar cetak laporan siap printer (`react-to-print`).
6. **Performa & Shimmer**:
   - Shimmer gradient animation saat memuat data kartu dan grafik.
