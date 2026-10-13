# Implementation Plan — F-10: Audit Codebase & Perbaikan Integritas Data Finansial

Aturan eksekusi:
- Setiap batch diawali test merah (reproduksi bug), lalu perbaikan, lalu gate hijau.
- Satu task = satu perubahan yang bisa diverifikasi. Jangan menggabungkan refactor di luar task.
- Dilarang menjalankan skrip di `scripts/` terhadap Firestore produksi.
- Komentar kode: hanya `//` atau JSDoc polos yang menjelaskan alasan, tanpa banner.

## Batch A — Integritas Data (P0)

- [x] **1. Test merah: mutasi Firestore gagal harus rollback dan throw**
  - Buat `src/hooks/useFirebaseFinance.test.ts` (mock `firebase/firestore`, `renderHook`).
  - Kasus: `updateDoc` reject → `updateOrderFinance` reject dan state order kembali. `addDoc` reject → tidak ada ID `kas-local-*`. `updateKas`/`deleteKas` reject → state kembali.
  - _Requirements: 1.1, 2.1_

- [x] **2. Perbaiki mutasi hook dan pemanggilnya**
  - `useFirebaseFinance.ts`: tambah `FinanceWriteError`, snapshot state sebelum optimistik, rollback di `catch`, lalu `throw`. Hapus fallback `kas-local-*`.
  - Pemanggil: `cash-in/new`, `cash-out/new`, `orders/[id]/edit`, `CashInflowSection`, `CashOutflowSection`, `ProfitAktualSection`, `page.tsx` membungkus `try/catch`, menampilkan `toast.error`, dan tidak berpindah halaman saat gagal.
  - _Requirements: 2.1, 3.8_

- [x] **3. Inisialisasi form sekali per order**
  - Test merah `src/hooks/useInitOnce.test.ts`: `init` tidak terpanggil ulang saat identitas objek berubah dengan kunci sama, dan tidak terpanggil saat `skip` (dirty).
  - Buat `src/hooks/useInitOnce.ts`. Terapkan di `orders/[id]/edit/page.tsx:69` (kunci `currentOrder.id`, skip saat `isDirty`), `cash-in/new/page.tsx` dan `cash-out/new/page.tsx` untuk `ledgerRows` (kunci `selectedOrderId`).
  - _Requirements: 1.2, 2.2_

- [x] **4. Net invoice halaman edit menyertakan biaya tambahan**
  - Test merah: untuk order fixture dengan `biayaTambahanCustomer = 500000`, net yang dihitung halaman edit = `calculateOrderTotals(order).netTotal`.
  - Ekstrak perhitungan gross/net halaman edit ke fungsi murni di `src/lib/calculations.ts` (misalnya `deriveEditableInvoice(order)`), lalu pakai di halaman.
  - _Requirements: 1.3, 2.3, 3.4_

- [x] **5. State awal kosong, sync error, dan seed hanya untuk test**
  - Test merah: hook tanpa snapshot → `orders=[]`, `syncState='connecting'`. Snapshot kosong → `[]`. Listener error (orders/kas/vendors) → `syncState='error'`.
  - Pindah `src/lib/seed-data.ts` ke `src/test/fixtures/seed-data.ts`. Perbarui import di test. Hapus import seed dari `page.tsx`, `CashOutflowSection.tsx`, dan hook.
  - Tambah `retry()` dan banner error + empty state di `page.tsx`.
  - _Requirements: 1.4, 2.4, 3.9_

- [x] **6. WhatsApp tanpa nomor dummy**
  - Test merah `normalizeWaNumber`: `0812…`, `+62812…`, `62812…`, `812…` → `62812…`. String kosong → `null`.
  - `utils.ts`: tambah `normalizeWaNumber`. `MetricDetailDrawer.tsx:424` dan `OrderInspectionDrawer.tsx:43`: hapus `'08123456789'`, nonaktifkan tombol kirim bila `null`.
  - _Requirements: 1.5, 2.5_

