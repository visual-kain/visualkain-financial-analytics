# Requirements Specification: F-07 Mobile-First Responsive & Touch Audit

## Executive Summary
Klien utama VisualKain (Kak Glora Sawita) menggunakan perangkat ponsel pintar (HP/Smartphone) sebagai sarana kerja utama operasional harian. Audit mendalam menemukan bahwa antarmuka saat ini mengasumsikan desktop canvas:
1. Sidebar tersembunyi tanpa navigasi alternatif pada mobile (`hidden md:flex`), menyebabkan kebuntuan navigasi.
2. Dual-sticky frozen columns (304px kiri + 300px kanan = 604px) pada `MasterFinanceTable` saling bertabrakan dan menutupi konten pada viewport 360–414px (sesuai bukti tangkapan layar user).
3. Kolom aksi tabel terdorong/tertutupi, menyebabkan tombol input/edit data order (pencil icon) tidak dapat diakses di HP.
4. Modal form (`EditFinanceModal`, `AddIncomeModal`) memiliki container yang memotong tombol submit pada layar pendek / saat keyboard virtual terbuka.
5. Dokumen faktur `InvoicePreviewModal` menggunakan fixed paper `210mm` (794px) yang menyebabkan overflow horizontal masif.

Spesifikasi ini menegakkan kaidah `/antislop-layoutmobile` (R-03, R-05, R-35) dan Clean Architecture mobile.

---

## Glossary & Conventions
- **HP / Mobile Viewport**: Layar smartphone dengan lebar 360px – 430px (e.g., iPhone SE/13/15, Samsung Galaxy, Xiaomi).
- **Dual-Sticky Collision**: Kegagalan tata letak di mana total lebar kolom frozen melebihi lebar viewport, menyebabkan tabrakan elemen.
- **Card Reflow**: Transformasi baris data tabel menjadi kartu vertikal modular yang ramah sentuhan.
- **Minimum Tap Target**: Standar ergonomi antarmuka jari sebesar minimal 44 x 44 px dengan jarak aman.

---

## Requirements (RFC 2119)

### 1. Mobile Navigation & Routing
- **1.1**: The system SHALL provide a dedicated thumb-friendly Mobile Navigation (Bottom Nav Bar or Mobile Drawer) when viewport width is `< 768px` (`md`).
- **1.2**: WHEN a user taps any navigation item on mobile, the application SHALL switch the active tab (`dashboard`, `cashout`, `vendor`) without layout jump.
- **1.3**: The fixed bottom navigation bar SHALL reserve bottom safe-area padding (`pb-20` / `env(safe-area-inset-bottom)`) so that it NEVER covers content or bottom buttons.

### 2. Master Finance Table Reflow & Sticky Resolution
- **2.1**: WHEN viewport is `< 768px`, the system SHALL NOT render dual-sticky left and right columns simultaneously.
- **2.2**: The system SHALL provide an adaptive Mobile Order Card View for mobile viewports where each order is rendered as an ergonomic card with:
  - Header: NO INV, Nama Customer, Nama Project, Status Badge.
  - Metrics Grid: Total Invoice, DP Nominal & Persen, Sisa Pelunasan Customer, HPP Vendor, Sisa Bayar Vendor, Profit Bersih.
  - Action Row: Quick Invoice Preview button, Quick Edit Finance button, Detail Drawer button, WA Follow-up button with minimum 44px touch targets.
- **2.3**: The user SHALL be able to toggle between "Tampilan Kartu" (Card View) and "Tampilan Tabel Horizontal" (Table View) on mobile.
- **2.4**: In Table View on mobile, the sticky right column SHALL be disabled to prevent header collision.

### 3. Action & Input Buttons Accessibility
- **3.1**: The button to input new transactions ("Tambahan Pemasukan" & "Catat Pengeluaran") SHALL remain visible, discoverable, and accessible on mobile viewports.
- **3.2**: On mobile header, controls SHALL reflow gracefully without stacking 6+ items vertically.
- **3.3**: Interactive buttons on mobile SHALL have minimum 44 x 44 px tap targets with active touch feedback (`active:scale-95`).

### 4. Modals, Sheets & Form Ergonomics
- **4.1**: `EditFinanceModal` SHALL be fully scrollable (`overflow-y-auto`) on mobile with a sticky action footer ensuring "Simpan Perubahan" is ALWAYS tappable.
- **4.2**: `AddIncomeModal` SHALL allow vertical scrolling when screen height is constricted or keyboard is open.
- **4.3**: `OrderInspectionDrawer` and `MetricDetailDrawer` SHALL utilize 100% viewport width on mobile (`pl-0` / `w-full`) to maximize readability.
- **4.4**: `InvoicePreviewModal` and `FinanceReportPaper` SHALL support mobile viewport scaling (`max-w-full overflow-x-auto` or proportional scaling) preventing viewport clipping.

### 5. Charts & Analytics Mobile Adaptation
- **5.1**: Charts in `AnalyticsCharts.tsx` and `CashOutflowSection.tsx` SHALL adapt height and legend layouts to stack on narrow viewports without clipping labels.
