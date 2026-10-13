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
7. **Otentikasi Khusus & Sapaan Eksekutif Kak Glora**: Dilengkapi halaman login elegan dengan hint email otomatis (`glora.sawita@visualkain.com`), password note (`Glora32145`), dan sapaan personal eksklusif *"Ibu Glora"* (Head of Finance & Accounting) di dashboard.
8. **Pengakuan DP Kas Riil Real-Time & Aturan Peringatan Defisit**: Setiap uang DP atau termin cicilan yang diterima langsung diakui dan menambah saldo kas riil saat itu juga (tidak di-hold sampai lunas). Jika kas mengalami posisi minus, sistem secara otomatis menampilkan warna **Merah Rose Warning** dengan ikon bahaya informatif.
9. **Sinkronisasi 100% Database Live Firebase**: Menarik seluruh 41 data order live (VK260001 s/d VK260041), seluruh rekanan vendor (Sablon, Bordir, CMT), dan mutasi kas keluar secara lengkap tanpa ada transaksi yang terlewat.

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

## 4. KOMPILASI LENGKAP RUMUS MATEMATIS & LOGIKA FINANSIAL DI SELURUH TAB (TAB 1 S/D TAB 5)

Bagian ini menyajikan secara komprehensif seluruh rumus matematis dan aturan akuntansi yang diterapkan di setiap tab sistem ([`src/lib/financial-calculator.ts`](/src/lib/financial-calculator.ts) & [`src/lib/calculations.ts`](/src/lib/calculations.ts)):

---

### 4.1. TAB 1: OVERVIEW & ARUS KAS EKSEKUTIF (F-01)

#### A. Omzet Realtime (Gross Revenue)
$$\text{Omzet Realtime} = \sum_{k=1}^N \text{Net Invoice}_k$$
* **Omzet Lunas**: $\sum \text{Net Invoice}_k \quad (\text{untuk order dengan Sisa Piutang} = 0)$
* **Omzet Berjalan**: $\sum \text{Net Invoice}_k \quad (\text{untuk order dengan Sisa Piutang} > 0)$

#### B. Profit Realtime & Net Profit Margin (%)
$$\text{Total Profit Realtime} = \sum_{k=1}^N \text{Net Profit Estimasi SPK}_k$$
$$\% \text{ Net Profit Margin} = \left( \frac{\text{Total Profit Realtime}}{\text{Omzet Realtime}} \right) \times 100\%$$

#### C. Saldo Periode (Kas Riil Bank Rekening VisualKain)
$$\text{Saldo Kas Riil Bank} = \text{Saldo Awal} + \sum \text{Kas Masuk Riil Customer (DP + Cicilan)} - \sum \text{Kas Dibayar ke Vendor} - \sum \text{Beban Operasional Kas}$$
* **Aturan Pengakuan DP**: DP langsung masuk hitungan kas riil secara real-time saat dana ditransfer (tidak di-hold sampai order lunas).
* **Aturan Visual Defisit**: Jika saldo kas bernilai minus ($< 0$), sistem secara kaku merender warna **Merah Rose Warning** (`border-rose-200 bg-rose-50 text-rose-700`).

#### D. Uang Keluar (Total Beban Kas)
$$\text{Total Uang Keluar} = \sum_{j=1}^M \text{Nominal Transaksi Keluar}_j$$
$$\text{Rata-Rata Kas Keluar} = \frac{\text{Total Uang Keluar}}{M} \quad (M = \text{Jumlah Transaksi Keluar})$$

#### E. Total Utang Vendor (Global & per Mitra)
$$\text{Utang Vendor Global} = \sum_{k=1}^N \max\left(0, \text{Total HPP Vendor}_k - \text{Kas Telah Dibayar ke Vendor}_k\right)$$
$$\text{Sisa Utang Vendor } V = \sum_{k \in V} \max\left(0, \text{Total HPP}_k - \text{Kas Dibayar}_k\right)$$

