# Requirements Specification — F-06: Financial Order Editor & Multi-Termin DP Management

## 1. Executive Context & Scope
Berdasarkan hasil audit mendalam terhadap sistem acuan `visualkaindb` dan arahan resmi dalam **Dokumen Konfirmasi Fitur & Arsitektur Finansial VisualKain (Oktober 2026)**:
1. **Penetapan Harga Jual & Tagihan Konsumen**: Mengatur nilai tagihan invoice, harga per jenis lengan (Pendek, Panjang, Tanpa Lengan), diskon khusus, dan beban operasional langsung per pesanan.
2. **Pencatatan Multi-Termin DP Konsumen (Partial Cash In)**: Mengelola sub-tabel riwayat pembayaran konsumen secara bertahap (DP 1 Awal, DP 2 Tambahan menuju 70%, dan Pelunasan Akhir 30%), mencatat tanggal, nominal, dan rekening penerima (BCA, Mandiri, dll.).
3. **Penegakan SOP Kritis Ambang Batas DP 70% Produksi**:
   - Bahan garmen tidak boleh dipotong dan dijahit oleh vendor sebelum DP mencapai minimal 70% dari nilai bersih tagihan (`netInvoice = totalInvoice - diskon`).
   - Sistem secara otomatis menghitung selisih gap:
     $$\text{sisaMenujuDp70} = \max\left(0, (0.7 \times \text{netInvoice}) - \text{nominalDpCustomer}\right)$$
4. **Penetapan Beban Pokok & Utang Vendor (HPP)**: Menunjuk vendor mitra (AMRIN, CAHAYA BORDIR, FJ MERCHANDISE, dll.), menetapkan total modal HPP, mencatat DP kas keluar ke vendor, dan melacak sisa utang vendor yang belum terbayar.
5. **Dokumentasi & Cetak Faktur (Invoice/SPK)**: Menampilkan lembar invoice resmi dengan tabel riwayat pembayaran transparan dan peringatan kekurangan DP 70% sesuai Bagian 3.C dokumen konfirmasi.
6. **Follow-Up (FU) WhatsApp Dinamis**: Mengintegrasikan 3 template pesan resmi WhatsApp sesuai Bagian 3.D dokumen konfirmasi untuk menagih sisa DP 2 menuju 70%, memberi notifikasi resmi SPK naik jahit, atau konfirmasi pelunasan pengiriman.

---

## 2. User Stories & Acceptance Criteria (RFC 2119)

### US-6.1: Sub-Tabel Riwayat Termin DP Interaktif di Form Edit Order
- **Kebutuhan**: User keuangan dapat mencatat pembayaran cicilan/termin bertahap (DP 1, DP 2, Pelunasan) langsung di dalam `EditFinanceModal` tanpa reload halaman.
- **Acceptance Criteria**:
  - Modal SHALL menampilkan kartu ringkasan spesifikasi garmen (Total Qty, Bahan, Warna, Metode Sablon/Bordir) secara *read-only*.
  - Modal SHALL menyediakan form penetapan harga jual:
    - Harga Jual Pendek (Rp)
    - Harga Jual Panjang (Rp)
    - Total Nilai Tagihan (Rp)
    - Diskon Pesanan (Rp)
  - Modal SHALL memuat sub-tabel `pembayaranList` dengan kolom:
    - Tanggal Pembayaran
    - Jenis Termin (`DP 1`, `DP 2 / Tambahan`, `Pelunasan 30%`)
    - Keterangan & Rekening Penerima
    - Nominal (Rp)
    - Tombol Hapus Baris
  - Form penambahan termin SHALL memvalidasi nominal > 0 dan secara otomatis menjumlahkan `nominalDpCustomer = sum(pembayaranList.nominal)`.
  - Kalkulasi margin & status badge SHALL menghitung secara real-time:
    - Net Invoice = `max(0, totalInvoice - diskon)`
    - Sisa Pelunasan Customer = `max(0, netInvoice - nominalDpCustomer)`
    - Sisa Utang Vendor = `max(0, totalBiayaVendor - dpVendor)`
    - Sisa Menuju 70% = `max(0, 0.7 * netInvoice - nominalDpCustomer)`
    - Profit Bersih = `netInvoice - totalBiayaVendor - biayaOperasional`
    - Margin % = `Profit Bersih / netInvoice * 100`

### US-6.2: Sinkronisasi Real-Time ke Firebase Firestore
- **Kebutuhan**: Ketika tombol "Simpan Perubahan Finansial" ditekan, data disimpan ke Firestore dan langsung memutasi state lokal secara reaktif.
- **Acceptance Criteria**:
  - Mutasi SHALL memutasi field `pembayaranList`, `totalUangMasukCustomer`, `totalInvoice`, `diskon`, `biayaOperasional`, `totalHpp`, `totalDibayarKeVendor`, dan `statusPembayaran`.
  - Dashboard master table, 6 KPI cards, dan Escrow Liquidity Bar SHALL merefleksikan perubahan seketika.

### US-6.3: Tampilan Dokumen Invoice Resmi dengan Riwayat Pembayaran (Bagian 3.C)
- **Kebutuhan**: Pratinjau invoice cetak memuat tabel riwayat pembayaran customer diterima dan highlight tebal kekurangan DP 70%.
- **Acceptance Criteria**:
  - Lembar invoice SHALL menampilkan daftar pembayaran bertahap:
    - `[✓] DP 1 (Tanggal ... via ...) : Rp ... (X%)`
    - `[✓] DP 2 (Tanggal ... via ...) : Rp ... (X%)`
  - Total Uang Muka Diterima SHALL ditampilkan berdampingan dengan syarat DP 70%.
  - Jika $\text{DP} < 70\%$, invoice SHALL menampilkan kotak peringatan:
    `⚠ Kekurangan DP untuk Naik Produksi: Rp [sisaMenujuDp70] (Menunggu pelunasan DP agar bahan dapat dipotong)`
  - Jika $70\% \le \text{DP} < 100\%$, invoice SHALL menampilkan notifikasi:
    `✓ Syarat Uang Muka Produksi Terpenuhi (Bahan Naik Jahit) • Sisa Pelunasan Saat Barang Selesai (30%): Rp [sisaPelunasan]`
  - Invoice SHALL memuat nomor rekening resmi PT Visual Kain Indonesia (Bank BCA: 8830-1928-41).

### US-6.4: WhatsApp Follow-Up Dinamis (Bagian 3.D)
- **Kebutuhan**: Tombol WhatsApp di drawer inspeksi dan tabel master data secara cerdas menghasilkan draf pesan sesuai status pelunasan.
- **Acceptance Criteria**:
  - Jika $\text{DP} < 70\%$, pesan SHALL menagih sisa kekurangan DP 2 agar antrean potong & jahit dapat dijalankan hari ini.
  - Jika $70\% \le \text{DP} < 100\%$, pesan SHALL mengabarkan barang resmi naik produksi dan menginformasikan sisa pelunasan 30% saat barang beres.
  - Jika $\text{DP} = 100\%$, pesan SHALL mengonfirmasi lunas total dan kesiapan pengiriman.
