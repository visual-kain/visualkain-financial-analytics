# Desain Teknis & Arsitektur Sistem (Technical Design Specification)
## VisualKain Database & Finance Management Revamp 2026

**Versi Dokumen:** 1.0  
**Status:** Draf Tinjauan Teknis  
**Metodologi:** Spec-Driven Development (SDD)  

---

### 1. Perubahan Model Data (Data Models & Schemas)

#### 1.1 Entitas Pembayaran Pelanggan Parsial (`CustomerPayment`)
Setiap pesanan (`Order`) kini memiliki sub-entri atau array riwayat pembayaran bertahap:

```typescript
export interface CustomerPayment {
  id: string;               // ID unik pembayaran
  orderId: string;          // Relasi ke order.id
  noInv: string;            // Nomor invoice acuan
  tanggal: string;          // Format YYYY-MM-DD
  nominal: number;          // Nominal rupiah yang dibayarkan
  jenis: 'dp' | 'termin' | 'pelunasan'; // Tipe pembayaran
  keterangan?: string;      // Contoh: "Transfer BCA Termin 1"
  buktiUrl?: string;        // URL bukti transfer (opsional)
  createdAt: string;
}
```

#### 1.2 Ekstensi Entitas `Order` (`src/types/index.ts`)
```typescript
export interface Order {
  // ... field eksisting ...
  
  // 🆕 Riwayat pembayaran bertahap
  pembayaranList?: CustomerPayment[];
  totalUangMasukCustomer?: number; // Akumulasi real-time seluruh cicilan/DP
  
  // 🆕 Status Pembayaran terpisah dari Status Produksi
  statusPembayaran?: 'belum_bayar' | 'parsial' | 'lunas';
  
  // 🆕 Riwayat pembayaran vendor bertahap
  totalDibayarKeVendor?: number;   // Akumulasi real-time pembayaran ke vendor
  statusPembayaranVendor?: 'belum_bayar' | 'dp_vendor' | 'lunas_vendor';
  
  // DEPRECATED / REMOVED:
  // profitAktual?: number; (DIHAPUS)
  // hppAktual?: number; (DIHAPUS)
}
```

#### 1.3 Entitas Saldo Kas Awal & Penyesuaian (`KasAdjustment`)
```typescript
export interface KasAdjustment {
  id: string;
  tanggal: string;
  nominalAwal: number;     // Saldo kas awal bank
  keterangan: string;      // Contoh: "Sinkronisasi saldo rekening BCA per 1 Oktober 2026"
  createdAt: string;
}
```

#### 1.4 Kategori Pengeluaran Baru (`CashOutflowCategory`)
```typescript
export type CashOutflowCategory =
  | 'Gaji/Upah'
  | 'Operasional'           // Menggantikan 'Perawatan Web/Sistem'
  | 'Marketing dan Penjualan'// Kategori baru
  | 'Logistik'              // Menggantikan 'Transport/Ongkir'
  | 'Keuangan'              // Kategori baru: admin bank, fee platform, biaya transfer
  | 'Pajak'                 // Angka nominal rupiah langsung
  | 'Biaya Lain';
```

---

### 2. Formulasi Matematis & Logika Akuntansi VisualKain

#### 2.1 Masalah Konsep Lama vs Solusi Konsep Baru

```
[MODEL LAMA (Keliru)]
  Saldo VisualKain = Profit (dari Order Selesai) - Uang Keluar Kas
  Masalah: Uang DP customer tidak diakui kasnya, bayar vendor dianggap memotong profit,
           dan saldo seringkali minus di sistem padahal kas di bank masih surplus.

[MODEL BARU (Standar Akuntansi Kas & Margin)]
  1. Arus Kas Riil (Cash Flow):
     Saldo Kas Riil = (Saldo Awal + Total Kas Masuk) - Total Kas Keluar
  
  2. Alokasi Kantong Pokok Vendor vs Margin:
     Setiap rupiah yang masuk dari customer dialokasikan sesuai proporsinya:
     - Kantong Pokok Vendor (HPP) = Khusus untuk melunasi vendor.
     - Kantong Margin VisualKain = Profit murni untuk operasional & laba pemilik.
```

#### 2.2 Simulasi Riil Kasus Klien:
* **Nilai Invoice ke Customer:** Rp 1.420.000
* **Tagihan Vendor (HPP):** Rp 986.000
* **Margin Keuntungan VisualKain:** Rp 434.000

