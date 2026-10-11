---
id: QUALITY-REVIEW
title: Review Checklist
status: approved
owner: "Technical Lead"
last_updated: "2026-09-19"
---

# Review Checklist

## Scope and Traceability

- [ ] The scope of the change matches the intended task.
- [ ] No out-of-scope behavior is included.
- [ ] No fabricated data, claims, or statistics are introduced.

## Implementation and Security

- [ ] Supabase calls explicitly check for errors before using or returning data.
- [ ] Row Level Security (RLS) considerations are documented and enforced for all new tables.
- [ ] Monetary values and financial data use `NUMERIC(15,2)` in the database schema.
- [ ] The Indonesian locale (`id-ID`) is used consistently for displaying dates and currencies.
- [ ] No secrets or sensitive keys are hardcoded in the codebase.
- [ ] No `console.log` statements are left in production code.

## User Experience & Reusability
 
- [ ] The user interface is mobile and tablet responsive across 360px, 768px, and 1024px+ viewports.
- [ ] No unwanted horizontal scroll exists on mobile devices (`overflow-x` contained).
- [ ] Touch targets are at least 44×44px with minimum 8px (`gap-2`) spacing between adjacent interactive controls.
- [ ] Mobile navigation drawer opens cleanly via hamburger button and closes upon route click or backdrop tap.
- [ ] Typography adheres to **Plus Jakarta Sans** with tabular numbers for currency and codes.
- [ ] UI components MUST use atomic primitives from `src/components/ui/` (Button, Badge, Modal, Input, Select, Card).
- [ ] Constant clinic attributes (villages, honorifics, default tariffs) MUST be imported from `src/constants/clinic.ts` and never hardcoded.
- [ ] Error, loading, and empty states are implemented for the feature.
