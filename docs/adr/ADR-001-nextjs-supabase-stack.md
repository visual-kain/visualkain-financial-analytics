---
id: ADR-001
title: "Next.js and Supabase as Primary Stack"
status: accepted
date: "2026-09-18"
deciders:
  - "Developer"
related_features:
  - "Core Stack"
supersedes: null
superseded_by: null
---

# ADR-001: Next.js and Supabase as Primary Stack

## Context

Klinik Pratama Cikidang Medika is a small outpatient clinic transitioning from Google Sheets to a web-based clinic management system (SIM). The system handles patient registration, medical records, billing, and cash flow reporting. The client has a total budget of Rp 2,500,000 and requires Rp 0/month in operational costs. A solo developer is implementing the MVP within a 5-7 day timeline.

## Decision Drivers

- Zero monthly hosting and operational costs.
- Fast development speed for a solo developer with a tight timeline.
- Built-in authentication, database, and storage.
- Real-time capabilities for future needs.
- Type safety to reduce bugs.

## Considered Options

### Option A — Laravel and MySQL on Shared Hosting

Description: Use PHP with Laravel framework and MySQL database hosted on traditional shared hosting.

Advantages:

- Well-established framework with many built-in features.
- Easy to find local developers for future maintenance.

Disadvantages:

- Incurs a monthly hosting cost (around Rp 50,000 to Rp 100,000 per month).
- Slower development cycle compared to a unified TypeScript stack.

### Option B — Pure Static Site with Google Sheets API

Description: Build a static frontend that reads and writes directly to Google Sheets via API.

Advantages:

- Completely free hosting (e.g., GitHub Pages).
- Familiar data storage for the client.

Disadvantages:

- Limited functionality and slow performance.
- Poor data integrity, lack of relational constraints, and difficult access control.

### Option C — WordPress with a Custom Plugin

Description: Build the clinic management system as a custom WordPress plugin.

Advantages:

- Built-in CMS features and user management.
- Abundant hosting options.

Disadvantages:

- High maintenance burden and security risks for sensitive medical data.
- Poor developer experience for complex relational data handling.

## Decision

We will use Next.js 14 (App Router) and Supabase as the full stack. Next.js will be deployed on Vercel's free tier, and Supabase will be used on its free tier for PostgreSQL database, authentication, and storage.

Implementation boundaries:

- Frontend and backend logic will reside in a single Next.js repository using TypeScript.
- Data persistence, authentication, and file storage will be handled exclusively by Supabase.

## Rationale

Next.js and Supabase provide a complete solution with zero monthly costs by leveraging their generous free tiers. Using TypeScript across the entire stack accelerates development for a solo developer and improves reliability. Supabase offers built-in auth, a managed PostgreSQL database with Row Level Security (RLS) for data protection, and storage, which perfectly matches the clinic's needs within the budget constraints. Options A, B, and C were rejected due to monthly costs, data integrity issues, and security risks, respectively.

## Consequences

### Positive

- Zero monthly operational costs for the clinic.
- High development speed and strong type safety.
- Enterprise-grade database features (PostgreSQL, RLS) out of the box.

### Negative

- Vendor lock-in to Supabase and Vercel.
- The Vercel free tier limits may eventually be reached, though sufficient for a single clinic.
- Potential learning curve for future developers taking over the project.

### Risks and mitigations

- Lock-in risk: Mitigated by Supabase being built on standard PostgreSQL, making data migration straightforward if needed.
- Free tier limits: Monitor usage, but expected load (7,493 visits, 4,238 patients) is well within limits.

## Implementation Impact

- Affected areas: `Entire application architecture`
- Migration required: Yes, migrating 4,238 patients and 7,493 visits from CSV to PostgreSQL.
- Compatibility impact: None, new system.
- Operational impact: Client moves from Google Sheets to a dedicated web interface.

## Validation

The decision is correctly implemented when:

- The application is successfully deployed to Vercel and accessible online.
- Users can authenticate, and CRUD operations on patients and visits work correctly against the Supabase database.

## Revisit Conditions

Reconsider when:

- The clinic outgrows the Vercel or Supabase free tier limits.
- Requirements change to necessitate a mobile application where a web app is insufficient.

## References

- `README.md`
