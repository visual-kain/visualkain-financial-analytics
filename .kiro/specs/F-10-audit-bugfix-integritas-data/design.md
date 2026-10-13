# Technical Design — F-10: Audit Codebase & Perbaikan Integritas Data Finansial

Referensi kebutuhan: `bugfix.md` (ID 1.x defect, 2.x kontrak, 3.x invariant, K-x keputusan).

## 1. Inventaris Komponen

| File | Status | Perubahan | Kebutuhan |
|---|---|---|---|
| `src/hooks/useFirebaseFinance.ts` | Modified | State awal kosong, `syncState` `error`, snapshot kosong mengosongkan state, mutasi rollback + throw, `vendorId` aman, label otomatis tidak dipersist, `riwayatPembayaran` tersaring dipertahankan | 2.1, 2.4, 2.6, 2.10, 2.23 |
| `src/lib/cash-ledger.ts` | **New** | `buildCashEntries`, `filterEntriesByPeriod`, `summarizeCashPeriod` (saldo kumulatif sejak cutoff), `collectYearOptions` | 2.14, 2.15, 2.21 |
| `src/lib/financial-calculator.ts` | Modified | Definisi lunas, metrik kas memakai `cash-ledger` | 2.14, 2.15, 2.17 |
| `src/lib/payment-ledger.ts` | Modified | `resolveEditTarget` (exact + alias), `isAutoLabel`, `toPersistedLabel` | 2.8, 2.10 |
| `src/lib/constants.ts` | Modified | `getDefaultFinanceDate` zona `Asia/Jakarta` | 2.26 |
| `src/lib/utils.ts` | Modified | `formatCompactRupiah` naik satuan, `normalizeWaNumber` | 2.5, 2.28 |
| `src/hooks/useInitOnce.ts` | **New** | Inisialisasi form sekali per kunci, dilewati saat dirty | 2.2 |
| `src/hooks/useBeforeUnloadGuard.ts` | **New** | Guard `beforeunload` saat dirty | 2.24 |
| `src/components/finance/PaymentLedgerPanel.tsx` | Modified | Auto-open sekali, `resolveEditTarget`, Enter di panel tidak submit form, label otomatis | 2.7, 2.8, 2.9, 2.10 |
| `src/app/orders/[id]/edit/page.tsx` | Modified | `useInitOnce`, net termasuk biaya tambahan, vendor aman, DP vendor read-only, not-found state, guard, cek hasil mutasi | 2.1, 2.2, 2.3, 2.6, 2.22, 2.24, 2.27 |
| `src/app/cash-in/new/page.tsx`, `src/app/cash-out/new/page.tsx` | Modified | `useInitOnce` untuk ledger, `orderId` hanya nilai awal, edit kas memuat/not-found, guard, cek hasil mutasi | 2.1, 2.2, 2.11, 2.12, 2.24 |
| `src/app/page.tsx` | Modified | `useMemo` untuk `masterRows`, kirim array kosong, metrik kas via `cash-ledger`, ekspor sesuai filter tabel | 2.13, 2.14, 2.15, 2.16, 2.20 |
| `src/components/analytics/AnalyticsCharts.tsx`, `VendorPerformanceSection.tsx` | Modified | Hapus default data contoh, empty state | 2.13 |
| `src/components/analytics/MetricDetailDrawer.tsx`, `OrderInspectionDrawer.tsx` | Modified | Tanpa nomor WA dummy, saldo awal periode | 2.5, 2.15 |
| `src/components/finance/CashOutflowSection.tsx`, `CashInflowSection.tsx` | Modified | Opsi kategori lengkap, konfirmasi hapus, opsi tahun bersama | 2.18, 2.19, 2.21 |
| `src/components/finance/MasterFinanceTable.tsx` | Modified | Badge DP legacy, ekspor hasil filter via callback | 2.20, 2.29 |
| `src/components/finance/FinanceReportPaper.tsx` | Modified | Ternary DP vendor, persen DP dari termin tercatat | 2.25 |
| `src/lib/seed-data.ts` | Moved | → `src/test/fixtures/seed-data.ts` (hanya test) | 2.4 |
| `src/lib/vendor-ref.ts` | **New** | `resolveVendorRef`, `isPlaceholderVendorName` | 2.6 |
| `src/components/finance/EditKasStatusNotice.tsx` | **New** | `resolveEditKasStatus` + notice memuat/tidak ditemukan | 2.12 |
| `src/components/ui/empty-state.tsx` | **New** | Empty state ringan untuk chart/daftar kosong | 2.13 |
| Komponen mati + dependency | Deleted | Lihat bugfix 1.30 | 2.30 |

