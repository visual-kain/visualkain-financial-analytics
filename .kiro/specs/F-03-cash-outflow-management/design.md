# Technical Design — F-03: Cash Outflow Management & Category Breakdown

## 1. Component Structure
```
src/components/finance/
├── CashOutflowSection.tsx     # Komponen utama yang menaungi 4 KPI, riwayat mutasi, & breakdown
├── OutflowStatsCards.tsx      # 4 Kartu KPI pengeluaran
├── OutflowHistoryTable.tsx    # Tabel riwayat dana keluar dengan aksi hapus
├── OutflowCategoryList.tsx    # List breakdown per kategori
└── AddOutflowDrawer.tsx       # Vaul-based drawer modal untuk mencatat pengeluaran baru
```

## 2. Kategori Pengeluaran Standar VisualKain 2026
```typescript
export const OUTFLOW_CATEGORIES: CashOutflowCategory[] = [
  'Gaji/Upah',
  'Operasional',
  'Marketing dan Penjualan',
  'Logistik',
  'Keuangan',
  'Pajak',
  'Biaya Lain',
];
```
