# Implementation Plan — F-12: Laba Bersih, Biaya Tambahan, Master Vendor & Rekening, Dana Investor

Aturan eksekusi:
- Logika finansial ditulis sebagai fungsi murni dengan test Vitest lebih dulu.
- Dilarang menjalankan skrip di `scripts/` terhadap Firestore produksi.
- Komentar kode: hanya `//` atau JSDoc polos yang menjelaskan alasan.

## Batch A — Logika & Test

- [x] **1. Tipe data baru**
  - `src/types/index.ts`: `BiayaTambahanItem`, `Order.biayaTambahanList`, `InflowCategoryType` + `investor`, `MetricDrawerType` + `net_profit` + `investor`, field summary baru, `CashTransaction.investorNama/jatuhTempo`.
  - _Requirements: 1.1, 2.1, 9.1_

- [x] **2. Ledger investor**
  - Test `src/lib/investor-ledger.test.ts` lalu implementasi `src/lib/investor-ledger.ts` dan konstanta kategori.
  - _Requirements: 9.3, 9.6, 9.7, 9.9_

- [x] **3. Cash ledger memisahkan investor**
  - Test: `masukNonOrder` tanpa investor, `keluarKas` tanpa pengembalian, `saldoKas` termasuk keduanya, `kewajibanInvestor` kumulatif s.d. akhir periode, jenis inflow `investor`.
  - Ubah `buildCashInflowEntries`, `buildCashEntries`, `summarizeCashPeriod`; tambah `groupBebanKasByKategori`.
  - _Requirements: 1.6, 1.7, 9.4, 9.5, 9.8_

- [x] **4. Summary laba bersih & agregat vendor**
  - Test: `labaBersih = labaKotor − bebanOperasionalKas`, bagi hasil mengurangi laba, dana investor tidak memengaruhi laba, `applyCashPeriod` mengisi field investor, `aggregateOrders` menjumlah 2 order vendor sama.
  - Ubah `calculateFinancialSummary`, `applyCashPeriod`; tambah `aggregateOrders`.
  - _Requirements: 1.1, 1.3, 1.7, 4.1, 9.9_

- [x] **5. Biaya tambahan**
  - Test `src/lib/biaya-tambahan.test.ts`: ringkasan per sumber, sintesis dari skalar, list tidak cocok → skalar, `deriveCostBase` menjaga total awal.
  - Implementasi `src/lib/biaya-tambahan.ts`.
  - _Requirements: 2.3, 2.4, 2.5, 2.7, 5.3_

- [x] **6. Master rekening**
  - Test `src/lib/rekening-master.test.ts`: merge default + override, tambahan baru, label, validasi kode duplikat.
  - Implementasi `src/lib/rekening-master.ts`.
  - _Requirements: 6.6, 6.7_

## Batch B — Data Layer

- [x] **7. Hook Firebase**
  - `useFirebaseFinance`: baca/tulis `investorNama`, `jatuhTempo`; `addVendor`, `renameVendor` dengan validasi nama unik.
  - `useRekeningMaster`: listener `finance_rekening` terisolasi + `saveRekening`.
  - Perbarui `useFirebaseFinance.test.ts` untuk field kas baru.
  - _Requirements: 6.2, 6.3, 6.4, 6.7, 6.8, 9.1_

## Batch C — UI

- [x] **8. Dialog master vendor & rekening**
  - `src/components/finance/MasterDataDialogs.tsx`.
  - _Requirements: 6.1–6.7_

- [x] **9. PaymentLedgerPanel**
  - Judul form, label "Judul Pembayaran", tombol kelola rekening. Perbarui `PaymentLedgerPanel.test.tsx`.
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] **10. Halaman edit order**
  - `BiayaTambahanSection`, HPP terkunci, kelola vendor & rekening, payload simpan baru.
  - _Requirements: 2.1–2.6, 2.9, 5.1, 5.2, 6.1_

- [x] **11. Dashboard & drawer**
  - `FinanceStatsGrid` 8 kartu; `MetricDetailDrawer` `net_profit`, `investor`, agregat vendor; `page.tsx` hapus badge live.
  - _Requirements: 1.1–1.6, 4.1–4.3, 7.1, 7.2, 9.5–9.7_

- [x] **12. Form kas**
  - `cash-in/new` mode investor; `cash-out/new` mode investor + hapus voucher (pertahankan teks voucher lama); kelola rekening.
  - _Requirements: 6.5, 8.1, 8.2, 9.1, 9.2, 9.3, 9.10_

- [x] **13. Tab kas, tabel master, inspeksi, ekspor**
  - `CashInflowSection` KPI & filter investor; rute edit investor di Kas Masuk/Keluar; rename "Pembayaran Vendor"; kartu rincian biaya tambahan di `OrderInspectionDrawer`; label jenis investor di ekspor.
  - _Requirements: 2.8, 3.1, 3.2, 3.3, 9.8, 9.10_

