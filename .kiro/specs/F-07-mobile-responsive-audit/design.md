# Technical Design: F-07 Mobile-First Responsive & Touch Architecture

## Overview & Architectural Principles
Sistem dirancang ulang untuk mematuhi filosofi `/antislop-layoutmobile`:
> **"Mobile layout is a different layout, not the desktop layout at a smaller size."**

Perubahan ini tidak sekadar menambahkan CSS media query tambalan, melainkan menyediakan **Dual-State Presentation Model**:
- **Desktop/Tablet (`>= 768px`)**: Layout meja kerja penuh (Collapsible Sidebar, Master Spreadsheet Table dengan frozen columns, multi-column dashboard grid).
- **Mobile Smartphone (`< 768px`)**: Layout telapak tangan (Fixed Bottom Navigation Bar, Mobile Order Card List, Full-Width Bottom Sheet Drawers, Compact Header Filter).

---

## 1. Component State & Presentation Flow

```
+-------------------------------------------------------------------+
|                        Viewport Width Detection                   |
|                        (Tailwind `md:` / CSS Media)               |
+---------------------------------+---------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v (< 768px - Mobile HP)                     v (>= 768px - Desktop)
+---------------------------------------+   +---------------------------------------+
|  Mobile Header Bar (Compact)          |   |  Executive Topbar                     |
|  - Brand & Profile Quick Chip         |   |  - Full Filter Selects                |
|  - Period Chip (Opens Filter Sheet)   |   |  - Desktop Action Buttons             |
|  - Primary Action Button ("+ Pemasukan")  |  - Persistent Collapsible Sidebar    |
+---------------------------------------+   +---------------------------------------+
|  Mobile Content View:                 |   |  Desktop Content View:                |
|  - Escrow Bar (Stacked Legend)        |   |  - Escrow Bar (Horizontal)            |
|  - 6 Metric Cards (1-col or 2-col)    |   |  - 6 Metric Cards (6-col grid)        |
|  - Order Cards (Reflowed cards)       |   |  - Master Spreadsheet Table           |
|    * Expandable detail & 4 actions    |   |    (Dual-sticky left & right frozen)  |
|  - Option to view Horizontal Table    |   +---------------------------------------+
|    (No right sticky, free scroll)     |
+---------------------------------------+
|  Fixed Bottom Navigation Bar          |
|  - [Dashboard]  [Cash Out]  [Vendor]  |
|  - Safe-area inset + 48px tap targets |
+---------------------------------------+
```

---

## 2. Root Cause & Solution Blueprint

### A. Master Table Sticky Overlap Defect
- **Root Cause**:
  `MasterFinanceTable` menerapkan `sticky left-0` (128px), `sticky left-[128px]` (176px), `sticky right-[124px]` (176px), `sticky right-0` (124px). Total width = 604px. Pada layar iPhone/Android (360–414px), kolom kiri dan kanan bertabrakan saling menimpa.
- **Solution**:
  1. Default tampilan mobile (< 768px) dialihkan ke **Order Card View** (`MobileOrderCard`).
  2. Setiap kartu memuat:
     - Header: Invoice badge, Nama Customer, Nama Project.
     - Status badges: Status Order & DP Threshold (Lunas / DP 70% / DP 1).
     - Rangkuman Keuangan: Total Jual, DP Masuk, Sisa Pelunasan, HPP Vendor, Sisa Vendor, Margin Bersih.
     - 4 Tombol Aksi Mandiri dengan target sentuh `min-h-[44px]`:
       - [Faktur PDF] (Biru)
       - [Edit Finansial] (Teal)
       - [Detail Cicilan] (Slate)
       - [WA Follow-up] (Hijau)
  3. Menyediakan toggle `Tampilan: [Kartu | Tabel]`. Jika user memilih "Tabel", class sticky dinonaktifkan pada mobile (`md:sticky md:right-...`) sehingga tabel dapat di-swipe bebas tanpa tabrakan kolom.

### B. Mobile Navigation Defect
- **Root Cause**:
  `Sidebar.tsx` memiliki class `hidden md:flex`. Tidak ada alternatif navigasi pada mobile.
- **Solution**:
  1. Buat komponen `MobileBottomNav.tsx` yang dipasang fixed di bawah layar khusus tampilan mobile (`md:hidden`).
  2. Tab navigasi mencakup:
     - 📊 Dashboard (`dashboard`)
     - 💸 Cash Out (`cashout`)
     - 👥 Vendor (`vendor`)
     - *(Opsional jika dev=true)* 📑 Profit Aktual (`manual`)
  3. Padding penyeimbang (`pb-24`) ditambahkan pada kontainer `<main>` agar tidak ada konten yang tertutup bilah navigasi bawah.

### C. Form & Modal Usability Defect
- **Root Cause**:
  Modal menggunakan `max-h-[92vh] flex flex-col` dengan inner form tanpa scroll vertikal aktif, sehingga tombol simpan di footer terpotong.
- **Solution**:
  1. `EditFinanceModal.tsx`:
     - Inner content dibungkus dalam `overflow-y-auto max-h-[calc(85vh-120px)] p-4`.
     - Sticky footer di bagian bawah (`border-t border-slate-100 bg-white p-4 shrink-0`) memastikan tombol "Simpan Perubahan Finansial" selalu terlihat dan dapat ditekan dengan satu sentuhan jempol.
  2. `OrderInspectionDrawer.tsx` & `MetricDetailDrawer.tsx`:
     - Ganti wrapper mobile dari `pl-10` menjadi `pl-0 w-full` pada `< sm` breakpoint.
  3. `InvoicePreviewModal.tsx` / `FinanceReportPaper.tsx`:
     - Tambahkan container pembungkus dengan `overflow-x-auto w-full max-w-full` dan kontrol zoom/fit untuk melihat faktur di layar sempit.

---

## 3. Ergonomics & Tap Target Compliance
- Seluruh tombol utama pada mobile memiliki dimensi minimum `44px x 44px`.
- Jarak antar tombol (touch target spacing) minimal `8px`.
- Seluruh elemen interaktif memiliki feedback sentuhan `active:scale-95 transition-all`.
