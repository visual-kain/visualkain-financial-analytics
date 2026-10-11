# Structure Steering — VisualKain Financial Data & Analytics

## 1. Directory Layout & Architecture
```
src/
├── app/
│   ├── layout.tsx                     # Global layout, HTML, typography, provider
│   ├── page.tsx                       # Dashboard Utama: Executive Financial Summary & Analytics
│   ├── globals.css                    # Tailwind & CSS custom properties (color tokens, font JetBrains Mono)
│   └── favicon.ico
├── components/
│   ├── ui/                            # Atomic reusable UI components (Card, Button, Badge, Shimmer)
│   │   ├── shimmer.tsx                # Zero-runtime Tailwind shimmer & skeleton loading primitives
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   └── badge.tsx
│   └── analytics/                     # Domain-specific financial analytics components
│       ├── FinanceStatsGrid.tsx       # 6 Kartu Ringkasan Finansial (Saldo Kas, Uang Masuk, Keluar, Utang Vendor, Piutang, Estimasi Profit)
│       ├── AnalyticsCharts.tsx        # Recharts Spline Area + Donut Alokasi Dana (HPP vs Margin)
│       └── TransactionLedgerTable.tsx # Headless table dengan TanStack Table & numeric formatting
├── lib/
│   ├── financial-calculator.ts        # Algoritma & kalkulasi finansial deterministik
│   ├── financial-calculator.test.ts   # Vitest unit test suite (scenario 1.420.000 customer payment)
│   └── utils.ts                       # Helper styling (cn), currency formatting (formatRupiah)
└── types/
    └── index.ts                       # Kontrak data finansial (Order, CustomerPayment, KasAdjustment, FinancialSummary)
```

## 2. SDD Specification Isolation
Dokumen spesifikasi teknis dan perancangan tersimpan pada:
- `.kiro/specs/financial-analytics-engine/`
  - `design.md`: Arsitektur model data, formulasi matematis akuntansi VisualKain, dan rancangan komponen.
  - `requirements.md`: Kebutuhan fungsional dan akseptansi RFC 2119.
  - `tasks.md`: Rincian tugas bertahap.
  - `spec.json`: Metadata siklus hidup spesifikasi.