## Batch D — Verifikasi

- [x] **14. Quality gate**
  - `npm run lint`, `npm run test`, `npm run build`, `npm run context:validate`.
  - Review independen (code-reviewer) atas diff.
  - Perbarui `docs/context/state.yaml` dan `docs/handoff/current.md`.
  - _Requirements: Invariant 1–6_

## Batch E — Opsi B: koleksi investor terpisah (2026-10-14)

- [x] **15. Pindahkan transaksi investor ke `finance_investor`**
  - `investor-ledger.ts`: `INVESTOR_COLLECTION`, `mapInvestorDoc`, konversi kategori ↔ jenis (dengan test).
  - `useFirebaseFinance`: listener keempat, `kasReady` menunggu `kas` dan `finance_investor`, `addKas`/`updateKas`/`deleteKas` diarahkan per koleksi, rollback tetap jalan (dengan test).
  - Form Dana Masuk/Keluar: mode dikunci saat edit transaksi kas; kode konversi investor ↔ kas biasa dihapus.
  - _Requirements: 9.1, 9.2, 9.10, A-5_

## Batch F — Tindak lanjut audit data produksi (2026-10-14)

- [x] **16. Migrasi dana investor lama ke `finance_investor`**
  - Salin `kas/YdRM2j4mK715FDhbKZmR` ke `finance_investor` (ID sama, `jenis: masuk`, `migratedFromKas`), verifikasi, lalu hapus dari `kas` dengan precondition `updateTime`. Dilakukan lewat Firebase MCP atas izin Sehan.
  - _Requirements: 9.4, 9.6, A-5, A-8_

- [x] **17. Kategori kas masuk `Pendapatan Lain`**
  - `constants.ts`: `KATEGORI_PENDAPATAN_LAIN`, `KATEGORI_KAS_MASUK_OPTIONS`, `normalizeKategoriKasMasuk` (test `kas-kategori.test.ts`).
  - `useFirebaseFinance`: kas masuk lama `Biaya Lain` dibaca sebagai `Pendapatan Lain`, kas keluar tidak berubah (test hook).
  - `cash-in/new`: opsi kategori dari konstanta bersama.
  - _Requirements: A-7_

Catatan: temuan audit AU-3 sampai AU-5 (requirements §7) sengaja tidak dijadikan task karena klien tidak memintanya.

## Batch G — Feedback lanjutan klien (2026-10-14 sore)

- [x] **18. Ganti "Total Biaya Tambahan" dengan "Selisih untuk VisualKain"**
  - `biaya-tambahan.ts`: `BiayaTambahanSummary.total` diganti `selisih = customer − vendor − lainnya` (test kasus VK260039 dan selisih negatif).
  - `BiayaTambahanSection`: kartu keempat menjadi "Selisih untuk VisualKain" (emerald/rose).
  - `OrderInspectionDrawer`: header rincian menampilkan selisih, bukan total gabungan.
  - _Requirements: 12.11_

## Batch H — Feedback lanjutan klien (2026-10-14 malam)

- [x] **19. Tukar posisi panel termin dan rincian biaya tambahan**
  - `orders/[id]/edit/page.tsx`: `PaymentLedgerPanel` (termin customer) dipindah ke atas `BiayaTambahanSection`. Tanpa perubahan logika maupun judul.
  - _Requirements: 12.12_

- [x] **20. Perbaiki baris item biaya tambahan di mobile**
  - `BiayaTambahanSection`: `li` menjadi `flex-col` di bawah 640px (keterangan di atas, nominal dan aksi di bawah), `sm:flex-row` di atasnya.
  - Diverifikasi visual di 360px dan 900px dengan markup yang sama (jsdom tidak menghitung layout).
  - _Requirements: 12.13_

## Batch I — Proyeksi kecukupan dana (2026-10-15)

- [x] **21. Proyeksi kecukupan dana**
  - `cash-ledger.ts`: `projectCashCoverage` dan tipe `CashCoverageProjection` (test `f12-cash-coverage.test.ts`: data Oktober asli, filter bulan berikutnya, pelunasan sesudah periode, order sesudah periode, kelebihan bayar, pengembalian pokok).
  - `CashCoveragePanel` (test render): varian `banner` menggantikan panel "Status Cover Hutang Vendor" di `FinanceStatsGrid`; varian `compact` menggantikan bagian status cover di drawer Saldo Kas.
  - `page.tsx`: proyeksi dihitung dari semua order dan entri kas, diteruskan ke dashboard dan drawer.
  - _Requirements: 12.14_

- [x] **22. Samakan header grup tabel master: "Pembayaran Vendor" dan "Pembayaran Customer"**
  - `MasterFinanceTable`: "Komitmen Vendor (HPP)" → "Pembayaran Vendor", "Pembayaran Konsumen" → "Pembayaran Customer"; teks saja (2026-10-15).
  - _Requirements: 3.4_
