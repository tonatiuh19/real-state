# ⚠️ Deprecated — see PER_OWNER_CRM_ARCHITECTURE.md

This document described a **separate “private contacts” layer** outside the CRM. That approach was **rejected** after product review.

**Use instead:** [`docs/PER_OWNER_CRM_ARCHITECTURE.md`](./PER_OWNER_CRM_ARCHITECTURE.md)

## Why it was replaced

The business requirement is **not** a WhatsApp-style shadow address book. It is:

- **Per-owner CRM client/realtor rows** (same phone, different saved names per banker)
- **Identity link groups** + **transfer/merge wizards** for CRM-level decisions
- **Owner-scoped conversations** tied to each banker’s client row

All approved product decisions are captured in the new document, including scenarios, diagrams, migration plan, and API summary.

---

_Original draft archived in git history._