## 2. Alur Mutasi Firestore (2.1)

```
SEBELUM
UI submit ──► mutate() ──► setState(optimistic) ──► updateDoc() ✗ ──► catch: warn, return true
                                                                      │
UI: toast.success + router.push ◄─────────────────────────────────────┘
snapshot server ──► state kembali ke data lama (perubahan hilang diam-diam)

SESUDAH
UI submit ──► mutate() ──► snapshot = state lama ──► setState(optimistic)
                              │
                              ├─ updateDoc() ✓ ──► return ──► toast.success + router.push
                              └─ updateDoc() ✗ ──► setState(snapshot) ──► throw FinanceWriteError
                                                                 │
UI: toast.error, tetap di halaman, input utuh ◄─────────────────┘
```

Kontrak baru:

```ts
export class FinanceWriteError extends Error {
  constructor(public readonly operation: 'updateOrder' | 'addKas' | 'updateKas' | 'deleteKas', cause: unknown) { … }
}
updateOrderFinance(orderId: string, data: Partial<Order>): Promise<void>; // throw saat gagal
addKas(data: Omit<CashTransaction, 'id'>): Promise<string>;              // ID Firestore asli, tidak ada kas-local-*
updateKas(id: string, data: Partial<Omit<CashTransaction, 'id'>>): Promise<void>;
deleteKas(id: string): Promise<void>;
```

`addKas` tidak lagi menyisipkan optimistik sebelum `addDoc` selesai, karena ID baru tersedia setelah sukses. Penambahan lokal setelah sukses tetap dipertahankan untuk responsivitas (de-dup berdasarkan ID).

## 3. Inisialisasi Form Sekali per Order (2.2)

```
SEBELUM: snapshot apa pun ─► orders[] baru ─► currentOrder identitas baru ─► useEffect([currentOrder]) ─► reset form + isDirty=false
SESUDAH: snapshot apa pun ─► currentOrder identitas baru ─► useInitOnce(key=currentOrder?.id, dirty) ─► dilewati (key sama / dirty)
```

```ts
// Menjalankan `init` saat `key` berubah ke nilai baru, tidak saat identitas objek sumber berubah.
export function useInitOnce(key: string | null | undefined, init: () => void, opts?: { skip?: boolean }): void;
```

Untuk ledger di `/cash-in/new` dan `/cash-out/new`: kunci = `selectedOrderId`. Berpindah pesanan tetap me-reset ledger seperti sekarang.

## 4. Auto-open Edit & Resolusi Target (2.7, 2.8, 2.9)

```
SEBELUM: useEffect([initialEditId, entries, userTouchedDraft])
         simpan/batal ─► resetForm(userTouchedDraft=false) ─► entries berubah ─► buka edit lagi (loop)
         baris dihapus ─► findTargetEditRow heuristik indeks ─► buka baris LAIN
SESUDAH: consumedEditIdRef
         initialEditId baru & belum dikonsumsi ─► resolveEditTarget(exact | alias)
            ├─ ketemu ─► buka form edit, tandai dikonsumsi
            └─ tidak  ─► (setelah data live) notice "Transaksi tidak ditemukan", tandai dikonsumsi
```

```ts
export function resolveEditTarget<T extends LedgerEntry>(rows: ReadonlyArray<T>, targetId: string): T | null;
// Alias deterministik:
//   pay-{orderId}-single          → pay-{orderId}-init
//   vp-{orderId} | vp-rem-{orderId} → vp-{orderId}-init
```

Enter: container panel memasang `onKeyDown` yang menangkap `Enter` dari input teks/angka/tanggal, memanggil `preventDefault()`, lalu menjalankan `handleSubmit()` panel bila `canSubmit`.

## 5. Label Termin Otomatis (2.10)

```ts
// Pola otomatis: `DP N`, `Termin N`, `Pembayaran ke-N`, `Pelunasan` (tanpa membedakan huruf besar), atau kosong.
export function isAutoLabel(label: string | null | undefined): boolean;
// Label otomatis disimpan '' (Firestore menolak undefined); label kustom disimpan apa adanya.
export function toPersistedLabel(label: string | null | undefined): string;
```

Catatan implementasi: `normalizeLedger` kini memperlakukan label berpola otomatis sebagai bukan kustom, sehingga data lama yang terlanjur menyimpan "DP 2" ikut dinomori ulang saat dibaca. Label hasil ketik user yang kebetulan sama dengan pola ini (misalnya "Pelunasan") juga dihitung ulang dari urutan.

`normalizeLedger` tidak berubah, karena label kosong otomatis dihitung ulang. Data lama yang sudah menyimpan label otomatis dibersihkan pada simpan berikutnya, tanpa skrip migrasi.

