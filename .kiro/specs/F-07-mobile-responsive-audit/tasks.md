# Implementation Tasks: F-07 Mobile-First Responsive & Touch Audit

## Phase 1: Mobile Navigation Architecture
- [x] **Task 1.1: Implement MobileBottomNav component**
  - Path: `src/components/layout/MobileBottomNav.tsx`
  - Render thumb-friendly navigation bar for `< 768px` viewports (`md:hidden`).
  - Support `dashboard`, `cashout`, `vendor`, and optional dev `manual` tab with badge and icons.
  - Comply with 48px tap targets and safe-area inset (`env(safe-area-inset-bottom)`).
  - _Requirements: 1.1, 1.2, 1.3, 3.3_

- [x] **Task 1.2: Integrate MobileBottomNav & Responsive Layout in page.tsx**
  - Path: `src/app/page.tsx`
  - Mount `<MobileBottomNav activeTab={tab} onSelectTab={setTab} showHiddenTabs={isDevMode} />`.
  - Add `pb-24 md:pb-8` to `<main>` so fixed bottom nav never occludes cards or buttons.
  - Simplify mobile top header: compact chip row, clean period selector, prominent action button.
  - _Requirements: 1.1, 1.3, 3.1, 3.2_

---

## Phase 2: Master Finance Table Reflow (Fix Sticky Collision & Action Buttons)
- [x] **Task 2.1: Implement MobileOrderCard View & Table View Toggle**
  - Path: `src/components/finance/MasterFinanceTable.tsx`
  - Create `MobileOrderCard` sub-component rendering each order as a card on `< 768px` screens.
  - Card displays invoice number, customer name, project name, DP badge, financial figures, and 4 distinct touch buttons (min 44px).
  - Add view switcher toggle: `[Kartu | Tabel]` on mobile toolbar.
  - _Requirements: 2.1, 2.2, 2.3, 3.3_

- [x] **Task 2.2: Fix Table Sticky Column Overlap Bug**
  - Path: `src/components/finance/MasterFinanceTable.tsx`
  - Scope sticky CSS classes: apply `sticky` only on `md:` breakpoint (`md:sticky md:left-0`, `md:sticky md:right-0`), preventing dual-sticky collision on `< 768px`.
  - Ensure table scrolls smoothly without overlapping headers on mobile viewports.
  - _Requirements: 2.1, 2.4_

---

## Phase 3: Modal & Drawer Mobile Usability Refactor
- [x] **Task 3.1: Refactor EditFinanceModal for Mobile Screens**
  - Path: `src/components/finance/EditFinanceModal.tsx`
  - Wrap modal form body in `overflow-y-auto max-h-[calc(88vh-120px)]`.
  - Fix sticky footer ensuring "Simpan Perubahan Finansial" button is always reachable on phone.
  - Adjust input fields and label alignments for single-column mobile stacking.
  - _Requirements: 4.1, 3.3_

- [x] **Task 3.2: Refactor AddIncomeModal and Inspection Drawers**
  - Path: `src/components/finance/AddIncomeModal.tsx`, `src/components/finance/OrderInspectionDrawer.tsx`, `src/components/analytics/MetricDetailDrawer.tsx`
  - Ensure `AddIncomeModal` has scrollable wrapper when viewport height is constricted.
  - Replace desktop margin (`pl-10`) with `w-full pl-0` on mobile for both slide-over inspection drawers.
  - _Requirements: 4.2, 4.3_

- [x] **Task 3.3: Make InvoicePreviewModal Responsive**
  - Path: `src/components/finance/InvoicePreviewModal.tsx`, `src/app/globals.css`
  - Wrap invoice paper in responsive scroll container with touch horizontal pan support.
  - _Requirements: 4.4_

---

## Phase 4: Cash Outflow & Analytics Mobile Polish
- [x] **Task 4.1: Optimize CashOutflowSection for Mobile**
  - Path: `src/components/finance/CashOutflowSection.tsx`
  - Make filter toolbar responsive (stack cleanly on mobile without overlapping).
  - Add mobile-friendly transaction cards or clean touch scroll container for outflow table.
  - _Requirements: 3.1, 3.3, 5.1_