#### F. Outstanding Customer (Hak Tagih Piutang Global)
$$\text{Outstanding Customer} = \sum_{k=1}^N \max\left(0, \text{Net Invoice}_k - \text{Total Uang Masuk Customer}_k\right)$$

#### G. Escrow Liquidity Bar (Dua Kantong Alokasi Proporsional)
$$\text{Rasio HPP Vendor} = \frac{\text{Total HPP}}{\text{Net Invoice}}, \quad \text{Rasio Margin} = \frac{\text{Target Margin}}{\text{Net Invoice}}$$
$$\text{Alokasi Pokok Vendor (Kantong A)} = \text{Uang Masuk Riil Customer} \times \text{Rasio HPP Vendor}$$
$$\text{Alokasi Margin Bersih VisualKain (Kantong B)} = \text{Uang Masuk Riil Customer} \times \text{Rasio Margin}$$
$$\text{Estimasi Profit Bersih Terealisasi Global} = \sum \text{Alokasi Margin VisualKain} - \text{Beban Operasional Non-Vendor}$$

---

### 4.2. TAB 2: MASTER DATA FINANSIAL (ORDERS LEDGER & RINCIAN SPK) (F-02)

#### A. Matriks Ukuran Garmen & Harga Ekstra Ukuran Besar
Untuk setiap kategori $c \in \{\text{Pendek, Panjang, Tanpa Lengan}\}$ dan ukuran $s \in \{\text{XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL}\}$:
$$\text{Ekstra Harga}(s) = \begin{cases} 
0 & \text{untuk XS, S, M, L, XL} \\
5.000 & \text{untuk 2XL} \\
10.000 & \text{untuk 3XL} \\
15.000 & \text{untuk 4XL} \\
20.000 & \text{untuk 5XL}
\end{cases}$$
$$\text{Grand Total Qty} = \sum_{c} \sum_{s} \text{Qty}(c, s)$$
$$\text{Grand Total Jual (Kotor)} = \sum_{c} \sum_{s} \Big[ \text{Qty}(c, s) \times \big(\text{Harga Jual Dasar}(c) + \text{Ekstra Harga}(s)\big) \Big]$$
$$\text{Grand Total Modal Vendor} = \sum_{c} \sum_{s} \Big[ \text{Qty}(c, s) \times \big(\text{Harga Modal Vendor}(c) + \text{Ekstra Harga}(s)\big) \Big]$$

#### B. Net Invoice (Nilai Tagihan Bersih Konsumen)
$$\text{Net Invoice} = \text{Grand Total Jual} - \text{Diskon} + \text{Biaya Tambahan Customer}$$

#### C. Total HPP Vendor Sah (Beban Pokok Produksi)
$$\text{Total HPP Vendor} = \text{Grand Total Modal Vendor} + \text{Biaya Tambahan Vendor (Sablon, Bordir, Ekspedisi, Packaging)}$$

#### D. Gross Profit & % Gross Profit Margin
$$\text{Gross Profit} = \text{Net Invoice} - \text{Total HPP Vendor}$$
$$\% \text{ Gross Profit Margin} = \left( \frac{\text{Gross Profit}}{\text{Net Invoice}} \right) \times 100\% \quad (\text{Batas Sehat } \ge 30\%)$$

#### E. Net Profit Estimasi SPK (Laba Bersih Sah SPK)
$$\text{Net Profit Estimasi SPK} = \text{Gross Profit} - \text{Biaya Operasional SPK}$$
$$\% \text{ Net Profit Margin} = \left( \frac{\text{Net Profit Estimasi SPK}}{\text{Net Invoice}} \right) \times 100\%$$

#### F. Akumulasi Multi-Termin Cicilan Customer
$$\text{Total Uang Masuk Customer} = \sum_{i=1}^m \text{Nominal Cicilan}_i = \text{DP 1} + \text{DP 2} + \dots + \text{Pelunasan}$$
$$\% \text{ Pembayaran Customer} = \left( \frac{\text{Total Uang Masuk Customer}}{\text{Net Invoice}} \right) \times 100\%$$