- [x] **7. Penyimpanan vendor yang aman**
  - Test merah fungsi murni `resolveVendorRef(vendorNama, vendors)`: cocok → `{vendorId, vendorName}`. Tidak cocok → `vendorId: ''`. Placeholder (`Tanpa Vendor`, `Vendor Mitra`) → kosong.
  - Terapkan di `orders/[id]/edit/page.tsx:244-247`. Inisialisasi `vendorNama` tidak boleh mengambil placeholder.
  - _Requirements: 1.6, 2.6_

- [x] **8. Gate Batch A**
  - `npm run lint`, `npm run test`, `npm run build` lulus. Tempel ringkasan output di catatan PR.
  - _Requirements: 2.1–2.6, 3.8, 3.9_

## Batch B — Ledger Termin & Edit Transaksi

- [x] **9. Test merah ledger dan panel**
  - `src/lib/payment-ledger.test.ts`: `resolveEditTarget` (exact, alias `-single`↔`-init`, `vp-`/`vp-rem-`↔`-init`, ID hilang → `null`, tidak pernah fallback ke indeks). `isAutoLabel`/`toPersistedLabel`: hapus termin 1 dari [DP 1, DP 2] → label baris tersisa "DP 1". Label kustom "Booking" dipertahankan.
  - `src/components/finance/PaymentLedgerPanel.test.tsx`: auto-open hanya sekali setelah simpan/batal/hapus. Enter di input nominal tidak memicu `onSubmit` form induk. ID target hilang → notice, tidak ada baris lain yang terbuka.
  - _Requirements: 1.7, 1.8, 1.9, 1.10_

- [x] **10. Helper ledger**
  - `payment-ledger.ts`: tambah `resolveEditTarget`, `isAutoLabel`, `toPersistedLabel`. Hapus `findTargetEditRow` dari panel.
  - _Requirements: 2.8, 2.10, 3.3_

- [x] **11. Perbaikan `PaymentLedgerPanel`**
  - Ganti efek `initialEditId` dengan `consumedEditIdRef` dan `resolveEditTarget`. Tampilkan notice bila target tidak ditemukan.
  - Tangkap Enter di container panel: `preventDefault()` lalu jalankan `handleSubmit()` bila `canSubmit`.
  - Label: chip/saran tidak menandai `labelTouched`. Hanya ketikan user yang menjadi label kustom.
  - _Requirements: 2.7, 2.8, 2.9, 2.10, 3.3_

- [x] **12. Persistensi label di hook**
  - `useFirebaseFinance.ts:377` dan `:407`: pakai `toPersistedLabel`, hapus fallback `Termin N` / `Pembayaran ke-N`.
  - _Requirements: 2.10, 3.8_

- [x] **13. Parameter URL dan mode edit kas**
  - `cash-in/new` dan `cash-out/new`: `orderId` dari URL hanya nilai awal (hapus efek pemaksa di sekitar baris 120/155).
  - Mode `editKasId`: state memuat sampai `syncState==='live'`. Bila transaksi tidak ditemukan → pesan + tombol Simpan nonaktif. Jangan pernah memanggil `updateKas` dengan nilai default.
  - _Requirements: 1.11, 1.12, 2.11, 2.12_

- [x] **14. Gate Batch B**
  - `npm run lint`, `npm run test`, `npm run build`.
  - _Requirements: 2.7–2.12, 3.3_

## Batch C — Dashboard, Periode & Filter

