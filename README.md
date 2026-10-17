# VisualKain Financial Data & Analytics 2026

Repositori khusus intelijen data finansial, rekonsiliasi arus kas riil, dan analitik eksekutif VisualKain 2026 (versi Financial & Analytics saja, tanpa bagian produksi).

Menggunakan metodologi **Spec-Driven Development (SDD)** yang diadaptasi dari template standar arsitektur `klinik-cikidang-medika`.

---

## 🏛️ Arsitektur & Spesifikasi Desain (System Design)
Acuan desain sistem disalin langsung dari `visualkaindb`:
- **Spesifikasi Desain Kanonikal**: `docs/specs/design.md` dan `.kiro/specs/financial-analytics-engine/design.md`
- **Rumus Akuntansi Arus Kas Riil**:
  $$\text{Saldo Kas Riil} = (\text{Saldo Awal} + \text{Total Kas Masuk}) - \text{Total Kas Keluar}$$
- **Alokasi Kantong Pokok Vendor (HPP / Escrow) vs Margin VisualKain**:
  Setiap pembayaran masuk dari konsumen dialokasikan proporsional ke pokok vendor dan margin kotor, membuktikan secara matematis bahwa pelunasan vendor tidak pernah menggerus laba bersih.

---

## 🚀 Tech Stack & Library Terpilih
- **Framework**: Next.js 15 App Router, React 19, TypeScript
- **Visualisasi Grafik**: `recharts` + pola Tremor Raw (Spline Area Chart, Donut Escrow Allocation, glassmorphism tooltip)
- **Tabel Finansial**: `@tanstack/react-table` + `@tanstack/react-virtual`
- **Masking Nilai Rupiah**: `react-number-format` (NumericFormat) + `JetBrains Mono` tabular-nums
- **URL Query Param Sync**: `nuqs` (Type-safe query parameter state)
- **Ekspor & Cetak Laporan**: `xlsx` (SheetJS) + `react-to-print`
- **Skeleton & Loading**: Native Tailwind Shimmer Primitives (`before:animate-shimmer` mask)
- **Unit Testing**: `vitest` + `@testing-library/react` + `jsdom`

---

## 🧪 Pengujian Otomatis (Vitest)
Untuk menjalankan suite pengujian kalkulator akuntansi dan kasus riil klien (Seksi 2.2):
```bash
npm run test
```

## 🛠️ Menjalankan Development Server
```bash
npm install
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

## 🔐 Environment Variables
Isi di `.env.local` untuk lokal dan di Vercel (Production + Preview) untuk deploy, satu baris per variabel dengan format `NAMA=nilai`. Next.js hanya membaca file `.env*` standar, jadi catatan seperti `env.cloudinary` tidak terpakai (dan sudah di-ignore git).

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Konfigurasi Firebase web |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Upload gambar ACC lewat `/api/upload` (hanya server, jangan diberi awalan `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_PRODUKSI_EMAILS` | Opsional. Email akun tim produksi (dipisah koma) yang mendarat di Ringkasan Produksi setelah login |
| `NEXT_PUBLIC_LOGIN_EMAIL_HINT` | Opsional. Email bawaan di form login |
