# Implementation Tasks: F-07 Mobile-First Responsive & Touch Audit

## Phase 1: Mobile Navigation Architecture
- [ ] **Task 1.1: Implement MobileBottomNav component**
  - Path: `src/components/layout/MobileBottomNav.tsx`
  - Render thumb-friendly navigation bar for `< 768px` viewports (`md:hidden`).
  - Support `dashboard`, `cashout`, `vendor`, and optional dev `manual` tab with badge and icons.
  - Comply with 48px tap targets and safe-area inset (`env(safe-area-inset-bottom)`).
  - _Requirements: 1.1, 1.2, 1.3, 3.3_

- [ ] **Task 1.2: Integrate MobileBottomNav & Responsive Layout in page.tsx**
  - Path: `src/app/page.tsx`
  - Mount `<MobileBottomNav activeTab={tab} onSelectTab={setTab} showHiddenTabs={isDevMode} />`.
  - Add `pb-24 md:pb-8` to `<main>` so fixed bottom nav never occludes cards or buttons.
  - Simplify mobile top header: compact chip row, clean period selector, prominent action button.
  - _Requirements: 1.1, 1.3, 3.1, 3.2_

---

## Phase 2: Master Finance Table Reflow (Fix Sticky Collision & Action Buttons)
- [ ] **Task 2.1: Implement MobileOrderCard View & Table View Toggle**
  - Path: `src/components/finance/MasterFinanceTable.tsx`
  - Create `MobileOrderCard` sub-component rendering each order as a card on `< 768px` screens.
  - Card displays invoice number, customer name, project name, DP badge, financial figures, and 4 distinct touch buttons (min 44px).
  - Add view switcher toggle: `[Kartu | Tabel]` on mobile toolbar.
  - _Requirements: 2.1, 2.2, 2.3, 3.3_

- [ ] **Task 2.2: Fix Table Sticky Column Overlap Bug**
  - Path: `src/components/finance/MasterFinanceTable.tsx`
  - Scope sticky CSS classes: apply `sticky` only on `md:` breakpoint (`md:sticky md:left-0`, `md:sticky md:right-0`), preventing dual-sticky collision on `< 768px`.
  - Ensure table scrolls smoothly without overlapping headers on mobile viewports.
  - _Requirements: 2.1, 2.4_

---

## Phase 3: Modal & Drawer Mobile Usability Refactor
- [ ] **Task 3.1: Refactor EditFinanceModal for Mobile Screens**
  - Path: `src/components/finance/EditFinanceModal.tsx`
  - Wrap modal form body in `overflow-y-auto max-h-[calc(88vh-120px)]`.
  - Fix sticky footer ensuring "Simpan Perubahan Finansial" button is always reachable on phone.
  - Adjust input fields and label alignments for single-column mobile stacking.
  - _Requirements: 4.1, 3.3_

- [ ] **Task 3.2: Refactor AddIncomeModal and Inspection Drawers**
  - Path: `src/components/finance/AddIncomeModal.tsx`, `src/components/finance/OrderInspectionDrawer.tsx`, `src/components/analytics/MetricDetailDrawer.tsx`
  - Ensure `AddIncomeModal` has scrollable wrapper when viewport height is constricted.
  - Replace desktop margin (`pl-10`) with `w-full pl-0` on mobile for both slide-over inspection drawers.
  - _Requirements: 4.2, 4.3_

- [ ] **Task 3.3: Make InvoicePreviewModal Responsive**
  - Path: `src/components/finance/InvoicePreviewModal.tsx`, `src/app/globals.css`
  - Wrap invoice paper in responsive scroll container with touch horizontal pan support.
  - _Requirements: 4.4_

---

## Phase 4: Cash Outflow & Analytics Mobile Polish
- [ ] **Task 4.1: Optimize CashOutflowSection for Mobile**
  - Path: `src/components/finance/CashOutflowSection.tsx`
  - Make filter toolbar responsive (stack cleanly on mobile without overlapping).
  - Add mobile-friendly transaction cards or clean touch scroll container for outflow table.
  - _Requirements: 3.1, 3.3, 5.1_

- [ ] **Task 4.2: Audit Analytics & Vendor Mobile Charts**
  - Path: `src/components/analytics/AnalyticsCharts.tsx`, `src/components/finance/EscrowLiquidityBar.tsx`
  - Stack chart headers, legend badges, and metric cards seamlessly on mobile.
  - _Requirements: 5.1_

---

## Phase 5: Verification & Quality Gate
- [ ] **Task 5.1: Run Full Test Suite & Static Analysis**
  - Run `npx tsc --noEmit` and `npm test`.
  - Ensure zero TypeScript errors and all tests pass.
- [ ] **Task 5.2: Production Build Verification**
  - Run `npm run build`.
  - Confirm production build succeeds.
