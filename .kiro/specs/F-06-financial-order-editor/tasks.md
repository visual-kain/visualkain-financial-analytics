# Tasks & Implementation Steps — F-06: Financial Order Editor & Document Preview Modal

- [x] T-6.1: Definisikan interface `OrderFinanceUpdatePayload` dan perluas tipe `Order` bila diperlukan.
- [x] T-6.2: Buat komponen `EditFinanceModal.tsx` dengan form dua kolom responsif, kalkulasi margin otomatis, pilihan vendor kustom, dan input nominal terkunci.
- [x] T-6.3: Buat komponen `InvoicePreviewModal.tsx` untuk pratinjau dokumen cetak faktur pesanan resmi VisualKain dengan nomor rekening dan status cap lunas.
- [x] T-6.4: Perbarui `MasterFinanceTable.tsx` dengan kolom AKSI 4 tombol (Dokumen Biru, Pensil Hijau, Mata Abu, Tagih WA).
- [x] T-6.5: Hubungkan state `editingOrder` dan `previewInvoiceOrder` di `src/app/page.tsx` ke hook `updateOrderFinance`.
- [x] T-6.6: Verifikasi kompilasi TypeScript, Vitest unit test, dan Next.js production build.