| Tahapan Transaksi | Uang Masuk Riil | Uang Keluar Riil | Saldo Kas Bank | Hak Vendor (Escrow) | Saldo Margin VisualKain |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Customer Bayar DP (Rp 500.000)** | + Rp 500.000 | Rp 0 | **Rp 500.000** | Rp 347.183 (proporsi HPP) | Rp 152.817 (proporsi profit) |
| **2. VisualKain Bayar DP Vendor (Rp 300.000)** | Rp 0 | - Rp 300.000 | **Rp 200.000** | Sisa utang vendor: Rp 686.000 | Profit utuh, kas tetap positif |
| **3. Customer Cicil Termin 2 (Rp 400.000)** | + Rp 400.000 | Rp 0 | **Rp 600.000** | Alokasi vendor bertambah | Profit bertambah proporsional |
| **4. Pelunasan Customer (Rp 520.000)** | + Rp 520.000 | Rp 0 | **Rp 1.120.000** | Dana vendor lengkap Rp 686.000 | Margin penuh Rp 434.000 |
| **5. Pelunasan Vendor (Rp 686.000)** | Rp 0 | - Rp 686.000 | **Rp 434.000** | Utang Vendor = Rp 0 | **Kas tersisa tepat Rp 434.000!** |

*Kesimpulan Logis:* Pembayaran ke vendor Rp 986.000 **tidak pernah memotong laba 434.000**, karena vendor dibayar dari uang pembayaran customer yang memang diperuntukkan sebagai modal pokok vendor!

---

### 3. Arsitektur Komponen Antarmuka (Component Inventory)

#### 3.1 Kartu Ringkasan Finansial Baru (`FinanceStatsGrid.tsx`)
1. **Kartu 1 — Saldo Kas VisualKain:**
   - Menampilkan total kas riil saat ini.
   - Subtitle: `Kas Masuk - Kas Keluar (Sinkron Bank)`.
   - Tombol tracking `(?)`: Membuka modal rekonsiliasi kas.
2. **Kartu 2 — Total Uang Masuk:**
   - Akumulasi seluruh pembayaran customer (DP + cicilan) pada periode terpilih.
   - Subtitle: `Total transaksi penerimaan kas`.
3. **Kartu 3 — Total Uang Keluar:**
   - Akumulasi kas keluar operasional dan kas keluar pembayaran vendor.
   - Subtitle: `Rincian per kategori pengeluaran`.
4. **Kartu 4 — Total Utang Vendor (Global):**
   - Kartu baru yang menampilkan sisa kewajiban yang belum dibayarkan ke seluruh vendor.
   - Subtitle: `Dari X order yang masih dalam proses vendor`.
   - Warna aksen: Amber/Warning lembut dengan indikator badge.
5. **Kartu 5 — Total Piutang Customer (Outstanding):**
   - Menampilkan sisa hak tagih ke customer yang belum dibayar.
   - Subtitle: `Dari X order aktif`.
6. **Kartu 6 — Estimasi Profit Bersih:**
   - Menampilkan proyeksi margin bersih dari order yang berjalan dan selesai setelah dikurangi beban operasional.

#### 3.2 Modal Detail Tracking Angka (`MetricDrilldownModal.tsx`)
* Komponen popover/modal seragam untuk setiap kartu finansial:
  - Header: Nama Metrik & Total Nilai Terkini.
  - Formula Box: Penjelasan rumus pembentuk angka dalam bahasa Indonesia yang mudah dipahami.
  - Data Table: Daftar transaksi riil yang menjumlahkan angka tersebut.
  - Tombol Ekspor Rincian (Excel/CSV).

#### 3.3 Komponen Modernisasi Grafik (`AnalyticsChartsRecharts.tsx`)
* Mengadopsi arsitektur dari project klinik (`klinik-cikidang-medika`):
  - Menggunakan library `recharts` dengan rendering responsif.
  - `ResponsiveContainer`, `AreaChart` (Spline dengan gradient fill halus).
  - `PieChart` / Donut dengan inner radius 60, outer radius 84, dan metrik total di tengah.
  - Header kartu dilengkapi badge icon duotone (`w-8 h-8 rounded-xl bg-teal-50 text-teal-700`).
  - Dark tooltip bergaya glassmorphism (`bg-slate-900/95 backdrop-blur-md text-white rounded-2xl`).

#### 3.4 Formulir & Pratinjau Penawaran Harga (`PenawaranForm.tsx`)
* Perbaikan grid responsif kolom barang/jasa:
  - Mengganti layout tabel kaku dengan CSS grid yang memiliki min-width aman dan perataan kolom presisi.
  - Di lembar cetak penawaran: menyembunyikan kotak Subtotal/Diskon/PPN sesuai catatan brief klien.

---

### 4. Perubahan Color System & Tipografi Global

```css
/* src/app/globals.css */
:root {
  /* Background abu-abu muda digelapkan sedikit (lebih berkontras) */
  --bg-primary: #e6ecf2;      /* Sebelumnya #f1f5f9 */
  
  /* Background kartu putih digelapkan sedikit (off-white teduh) */
  --bg-secondary: #f8fafc;    /* Sebelumnya #ffffff */
  --bg-card: #f8fafc;         /* Sebelumnya #ffffff */
  
  /* Border diselaraskan agar lebih tajam dan clean */
  --border: #cbd5e1;          /* Sebelumnya #e2e8f0 */
}

/* Tipografi Tabel Data */
.data-table td, 
.data-table th {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.data-table .currency,
.data-table .inv-number,
.data-table .tabular-num {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace !important;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
```