## 6. Mesin Periode Kas (2.14, 2.15, 2.21)

```
SEBELUM
filteredOrders (tanggalOrder) ──► calculateFinancialSummary ──► Dana Masuk = Σ order.totalUangMasukCustomer
filteredCashTxs (tanggal)     ──┘                               Saldo = 0 + masuk − keluar (periode)
CashInflowSection: per p.tanggal │ chart tren: per tanggal bayar │ ► angka berbeda

SESUDAH
orders + kas ──► buildCashEntries() ──► CashEntry[] {tanggal, arah, nominal, sumber, kategori, orderId?}
                       │
                       ├─► filterEntriesByPeriod(tahun, bulan) ──► Dana Masuk / Keluar / tren / tab Kas / drawer
                       └─► summarizeCashPeriod(entries, periode)
                              saldoAwalPeriode = Σ(entri ≥ 2026-10-01 dan < awalPeriode)
                              saldoKas = saldoAwalPeriode + masukPeriode − keluarPeriode
```

```ts
export interface CashEntry {
  id: string; tanggal: string; arah: 'masuk' | 'keluar'; nominal: number;
  sumber: 'order_customer' | 'order_vendor' | 'order_opex' | 'kas';
  kategori: string; orderId?: string;
}
export function buildCashEntries(orders: Order[], kas: CashTransaction[]): CashEntry[];
export function summarizeCashPeriod(entries: CashEntry[], period: { tahun: string; bulan: string }): {
  saldoAwalPeriode: number; masukPeriode: number; keluarPeriode: number; saldoKas: number;
};
export function collectYearOptions(orders: Order[], kas: CashTransaction[]): string[];
```

- `buildCashEntries` menggabungkan sumber yang sekarang dipakai `buildCashOutflowEntries` dan builder inflow di `CashInflowSection`, termasuk de-dup `isDuplicateOrderVendorTx`, sehingga Dashboard dan tab memakai satu fungsi.
- Biaya operasional order tetap bertanggal `tanggalOrder` karena tidak punya tanggal bayar sendiri. Ini dicatat di drawer.
- Metrik omzet, laba, piutang, utang vendor tetap berbasis order dalam periode (`tanggalOrder`), tanpa perubahan rumus (K-1).
- Tidak ada perubahan Firestore schema.

## 7. Empty State & Sync (2.4, 2.13)

```
syncState: 'connecting' ─► skeleton (shimmer yang sudah ada)
           'live' + data kosong ─► EmptyState("Belum ada transaksi di periode ini", CTA Dana Masuk/Keluar)
           'error' ─► banner merah "Gagal memuat data Firestore" + tombol "Coba lagi" (re-subscribe)
```

`useFirebaseFinance(): { …, retry: () => void; kasReady: boolean }`. `retry` me-mount ulang listener lewat counter di dependency efek. `kasReady` menandai snapshot `kas` pertama sudah tiba (dipakai mode edit kas, karena `syncState` hanya mencerminkan `orders`).

## 8. Penanganan Error & Edge Case

| Kasus | Perilaku |
|---|---|
| Mutasi gagal | Rollback, `FinanceWriteError`, toast error, tetap di halaman |
| Snapshot kosong | State kosong (bukan seed), empty state |
| Edit target tidak ditemukan | Notice, tidak membuka baris lain, Simpan halaman tetap mungkin untuk perubahan lain |
| Edit kas tidak ditemukan | Simpan nonaktif, pesan jelas |
| Order < cutoff di halaman edit | State "di luar periode pembukuan" |
| Net invoice 0 | `validateEntryNominal` tetap menolak. Ringkasan menampilkan "Tagihan belum diisi", bukan "sudah lunas" |
| Nomor WA kosong | Tombol nonaktif |

## 9. Strategi Test

- Unit (Vitest, `src/lib/f10-*.test.ts`): `cash-ledger`, `resolveEditTarget`, `isAutoLabel`/`toPersistedLabel`, `getDefaultFinanceDate` (fake timers 2026-10-14T18:30Z = 15 Okt 01.30 WIB), `formatCompactRupiah`, `normalizeWaNumber`, net halaman edit vs `calculateOrderTotals`, invariant total Rupiah K-5.
- Hook (Vitest + `@testing-library/react`, mock `firebase/firestore`): rollback dan throw saat `updateDoc` reject, snapshot kosong, `useInitOnce`.
- Komponen (`@testing-library/react`): `PaymentLedgerPanel`, yaitu auto-open sekali, Enter tidak submit form induk, target hilang tidak membuka baris lain.
- Smoke manual oleh user di akun produksi (lihat Task 30) karena login memakai kredensial nyata.