#### G. SOP Ambang Batas 70% Produksi (Naik Meja Potong)
$$\text{Target Ambang Batas 70\%} = 0.70 \times \text{Net Invoice}$$
$$\text{Kekurangan Menuju 70\% (Nominal Tagih FU WA)} = \max\left(0, \text{Target 70\%} - \text{Total Uang Masuk Customer}\right)$$
*Kaidah Matrix Status Finansial*:
* `BELUM DP (0%)`: $\text{Uang Masuk} = 0$
* `DP 1 PARSIAL (KURANG MENUJU 70%)`: $0 < \text{Uang Masuk} < \text{Target 70\%}$ $\rightarrow$ **Kain Dilarang Dipotong**
* `DP 2 LENGKAP (70% - SIAP POTONG)`: $\text{Target 70\%} \le \text{Uang Masuk} < \text{Net Invoice}$ $\rightarrow$ **SPK Resmi Rilis ke Vendor**
* `LUNAS TOTAL (100%)`: $\text{Uang Masuk} \ge \text{Net Invoice}$ $\rightarrow$ **Barang Siap Dikirim**

#### H. Sisa Pelunasan Konsumen (30% Akhir)
$$\text{Sisa Pelunasan} = \max\left(0, \text{Net Invoice} - \text{Total Uang Masuk Customer}\right)$$

#### I. Komitmen & Pemenuhan Pelunasan Vendor
$$\text{Sisa Utang ke Vendor} = \max\left(0, \text{Total HPP Vendor} - \text{Kas Telah Dibayar ke Vendor}\right)$$
$$\% \text{ Pelunasan Vendor} = \left( \frac{\text{Kas Telah Dibayar ke Vendor}}{\text{Total HPP Vendor}} \right) \times 100\%$$

---

### 4.3. TAB 3: BEBAN KAS KELUAR (CASH OUTFLOW) (F-03)

#### A. Total Pengeluaran Kas
$$\text{Total Dana Keluar} = \sum_{t \in \text{Filtered}} \text{Nominal Transaksi}_t$$

#### B. Rata-Rata Kas Keluar per Transaksi
$$\text{Rata-Rata Transaksi} = \frac{\text{Total Dana Keluar}}{\text{Jumlah Transaksi Keluar}}$$

#### C. Proporsi Pengeluaran per Kategori (Donut Chart %)
$$\% \text{ Beban Kategori } K = \left( \frac{\sum_{t \in K} \text{Nominal}_t}{\text{Total Dana Keluar}} \right) \times 100\%$$

#### D. Kategori Beban Terbesar
$$\text{Kategori Terbesar} = \arg\max_K \left( \sum_{t \in K} \text{Nominal}_t \right)$$

#### E. Puncak Kas Keluar (Peak Outflow Spike)
$$\text{Akumulasi Harian Tanggal } D = \sum_{t \in D} \text{Nominal}_t$$
$$\text{Puncak Kas Keluar} = \max_D (\text{Akumulasi Harian Tanggal } D)$$

---

### 4.4. TAB 4: PERFORMA & INTELIJEN BIAYA VENDOR (F-04)

#### A. Rata-Rata Harga Modal Vendor per Tipe Lengan Garmen
Untuk setiap vendor $v$:
$$\overline{P}_{\text{pendek}}(v) = \frac{\sum \text{Harga Modal Lengan Pendek}(v)}{n_{\text{pendek}}(v)}$$
$$\overline{P}_{\text{panjang}}(v) = \frac{\sum \text{Harga Modal Lengan Panjang}(v)}{n_{\text{panjang}}(v)}$$
$$\overline{P}_{\text{tanpaLengan}}(v) = \frac{\sum \text{Harga Modal Tanpa Lengan}(v)}{n_{\text{tanpaLengan}}(v)}$$

