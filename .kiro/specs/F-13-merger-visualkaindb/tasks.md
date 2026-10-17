# Tasks — F-13: Merger VisualKainDB

Status: `[ ]` belum, `[x]` selesai.

## Fondasi
- [x] 1. Konstanta dan rumus legacy (`src/lib/legacy/calculations.ts`, `formatters.ts`, `types.ts`) dengan kategori `tigaPerempat`; tambah `tigaPerempat` ke `CATEGORIES` modul finansial. Test pembanding. _US-13.4, K-13_
- [x] 2. Pindahkan derivasi pembayaran dari `useFirebaseFinance` ke `src/lib/order-payments.ts` tanpa ubah perilaku; test. _US-13.5, US-13.7_
- [x] 3. Generator No. Invoice (cek ulang Firestore) dan nomor dokumen (`document_counters` transaction); test. _US-13.4, US-13.11_
- [x] 4. Navigasi gabungan: `src/lib/navigation.ts`, `Sidebar` berkelompok, `MobileBottomNav` 5 slot + sheet Menu, `AppShell`, `PageHeader`; profil user dari login. _US-13.1_
- [x] 5. Komponen `NegativeAwareValue` + strip baris; terapkan ke tabel master finansial (desktop dan HP) dan teks panjang turun baris. _US-13.10, K-6_
- [x] 6. CSS kertas legacy (generator + `legacy-base.css`), `PaperViewport`, `PrintPortal`, isolasi aturan kertas lama di `globals.css`. _US-13.6, US-13.7_

## Fase 1
- [x] 7. Hook `useOrdersMaster`, `useSizeCharts`, `useKategori`, `useVendorsMaster`, sinkron tracking dengan riwayat status. _US-13.2, US-13.4_
- [x] 8. Daftar Data Customer: tabel 19 kolom, kartu HP, pencarian, chip status, arsip, pagination, pintasan keyboard, lightbox ACC, hapus dengan guard. _US-13.2, US-13.5_
- [x] 9. Detail Order. _US-13.3_
- [x] 10. Form Order baru/edit: modal vendor, modal kategori, unggah ACC, qty 4 kategori, footer, dialog pelunasan vendor, sinkron override, guard keluar. _US-13.4_
- [x] 11. `/api/upload` dengan verifikasi token + Cloudinary signed upload. _US-13.4_
- [x] 12. Techpack (kertas disalin + 3/4). _US-13.6_
- [x] 13. Invoice: pencarian order, kertas disalin dengan sumber `pembayaranList`, Target DP %, modal rekening, cetak. _US-13.7_
- [x] 14. Size Chart: grid, dialog buat/edit, hapus. _US-13.8_
- [x] 15. Ekspor Excel Data Customer. _US-13.9_

## Fase 2
- [x] 16. Kerjasama: daftar, editor, kertas disalin, nomor `SK-VK-YYYY-NNN`. _US-13.11_
- [x] 17. Penawaran: daftar, editor item, kertas disalin, nomor `PH-VK-YYYY-NNN`. _US-13.12_
- [x] 18. Purchase Order: pencarian order, kertas disalin, nomor `PO-{noInv}`. _US-13.13_

## Kompatibilitas & verifikasi
- [x] 19. Patch `visualkaindb` untuk kategori `tigaPerempat` (branch terpisah di repo itu). _K-13_
- [ ] 20. `npm run lint`, `npm run test`, `npm run build`, `npm run context:validate`; cek layar 360/768/1440/1920 px; review independen.
- [ ] 21. Update `docs/context/state.yaml`, `docs/specs/_index.md`, handoff.

## Fase 3
- [x] 22. Data Vendor (`/vendor`). _US-13.15_
- [x] 23. Kalender Produksi (`/kalender`). _US-13.16, K-28_
- [x] 24. Cost & Profit (`/cost-profit`). _US-13.17_
- [x] 25. Ringkasan Produksi (`/produksi`) + navigasi dua section. _US-13.14, K-27_
- [x] 26. Chart Ringkasan Produksi mengikuti layout dashboard `visualkaindb` (tren, donut + pipeline, radar + antrean, leaderboard, distribusi ukuran). _US-13.14.4, K-29_
- [x] 27. Header halaman versi desktop (tile ikon, badge sebaris judul, aksi rata kanan); tampilan HP tidak berubah.
