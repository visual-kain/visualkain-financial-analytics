---
id: PRODUCT-ROADMAP
title: Product Roadmap
status: active
owner: Developer
last_updated: 2026-09-18
---

# Product Roadmap

## Purpose

This file records strategic capability order, release intent, and dependency rationale.

It is not the execution-status board. Mutable feature/task status belongs in `docs/context/state.yaml` and its generated views.

## Releases and milestones

### MVP — Minimum Viable Product

Outcome:

A fully functional web-based clinic management system capable of handling daily operations, managing patient data, recording medical visits, and tracking cash flows, successfully transitioning from CSV files to a digital system.

Target capabilities:

- `F-001` — Master Pasien & Kasir (Patient registration, billing)
- `F-002` — Rekam Medis Dokter (Doctor's medical records)
- `F-003` — Buku Kas & Kapitasi BPJS (Cash book, BPJS capitation tracking)
- `F-004` — Dashboard & Ekspor Excel (Overview dashboard, Excel export)
- `F-005` — Migrasi 7,493 Data CSV (Data migration from 4 CSV files)
- `F-006` — Register Program Khusus (TBC, Sunat, Pos-Rawat)

Dependencies:

- Vercel and Supabase Free Tier setup.
- Access to the 4 CSV files for F-005.

Explicitly excluded:

- Emerys Glow skincare inventory.
- BPJS P-Care API integration/bridging.
- Medication stock tracking per lot.
- TV queue display.
- Inpatient care (Rawat Inap).

Exit criteria:

- All 6 features pass acceptance criteria.
- Real data migration verified (7,493 visits, 4,238 patients).
- dr. Ovan sign-off.

## Capability ordering

| Capability | Why now | Depends on | Intended milestone |
|---|---|---|---|
| Core Modules (F-001 to F-004) | Foundation for clinic operations. | Supabase setup | Phase 1 (Week 1-2) |
| Data Migration (F-005) | Need historical data to operate effectively. | Core DB schema | Phase 2 (Week 2-3) |
| Special Programs (F-006) | Important clinic services that require custom tracking. | Core modules | Phase 3 (Week 3+) |

## Roadmap changes

Record material priority or scope changes with date and rationale. Do not copy task progress here.

| Date | Change | Rationale | Approved by |
|---|---|---|---|
| 2026-09-18 | Initial roadmap definition | Aligning with MVP scope and budget | Developer |
