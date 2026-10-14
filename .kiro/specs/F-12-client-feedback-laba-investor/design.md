# Technical Design — F-12: Laba Bersih, Biaya Tambahan, Master Vendor & Rekening, Dana Investor

## 1. Inventaris Komponen

| File | Status | Perubahan |
|---|---|---|
| `src/lib/investor-ledger.ts` | Baru | Konstanta kategori investor, `isInvestorInflow`, `isInvestorRepayment`, `summarizeInvestors`. |
| `src/lib/biaya-tambahan.ts` | Baru | Tipe item, `summarizeBiayaTambahan`, `deriveBiayaTambahanItems`, `deriveCostBase`. |
| `src/lib/rekening-master.ts` | Baru | Default rekening, `mergeRekening`, `rekeningLabel`, `rekeningDocId`, `validateRekeningInput`. |
| `src/hooks/useRekeningMaster.ts` | Baru | Listener `finance_rekening` terisolasi + `saveRekening`. |
| `src/components/finance/MasterDataDialogs.tsx` | Baru | `VendorFormDialog`, `RekeningFormDialog`, `useRekeningManager`, `ManageActions`. |
| `src/components/finance/BiayaTambahanSection.tsx` | Baru | Editor item biaya tambahan + kartu ringkasan per sumber. |
| `src/lib/cash-ledger.ts` | Ubah | Sumber `investor_masuk`/`investor_keluar`, jenis inflow `investor`, summary investor, `groupBebanKasByKategori`. |
| `src/lib/financial-calculator.ts` | Ubah | Beban kas mengecualikan pengembalian investor; field `labaBersih`, `labaBersihMarginPercent`, `totalKasMasukUsaha`, investor; `aggregateOrders`. |
| `src/types/index.ts` | Ubah | `BiayaTambahanItem`, `Order.biayaTambahanList`, `InflowCategoryType` + `investor`, `MetricDrawerType` + `net_profit` + `investor`, field summary baru, field `CashTransaction.investorNama/jatuhTempo`. |
| `src/lib/constants.ts` | Ubah | `KATEGORI_INVESTOR`, opsi kategori outflow investor di filter. |
| `src/hooks/useFirebaseFinance.ts` | Ubah | Baca/tulis `investorNama`, `jatuhTempo`; mutasi `addVendor`, `renameVendor`. |
| `src/components/analytics/FinanceStatsGrid.tsx` | Ubah | 8 kartu, grid 4 kolom, catatan dana investor di status cover. |
| `src/components/analytics/MetricDetailDrawer.tsx` | Ubah | Drawer `net_profit`, `investor`, agregat vendor, label investor di inflow. |
| `src/app/page.tsx` | Ubah | Hapus badge live, oper data investor ke drawer. |
| `src/app/orders/[id]/edit/page.tsx` | Ubah | Section biaya tambahan, HPP terkunci, kelola vendor & rekening. |
| `src/app/cash-in/new/page.tsx` | Ubah | Mode `investor`, kelola rekening. |
| `src/app/cash-out/new/page.tsx` | Ubah | Mode `investor`, hapus voucher, kelola rekening. |
| `src/components/finance/PaymentLedgerPanel.tsx` | Ubah | Judul form, label "Judul Pembayaran", tombol kelola rekening. |
| `src/components/finance/CashInflowSection.tsx` | Ubah | KPI usaha vs investor, filter `investor`, rute edit investor. |
| `src/components/finance/CashOutflowSection.tsx` | Ubah | Rute edit transaksi investor. |
| `src/components/finance/MasterFinanceTable.tsx`, `src/lib/excel-export.ts`, `OrderInspectionDrawer.tsx` | Ubah | Rename "Pembayaran Vendor", kartu rincian biaya tambahan. |

## 2. Alur Data

```
Firestore kas ──► useFirebaseFinance (CashTransaction + investorNama/jatuhTempo)
                        │
                        ├─► buildCashEntries ─► summarizeCashPeriod ─► CashPeriodSummary
                        │        sumber: order_customer | kas | investor_masuk
                        │                order_vendor | order_opex | kas | investor_keluar
                        │
                        └─► summarizeInvestors(transactions, until) ─► drawer & form investor

calculateFinancialSummary(orders) ─► applyCashPeriod(summary, cash)
     labaKotor = totalProfitRealtime (basis order)
     bebanOperasionalKas = cash.keluarKas (exclude Pembayaran Vendor & Pengembalian Dana Investor)
     labaBersih = labaKotor − bebanOperasionalKas
     totalKasMasukUsaha = cash.masukOrder + cash.masukNonOrder
     totalKasMasuk = totalKasMasukUsaha + cash.masukInvestor   (saldo tetap konsisten)
```

## 3. Kontrak Data

