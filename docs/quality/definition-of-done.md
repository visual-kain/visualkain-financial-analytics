---
id: QUALITY-DOD
title: Definition of Done
status: approved
owner: "Technical Lead"
last_updated: "2026-09-19"
---

# Definition of Done

## Task

A task is considered done only when:

- Code compiles successfully (`npm run build` passes).
- Linting passes without errors (`npm run lint`).
- Type checking passes without errors (`npx tsc --noEmit`).
- All acceptance criteria from the specification are met.
- Mobile (360px–640px) and tablet (768px–1024px) responsiveness verified with 44×44px minimum touch targets and zero horizontal overflow.
- No unrelated changes are included in the commit or pull request.
- The execution state is updated appropriately.

## Feature

A feature is considered done only when:

- All committed tasks for the feature are completed.
- Edge cases are explicitly handled, including empty states, error states, and loading states.
- The feature has been tested manually with real clinic data samples (e.g., patient records, cash flows).
- Critical manual flows are accepted by the product owner or technical lead.

## Documentation

A documentation change is considered done only when:

- The canonical source is updated.
- Links and references validate successfully.
- Assertions and claims are grounded in actual project artifacts without fabrication.