- [x] **15. Test merah mesin periode kas dan invariant K-5**
  - `src/lib/f10-cash-ledger.test.ts`: skenario order 20 Okt (30 jt 20 Okt, 40 jt 5 Nov): Okt masuk = 30 jt, Nov masuk = 40 jt. Saldo Nov = saldo akhir Okt + net Nov. Transaksi `Saldo Awal` 1 Okt terbawa ke saldo Nov. Data < 2026-10-01 diabaikan. `collectYearOptions` mencakup tahun pembayaran.
  - Invariant 3.5: fixture seed lama → `omzetTotal`, `totalPiutang`, `totalProfitRealtime` sama persis dengan nilai sebelum F-10 (snapshot angka dicatat di test).
  - Invariant 3.1: `saldoKas === saldoAwalPeriode + masukPeriode − keluarPeriode` untuk semua periode fixture.
  - _Requirements: 1.14, 1.15, 1.17, 1.21, 3.1, 3.5, 3.6_

- [x] **16. Implementasi `src/lib/cash-ledger.ts` dan wiring**
  - Buat `buildCashEntries`, `filterEntriesByPeriod`, `summarizeCashPeriod`, `collectYearOptions` (reuse `isDuplicateOrderVendorTx`).
  - `page.tsx`: metrik kas, chart tren, dan drawer saldo memakai entri kas. Hapus `useState(0)` untuk `saldoAwal`. `CashInflowSection`/`CashOutflowSection` memakai builder yang sama.
  - `MetricDetailDrawer`: baris "Saldo awal periode (sejak 1 Okt 2026)".
  - _Requirements: 2.14, 2.15, 2.21, 3.1, 3.2, 3.6, 3.7_

- [x] **17. Definisi lunas tunggal**
  - `financial-calculator.ts:310`: `isLunas = sisaPiutangCustomer <= 0`. Samakan filter Lunas/Berjalan di `MetricDetailDrawer.tsx:134`.
  - _Requirements: 1.17, 2.17, 3.5_

- [x] **18. Hapus data contoh dan tambah empty state**
  - `AnalyticsCharts.tsx`: hapus `defaultTrendData`/`defaultDonutData`. `VendorPerformanceSection.tsx`: hapus `defaultVendors`, `defaultCheapest`, default `mostUsedVendor`, `tanpaOrder`. `page.tsx:484`, `:570`: kirim `[]`/`null`.
  - Tambah komponen empty state kecil di `src/components/ui/` sesuai token visual yang ada.
  - _Requirements: 1.13, 2.13_

- [x] **19. Pagination stabil dan ekspor sesuai filter**
  - `page.tsx:147`: `useMemo(() => transformToMasterRows(filteredOrders), [filteredOrders])`.
  - `MasterFinanceTable`: expose baris terfilter via callback `onFilteredRowsChange`. Ekspor header pada tab Data Table memakai baris tersebut dan nama file menyebut filter.
  - _Requirements: 1.16, 1.20, 2.16, 2.20_

- [x] **20. Filter kategori Outflow dan konfirmasi hapus**
  - `CashOutflowSection.tsx:108-123`: opsi dari konstanta bersama dengan `/cash-out/new` + kategori unik dari data. Pindahkan daftar kategori ke `constants.ts`.
  - Konfirmasi sebelum hapus di Outflow, setara dengan Inflow.
  - _Requirements: 1.18, 1.19, 2.18, 2.19_

- [x] **21. Gate Batch C**
  - `npm run lint`, `npm run test`, `npm run build`.
  - _Requirements: 2.13–2.21, 3.1, 3.2, 3.5, 3.6, 3.7_

## Batch D — Form, Cetak & Minor

- [x] **22. DP vendor read-only di halaman edit**
  - `orders/[id]/edit/page.tsx`: field DP vendor = Σ `vendorPembayaranList` (fallback `totalDibayarKeVendor` untuk data lama), read-only, tautan `/cash-out/new?mode=vendor&orderId=…`. Payload simpan tidak lagi menulis `dpNominalPO`/`totalDibayarKeVendor` dari field ini.
  - _Requirements: 1.22, 2.22, 3.8_