#### B. Penentuan Vendor Termurah per Tipe Lengan
$$\text{Vendor Termurah Lengan Pendek} = \arg\min_{v} \left( \overline{P}_{\text{pendek}}(v) \right) \quad (\text{untuk } \overline{P} > 0)$$
$$\text{Vendor Termurah Lengan Panjang} = \arg\min_{v} \left( \overline{P}_{\text{panjang}}(v) \right) \quad (\text{untuk } \overline{P} > 0)$$
$$\text{Vendor Termurah Tanpa Lengan} = \arg\min_{v} \left( \overline{P}_{\text{tanpaLengan}}(v) \right) \quad (\text{untuk } \overline{P} > 0)$$

#### C. Biaya Rata-Rata per Pcs per Kategori Produk Garmen
Untuk setiap kategori garmen $G$ (Kemeja, Kaos, Polo, Jaket) dan vendor $v$:
$$\text{Biaya Rata-Rata per Pcs}(G, v) = \frac{\sum \text{HPP}(G, v)}{\sum \text{Pcs Total}(G, v)}$$
$$\text{Vendor Paling Efisien per Kategori } G = \arg\min_v \Big(\text{Biaya Rata-Rata per Pcs}(G, v)\Big)$$

#### D. Selisih Deviasi Biaya Vendor (Quotation vs Realisasi HPP)
$$\text{Deviasi HPP Vendor}(v) = \sum \text{HPP Aktual}(v) - \sum \text{HPP Quotation Estimasi}(v)$$

#### E. Margin Keuntungan per Mitra Vendor
$$\% \text{ Margin Vendor}(v) = \left( \frac{\text{Total Profit}(v)}{\text{Total Revenue}(v)} \right) \times 100\%$$

#### F. Mitra Vendor Paling Sering Digunakan (Most Used Vendor)
$$\text{Vendor Terbanyak Order} = \arg\max_v \big(\text{Jumlah Order}(v)\big)$$

---

### 4.5. TAB 5: REKONSILIASI PROFIT AKTUAL & AUDIT VARIANS (F-05)

#### A. Total Profit Estimasi SPK (SSOT Benchmark)
$$\text{Total Profit Estimasi} = \sum_{k=1}^N \text{Target Net Profit SPK}_k$$

#### B. Total Profit Aktual (Realisasi Bersih Lapangan)
$$\text{Profit Aktual Order}_k = \begin{cases} 
\text{profitAktual}_k & \text{jika telah diinput manual oleh Finance} \\
\text{Target Net Profit SPK}_k & \text{jika belum diinput (default)}
\end{cases}$$
$$\text{Total Profit Aktual} = \sum_{k=1}^N \text{Profit Aktual Order}_k$$

#### C. Net Deviasi Margin Global (Audit Delta Net)
$$\Delta_{\text{Net}} = \text{Total Profit Aktual} - \text{Total Profit Estimasi}$$
* Jika $\Delta_{\text{Net}} \ge 0$: **Surplus Efisiensi Biaya Lapangan (Emerald)**
* Jika $\Delta_{\text{Net}} < 0$: **Pembengkakan Biaya Lapangan / Defisit (Rose Warning)**

#### D. Deviasi Margin per Invoice (Waterfall Bar Delta)
$$\delta_k = \text{Profit Aktual Order}_k - \text{Target Net Profit SPK}_k$$
*Kaidah Visual Bar Recharts*:
* $\delta_k > 0$: Bar Hijau Emerald (`#10b981`) $\rightarrow$ Surplus efisiensi bahan/vendor
* $\delta_k = 0$: Bar Abu-Abu Netral (`#cbd5e1`) $\rightarrow$ 100% On-Track sesuai SPK
* $\delta_k < 0$: Bar Merah Rose (`#f43f5e`) $\rightarrow$ Defisit / kebocoran biaya di luar quotation awal

#### E. Deviasi Beban HPP Riil Lapangan
$$\Delta \text{HPP}_k = \text{HPP Aktual}_k - \text{HPP Estimasi SPK}_k$$

#### F. Persentase Deviasi Margin Global
$$\% \Delta = \left( \frac{\Delta_{\text{Net}}}{\text{Total Profit Estimasi}} \right) \times 100\%$$