- [x] **Task 4.2: Audit Analytics & Vendor Mobile Charts**
  - Path: `src/components/analytics/AnalyticsCharts.tsx`, `src/components/finance/EscrowLiquidityBar.tsx`
  - Stack chart headers, legend badges, and metric cards seamlessly on mobile.
  - _Requirements: 5.1_

---

## Phase 5: Verification & Quality Gate
- [x] **Task 5.1: Run Full Test Suite & Static Analysis**
  - Run `npx tsc --noEmit` and `npm test`.
  - Ensure zero TypeScript errors and all tests pass.
- [x] **Task 5.2: Production Build Verification**
  - Run `npm run build`.
  - Confirm production build succeeds.

---

## Phase 6: 2-Grid Mobile Layout & Ergonomic Action Polish (User Request)
- [x] **Task 6.1: Header Filter & Action Buttons Mobile Restructure**
  - Path: `src/app/page.tsx`
  - Split mobile header controls into balanced rows: Row 1 = Bulan/Tahun grid 2-kolom, Row 2 = '+ Pemasukan' & 'Export CSV' row, Row 3 = Live status & Logout.
- [x] **Task 6.2: Escrow Liquidity Bar Mobile Redesign**
  - Path: `src/components/finance/EscrowLiquidityBar.tsx`
  - Re-align 2-Pocket pills into `grid grid-cols-2 gap-2` and footer audit metrics into 2-grid box.
- [x] **Task 6.3: FinanceStatsGrid 2-Grid Refactor**
  - Path: `src/components/analytics/FinanceStatsGrid.tsx`
  - Set mobile layout to `grid grid-cols-2 gap-2.5` with proportional font scale & touch area.
- [x] **Task 6.4: MasterFinanceTable Compact 2-Grid Order Cards**
  - Path: `src/components/finance/MasterFinanceTable.tsx`
  - Transform mobile cards into a 2-column grid (`grid grid-cols-2 gap-2.5`) with compact card view (No Inv, Customer, Omzet, DP/Status, Profit, Edit & Detail buttons).
- [x] **Task 6.5: 2-Grid Layout in Cash Outflow & Vendor Tabs**
  - Path: `src/components/finance/CashOutflowSection.tsx`, `src/components/finance/VendorPerformanceSection.tsx`
  - Refactor summary cards in Cash Outflow and Vendor Performance into 2-grid on mobile.
- [x] **Task 6.6: Quality Gate Verification**
  - Run `npx tsc --noEmit`, `npm test`, and `npm run build`.

---

## Phase 7: Mobile Screen Edge Header, Centralized Invoice Drawer & Visual Consistency
- [x] **Task 7.1: Centralize Invoice Action in Detail Drawer**
  - Path: `src/components/finance/MasterFinanceTable.tsx`, `src/components/finance/OrderInspectionDrawer.tsx`, `src/app/page.tsx`
  - Remove blue document icon button from desktop table actions row.
  - Add prominent `[📄 Lihat Faktur & Invoice Resmi]` button in `OrderInspectionDrawer` header.
- [x] **Task 7.2: Flush Mobile Header Card (Top, Left, Right Screen Boundaries)**
  - Path: `src/app/page.tsx`
  - Apply `-mx-3.5 -mt-4 border-t-0 border-x-0 rounded-t-none rounded-b-2xl` on mobile so header touches screen edges on top, left, and right, while preserving bottom rounded corners and spacing.
- [x] **Task 7.3: Unified White Card Design System for 3 Vendor Highlight Cards**
  - Path: `src/components/finance/VendorPerformanceSection.tsx`
  - Replace multicolored pastel fills (`amber-50`, `teal-50`, `blue-50`) with clean `bg-white border-slate-200/90 shadow-card-double` design system, matching Finance & Cash Outflow cards.
- [x] **Task 7.4: Harmonize Spacing and Responsive Dropdown Grid in Cash Outflow Mutasi**
  - Path: `src/components/finance/CashOutflowSection.tsx`
  - Standardize action buttons into balanced 2-column grid (`h-10 min-h-[40px]`), clean search bar, 2-column dropdown grid for Bulan & Tahun, full-width category dropdown, and tidy bottom data pill.
- [x] **Task 7.5: Quality Gate & Remote Push**
  - Pass TypeScript check (`tsc`), Vitest unit tests (12/12), and Next.js production build (`next build`).

