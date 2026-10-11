# Test Strategy

## Current State

No automated test framework is currently configured for the project. Testing relies heavily on manual verification against real CSV data samples migrated from the legacy system.

## Planned Test Layers (Pyramid)

| Layer | Technology | Target |
|---|---|---|
| Unit | Vitest | Utility functions, data transformations, and billing calculations. |
| Component | React Testing Library | Form validation, UI states (loading, error, empty). |
| End-to-End | Playwright | Critical user flows: patient registration, visit recording, cash entry. |
| Manual | N/A | UX verification, environment-specific behavior using real data samples. |

## Risk-Based Rules

- Financial and billing calculations are the highest priority for unit tests.
- Form inputs for patient registration and medical records must handle validation accurately.
- Database access relies on Supabase Row Level Security (RLS) which must be verified manually until integration tests are set up.
- All manual verification must use real clinic data samples to ensure edge cases in legacy data are handled.

## Coverage Target

- Primary focus: Critical paths first (billing calculations, patient search).
- Secondary focus: CRUD operations for core entities (patients, visits, cash flows).
