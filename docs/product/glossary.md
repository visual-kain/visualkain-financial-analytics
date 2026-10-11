---
id: PRODUCT-GLOSSARY
title: Product Glossary
status: active
owner: Developer
last_updated: 2026-09-18
---

# Product Glossary

Use this file when domain language can be misunderstood or used inconsistently.

| Term | Canonical meaning | Do not confuse with | Notes |
|---|---|---|---|
| No RM | Nomor Rekam Medis. A unique identifier assigned to each patient for tracking medical records over time. | NIK | Required for all patients, whether general or BPJS. |
| ICD-10 | International Classification of Diseases, 10th Revision. A standard diagnostic tool for epidemiology, health management and clinical purposes. | Procedure Codes | Used in medical records to classify the patient's diagnosis. |
| BPJS | Badan Penyelenggara Jaminan Sosial. The national health insurance program in Indonesia. | Asuransi Swasta | Patients with BPJS may not need to pay out-of-pocket for covered services. |
| Kapitasi | Capitation. A monthly payment from BPJS to the clinic based on the number of enrolled members, regardless of visits. | Fee-for-Service | Currently ~Rp 28 juta/bulan. |
| Umum | General or self-pay patient. Patients paying out-of-pocket without using BPJS. | BPJS Patient | Often involves cash transactions that need to be recorded in Buku Kas. |
| Rawat Jalan | Outpatient care. Medical treatment provided without hospital admission. | Rawat Inap | The clinic only handles outpatient care. Inpatient is out of scope. |
| Sirkumsisi/Sunat | Circumcision. A special medical procedure offered by the clinic. | General Surgery | Requires before/after photo documentation (F-006). |
| TBC/TB | Tuberculosis. A bacterial infection. The clinic runs a 6-month treatment cohort program. | General Infection | Requires special tracking and reporting (F-006). |
| Pos-Rawat | Post-care follow-up monitoring. Checking up on patients after significant procedures or treatments. | Anamnesa | Tracked as a special program (F-006). |
| Anamnesa | Medical history intake. The process of a healthcare provider asking a patient questions to obtain information useful in formulating a diagnosis. | Diagnosis | The first step in a patient visit before examination. |
| Tindakan | Medical procedure or intervention performed by a doctor or nurse. | Obat | Logged in medical records and may incur specific charges. |
| Setor Tunai | Cash deposit to bank. The physical movement of cash collected at the clinic to the bank. | Cash Flow | Tracked in the Buku Kas module. |
| Emerys Glow | A skincare brand. | Clinic Medicine | Out of scope for MVP. Deferred for future inventory tracking. |

Rules:

1. Requirements, UI copy, API contracts, and database terminology should use canonical terms.
2. Do not add synonyms unless users genuinely use them.
3. When a term changes meaning, record the change and update affected specifications.