#### G. Hasil Audit Lapangan (41 Pesanan Live):
* **Total Profit Estimasi SPK**: **Rp 31.136.500**
* **Total Profit Aktual**: **Rp 31.070.500**
* **Net Deviasi Riil**: **-Rp 66.000** (hanya berasal dari 2 invoice: `VK260038` ongkir tambahan -Rp 100rb dan `VK260041` surplus sablon +Rp 34rb. Sebanyak 39 pesanan lainnya berjalan 100% tepat sasaran).
* Formula kini 100% konsisten membandingkan Net Profit, mengoreksi selisih semu lama (-Rp 1.331.000) yang salah membandingkan gross margin dengan net profit.

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

Modal Edit Finansial (`EditFinanceModal.tsx`, kini digantikan halaman `/orders/[id]/edit`) menyediakan sub-tabel pencatatan termin cicilan secara kronologis.

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

### 8.4. Kredensial Otentikasi & Akun Eksekutif Kak Glora
Sistem telah dilengkapi modul otentikasi Firebase yang aman dan personal:
* **Email Resmi Akun**: `glora.sawita@visualkain.com`
* **Password Default**: `Glora32145`
* **Fitur Kemudahan Login**: Pada formulir login (`/login`), kotak input telah dilengkapi *Hint Otomatis* sehingga Kak Glora tidak perlu mengetikkan alamat email berulang kali. Cukup masukkan kata sandi dan klik **Masuk ke Dashboard**.
* **Personalisasi Eksekutif**: Setelah berhasil masuk, dashboard secara otomatis menyematkan sapaan personal *"Selamat Datang, Ibu Glora"* dengan inisial *"GS"* dan identitas struktural *"Head of Finance & Accounting"*.

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

### Skenario F: Melakukan Audit HPP Aktual & Membaca 3 Kartu Rekonsiliasi
1. Buka sub-tab **Rekonsiliasi Profit Aktual**.
2. Perhatikan 3 Kartu Ringkasan Eksekutif di bagian atas:
   * **Total Profit Estimasi**: Rp 31.136.500 (Target laba bersih sah SPK dari 41 pesanan).
   * **Total Profit Aktual**: Rp 31.070.500 (Realisasi laba bersih setelah belanja riil lapangan).
   * **Net Deviasi Margin**: -Rp 66.000 (Selisih penyesuaian belanja riil lapangan).
3. Pada **Visualisasi Deviasi Margin (Waterfall Bar Chart)**, gunakan tombol filter:
   * Klik **[Hanya Berdeviasi (2)]** untuk langsung melihat invoice `VK260038` (-Rp 100rb) dan `VK260041` (+Rp 34rb).
   * Arahkan kursor (*hover*) pada diagram batang untuk melihat tooltip kontras tinggi yang merinci nomor invoice, nama konsumen, profit estimasi, profit aktual, dan nilai deviasi.
4. Pada tabel rekonsiliasi, input field yang belum terisi kini menampilkan *placeholder* nilai estimasi SPK (warna abu-abu) sebagai panduan nominal.
5. Masukkan angka riil dan catatan jika terjadi penyesuaian, lalu klik tombol **Simpan (Ikon Centang)** untuk memperbarui data ke Firebase Firestore secara real-time.

### Skenario G: Memonitor Komposisi Beban Kas Keluar & Tren Harian
1. Buka sub-tab **Beban Kas Keluar (Cash Outflow)**.
2. Perhatikan **Donut Chart Komposisi Beban per Pos**:
   * Bagian tengah donut kini dilengkapi metrik permanen **Total Kas** (misal: `Rp 37,8 Jt`).
   * Arahkan kursor ke segmen warna donut untuk melihat rincian nominal dan persentase alokasi pos beban (Gaji/Payroll, Operasional, Bahan Baku, dll.).
3. Perhatikan **Grafik Tren Pengeluaran Harian**:
   * Menampilkan titik-titik tanggal pencairan dana.
   * Dilengkapi indikator otomatis **Puncak Kas Keluar** yang mendeteksi tanggal pengeluaran terbesar dalam periode aktif.

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
