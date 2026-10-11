# Requirements Specification — F-02: Executive Financial Dashboard, Liquidity Bar & Inspection Drawer

## 1. Executive Context & Scope
Financial Dashboard dirancang ulang total untuk meninggalkan layout kaku dan berantakan ala Excel lama `visualkaindb`:
1. **Escrow Liquidity Bar (Kas Aman Ditarik)**:
   - Visualisasi bar real-time yang memisahkan:
     * **Kas Aman Ditarik (Free Cash Flow / Dividen)**: Margin bersih yang sudah terealisasi di bank.
     * **Dana Pokok Terkunci Vendor**: Uang titipan dari DP customer yang haram dipakai operasional.
     * **Cadangan Beban Operasional**: Dana yang dialokasikan untuk operasional bulanan.
2. **Master Finance Table Modern (Grouped Headers & Fullscreen Expand)**:
   - Menghapus warna-warni pastel kaku visualkaindb, digantikan dengan grouped column header yang bersih:
     * *Informasi Pesanan*: NO INV (frozen left-0) & Customer (frozen left-128px).
     * *Komitmen Vendor*: Total HPP, DP Vendor, Sisa Utang.
     * *Pembayaran Konsumen*: Total Tagihan, DP %, Sisa Pelunasan, Status Threshold.
     * *Laba*: Profit Bersih & Margin %.
     * *Kolom AKSI (Sticky Right)*: Pratinjau Invoice/Dokumen (Biru), Edit Finansial (Pensil Hijau), Detail Cicilan (Mata Abu), Tagih WA (DP < 70%).
   - Mode Fullscreen Expand: Menampilkan tabel layar penuh dengan filter terpadu Status DP & Utang Vendor, live search, shortcut Escape, dan ekspor data.
3. **1-Click WhatsApp Follow-Up Generator**:
   - Membaca `noWaCustomer` dari database order.
   - Menghasilkan tautan `https://wa.me/62...` dengan teks penagihan sopan otomatis yang mencantumkan sisa nominal menuju DP 70% produksi.
4. **Slide-Over Inspection Drawer**:
   - Mengklik baris order atau tombol detail membuka drawer samping kanan yang memperlihatkan riwayat transaksi cicilan (DP 1, DP 2, Pelunasan), catatan vendor, dan action button.

## 2. User Stories & Acceptance Criteria (RFC 2119)
- **US-2.1**: Sistem SHALL menampilkan Escrow Liquidity Bar yang menunjukkan persentase dana aman ditarik vs dana terkunci vendor secara real-time.
- **US-2.2**: Master table SHALL menggunakan tipografi monospaced `JetBrains Mono` untuk seluruh nominal rupiah dan status badge terstandardisasi (`belum_dp`, `dp1_parsial`, `dp2_siap_produksi`, `lunas_total`).
- **US-2.3**: Master table SHALL mengunci kolom NO INV dan Customer di sebelah kiri dan kolom AKSI di sebelah kanan saat horizontal scrolling.
- **US-2.4**: Kolom AKSI SHALL memfasilitasi 4 aksi: Pratinjau Faktur, Edit Finansial, Inspeksi Cicilan, dan Tagih WA.
- **US-2.5**: Tombol "WA Follow-Up" SHALL langsung membuka aplikasi WhatsApp atau web dengan pesan penagihan yang telah terisi otomatis sesuai target DP 70%.
- **US-2.6**: Mengklik baris order atau tombol detail SHALL memicu Slide-Over Inspection Drawer tanpa mengganggu tampilan tabel utama.
