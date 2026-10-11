# Architecture Boundaries

## Purpose

Define ownership and allowed dependencies between modules in the Klinik Cikidang Medika Next.js application.

## Boundary Matrix

| Layer | Path | May depend on | Must not depend on |
|---|---|---|---|
| Presentation | `src/app/` | Feature components, UI primitives, Constants, Domain types, Supabase client | Direct raw infrastructure or external upload APIs |
| Feature Components | `src/components/{feature}/` | UI primitives, Constants, Domain types, Supabase client, Storage adapter | Framework pages, other route-private logic |
| UI Primitives | `src/components/ui/` | Tailwind utilities (`src/lib/utils.ts`), React | Domain entities, Supabase client, Feature state |
| Domain Constants | `src/constants/` | TypeScript primitive types | Framework components, Supabase client, UI state |
| Domain | `src/types/` | None | Network, framework APIs, database drivers |
| Infrastructure | `src/lib/supabase/`, `src/lib/storage.ts`, `supabase/migrations/` | External SDKs (Supabase, Cloudinary) | Presentation state, UI components |

## Data Ownership

| Data or rule | Canonical owner | Consumers |
|---|---|---|
| Patients | Kasir, Dokter | Kasir, Dokter, Owner |
| Visits (Medical Records) | Dokter | Kasir, Owner |
| Cash Flows | Owner | Owner |
| Medical Photos | Dokter, Perawat | Dokter, Owner |

## Cross-Feature Rules

1. The presentation layer must use the configured Supabase clients (`src/lib/supabase/client.ts` or `server.ts`) instead of instantiating new ones.
2. Feature pages and domain components MUST use shared UI primitives from `src/components/ui/` and constants from `src/constants/` to guarantee design consistency.
3. Medical photo uploads must go through `src/lib/storage.ts` (`uploadMedicalPhoto`), which enforces WebP compression (< 300KB) and routes between Supabase Storage (primary 1GB) and Cloudinary (fallback 25GB).
4. Data models must strictly adhere to the types defined in `src/types/database.ts`.
5. Complex queries or reporting exports (e.g., sheetjs) must be isolated from the core UI components.
