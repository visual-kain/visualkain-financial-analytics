# Technical Design — F-05: Profit & HPP Aktual Reconciliation (Manual Override)

## 1. State Model & Draft Form
```typescript
export interface ManualFinanceDraft {
  orderId: string;
  hppAktual: number | null;
  profitAktual: number | null;
  catatanFinance: string;
  isDirty?: boolean;
}
```

## 2. Inline Component Design
```
src/components/finance/
└── ProfitAktualSection.tsx     # Tabel edit inline dengan input field monospaced dan button Simpan
```
Setiap input cell menggunakan `:focus { ring-2 ring-teal-500/30 border-teal-500 }` dengan font monospaced `font-mono`. Tombol simpan memiliki state loading spinner saat proses mutasi berlangsung.
