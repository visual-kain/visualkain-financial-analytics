# Technical Design Specification — F-08: Cash Inflow Management & Payment Tracking (Dana Masuk)

## 1. System Architecture & Data Flow

```
                      ┌────────────────────────────────────────┐
                      │           Firestore Database           │
                      └───────────────┬────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
        Koleksi `orders`                          Koleksi `kas`
      (riwayatPembayaran,                         (jenis: 'masuk')
      dp1, dp2, pelunasan)                                 │
                 │                                         │
                 ▼                                         ▼
        ┌─────────────────────────────────────────────────────────┐
        │             useFirebaseFinance Hook Layer               │
        │               (Realtime Firestore Sync)                 │
        └────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │             Dual-Source Inflow Aggregator               │
        │           (transformToInflowEntries helper)             │
        │                                                         │
        │  1. Extract `order.pembayaranList` -> InflowEntry[]     │
        │  2. Extract `kas` (tipe === 'masuk') -> InflowEntry[]   │
        │  3. Merge & Sort by `tanggal` descending                │
        └────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │    CashInflowSection View     │
                     └───────────────┬───────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   4 KPI Metric Cards        Recharts Analytics       Filter Toolbar &
   - Total Masuk             - Daily Inflow Bar       - Live Search
   - DP & Order Pelunasan    - Type Donut Chart       - Filter Jenis
   - Kas Masuk Non-Order                              - Export Excel
   - Rata-rata Masuk                                  - + Catat Kas
           │
           ▼
   Dual-Layout Mutasi Feed:
   ├── Desktop (>= 768px): Full Spreadsheet Table (Tanggal, No Inv, Customer, Jenis, Keterangan, Nominal, Aksi)
   └── Mobile (< 768px): Ergonomic 2-Grid Card System (/antislop-layoutmobile, anti-overflow, Detail / Hapus)
```

---

## 2. Interface & Data Contracts

### 2.1 Extension to `FinanceSubTab`
In `src/types/index.ts`:
```ts
export type FinanceSubTab = 'dashboard' | 'cashin' | 'cashout' | 'vendor' | 'manual';
```

### 2.2 Inflow Entry Contract (`CashInflowEntry`)
```ts
export type InflowCategoryType = 'dp' | 'termin' | 'pelunasan' | 'kas_masuk';

export interface CashInflowEntry {
  id: string;
  tanggal: string;              // YYYY-MM-DD
  sumber: 'order' | 'manual';   // 'order' dari invoice konsumen, 'manual' dari koleksi kas
  jenis: InflowCategoryType;
  noInv?: string;               // Referensi nomor invoice (misal: 'VK260041')
  orderId?: string;             // ID order untuk inspeksi drilldown
  customerName: string;         // Nama customer atau sumber dana
  projectName?: string;         // Nama project pesanan
  keterangan: string;           // Keterangan / catatan pembayaran
  nominal: number;              // Jumlah rupiah masuk
  rawOrder?: Order;             // Referensi order lengkap untuk modal inspeksi
}
```

---

## 3. Component Inventory

| Komponen | Status | Tanggung Jawab |
|---|---|---|
| `src/components/finance/CashInflowSection.tsx` | **BARU** | Komponen utama tab Dana Masuk: 4 KPI Cards, Grafik Analitik, Filter, dan Mutasi Feed (Desktop & Mobile). |
| `src/components/layout/Sidebar.tsx` | **MODIFIKASI** | Tambahkan tab `cashin` ("Cash Inflow") dengan badge dan icon `ArrowDownLeft` / `Coins`. |
| `src/components/layout/MobileBottomNav.tsx` | **MODIFIKASI** | Tambahkan tab `cashin` ("Dana Masuk"), menyusun 4 tab mobile simetris ergonomis. |
| `src/app/page.tsx` | **MODIFIKASI** | Tambahkan routing state untuk `tab === 'cashin'`, handler aksi inspeksi detail, dan judul header view. |

---

## 4. Mobile Ergonomics & Anti-Slop Layout Standards (`/antislop-layoutmobile` & `/antislop-ui`)

1. **Card Container**:
   - `grid grid-cols-2 gap-2 sm:gap-2.5 p-2 sm:p-3 bg-slate-50/40`
   - Tiap card: `rounded-xl border border-slate-200/90 bg-white p-2 sm:p-2.5 shadow-2xs flex flex-col justify-between gap-1.5 overflow-hidden`
2. **Header Bar**:
   - Tanggal: `font-mono text-[9px] sm:text-[9.5px] text-slate-400 font-medium truncate`
   - Status Badge: `px-1.5 py-0.5 text-[8px] sm:text-[8.5px] font-bold rounded-full border shrink-0` (DP: Blue, Termin: Amber, Pelunasan: Emerald, Kas Masuk: Purple).
3. **Identitas**:
   - No Inv (jika ada): `text-[9.5px] font-mono font-extrabold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/80 shrink-0`
   - Customer & Project: `text-[11px] sm:text-xs font-bold text-slate-900 truncate`
4. **Hero Nominal**:
   - `font-mono font-bold text-[11px] sm:text-xs text-emerald-600 truncate`
5. **Aksi**:
   - Jika sumber `order`: Tombol `Detail` (icon `Eye h-3 w-3`) untuk membuka `OrderInspectionDrawer`.
   - Jika sumber `manual`: Tombol `Hapus` (icon `Trash2 h-3 w-3 text-rose-500`) untuk menghapus transaksi kas manual.
