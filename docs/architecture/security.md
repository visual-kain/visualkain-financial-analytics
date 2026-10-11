# Security Baseline

## Security Ownership

- Security approver: Developer
- Data classification owner: Pemilik Klinik

## Trust Boundaries

```text
Untrusted Client (Browser)
  ├──> Authenticated Supabase Client
  │     └──> Supabase RLS (Row Level Security) Enforcement Point
  │           └──> PostgreSQL Database & Supabase Storage (Private Bucket)
  └──> Hybrid Fallback Upload Adapter (src/lib/storage.ts)
        └──> Cloudinary Cloud Storage (Scoped Media Upload)
```

## Authentication

- Provider: Supabase Auth
- Roles: `kasir`, `dokter`, `owner`
- Strategy: Role-Based Access Control (RBAC) via Supabase Custom Claims or User metadata.
- Token storage: Managed by Supabase Auth (local storage and cookies).

## Data Classification

| Classification | Examples | Storage | Logging |
|---|---|---|---|
| Public | Clinic profile, village names | `src/constants/clinic.ts` | Allowed |
| Internal | Doctor names, ICD-10 codes, tariff defaults | Standard (Supabase Postgres) | Allowed |
| Sensitive | Patient NIK KTP, BPJS numbers, medical diagnoses, circumcision photos | Restricted via RLS, Supabase Private Bucket / Cloudinary Media | Redacted |
| Restricted | Supabase service_role key, Cloudinary API secret, `.env.local` | Server environments only | Prohibited |

## Secret Management

- Secrets must use environment variables (`.env.local`).
- Client-facing keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`) are safe for browser exposure.
- Server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`) must NEVER be prefixed with `NEXT_PUBLIC_` and must never reach the browser client.
- Real credentials in `.env.local` must remain gitignored.

## Input and Abuse Protection

- Validation: Client-side validation via form components and server-side validation enforced by PostgreSQL schema constraints.
- Photo upload security:
  - Client-side compression to WebP (< 300KB) via `compressImageToWebP` before network dispatch.
  - Unguessable UUID-based storage paths: `{pasienId}/{tindakanId}_{timestamp}.webp`.
  - Supabase Storage access requires short-lived signed URLs (TTL 3600 seconds).
  - Cloudinary uploads use dedicated scoped upload presets.
