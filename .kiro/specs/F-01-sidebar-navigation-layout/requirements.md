# Requirements Specification — F-01: Collapsible Executive Sidebar & Sub-Tab Navigation Layout

## 1. Executive Context & Scope
Sistem Financial Data & Analytics VisualKain 2026 memerlukan shell navigasi eksekutif berupa **Sidebar responsif & dual-state collapsible** yang menampung 4 sub-fitur finansial utama:
1. `Financial Dashboard`
2. `Cash Outflow (Dana Keluar)`
3. `Vendor Performance`
4. `Profit Aktual (Input Manual Finance)`

Navigasi wajib mengadopsi standar **Emil Kowalski** (tactile spring physics, floating active pill tab indicator dengan `framer-motion` layoutId) dan mobile drawer slide-up via `vaul`.

## 2. User Stories & Acceptance Criteria (RFC 2119)

### US-1.1: Navigasi Antar Sub-Tab Tanpa Full-Page Reload
- **GIVEN** pengguna berada di halaman dasbor finansial
- **WHEN** pengguna mengklik salah satu menu sub-tab pada sidebar atau floating nav
- **THEN** sistem SHALL mengganti konten view secara instan tanpa reload halaman, dan memperbarui query URL (`?tab=dashboard|cashout|vendor|manual`) via `nuqs`.

### US-1.2: Dual-State Collapsible Icon-Rail (260px ↔ 72px)
- **WHEN** pengguna menekan tombol toggle collapse di sidebar atau menekan kombinasi keyboard `Ctrl+B` (atau `Cmd+B`)
- **THEN** sistem SHALL memperkecil sidebar secara animasi halus menjadi icon-rail berukuran lebar $72\text{px}$, menyembunyikan teks label, dan menampilkan tooltip melayang saat kursor mengarah ke icon.
- **THEN** area konten utama (grafik & tabel data) SHALL melebar secara otomatis mengisi sisa ruang layar.

### US-1.3: Indikator Tab Melayang (Floating Active Pill)
- **WHEN** tab aktif berpindah
- **THEN** sistem SHALL menggerakkan background pill aktif menggunakan animasi transisi pegas (`framer-motion` layoutId `type: "spring", duration: 0.25, bounce: 0`).

### US-1.4: Responsivitas Mobile & Slide-Over Drawer
- **WHEN** sistem dibuka pada viewport mobile (< 768px)
- **THEN** sistem SHALL menyembunyikan sidebar desktop dan menyediakan trigger hamburger menu yang membuka drawer navigasi menggunakan `vaul` drawer.

### US-1.5: Kontrak Aksesibilitas & Touch Target
- **THEN** seluruh tombol navigasi pada sidebar SHALL memiliki ukuran sentuh minimum $44 \times 44\text{px}$ dan tactile feedback `:active { transform: scale(0.97); }`.
