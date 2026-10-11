---
id: ADR-002
title: "Supabase Storage for Medical Photo Uploads"
status: accepted
date: "2026-09-18"
deciders:
  - "Developer"
related_features:
  - "F-007"
  - "Medical Records"
supersedes: null
superseded_by: null
---

# ADR-002: Supabase Storage for Medical Photo Uploads

## Context

Feature F-007 requires storing medical photos, specifically circumcision post-op photos. This is sensitive patient data (HIPAA-adjacent sensitivity for Indonesian medical data). The system must allow a maximum of 2 photos per patient. Photos must be compressed on the client side to WebP format under 300KB. Access to these photos must be private and secure.

## Decision Drivers

- High sensitivity of medical data requiring secure, private access.
- Zero additional cost requirement (must fit within Supabase's 1GB free tier).
- Need for integrated authentication to control access.

## Considered Options

### Option A — Store in PostgreSQL as base64 BYTEA

Description: Convert images to base64 strings and store them directly in the database as BYTEA columns.

Advantages:

- Everything is in one place, simplifying backups.

Disadvantages:

- Significantly bloats the database size.
- Results in slow queries and increased memory usage.

### Option B — Cloudinary or Similar CDN

Description: Use a dedicated media management service like Cloudinary.

Advantages:

- Excellent image transformation and delivery capabilities.

Disadvantages:

- Introduces an additional service and potential cost.
- Data sovereignty and privacy concerns with third-party CDNs hosting sensitive medical data.

### Option C — Local File System on Vercel

Description: Upload and store files directly on the hosting server.

Advantages:

- Simple to implement locally.

Disadvantages:

- Vercel's file system is ephemeral; files will be lost on redeploy or across serverless function instances.

## Decision

We will use a Supabase Storage private bucket for storing medical photos. Access to the photos will be managed via signed URLs with expiry times. Photos will be compressed client-side to < 300KB WebP before upload.

Implementation boundaries:

- Client-side code will handle compression and enforcement of the 2-photo limit.
- Supabase Storage will handle the actual file persistence in a private bucket.
- Server actions or API routes will generate signed URLs for viewing the photos.

## Rationale

Supabase Storage is already part of our chosen stack (ADR-001), meaning it adds zero additional cost and integrates seamlessly with our existing authentication (same Supabase session). The private bucket combined with signed URLs provides the necessary security for sensitive medical data. The 1GB storage limit on the free tier is sufficient given the strict client-side compression (max 2 photos * 300KB * ~100 patients = ~60MB). Alternative options were rejected due to performance issues, costs, data privacy concerns, and architectural incompatibility with serverless deployments.

## Consequences

### Positive

- Secure storage of sensitive medical data using integrated auth.
- Zero extra monthly cost.
- Avoids database bloat.

### Negative

- Strict 1GB storage limit on the free tier.
- Photos are not directly searchable by content within the database.

### Risks and mitigations

- Storage limit risk: Mitigated by enforcing strict client-side compression to WebP (< 300KB) and limiting to 2 photos per patient.

## Implementation Impact

- Affected areas: `src/app/rekam-medis/`, `Supabase Storage Configuration`
- Migration required: No.
- Compatibility impact: None.
- Operational impact: Requires proper configuration of Supabase Storage RLS policies for the private bucket.

## Validation

The decision is correctly implemented when:

- A private bucket is created in Supabase Storage with appropriate RLS policies.
- Users can successfully upload compressed photos.
- Photos can only be accessed via securely generated signed URLs.

## Revisit Conditions

Reconsider when:

- The 1GB storage limit approaches capacity.
- The clinic needs to store significantly more or larger files (e.g., high-resolution X-rays, videos).

## References

- `ADR-001`