- [x] **23. Pertahankan entri `riwayatPembayaran` yang disaring**
  - Test merah: dokumen dengan entri "pinjaman" → setelah `updateOrderFinance`, entri tetap ada di payload.
  - Hook: simpan entri tersaring di `rawOrder`, lalu gabungkan saat menulis.
  - _Requirements: 1.23, 2.23, 3.8_

- [x] **24. Guard `beforeunload` dan state not-found**
  - Buat `src/hooks/useBeforeUnloadGuard.ts`, pasang di tiga halaman form.
  - `orders/[id]/edit/page.tsx:315-333`: state not-found saat `syncState==='live'` dan order tidak ada.
  - _Requirements: 1.24, 1.27, 2.24, 2.27_

- [x] **25. Perbaikan `FinanceReportPaper`**
  - Baris `:131` pakai ternary. `:34`/`:140`: nominal DP = `totalUangMasukCustomer`, persen = nominal / net.
  - _Requirements: 1.25, 2.25_

- [x] **26. Tanggal WIB dan format ringkas**
  - Test merah: `getDefaultFinanceDate` pada 2026-10-14T18:30Z → `2026-10-15`. `formatCompactRupiah(999_999)` → `Rp 1 jt`. `1_999_999` → `Rp 2 jt`. `1_250_000` → `Rp 1,3 jt` (1 desimal, koma id-ID).
  - Perbaiki `constants.ts:15`, `utils.ts:36`, dan pemakaian `toISOString().slice(0, 10)` lain untuk tanggal default (7 lokasi, cari dengan grep).
  - _Requirements: 1.26, 1.28, 2.26, 2.28_

- [x] **27. Penanda DP legacy**
  - Fungsi murni `isLegacyPaymentId(id)`. Badge "DP belum dirinci per termin" di `MasterFinanceTable` (tabel + kartu mobile) dan `PaymentLedgerPanel`. Tidak ada perubahan perhitungan (test invariant 3.5 tetap hijau).
  - _Requirements: 1.29, 2.29, 3.5_

- [x] **28. Gate Batch D**
  - `npm run lint`, `npm run test`, `npm run build`.
  - _Requirements: 2.22–2.29, 3.8_

## Batch E — Kebersihan & Penutupan

- [x] **29. Hapus dead code dan dependency tak terpakai**
  - Hapus `EditFinanceModal.tsx`, `AddIncomeModal.tsx`, `EscrowLiquidityBar.tsx`, `TransactionLedgerTable.tsx`, state `donutData`/`dynamicDonutData`, `drawerVendorFilter`, drawer tambah mati di `CashOutflowSection`.
  - `npm uninstall` dependency di bugfix 1.30 setelah konfirmasi ulang dengan grep bahwa tidak ada import.
  - _Requirements: 1.30, 2.30_

- [x] **30. Gate akhir, smoke manual, dan dokumen**
  - `npm run lint`, `npm run test`, `npm run build`, `npm run context:validate`.
  - Smoke manual oleh user (akun produksi, tanpa mengubah data riil, atau dengan order uji yang disepakati):
    1. Filter Oktober vs November: Dana Masuk Dashboard = tab Kas Masuk. Saldo November mencakup Oktober.
    2. Filter Januari: semua chart dan kartu menampilkan empty state, tanpa "AMRIN" dan tanpa "1–7 Okt".
    3. Edit termin dari tabel Kas Masuk → simpan baris → form tidak terbuka lagi. Enter di nominal tidak menyimpan halaman.
    4. Hapus DP 1 dari order dengan 3 termin → label berurutan DP 1, DP 2.
    5. Data Table halaman 2 → klik baris → tetap di halaman 2.
    6. Matikan jaringan → simpan → toast error, input utuh.
  - Perbaiki 7 link `file:///` di `.kiro/specs/F-09-client-feedback-refinements/design.md` menjadi link relatif.
  - Perbarui `docs/context/state.yaml` (F-10 → completed), `docs/handoff/current.md`, dan `spec.json`.
  - _Requirements: 2.31, 3.1–3.10_