```ts
// src/types
export type BiayaTambahanSumber = 'customer' | 'vendor' | 'lainnya';
export interface BiayaTambahanItem { id: string; keterangan: string; nominal: number; sumber: BiayaTambahanSumber }

// CashPeriodSummary (tambahan)
masukInvestor: number;     // dana investor masuk pada periode
keluarInvestor: number;    // pengembalian pokok pada periode
kewajibanInvestor: number; // Σ masuk − Σ kembali, kumulatif s.d. akhir periode

// FinancialSummary (tambahan)
totalKasMasukUsaha: number;
danaInvestorMasuk: number;
danaInvestorKembali: number;
kewajibanInvestor: number;
labaBersih: number;
labaBersihMarginPercent: number;

// investor-ledger
export const KATEGORI_INVESTOR = {
  masuk: 'Dana Investor',
  pengembalian: 'Pengembalian Dana Investor',
  bagiHasil: 'Bagi Hasil Investor',
} as const;
export interface InvestorSummary {
  key: string; nama: string;
  totalMasuk: number; totalKembali: number; totalBagiHasil: number; sisaKewajiban: number;
  jatuhTempoTerdekat?: string; transaksi: CashTransaction[];
}
export function summarizeInvestors(txs: CashTransaction[], until?: string | null): InvestorSummary[];

// biaya-tambahan
export function summarizeBiayaTambahan(items): { customer: number; vendor: number; lainnya: number; total: number };
export function deriveBiayaTambahanItems(order): BiayaTambahanItem[];
export function deriveCostBase(order, items): { hppDasar: number; opexDasar: number };

// rekening-master
export interface RekeningAccount { kode: string; namaBank: string; nomor: string; atasNama: string; isDefault: boolean }
export function mergeRekening(defaults, docs): RekeningAccount[];
export function rekeningLabel(acc): string; // "Bank BCA (8830-1928-41)"
```

### Firestore
- `finance_investor` (baru, milik app ini): `{tanggal, jenis: 'masuk' | 'pengembalian' | 'bagiHasil', nominal, investorNama, jatuhTempo?, keterangan, createdAt, updatedAt}`. Hook memetakan tiap dokumen ke `CashTransaction` (`koleksi: 'investor'`, kategori investor) dan menggabungkannya dengan `kas`, sehingga ledger dan summary tidak perlu cabang khusus. `kas` tidak lagi menerima transaksi investor.
- Rules produksi (dibaca via Firebase MCP, 2026-10-14): semua koleksi baca/tulis untuk `request.auth != null`, `tracking` baca publik. Koleksi baru tidak butuh perubahan rules.
- `vendors` (dibagi): `addDoc {nama, pic, createdAt}`, `updateDoc {nama, updatedAt}`.
- `finance_rekening` (baru, milik app ini): doc id = slug kode; `{kode, namaBank, nomor, atasNama, updatedAt}`.
- `orders`: `biayaTambahanList`, `biayaTambahanCust`, `biayaLainnya`, `biayaOperasionalDasar`.
- `kas` masuk: kategori non-order `Saldo Awal` atau `Pendapatan Lain` (`KATEGORI_KAS_MASUK_OPTIONS` di `constants.ts`). Hook menormalkan kas masuk `Biaya Lain`/kosong menjadi `Pendapatan Lain` lewat `normalizeKategoriKasMasuk` (A-7).
- Migrasi satu kali (A-8): dokumen investor lama dari `kas` disalin ke `finance_investor` dengan ID yang sama dan field tambahan `migratedFromKas`, `migratedAt`; `mapInvestorDoc` mengabaikan field tambahan itu.

## 4. Aturan Biaya Tambahan

```
items valid  ⇔ Σcustomer(list) == biayaTambahanCustomer  &&  Σvendor(list) == biayaTambahanVendor
items        = valid ? list : synth(scalar customer, scalar vendor)
lainnya dipakai hanya bila biayaOperasionalDasar + Σlainnya == biayaOperasional; selain itu dibuang
hppDasar     = max(0, totalHpp − Σvendor(items))
opexDasar    = biayaOperasionalDasar valid ? biayaOperasionalDasar : max(0, biayaOperasional − Σlainnya(items))

net   = gross − diskon + Σcustomer
hpp   = hppDasar + Σvendor        (field terkunci)
opex  = opexDasar + Σlainnya
laba  = net − hpp − opex
```

Saat halaman dibuka tanpa perubahan, `net`, `hpp`, dan `opex` identik dengan nilai tersimpan (invariant 4).

## 5. Master Rekening

- `kode` = nilai yang ditulis sebagai prefix keterangan (`"Transfer BCA - catatan"`). Tidak dapat diubah setelah dibuat agar `splitKeterangan` tetap mengenali transaksi lama.
- Rekening baru: `kode = namaBank.trim()`; ditolak bila bentrok dengan kode atau label yang ada.
- Listener rekening berdiri sendiri (`useRekeningMaster`); error hanya `console.warn` dan fallback default. Ini mencegah koleksi baru yang belum diizinkan rules membuat dashboard berstatus error.

## 6. UI

- Dashboard: 8 kartu `grid-cols-2 lg:grid-cols-4`: Dana Masuk (usaha), Dana Investor, Dana Keluar, Saldo Kas, Piutang, Hutang Vendor, Laba Kotor & Omzet, Laba Bersih.
- Edit order: section 2 baru "Rincian Biaya Tambahan" di bawah section 1; field HPP `disabled`; tombol "Tambah"/"Edit" kecil di samping label vendor dan rekening, membuka dialog modal sederhana (pola modal konfirmasi yang ada).
- Uang selalu `font-mono tabular-nums`. Copy Bahasa Indonesia.

## 7. Error Handling

| Kasus | Perilaku |
|---|---|
| Tulis vendor/rekening gagal | `toast.error`, dialog tetap terbuka, state tidak berubah. |
| Pengembalian > sisa kewajiban | Tombol simpan nonaktif + pesan galat. |
| Nama investor kosong | Simpan ditolak. |
| Item biaya tambahan nominal ≤ 0 / keterangan kosong | Tombol tambah nonaktif. |
| Listener `finance_rekening` gagal | Pakai default, tidak memengaruhi `syncState`. |
