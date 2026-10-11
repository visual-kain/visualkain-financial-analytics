# Tech Steering — VisualKain Financial Data & Analytics

## 1. Core Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5.7+
- **Styling**: Tailwind CSS 3.4 + PostCSS + Autoprefixer
- **Charts & Visualizations**: Recharts (ResponsiveContainer, AreaChart spline, PieChart donut dengan glassmorphism tooltip) + Tremor Raw KPI patterns
- **Data Tables**: `@tanstack/react-table` + `@tanstack/react-virtual` (virtualized scrolling)
- **Numeric & Currency Formatting**: `react-number-format` (NumericFormat Rupiah) + `Intl.NumberFormat('id-ID')`
- **URL & Search State**: `nuqs` (Type-safe query parameter sync untuk filter rentang tanggal, kategori arus kas, dan tab aktif)
- **Spreadsheet & Reporting**: `xlsx` (SheetJS) untuk ekspor data + `react-to-print` untuk cetak rekonsiliasi
- **Loading State**: Tailwind CSS Native Shimmer Gradient & Primitives (`before:animate-shimmer` mask)
- **Unit Testing**: Vitest 3.0 + jsdom + `@testing-library/react`
- **Iconography**: `@phosphor-icons/react` + `lucide-react`
- **Dialogs & Overlays**: `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-tabs`, `sonner`

## 2. Invariants & Performance
- **Vitest Testing**: Semua formula perhitungan arus kas, alokasi kantong pokok vendor (HPP), dan estimasi profit harus lulus test unit di `src/lib/financial-calculator.test.ts`.
- **Zero CLS**: Seluruh kartu metrik finansial wajib memiliki skeleton shimmer identik saat proses fetching data.
- **Monospace Font**: Semua nilai rupiah menggunakan class `.currency` atau `.tabular-num` dengan font `JetBrains Mono`.
