# Technical Design Specification — F-09: Client Feedback Refinements & Quality Bugfix Spec

## 1. Technical Architecture & Modifications

```
+------------------------------------------------------------------------------------+
| 1. FinanceReportPaper.tsx                                                          |
|    - Hapus baris `Keuntungan Real (Manual)`                                        |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| 2. EditFinanceModal.tsx                                                            |
|    - State: `editingPaymentId: string | null`                                      |
|    - Kolom Aksi tabel: Tambah button `Pencil` (Edit)                               |
|    - Form populate: Muat tanggal, jenis, rekening, nominal, keterangan             |
|    - Handler: `handleUpdatePaymentEntry` mengganti item di `pembayaranList`        |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| 3. Period Sync Bugfix (page.tsx, CashOutflowSection.tsx, CashInflowSection.tsx)    |
|    - `page.tsx`: Operkan `filteredCashTxs` (atau `bulan` & `tahun`) ke section     |
|    - `CashOutflowSection.tsx`:                                                     |
|      * Sinkronkan `bulanFilter` & `tahunFilter` dengan props parent                |
|      * Hilangkan dobel-filter yang membingungkan klien                             |
|      * Daily trend chart otomatis mencerminkan hanya tanggal pada periode aktif    |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| 4. Escrow Transparency & Dynamic Calculation (AnalyticsCharts.tsx & page.tsx)      |
|    - `page.tsx`: Hitung akumulasi escrow dari `filteredOrders`:                    |
|      * `totalHakVendor = sum(alloc.alokasiHakVendor)`                              |
|      * `totalMarginVisualKain = sum(alloc.alokasiMarginVisualKain)`                |
|      * Operkan data dinamis ke `<AnalyticsCharts donutData={dynamicDonut} />`      |
|    - `AnalyticsCharts.tsx`: Tambah badge/tooltip keterangan asal-usul data formula |
+------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------+
| 5 & 6. Search Bar & Pagination (MasterFinanceTable.tsx)                            |
|    - Standard Header: Tambah Search Input box di atas card list / table            |
|    - Pagination:                                                                   |
|      * State: `currentPage: number` (1), `pageSize: number` (10)                   |
|      * `paginatedRows = filteredRows.slice((page-1)*size, page*size)`              |
|      * Kontrol UI: `Prev`, `[1]`, `[2]`, `[3]`, `Next` dengan hit target min 44px  |
|      * Reset `currentPage = 1` pada input pencarian / perubahan filter             |
+------------------------------------------------------------------------------------+
```

---

## 2. Component Modification Inventory

| File | Tipe Perubahan | Deskripsi |
|---|---|---|
| `src/components/finance/FinanceReportPaper.tsx` | Hapus Elemen | Menghilangkan baris `Keuntungan Real (Manual)`. |
| `src/components/finance/EditFinanceModal.tsx` | Fitur Aksi | Menambahkan aksi Edit payment row & update handler. |
| `src/components/finance/CashOutflowSection.tsx` | Bugfix Filter | Menyelaraskan filter periode dengan top executive header. |
| `src/app/page.tsx` | Data Wiring | Mengirimkan real dynamic escrow data ke `AnalyticsCharts` dan memastikan filter sinkron. |
| `src/components/analytics/AnalyticsCharts.tsx` | UI Transparency | Menampilkan keterangan audit asal-usul data alokasi dana escrow. |
| `src/components/finance/MasterFinanceTable.tsx` | Search & Pagination | Menempatkan search bar di standard view dan paginasi kartu mobile/tabel desktop. |
