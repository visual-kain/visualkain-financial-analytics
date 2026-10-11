# Technical Design — F-04: Vendor Performance Intelligence & Cost Ranking

## 1. Schema & Analytics Model
```typescript
export interface VendorPerformanceItem {
  vendorId: string;
  vendorNama: string;
  orderCount: number;
  pcsTotal: number;
  avgLenganPendek: number;
  avgLenganPanjang: number;
  avgTanpaLengan: number;
  hppQuotation: number;
  hppAktual: number;
  selisihQuotation: number; // hppAktual - hppQuotation
  profit: number;
  marginPercent: number;
}

export interface CheapestByCategory {
  kategori: string;
  vendorNama: string;
  avgCost: number; // Rata-rata HPP per pcs
}
```

## 2. Component Layout
```
src/components/finance/
├── VendorPerformanceSection.tsx # Container utama modul vendor
├── VendorHighlightCard.tsx       # Kartu highlight paling banyak dipakai & termurah per produk
└── VendorComparisonTable.tsx     # Tabel ranking perbandingan komparatif vendor
```
