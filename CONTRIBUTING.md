# Panduan Kontribusi & Alur Kerja (Contributing Workflow)

Dokumen ini menjelaskan alur kerja pengembangan (*development workflow*) dan standar kualitas untuk berkontribusi pada proyek **Klinik Pratama Cikidang Medika**.

---

## 1. Prinsip Dasar: Spec-Driven Development (SDD)

Proyek ini menerapkan pendekatan **Spec-Driven Development**. Setiap pengerjaan fitur wajib diawali dengan pendefinisian spesifikasi yang jelas sebelum kode ditulis:

1. **Requirements (`requirements.md`)**: Identifikasi kebutuhan fungsional (FR) dan kriteria penerimaan (AC) menggunakan format EARS / RFC 2119.
2. **Design (`design.md`)**: Arsitektur komponen, relasi query Supabase, dan model data.
3. **Tasks (`tasks.md`)**: Pembagian tugas terperinci (`TASK-001`, `TASK-002`, dst.) dengan urutan eksekusi satu per satu.
4. **Implementation**: Penulisan kode yang hanya berfokus pada task aktif tanpa melakukan refactor di luar cakupan.
5. **Verification**: Pengujian statis (`npx tsc --noEmit`), build (`npm run build`), dan validasi konteks (`npm run context:validate`).

---

## 2. Standar Kode & Desain UI

- **Komponen UI Reusable:** Seluruh halaman dan fitur baru **wajib** menggunakan komponen atomik dari `src/components/ui/` (`Button`, `Badge`, `Modal`, `Input`, `Select`, `Card`). Pembuatan backdrop modal kustom atau duplikasi elemen input secara inline tidak diperbolehkan.
- **Konstanta Terpusat:** Nilai tetap seperti daftar desa domisili, sapaan/gelar, tarif standar, dan nomor kontak klinik **harus** diimpor dari `src/constants/clinic.ts`.
- **Penanganan Nilai Uang:** Seluruh nilai moneter disimpan sebagai `NUMERIC(15,2)` di PostgreSQL dan ditampilkan ke pengguna dengan format rupiah standar Indonesia (`formatRupiah(amount)` dari `src/lib/utils.ts`).
- **Penyimpanan Foto Medis:** Seluruh unggahan foto medis wajib melalui fungsi `uploadMedicalPhoto` dari `src/lib/storage.ts` yang secara otomatis mengompresi gambar ke format WebP < 300KB.

---

## 3. Alur Kerja Git & Penamaan Branch

### Penamaan Branch
- Fitur baru: `feature/{feature-id}-{deskripsi-singkat}` (contoh: `feature/F-002-rekam-medis-dokter`)
- Perbaikan bug: `fix/{deskripsi-bug}` (contoh: `fix/search-debounce-timeout`)

### Pesan Commit
Gunakan kalimat perintah (*imperative mood*) dan cantumkan ID fitur jika relevan:
- `feat(F-001): add patient search autocomplete component`
- `fix(pendaftaran): handle duplicate No RM error gracefully`
- `docs: update hybrid storage architecture decision`

---

## 4. Checklist Verifikasi Sebelum Push

Sebelum melakukan *commit* atau *pull request*, pastikan seluruh pemeriksaan berikut berhasil tanpa error:

```bash
# 1. Validasi integritas dokumen spesifikasi SDD
npm run context:validate

# 2. Type-checking TypeScript mode strict
npx tsc --noEmit

# 3. Build produksi Next.js
npm run build
```

---

## 5. Keamanan & Privasi Data

- **Dilarang keras melakukan commit berkas rahasia:** Jangan pernah meng-commit `.env.local` atau berkas apa pun yang berisi `SUPABASE_SERVICE_ROLE_KEY` atau `CLOUDINARY_API_SECRET`.
- **Dilarang memasukkan data pasien asli ke Git:** Data spreadsheet asli di `docs/data/` dan catatan transkrip negosiasi privat telah di-ignore secara permanen oleh `.gitignore`.
