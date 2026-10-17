---
status: active
owner: "Claude Code (sesi bersama Sehan)"
session_date: "2026-10-17"
branch: "feat/F-13-merger-visualkaindb"
base_commit: "b7074de"
current_commit: "feat/F-13-merger-visualkaindb (belum di-push)"
active_feature: "F-13"
active_task: "F-13 task 1–19 selesai, menunggu preview deploy dan smoke klien"
expires_after: "2026-10-31"
---

# Session Handoff: F-13 Merger VisualKainDB

## Tujuan
Memindahkan modul operasional `visualkaindb` ke aplikasi ini dengan UI standar aplikasi ini, responsif untuk monitor besar dan HP, logika dan angka tetap sama. Spec: `.kiro/specs/F-13-merger-visualkaindb/` (requirements K-1 sampai K-20, design, screens, tasks).

## Status
- Fase 1 selesai: navigasi gabungan (sidebar berkelompok, bottom nav HP 5 slot + sheet Menu), Data Customer (daftar 18 kolom + status, kartu HP, detail, tambah/edit, hapus dengan guard pembayaran, ekspor Excel), Techpack, Invoice (kertas disalin, pembayaran dari `pembayaranList`), Size Chart, warning minus di tabel finansial.
- Fase 2 selesai: Kerjasama (`SK-VK-YYYY-NNN`), Penawaran (`PH-VK-YYYY-NNN`), Purchase Order (`PO-{noInv}`).
- Fase 3 (Vendor, Kalender, Cost & Profit, ringkasan operasional) belum dikerjakan, hanya spec.
- Patch kompatibilitas 3/4 Tangan di repo `visualkaindb` ada di branch `fix/tiga-perempat-compat` (commit `6c44680`), belum di-merge atau di-deploy.

## Bukti verifikasi (2026-10-17)
- `npm run lint` (tsc): 0 error.
- `npm run test`: 36 file, 383 test lulus (sebelumnya 24 file, 226 test).
- `npm run build`: sukses.
- `npm run context:validate`: lulus.
- QA visual lewat `/dev-preview/*` (data fiktif, hanya `next dev`) di lebar HP: tidak ada overflow horizontal di 12 layar; tabel desktop 1440 px tanpa overflow halaman.
- Belum diuji dengan login dan data produksi; belum ada penulisan ke Firestore produksi.
- Review independen (code-reviewer): tidak ada Critical. High (invoice lunas lewat satu transfer masih menampilkan Sisa DP) dan Medium/Low (gerbang pelunasan vendor, validasi tanggal, total di bawah pembayaran, guard navigasi, vendorName, nomor invoice dari Firestore, URL gambar https) sudah diperbaiki dengan test. Medium Q-1 (total invoice vs biaya tambahan F-12) menunggu keputusan.

## Keputusan penting yang perlu diingat
- K-16: order baru ditulis `pembayaranList: []` dan `dpNominal: 0` supaya modul finansial tidak membaca DP 70% sebagai uang masuk. Form Data Customer tidak menulis DP, biaya operasional, atau pembayaran.
- K-20: rekening invoice default tetap rekening invoice `visualkaindb`. Default bawaan master rekening aplikasi ini (`8830-1928-41`, `137-00-1928-11`) berbeda dan belum dikonfirmasi klien, jadi disembunyikan dari modal rekening invoice sampai diubah lewat master rekening.

## Risiko terbuka
- Selama paralel, mengedit order baru lewat form `visualkaindb` akan menulis `dpNominal` 70% yang dibaca modul finansial sebagai uang masuk. Pensiunkan form order `visualkaindb` begitu Data Customer dipakai.
- Kertas invoice memakai rumus `visualkaindb` (tanpa biaya tambahan customer F-12 dan tanpa override gross finansial), sama seperti sebelumnya.
- `/api/upload` butuh env `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` di Vercel aplikasi ini.
- Koleksi baru `document_counters`, `kerjasama`, `penawaran` mengandalkan rules "semua koleksi untuk user login" (audit F-12).
- Sisa F-12: smoke klien di live belum dikonfirmasi (lihat arsip handoff 2026-10-15).

## Langkah berikutnya
Push branch `feat/F-13-merger-visualkaindb` untuk preview deploy (butuh persetujuan Sehan), set env Cloudinary di Vercel, lalu Sehan dan klien smoke test dengan login: buat order uji, cek Data Table finansial, cetak invoice/techpack/PO, buat surat kerjasama dan penawaran. Setelah lolos, merge ke `main`.
