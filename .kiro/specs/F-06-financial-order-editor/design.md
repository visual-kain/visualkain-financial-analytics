# Technical Design — F-06: Financial Order Editor & Multi-Termin DP Management

## 1. Arsitektur Komponen & Alur Data

```
MasterFinanceTable
  ├── Baris Order (17 Kolom Dual-Sticky)
  │     └── Kolom AKSI (Sticky Right w-44):
  │           ├── [Ikon Dokumen Biru]  → onPreviewInvoice(order)  → InvoicePreviewModal.tsx (Riwayat DP & Warning 70%)
  │           ├── [Ikon Pensil Hijau]  → onEditOrder(order)       → EditFinanceModal.tsx (Sub-tabel Multi-Termin DP)
  │           ├── [Ikon Mata Abu]      → onInspectOrder(order)    → OrderInspectionDrawer.tsx (Timeline & Dynamic WA)
  │           └── [Tombol Tagih WA]    → onQuickWaFollowUp(row)   → wa.me link (Template dinamis)
  └── Fullscreen Expand Mode (Modal viewport penuh dengan filter toolbar & dual sticky freeze)
```

## 2. Struktur Kontrak Data Pembaruan Finansial

```typescript
export interface CustomerPayment {
  id: string;               // ID unik pembayaran termin
  orderId: string;          // Relasi ke order.id
  noInv: string;            // Nomor invoice acuan
  tanggal: string;          // Format YYYY-MM-DD
  nominal: number;          // Nominal rupiah yang dibayarkan
  jenis: 'dp' | 'termin' | 'pelunasan'; // Tipe pembayaran
  keterangan?: string;      // Contoh: "Transfer BCA Termin 1"
  createdAt: string;
}

export interface OrderFinanceUpdatePayload {
  totalInvoice: number;
  diskon: number;
  biayaOperasional: number;
  pembayaranList: CustomerPayment[]; // Sub-tabel mutasi kas masuk per invoice
  totalUangMasukCustomer: number;    // Akumulasi nominal seluruh pembayaran termin
  targetDpPersen: number;
  totalHpp: number;                  // Total tagihan/beban modal vendor
  totalDibayarKeVendor: number;      // Kas keluar ke vendor
  vendorName?: string;
  catatanFinance?: string;
  statusPembayaran?: 'belum_bayar' | 'parsial' | 'lunas';
  statusPembayaranVendor?: 'belum_bayar' | 'dp_vendor' | 'lunas_vendor';
}
```

## 3. Logika Ambang Batas SOP DP 70% Produksi

```typescript
const netInvoice = Math.max(0, totalInvoice - diskon);
const totalUangMasuk = pembayaranList.reduce((acc, p) => acc + p.nominal, 0);
const dpPersenCustomer = netInvoice > 0 ? (totalUangMasuk / netInvoice) * 100 : 0;
const sisaMenujuDp70 = Math.max(0, (0.7 * netInvoice) - totalUangMasuk);
const sisaPelunasanCustomer = Math.max(0, netInvoice - totalUangMasuk);

let statusDpThreshold: 'belum_dp' | 'dp1_parsial' | 'dp2_siap_produksi' | 'lunas_total' = 'belum_dp';

if (dpPersenCustomer >= 100) {
  statusDpThreshold = 'lunas_total';
} else if (dpPersenCustomer >= 70) {
  statusDpThreshold = 'dp2_siap_produksi'; // SPK potong & jahit diterbitkan
} else if (dpPersenCustomer > 0) {
  statusDpThreshold = 'dp1_parsial';       // Belum boleh naik potong, wajib ditagih
}
```

## 4. Desain Responsif & Mobile Tap Targets (antislop-layoutmobile)
- **Modal Dialog Window**:
  - `w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl`
  - Sub-tabel pembayaran menggunakan baris horizontal rapat dengan padding `py-2.5 px-3` dan tipografi tabular font monospace (`JetBrains Mono`).
  - Tombol aksi `+ Catat Pembayaran Baru` responsif dengan input inline yang nyaman di ponsel/tablet.
  - Sticky header & footer aksi pada modal untuk kemudahan simpan pada layar kecil.
- **Kombinasi Warna & Micro-interaction**:
  - Ikon Dokumen: `text-blue-600 bg-blue-50 hover:bg-blue-100`
  - Ikon Pensil Edit: `text-teal-700 bg-teal-50 hover:bg-teal-100`
  - Ikon Detail: `text-slate-600 bg-slate-50 hover:bg-slate-100`
  - Tagih WA: `text-white bg-emerald-600 hover:bg-emerald-700`
