# System Architecture Overview — VisualKain Financial Data & Analytics

## 1. Architectural Principles
- **Separation of Concerns**: Logika finansial dimodelkan sebagai domain murni di `src/lib/financial-calculator.ts`, sepenuhnya decoupled dari UI dan komponen presentasi.
- **Spec-Driven Development (SDD)**: Perubahan fungsional didorong oleh spesifikasi di `.kiro/specs/` dan diverifikasi dengan suite pengujian otomatis Vitest.
- **Deterministic Math**: Seluruh perhitungan akumulasi pembayaran, utang vendor, dan rekonsiliasi kas menggunakan fungsi murni yang dapat diuji tanpa efek samping.

## 2. Component Topology
- **Next.js App Router**: Menyediakan SSR dan streaming UI dengan React Suspense.
- **Shimmer Skeletons**: `src/components/ui/shimmer.tsx` menyediakan skeleton loading mask yang konsisten saat query data berlangsung.
- **Recharts + Tremor Patterns**: `src/components/analytics/AnalyticsCharts.tsx` merender area chart spline untuk tren arus kas dan donut chart proporsi alokasi.
- **TanStack Table**: `src/components/analytics/TransactionLedgerTable.tsx` menampilkan buku kas dan rekonsiliasi dengan pagination dan format angka rupiah.
