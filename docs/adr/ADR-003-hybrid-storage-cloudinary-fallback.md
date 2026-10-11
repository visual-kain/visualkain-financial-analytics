---
id: ADR-003
title: "Hybrid Storage Architecture with Cloudinary Fallback for Medical Photos"
status: accepted
date: "2026-09-19"
deciders:
  - "Developer"
related_features:
  - "F-006"
  - "F-007"
supersedes: null
superseded_by: null
---

# ADR-003: Hybrid Storage Architecture with Cloudinary Fallback for Medical Photos

## Context

In ADR-002, Supabase Storage (1GB free tier) was chosen as the primary storage mechanism for circumcision post-op photos. However, as the clinic scales its specialized circumcision and wound care programs (F-006), the 1GB quota poses a medium-term capacity bottleneck. Upgrading Supabase to a paid tier would violate the strict zero-additional-cost requirement for the client's MVP stage. The developer provisioned an external Cloudinary account offering a 25GB free tier specifically dedicated to media file storage.

## Decision Drivers

- Strict zero-monthly-cost constraint for clinic operations.
- Long-term capacity expansion for medical photo monitoring (circumcision post-care).
- High performance and reliability for clinic devices with limited bandwidth.
- Preservation of patient data privacy and minimal exposure of raw medical images.

## Considered Options

### Option A — Solely Supabase Storage (1GB)

Description: Rely solely on Supabase Storage and prune older photos after 6 months.

Disadvantages:
- Risk of losing post-care historical records required for clinical dispute resolution.
- Exceeding the 1GB limit requires a $25/month Supabase Pro plan.

### Option B — Complete Migration to Cloudinary

Description: Move all image uploads directly to Cloudinary and deprecate Supabase Storage.

Disadvantages:
- Breaks unified auth session boundaries for file access control.
- Does not leverage the already configured Supabase private bucket and RLS policies.

### Option C — Hybrid Storage with Transparent Fallback (Selected)

Description: Maintain Supabase Storage as the primary private storage bucket. Implement an intelligent client/server adapter in `src/lib/storage.ts` that uploads to Supabase Storage by default, but automatically routes or falls back to Cloudinary (25GB) if the Supabase quota is reached or an error occurs.

Advantages:
- Retains primary security and privacy in Supabase Storage for daily operations.
- Unlocks 25GB additional free storage via Cloudinary without breaking existing code.
- Client-side WebP compression (< 300KB) applies equally to both providers.

## Decision

We will implement a hybrid storage adapter in `src/lib/storage.ts`. All photos are compressed client-side to WebP < 300KB. The adapter targets Supabase Storage (`medical-photos` private bucket) by default, falling back to Cloudinary if the Supabase upload fails or quota exceeds thresholds.

Implementation boundaries:
- `src/lib/storage.ts`: Owns compression, provider selection, and upload orchestration.
- PostgreSQL database stores the resulting image URL and provider identifier (`provider: 'supabase' | 'cloudinary'`).
- UI components consume only the unified `uploadMedicalPhoto` function without knowing which backend stores the file.

## Consequences

### Positive
- Expands storage headroom from 1GB to 26GB total without paying recurring cloud fees.
- Zero downtime or disruption if Supabase storage fills up during clinic peak hours.
- Transparent developer API via `src/lib/storage.ts`.

### Negative
- Requires maintaining two sets of storage credentials (`NEXT_PUBLIC_SUPABASE_*` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`).

### Risks and mitigations
- Public URL exposure risk: Photos are uploaded using unguessable UUID-based filenames (`{pasienId}/{tindakanId}_{timestamp}.webp`) and accessed only via the application interface.

## References
- `ADR-002`
- `docs/architecture/overview.md`
- `src/lib/storage.ts`
