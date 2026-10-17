---
status: active
owner: "Claude Code (sesi bersama Sehan)"
session_date: "2026-10-17"
branch: "feat/F-13-merger-visualkaindb"
base_commit: "b7074de"
current_commit: "feat/F-13-merger-visualkaindb (belum di-push)"
active_feature: "F-13"
active_task: "F-13 task 1–27 selesai, menunggu preview deploy dan smoke klien"
expires_after: "2026-10-31"
---

# Session Handoff: F-13 Merger VisualKainDB

## Tujuan
Memindahkan modul operasional `visualkaindb` ke aplikasi ini dengan UI standar aplikasi ini, responsif untuk monitor besar dan HP, logika dan angka tetap sama. Spec: `.kiro/specs/F-13-merger-visualkaindb/` (requirements K-1 sampai K-29, design, screens, tasks).

## Status
- Fase 1 selesai: Data Customer (daftar, kartu HP, detail, tambah/edit, hapus dengan guard pembayaran, ekspor Excel), Techpack, Invoice, Size Chart, warning minus di tabel finansial.
- Fase 2 selesai: Kerjasama (`SK-VK-YYYY-NNN`), Penawaran (`PH-VK-YYYY-NNN`), Purchase Order (`PO-{noInv}`).
- Fase 3 selesai: Ringkasan Produksi, Data Vendor, Kalender Produksi (tautan Google Calendar + `.ics`, K-28), Cost & Profit.
- Revisi UI dari Sehan (17 Okt): invoice kembali ke versi formal dengan rincian DP tanpa warna (K-22), size chart daftar + detail (K-23), baris biaya tambahan customer di laporan finansial (K-24), tombol taktil seragam (K-25), navigasi dua section Produksi/Finansial dengan bottom nav HP mengikuti section (K-27), header halaman desktop dipadatkan (HP tidak berubah), chart Ringkasan Produksi mengikuti layout dashboard `visualkaindb` fase 4-6 versi volume (K-29).
- Patch kompatibilitas 3/4 Tangan di repo `visualkaindb` ada di branch `fix/tiga-perempat-compat` (commit `6c44680`), belum di-merge atau di-deploy.

## Bukti verifikasi (2026-10-17)
- `npm run lint` (tsc): 0 error.
- `npm run test`: 47 file, 531 test lulus. Satu run sempat melaporkan 1 unhandled error tanpa test gagal; tidak muncul lagi saat diulang.
- `npm run build`: sukses di worktree terpisah (dev server Sehan di port 3000 dibiarkan jalan).
- `npm run context:validate`: lulus.
- QA visual lewat `/dev-preview/*` (data fiktif, hanya `next dev`) di 375 px dan 1366/1440 px.
- Belum diuji dengan login dan data produksi; belum ada penulisan ke Firestore produksi dari sesi ini.

## Keputusan penting yang perlu diingat
- K-16: order baru ditulis `pembayaranList: []` dan `dpNominal: 0` supaya modul finansial tidak membaca DP 70% sebagai uang masuk.
- K-20: rekening invoice default tetap rekening `visualkaindb`; default master rekening aplikasi ini (`8830-1928-41`, `137-00-1928-11`) belum dikonfirmasi klien.
- K-29: Ringkasan Produksi tidak menampilkan angka uang. Order tanpa deadline tidak dihitung "aman" (beda dari `visualkaindb`), ditampilkan terpisah di akhir antrean.

## Temuan di luar kode
- Firebase MCP sering gagal terhubung karena plugin menjalankan `npx -y firebase-tools@latest mcp` dan daftar tool-nya butuh 25–37 detik, melewati batas waktu koneksi. Usulan (butuh persetujuan karena mengubah konfigurasi): `MCP_TIMEOUT=120000` di env settings, pakai `firebase` global alih-alih `npx @latest`, dan nonaktifkan server `firestore-native` yang duplikat.
- Audit baca-saja Firestore: data order dan kas sehat. Ada 24 order tanpa dokumen tracking dan 25 dokumen tracking yatim, berasal dari bug lama `visualkaindb` sekitar 10 Okt. Perbaikan menulis ke produksi, jadi menunggu persetujuan.

## Risiko terbuka
- Selama paralel, mengedit order baru lewat form `visualkaindb` akan menulis `dpNominal` 70% yang dibaca modul finansial sebagai uang masuk. Pensiunkan form order `visualkaindb` begitu Data Customer dipakai.
- Q-1: kertas invoice memakai rumus `visualkaindb` (tanpa biaya tambahan customer F-12 dan tanpa override gross finansial); laporan finansial sudah menampilkan baris biaya tambahan (K-24).
- `/api/upload` butuh env `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` di Vercel aplikasi ini.
- Koleksi baru (`document_counters`, `kerjasama`, `penawaran`, `vendors`, catatan kalender) mengandalkan rules "semua koleksi untuk user login" (audit F-12).

## Langkah berikutnya
Push branch `feat/F-13-merger-visualkaindb` untuk preview deploy (butuh persetujuan Sehan), set env Cloudinary di Vercel, lalu Sehan dan klien smoke test dengan login: buat order uji, cek Ringkasan Produksi dan Data Table finansial, cetak invoice/techpack/PO, buat surat kerjasama dan penawaran. Setelah lolos, merge ke `main`.
