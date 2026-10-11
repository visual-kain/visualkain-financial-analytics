# DOKUMEN SERAH TERIMA SISTEM & PANDUAN RESMI TATA KELOLA KEUANGAN
## VISUALKAIN FINANCIAL DATA & EXECUTIVE ANALYTICS SYSTEM (VERSI 2026)

---

**Nomor Dokumen:** VK/FIN-DOC/2026/X/001  
**Tanggal Penerbitan:** 11 Oktober 2026  
**Status Sistem:** *Production-Ready (Verified on Next.js 15.5 & Firebase Firestore)*  
**Klasifikasi:** Dokumen Rahasia & Operasional Internal (Confidential)  

| Pihak | Nama | Jabatan | Institusi |
|---|---|---|---|
| **Penerima Dokumen** | **Kak Glora** | Head of Finance & Accounting / Lead Keuangan | PT Visual Kain Indonesia |
| **Penyusun Sistem** | **Engineering & System Architecture Team** | Lead Software & Finance Systems Engineer | VisualKain Digital Platform |
| **Pengesahan Direksi** | **Executive Board** | Chief Executive & Operations | PT Visual Kain Indonesia |

---

## DAFTAR ISI

1. [Pernyataan Serah Terima & Ringkasan Eksekutif](#1-pernyataan-serah-terima--ringkasan-eksekutif)
2. [Latar Belakang Revamp & Pemisahan Domain Finansial](#2-latar-belakang-revamp--pemisahan-domain-finansial)
3. [Arsitektur Navigasi & Tinjauan Modul Utama (F-01 s/d F-06)](#3-arsitektur-navigasi--tinjauan-modul-utama-f-01-sd-f-06)
4. [Kompilasi Rumus Matematis & Logika Akuntansi Standar](#4-kompilasi-rumus-matematis--logika-akuntansi-standar)
5. [Standar Operasional Prosedur (SOP) Ambang Batas DP 70% Produksi](#5-standar-operasional-prosedur-sop-ambang-batas-dp-70-produksi)
6. [Mekanisme Pencatatan Multi-Termin Cicilan Pembayaran](#6-mekanisme-pencatatan-multi-termin-cicilan-pembayaran)
7. [Template Pesanan & Integrasi WhatsApp Follow-Up Otomatis](#7-template-pesanan--integrasi-whatsapp-follow-up-otomatis)
8. [Standarisasi Rekening Bank, Konstanta, dan Format Nominal](#8-standarisasi-rekening-bank-konstanta-dan-format-nominal)
9. [Panduan Operasional Harian Tim Finance (Step-by-Step SOP)](#9-panduan-operasional-harian-tim-finance-step-by-step-sop)
10. [Laporan Verifikasi Kualitas & Stabilitas Sistem](#10-laporan-verifikasi-kualitas--stabilitas-sistem)
11. [Lembar Pengesahan & Tanda Tangan Serah Terima](#11-lembar-pengesahan--tanda-tangan-serah-terima)

---

## 1. PERNYATAAN SERAH TERIMA & RINGKASAN EKSEKUTIF

Dokumen ini disusun secara formal sebagai laporan serah terima teknis dan panduan operasional definitif bagi **Kak Glora** selaku Head of Finance & Accounting PT Visual Kain Indonesia.

Sistem **VisualKain Financial Data & Executive Analytics** dibangun khusus untuk mengonsolidasikan seluruh arus kas masuk (*cash inflow*), arus kas keluar (*cash outflow*), kepatuhan pembayaran termin konsumen (*partial payment*), komitmen utang-piutang vendor konveksi, serta kalkulasi margin keuntungan aktual secara *real-time*.

### Sorotan Pencapaian Sistem Terkini:
1. **Pemisahan Penuh Beban Kerja Finansial**: Tim Finance tidak lagi dibebani oleh formulir potong teknis garmen (matrix ukuran XS-5XL, pola potong kain) yang sebelumnya tercampur di monolit sistem lama. Rincian produksi disajikan secara *read-only* sebagai konteks transaksi.
2. **Penegakan SOP Kritis Ambang Batas DP 70%**: Vendor garmen tidak diizinkan memotong atau menjahit kain sebelum konsumen menyelesaikan akumulasi uang muka minimal 70% dari nilai bersih invoice.
3. **Pencatatan Multi-Termin DP & Pelunasan**: Kemampuan mencatat cicilan bertahap (DP 1 tanda jadi, DP 2 pemenuhan 70%, dan Pelunasan akhir 30%) lengkap dengan catatan nomor rekening dan tanggal transaksi.
4. **Format Input Nominal Rupiah Baku (`Rp 1.420.000`)**: Seluruh formulir finansial telah dilengkapi pemisah ribuan otomatis dengan kursor halus, mencegah potensi kesalahan ketik nilai nol (*zero-digit human error*).
5. **Freeze Column & Mode Layar Penuh (Expanded Table)**: Tabel master finansial dilengkapi pembekuan kolom No. Invoice & Nama Customer, serta tombol ekspansi penuh untuk kenyamanan audit data besar.
6. **Follow-Up Tagihan 1-Klik via WhatsApp**: 3 draf pesan formal terintegrasi otomatis untuk menagih kekurangan DP, mengabarkan pesanan naik potong, dan konfirmasi pelunasan.

---

## 2. LATAR BELAKANG REVAMP & PEMISAHAN DOMAIN FINANSIAL

### 2.1. Permasalahan pada Sistem Terdahulu (`visualkaindb`)
Berdasarkan audit komparatif terhadap repositori terdahulu:
* **Tumpang Tindih Formulir**: Tim keuangan harus membuka formulir raksasa yang berisi pilihan bahan kaos, sablon, bordir, dan ukuran garmen hanya untuk memperbarui status DP atau biaya vendor.
* **Layout Kaku & Kurang Ergonomis**: Tata letak tabel lama terpotong pada layar berukuran standar laptop, tidak memiliki fitur pembekuan kolom penting saat di-scroll horizontal, dan navigasi tab tidak terstruktur.
* **Ketiadaan Riwayat Cicilan Finansial**: Pembayaran customer hanya berupa satu kolom angka kaku tanpa riwayat tanggal, saluran bank, atau kronologi termin.
* **Potensi Kerugian Akibat Pelanggaran SOP Produksi**: Tidak adanya peringatan visual otomatis saat pesanan dikerjakan sebelum mencapai batas aman modal produksi (70%).

### 2.2. Solusi Arsitektur Baru 2026
Dashboard baru dirancang berbasis *Single Responsibility Principle*:
* Antarmuka didedikasikan 100% untuk eksekutif dan staf akuntansi.
* Komponen dibangun menggunakan fondasi modern: **Next.js 15**, **Tailwind CSS**, **Radix UI**, **Recharts**, **Lucide Icons**, dan terhubung langsung ke **Firebase Firestore**.
* Desain visual elegan berstandar enterprise dengan palet Slate-Teal, tipografi tabular monospace untuk angka nominal, serta animasi mikro responsif.

---

## 3. ARSITEKTUR NAVIGASI & TINJAUAN MODUL UTAMA (F-01 s/d F-06)

Sistem dibagi ke dalam 5 sub-tab navigasi utama yang dapat diakses melalui Sidebar Rail interaktif:

```
┌────────────────────────────────────────────────────────────────────────┐
│ VISUALKAIN EXECUTIVE FINANCIAL DASHBOARD                               │
├───────────────┬────────────────────────────────────────────────────────┤
│ SIDEBAR RAIL  │ SUB-TAB VIEWPORT                                       │
│ [Ctrl + B]    │                                                        │
│               │ 1. [Overview & Arus Kas]                               │
│ • Arus Kas    │    - Escrow Liquidity Bar (Kas Riil vs Tertahan)       │
│ • Master Data │    - 6 Kartu Eksekutif Berstandar VisualKainDB:        │
│ • Pengeluaran │      1. Omzet (Realtime) (Lunas + Berjalan)            │
│ • Vendor      │      2. Profit (Realtime) (% Net Margin)               │
│ • Rekonsiliasi│      3. Saldo Periode (Kas Riil Masuk - Keluar)        │
│               │      4. Uang Keluar (Beban Operasional & Mutasi)       │
│               │      5. Utang Vendor (dengan Inline Vendor Select)     │
│               │      6. Outstanding Customer (Hak Tagih Piutang)       │
│ [Collapse <]  │    - 6 Slide-Over Inspection Drawers (Traceability Box)│
│               │    - Tombol 1-Klik WhatsApp Follow-Up Tagihan Konsumen │
│               │    - Grafik Tren Pendapatan vs Beban Bulanan           │
│               │                                                        │
│               │ 2. [Master Data Finansial (Orders)]                    │
│               │    - Dual Sticky Freeze Table (No. Inv & Customer)     │
│               │    - Kolom STATUS Order (Pill PRODUKSI & SELESAI)      │
│ [Collapse <]  │    - Fullscreen Expand Mode                            │
│               │    - 4 Aksi Cepat: Invoice, WhatsApp, Detail, Edit     │
│               │                                                        │
│               │ 3. [Beban Kas Keluar (Cash Outflow)]                   │
│               │    - Donut Chart Proporsi Beban per Kategori           │
│               │    - Drawer Pencatatan Kas Keluar Berformat Rp         │
│               │    - Ekspor Buku Kas ke Excel (.xlsx)                  │
│               │                                                        │
│               │ 4. [Performa & Intelijen Biaya Vendor]                 │
│               │    - Peringkat Vendor Termurah per Kategori Garmen     │
│               │    - Radar Utang & Komitmen Pembayaran Vendor          │
│               │                                                        │
│               │ 5. [Rekonsiliasi Profit & HPP Aktual Lapangan]         │
│               │    - Tabel Input Audit HPP & Profit Nyata              │
│               │    - Grafik Batang Deviasi Laba (Surplus vs Defisit)   │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

## 4. KOMPILASI RUMUS MATEMATIS & LOGIKA AKUNTANSI STANDAR

Bagian ini merangkum seluruh formula kalkulasi yang berjalan secara otomatis di dalam mesin komputasi sistem ([`src/lib/financial-calculator.ts`](/src/lib/financial-calculator.ts)):

### 4.1. Formula Tagihan Bersih Konsumen (Net Invoice)
$$\text{Net Invoice} = \text{Total Invoice Kotor} - \text{Diskon}$$
*Keterangan*: Nilai bersih yang menjadi dasar hak tagih riil kepada konsumen setelah potongan harga khusus/diskon pesanan.

### 4.2. Formula Akumulasi Uang Masuk Customer (Multi-Termin)
$$\text{Total DP Customer} = \sum_{i=1}^{n} \text{Nominal Cicilan}_i = \text{DP 1} + \text{DP 2} + \dots + \text{Pelunasan}$$
$$\% \text{ Pembayaran Konsumen} = \left( \frac{\text{Total DP Customer}}{\text{Net Invoice}} \right) \times 100\%$$

### 4.3. Formula Ambang Batas 70% Produksi (SOP Penjahit & Naik Potong)
$$\text{Target Ambang Batas DP 70\%} = 0.70 \times \text{Net Invoice}$$
$$\text{Sisa Menuju 70\%} = \max\left(0, \text{Target Ambang Batas DP 70\%} - \text{Total DP Customer}\right)$$
*Kaidah Logika*:
* Jika $\text{Total DP Customer} < \text{Target Ambang Batas DP 70\%}$: Sistem menandai status `PARSIAL (BELUM AMAN NAIK POTONG)` dan menampilkan indikator nominal kekurangan uang muka.
* Jika $\text{Total DP Customer} \ge \text{Target Ambang Batas DP 70\%}$: Sistem mengaktifkan status `SIAP POTONG / SIAP PRODUKSI` dan menerbitkan SPK resmi konveksi.

### 4.4. Formula Sisa Piutang / Pelunasan Konsumen (30% Akhir)
$$\text{Sisa Pelunasan Konsumen} = \max\left(0, \text{Net Invoice} - \text{Total DP Customer}\right)$$
*Keterangan*: Tagihan akhir yang wajib diselesaikan konsumen sebelum barang pesanan diserahkan/dikirimkan oleh tim logistik.

### 4.5. Formula Komitmen & Utang Mitra Vendor Garmen
$$\text{Sisa Utang ke Vendor} = \max\left(0, \text{Total Biaya HPP Vendor} - \text{Kas yang Telah Dibayar ke Vendor}\right)$$
$$\% \text{ Pemenuhan Vendor} = \left( \frac{\text{Kas yang Telah Dibayar ke Vendor}}{\text{Total Biaya HPP Vendor}} \right) \times 100\%$$

### 4.6. Formula Profitabilitas Estimasi (Gross & Nett Margin)
$$\text{Gross Profit (Laba Kotor)} = \text{Net Invoice} - \text{Total Biaya HPP Vendor}$$
$$\% \text{ Gross Profit Margin} = \left( \frac{\text{Gross Profit}}{\text{Net Invoice}} \right) \times 100\%$$
*Standar Perusahaan*: Target Gross Profit Margin minimal adalah **$\ge 30\%$**. Jika berada di bawah $30\%$, sistem menandai order tersebut sebagai margin tipis (*low margin warning*).

$$\text{Nett Profit (Laba Bersih Operasional)} = \text{Gross Profit} - \text{Biaya Operasional Invoice}$$

### 4.7. Formula Rekonsiliasi & Deviasi Laba Lapangan (Variance)
$$\text{Deviasi Margin Lapangan } (\Delta) = \text{Profit Aktual Lapangan} - \text{Target Margin Estimasi}$$
*Kaidah Klasifikasi*:
* Jika $\Delta \ge 0$: **Efisiensi Positif (Surplus)** $\rightarrow$ Ditampilkan pada diagram batang berwarna hijau emerald.
* Jika $\Delta < 0$: **Pembengkakan Biaya (Defisit / Loss)** $\rightarrow$ Ditampilkan pada diagram batang berwarna merah rose sebagai bahan audit ketidaksesuaian ongkos lapangan.

### 4.8. Formula Arus Kas Likuiditas Riil
$$\text{Saldo Kas Riil Akhir} = \text{Saldo Kas Awal} + \sum \text{Kas Masuk Riil} - \sum \text{Kas Keluar Operasional}$$

---

## 5. STANDAR OPERASIONAL PROSEDUR (SOP) AMBANG BATAS DP 70% PRODUKSI

Untuk menjamin likuiditas kas dan melindungi modal kerja dari risiko pembatalan konsumen sepihak, diberlakukan SOP Finansial yang tertanam secara kaku pada sistem:

```
[Konsumen Order] ───> [Pencatatan DP 1] ───> Apakah DP >= 70%?
                                                    │
                           ┌────────────────────────┴────────────────────────┐
                           ▼ TIDAK                                           ▼ YA
                [DP Masih Kurang]                                 [SOP 70% Terpenuhi]
                • Kain BELUM BOLEH dipotong                       • Bahan diizinkan naik potong & jahit
                • Tampilkan Badge Amber Alert                     • Terbitkan SPK Produksi Resmi
                • Kirim WhatsApp Penagihan 70%                    • Monitor progres hingga tahap finishing
```

### Ketentuan Mutlak bagi Staf Keuangan:
1. **Dilarang Keras Merilis SPK Meja Potong** kepada vendor/penjahit jika baris invoice di tabel masih berwarna kuning amber (*Kurang menuju 70%*).
2. **Prioritas Penagihan**: Hubungi PIC pemesan melalui tombol WhatsApp cepat segera setelah barang pesanan selesai di-proofing namun pembayaran belum mencapai 70%.

---

## 6. MEKANISME PENCATATAN MULTI-TERMIN CICILAN PEMBAYARAN

Modal Edit Finansial ([`EditFinanceModal.tsx`](/src/components/finance/EditFinanceModal.tsx)) menyediakan sub-tabel pencatatan termin cicilan secara kronologis.

### Atribut Setiap Baris Pembayaran:
* **Tanggal**: Tanggal diterimanya dana di rekening perusahaan (`YYYY-MM-DD`).
* **Jenis Termin**:
  * `DP 1 (Awal)`: Tanda jadi pembuatan sample / pengikatan slot antrean order.
  * `DP 2 (Tambahan)`: Uang muka lanjutan pemenuhan ambang batas 70% agar pesanan boleh dipotong.
  * `Pelunasan 30%`: Pembayaran akhir sebelum pengiriman produk garmen.
* **Saluran Rekening / Bank**: Identifikasi rekening tujuan (BCA / Mandiri / Kas Tunai).
* **Nominal (Rp)**: Angka uang masuk berformat ribuan otomatis.
* **Keterangan / Berita Acara**: Catatan nomor referensi transfer atau nama pengirim.

Setiap penambahan atau penghapusan baris termin secara otomatis menghitung ulang `totalUangMasukCustomer`, persentase DP, sisa tagihan, dan status order secara *real-time*.

---

## 7. TEMPLATE PESANAN & INTEGRASI WHATSAPP FOLLOW-UP OTOMATIS

Sistem menyediakan 3 template pesan WhatsApp resmi yang dipersonalisasi secara otomatis berdasarkan data pesanan, nomor invoice, dan rekening resmi perusahaan:

### Template 1: Penagihan Pemenuhan DP 2 (Menuju SOP 70% Naik Potong)
> *Halo Kak {namaCustomer}, terima kasih atas kepercayaannya pada VisualKain untuk project **{namaProject}**.*  
>  
> *Kami informasikan bahwa pesanan Invoice **{noInv}** saat ini telah selesai tahap proofing desain.*  
> *Sesuai SOP produksi garmen VisualKain, bahan pesanan siap dinaikkan ke meja potong & jahit setelah pembayaran mencapai minimal 70%.*  
>  
> *• Total Nilai Pesanan: **Rp {netInvoice}***  
> *• DP yang Telah Masuk: **Rp {nominalDp} ({dpPersen}%)***  
> *• **Kekurangan menuju DP 70%: Rp {sisaMenuju70}***  
>  
> *Pembayaran dapat ditransfer ke Rekening Resmi:*  
> *🏦 **BCA: 8830-1928-41** a.n. **PT VISUAL KAIN INDONESIA***  
>  
> *Mohon konfirmasi bukti transfer agar tim produksi dapat segera memproses jahitan. Terima kasih banyak Kak!*

---

### Template 2: Notifikasi SPK Naik Potong & Informasi Sisa Pelunasan 30%
> *Kabar baik Kak {namaCustomer}!*  
>  
> *Pembayaran DP 70% untuk Invoice **{noInv}** ({namaProject}) telah kami terima dan diverifikasi oleh bagian keuangan.*  
> *Saat ini Surat Perintah Kerja (SPK) resmi telah diterbitkan ke meja potong & jahit vendor kami.*  
>  
> *• Sisa Pelunasan 30%: **Rp {sisaPelunasan}***  
> *(Dapat diselesaikan saat barang memasuki tahap akhir finishing & sebelum pengiriman)*  
>  
> *Salam hangat, Tim VisualKain.*

---

### Template 3: Konfirmasi Pembayaran Lunas 100% & Kesiapan Pengiriman
> *Halo Kak {namaCustomer}, terima kasih banyak!*  
>  
> *Pembayaran pelunasan untuk Invoice **{noInv}** telah kami terima secara penuh (LUNAS 100%).*  
> *Pesanan garmen Anda saat ini sedang dikemas rapi dan diserahkan ke bagian logistik untuk pengiriman ke alamat tujuan.*  
>  
> *Resi dan foto paket akan segera kami kirimkan. Sukses selalu untuk event/project Anda!*

---

## 8. STANDARISASI REKENING BANK, KONSTANTA, DAN FORMAT NOMINAL

Seluruh konfigurasi keuangan terpusat pada file konstanta tunggal ([`src/lib/constants.ts`](/src/lib/constants.ts)) demi menjamin integritas data:

### 8.1. Rekening Bank Resmi Perusahaan
| Nama Bank | Nomor Rekening | Atas Nama | Peruntukan |
|---|---|---|---|
| **Bank Central Asia (BCA)** | **8830-1928-41** | **PT VISUAL KAIN INDONESIA** | Rekening Utama (Inflow Konsumen & DP) |
| **Bank Mandiri** | **137-00-1928-11** | **PT VISUAL KAIN INDONESIA** | Rekening Operasional & Pengeluaran Beban |
| **Kas Tunai** | - | Petty Cash Office | Operasional Harian Lapangan / Darurat |

### 8.2. Standar Format Mata Uang & Tipografi Angka Bersih
* **Prefix**: `Rp `
* **Pemisah Ribuan**: Titik (`.`)
* **Pemisah Desimal**: Koma (`,`)
* **Tipografi Angka Baku**: Menggunakan **Plus Jakarta Sans** dengan `tabular-nums`. Seluruh angka nol (`0`) tampil bersih dan bulat natural tanpa titik atau coretan di tengah, menjamin keterbacaan laporan eksekutif tanpa kesan font koding/programmer.
* **Format Sumbu Y Grafik**: Diformat ringkas dan proporsional (contoh: `Rp 2,4 jt`, `Rp 1,8 jt`, `Rp 600 rb`, `Rp 0`) dengan wadah sumbu horizontal yang lega sehingga tidak terjadi pembungkusan teks (*text wrapping*) yang canggung.

### 8.3. Parameter Threshold Keuangan
* `DP_THRESHOLD_PERCENT`: **70%** (Ambang batas wajib potong & jahit).
* `PELUNASAN_PERCENT`: **30%** (Ambang batas sebelum rilis pengiriman barang).
* `TARGET_MINIMUM_MARGIN_PERCENT`: **30%** (Ambang batas margin sehat perusahaan).

---

## 9. PANDUAN OPERASIONAL HARIAN TIM FINANCE (STEP-BY-STEP SOP)

Panduan praktis bagi Kak Glora dan staf keuangan dalam mengoperasikan dashboard:

### Skenario A: Menerima Pesanan Baru & Mencatat DP 1 Konsumen
1. Masuk ke sub-tab **Master Data Finansial**.
2. Cari pesanan berdasarkan nama customer atau nomor invoice pada kotak pencarian.
3. Klik tombol **Edit Finansial** (ikon pensil hijau) pada baris order yang dituju.
4. Periksa harga jual per pcs (lengan pendek / lengan panjang), total tagihan, dan diskon (jika ada).
5. Pada seksi **Riwayat Pembayaran Termin Customer**, klik tombol **Catat Pembayaran Baru**.
6. Pilih Tanggal transfer, pilih jenis `DP 1 (Awal)`, pilih bank penerima (BCA), ketik nominal yang ditransfer konsumen (otomatis terformat `Rp ...`), lalu klik **Simpan Baris Termin**.
7. Klik tombol utama **Simpan Data Finansial Order** di bagian bawah.
8. Status pesanan akan otomatis terbarui menjadi `Parsial (Kurang menuju 70%)`.

### Skenario B: Menindaklanjuti Penagihan Kekurangan DP 70%
1. Buka sub-tab **Master Data Finansial**.
2. Perhatikan kolom **STATUS DP / AMBANG BATAS 70%**. Baris berstatus kuning amber menunjukkan order yang belum memenuhi batas 70%.
3. Klik tombol **WhatsApp** (ikon hijau WA) pada baris tersebut.
4. Pilih opsi pesan: **1. Tagih DP 70%**.
5. Sistem akan otomatis membuka WhatsApp Web / Desktop dengan nomor HP konsumen dan draf pesan formal yang telah terisi rincian tagihan secara akurat.
6. Kirimkan pesan tersebut kepada konsumen.

### Skenario C: Menyetujui SPK Naik Potong & Jahit
1. Setelah konsumen mengirimkan bukti transfer DP 2, buka kembali modal **Edit Finansial**.
2. Tambahkan baris termin baru berjenis `DP 2 (Tambahan)`.
3. Setelah nominal tersimpan dan persentase pembayaran mencapai $\ge 70\%$, badge status otomatis berubah menjadi hijau **Siap Potong / Siap Produksi**.
4. Bagian produksi konveksi kini aman untuk memulai pemotongan kain.

### Skenario D: Mengontrol Pembayaran ke Vendor Konveksi
1. Pada modal **Edit Finansial**, lihat seksi **3. Komitmen Mitra Vendor & Biaya Pokok (HPP)**.
2. Masukkan total komitmen biaya vendor dan nominal kas yang telah dibayarkan VisualKain ke pihak vendor.
3. Sistem akan otomatis menampilkan **Sisa Utang Vendor**. Pastikan pelunasan vendor disesuaikan dengan termin penyelesaian barang di penjahit.

### Skenario E: Mencatat Kas Keluar Operasional & Ekspor Excel
1. Masuk ke sub-tab **Pengeluaran Beban (Cash Outflow)**.
2. Klik tombol **+ Catat Pengeluaran Baru**.
3. Pilih tanggal, pilih kategori beban (Operasional / Bahan Baku / Gaji / Logistik / Keuangan), tulis keterangan berita acara, dan masukkan nominal rupiah.
4. Klik **Simpan Transaksi Pengeluaran**.
5. Untuk audit mingguan/bulanan, klik tombol **Ekspor Excel (.xlsx)** di sudut kanan atas untuk mengunduh rekapitulasi pembukuan kas keluar.

### Skenario F: Melakukan Audit HPP Aktual & Rekonsiliasi Lapangan
1. Buka sub-tab **Rekonsiliasi Profit Aktual**.
2. Setelah pesanan selesai dikirim dan seluruh biaya riil lapangan tercatat, masukkan angka **HPP Aktual** dan **Profit Aktual** riil yang diperoleh.
3. Tuliskan catatan penting jika ada perubahan (misal: *Ongkir tambahan ditanggung vendor*).
4. Klik tombol **Simpan (Ikon Centang)** pada baris yang bersangkutan.
5. Grafik deviasi laba akan langsung memetakan apakah pesanan tersebut menghasilkan efisiensi surplus atau defisit.

---

## 10. LAPORAN VERIFIKASI KUALITAS & STABILITAS SISTEM

Sistem telah diuji secara komprehensif menggunakan instrumen pengujian otomatis berstandar enterprise:

| Jenis Pengujian | Alat Penguji (*Tool*) | Parameter Verifikasi | Hasil Akhir |
|---|---|---|---|
| **Validasi Kode TypeScript** | `tsc --noEmit` | Tipe data ketat (*strict typing*), 0 *any*, readonly safety | **PASS (0 Errors)** |
| **Unit Test Logika Finansial** | `vitest` | Akurasi rumus DP 70%, pelunasan, margin, dan deviasi laba | **PASS (5/5 Tests Passing)** |
| **Kompilasi & Build Produksi** | `next build` | Next.js 15.5 App Router, zero bundle warning, server prerender | **PASS (Exit Code 0)** |
| **Integritas Konteks SDD** | `context:validate` | Sinkronisasi spesifikasi teknis dan riwayat modul | **PASS (83 Docs Valid)** |

---

## 11. LEMBAR PENGESAHAN & TANDA TANGAN SERAH TERIMA

Dengan ditandatanganinya lembar ini, sistem **VisualKain Financial Data & Executive Analytics Versi 2026** dinyatakan telah diserahkan secara resmi untuk dipergunakan sebagai instrumen tata kelola keuangan utama PT Visual Kain Indonesia.

Diterbitkan di: **Bandung / Jakarta**  
Pada tanggal: **11 Oktober 2026**  

<br>

| Diserahkan Oleh, | Diterima & Disetujui Oleh, |
| :---: | :---: |
| <br><br><br>**<u>Engineering & System Architecture Team</u>**<br>Lead Finance Systems Architect | <br><br><br>**<u>Kak Glora</u>**<br>Head of Finance & Accounting / Lead Keuangan |

<br>

| Mengetahui & Mengesahkan, |
| :---: |
| <br><br><br>**<u>Board of Directors</u>**<br>PT Visual Kain Indonesia |
