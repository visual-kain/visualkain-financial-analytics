# Repository Operating Contract — visualkain-financial-analytics

## 1. Project Identity

`visualkain-financial-analytics` adalah aplikasi web khusus manajemen data finansial, rekonsiliasi arus kas riil, dan analitik eksekutif VisualKain 2026. Modul ini secara sengaja memisahkan aspek finansial murni dari modul operasional manufaktur, logistik kain mentah, atau produksi.

- Lifecycle stage: Foundation / MVP
- Primary repository purpose: Financial Intelligence, Cash Flow Reconciliation, Escrow Margin Analytics, Executive Reporting
- Production sensitivity: HIGH (integritas akuntansi, kas bank riil, piutang pelanggan, utang vendor)
- Primary owner/team: VisualKain Executive Management

## 2. Source of Truth

| Pertanyaan | Sumber Kanonikal |
|---|---|
| Tujuan produk & scope | `docs/product/prd.md`, `.kiro/steering/product.md` |
| Tata kelola engineering & aturan agen | `AGENTS.md` (file ini) |
| Desain sistem & formulasi akuntansi | `docs/specs/design.md`, `.kiro/specs/financial-analytics-engine/design.md` |
| Arsitektur teknis | `docs/architecture/overview.md`, `.kiro/steering/tech.md` |
| Rincian spesifikasi & tugas implementasi | `.kiro/specs/financial-analytics-engine/tasks.md` |
| State eksekusi repositori | `docs/context/state.yaml` |
| Kriteria kelulusan pekerjaan | `docs/quality/definition-of-done.md` |

## 3. Technology Stack

- **Client / Application Framework**: Next.js 15 App Router, React 19, TypeScript 5.7+
- **Styling**: Tailwind CSS 3.4 (with customized financial tokens, Emil Kowalski tactile shadows, and shimmer keyframe masks)
- **Visualisasi Grafik**: `recharts` + Tremor Raw KPI patterns (Spline Area Arus Kas, Donut Proporsi Vendor Escrow vs Margin)
- **Tabel Finansial**: `@tanstack/react-table` + `@tanstack/react-virtual`
- **Masking & Format Rupiah**: `react-number-format` (NumericFormat) + `JetBrains Mono` tabular-nums
- **URL & Search State**: `nuqs` (Type-safe query parameter sync untuk filter rentang tanggal & kategori kas)
- **Pelaporan & Ekspor**: `xlsx` (SheetJS) + `react-to-print`
- **Loading & Skeleton**: Native Tailwind Shimmer Primitives (`before:animate-shimmer` mask)
- **Unit Testing**: Vitest 3.0 + `@testing-library/react` + `jsdom`

## 4. Fundamental Accounting Invariants

1. **Formula Arus Kas Riil**:
   $$\text{Saldo Kas Riil} = (\text{Saldo Awal} + \text{Total Kas Masuk}) - \text{Total Kas Keluar}$$
2. **Prinsip Proporsionalitas Alokasi Dana (Escrow Vendor vs Margin VisualKain)**:
   - Setiap pembayaran yang masuk dari pelanggan dialokasikan proporsional ke:
     $$\text{Alokasi Vendor (HPP)} = \text{Nominal Masuk} \times \frac{\text{Total HPP}}{\text{Total Invoice}}$$
     $$\text{Alokasi Margin VisualKain} = \text{Nominal Masuk} \times \frac{\text{Total Margin}}{\text{Total Invoice}}$$
   - Pelunasan vendor dibayarkan dari alokasi dana pokok vendor, sehingga **tidak pernah memotong laba margin bersih VisualKain**.
3. **Verifikasi Test Otomatis**:
   - Seluruh perubahan logika wajib diuji dan lulus via `npm run test` (Vitest).
