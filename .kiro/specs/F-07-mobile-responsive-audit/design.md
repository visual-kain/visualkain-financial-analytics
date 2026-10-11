# Technical Design: F-07 Mobile-First Responsive & Touch Architecture

## Overview & Architectural Principles
Sistem dirancang ulang untuk mematuhi filosofi `/antislop-layoutmobile`:
> **"Mobile layout is a different layout, not the desktop layout at a smaller size."**

Perubahan ini tidak sekadar menambahkan CSS media query tambalan, melainkan menyediakan **Dual-State Presentation Model**:
- **Desktop/Tablet (`>= 768px`)**: Layout meja kerja penuh (Collapsible Sidebar, Master Spreadsheet Table dengan frozen columns, multi-column dashboard grid).
- **Mobile Smartphone (`< 768px`)**: Layout telapak tangan (Fixed Bottom Navigation Bar, Mobile Order Card List, Full-Width Bottom Sheet Drawers, Compact Header Filter).

---

## 1. Confirmed Architecture Decisions (via /grill-me)
1. **Data Display Strategy (< 768px)**:
   - **Default**: Adaptive Mobile Order Card View (`MobileOrderCard`). Setiap pesanan dirender sebagai kartu interaktif dengan status order, progres DP, metrik keuangan kunci, dan 4 tombol aksi berukuran minimum 44px (Faktur, Edit, Detail Cicilan, WA).
   - **Toggle Opsi**: Tombol toggle `[Kartu | Tabel]` di header tabel memungkinkan klien melihat tabel spreadsheet horizontal kapan saja tanpa tabrakan sticky kanan.
2. **Mobile Navigation**:
   - Fixed Bottom Navigation Bar (`MobileBottomNav.tsx`) terpasang permanen di bagian bawah layar HP (`md:hidden`) untuk 3 sub-modul utama: Dashboard, Cash Outflow, dan Vendor Performance.
   - Kontainer `<main>` diberi safe-area padding `pb-24` agar tidak ada kartu atau tombol yang tertutup.
3. **Primary Input Action Bar**:
   - Header mobile diringkas: chip periode yang bersih dan tombol input transaksi menonjol ("+ Pemasukan" / "+ Catat Pengeluaran") langsung terlihat di bagian atas tanpa tumpukan vertikal berlebih.
4. **Form Modal & Sheet Ergonomics**:
   - `EditFinanceModal` dan `AddIncomeModal` menggunakan pola **Full-Screen Bottom Sheet**: panel memenuhi layar HP (`max-h-[95vh]` / `h-full`), isi formulir dapat di-scroll vertikal (`overflow-y-auto`), dan tombol aksi "Simpan" dipasang sebagai sticky footer di bawah sehingga tidak akan pernah terpotong oleh keyboard virtual.


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

---

## 4. Mobile 2-Grid Architecture & High-Density Visual Polish (Grill-Me Settled)

### 4.1 Top Header Action Layout
- **Mobile (< 768px)**:
  - Row 1: Filter Bulan & Filter Tahun dalam `grid grid-cols-2 gap-2 w-full`.
  - Row 2: Tombol `+ Tambahan Pemasukan` (`flex-1`) dan `Export CSV` berjejer seimbang.
  - Sub-row: Status `Live Firestore` dan tombol logout `Keluar` berukuran proporsional.

### 4.2 Escrow Liquidity Bar Redesign
- Header: Shield icon + Judul rapi, badge `2-Pocket Accounting` ditaruh proporsional tanpa tabrakan teks.
- Status Kantong (2-Pocket Pills): Menggunakan `grid grid-cols-2 gap-2 w-full`. Kiri = Kas Bebas (Emerald), Kanan = Terkunci Vendor (Amber).
- Progress Bar: Full width rounded pill dengan pembagian persentase kontras.
- Bottom Audit Box: Menggunakan `grid grid-cols-2 gap-2 pt-3 border-t border-slate-100`. Kiri = Saldo Bank Riil & Status BCA; Kanan = % Likuiditas & Status Utang Vendor.

### 4.3 2-Grid KPI Summary Cards
- `FinanceStatsGrid`, `CashOutflowSection`, dan `VendorPerformanceSection`:
  - Mobile `< 640px`: `grid grid-cols-2 gap-2.5`.
  - Tablet/Desktop `>= 640px`: responsif ke `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6` / `lg:grid-cols-4`.
  - Card internal padding `p-3.5 sm:p-5`, icon ringkas, font angka `text-base sm:text-2xl font-bold tabular-nums`.

### 4.4 Compact 2-Grid Master Order Cards
- Container: `grid grid-cols-2 gap-2.5 p-3 bg-slate-50/40`.
- Setiap kartu berukuran seimbang:
  - Header: No Inv pill + Status Badge (`PRODUKSI`, dll).
  - Info: Nama Customer (font-extrabold, truncate) & Nama Project (truncate).
  - Finansial: Total Invoice (bold), Status/Sisa DP (amber/teal), Profit (emerald).
  - Tombol: 2 tombol sentuh responsif (`[✏️ Edit]` dan `[👁️ Detail]`). Drawer inspeksi menyajikan rincian lengkap, tombol WA, dan faktur.
