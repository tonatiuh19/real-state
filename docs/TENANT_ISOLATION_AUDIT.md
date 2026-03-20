# Tenant Isolation Audit Report

**Date:** February 3, 2026  
**Base Repo:** https://github.com/tonatiuh19/real-state

## 🎯 Purpose

This document outlines the tenant isolation strategy for the multi-tenant loan application system. All clients share the same database, isolated by `tenant_id` (configured as `ENCORE_TENANT_ID` in api/index.ts).

---

## 📊 Database Tables with tenant_id

### Direct tenant_id Column (16 tables)

These tables have a `tenant_id` column and **MUST** include it in all WHERE clauses:

1. ✅ **application_status_history** - Status change tracking
2. ✅ **audit_logs** - System audit trail (allows NULL for system events)
3. ✅ **brokers** - Broker accounts
4. ✅ **campaigns** - Marketing campaigns
5. ✅ **clients** - Client/user accounts
6. ✅ **communications** - Communication logs
7. ✅ **compliance_checklists** - Compliance tracking
8. ✅ **documents** - Document storage
9. ✅ **email_templates** - Email templates
10. ✅ **leads** - Lead management
11. ✅ **loan_applications** - Loan applications (primary entity)
12. ✅ **notifications** - User notifications
13. ✅ **sms_templates** - SMS templates
14. ✅ **system_settings** - System configuration (allows NULL for global)
15. ✅ **tasks** - Application tasks
16. ⚠️ **task_templates** - **MIGRATION REQUIRED** (see below)

### Inherited tenant_id via Foreign Keys (10 tables)

These tables inherit tenant isolation through parent table relationships:

1. **broker_profiles** → inherits from `brokers.tenant_id`
2. **broker_sessions** → inherits from `brokers.tenant_id`
3. **campaign_recipients** → inherits from `campaigns.tenant_id`
4. **compliance_checklist_items** → inherits from `compliance_checklists.tenant_id`
5. **lead_activities** → inherits from `leads.tenant_id`
6. **task_documents** → inherits from `tasks.tenant_id` → `loan_applications.tenant_id`
7. **task_form_fields** → inherits from `task_templates.tenant_id` (after migration)
8. **task_form_responses** → inherits from `tasks.tenant_id`
9. **user_profiles** → inherits from `clients.tenant_id`
10. **user_sessions** → inherits from `clients.tenant_id`

---

## 🚨 Critical Migration Required

### task_templates Table

**Status:** ⚠️ **MISSING tenant_id column**

**Impact:** Task templates can leak across tenants, causing:

- Templates visible to wrong clients
- Data privacy violations
- Compliance issues

**Solution:** Migration file created at:

```
database/migrations/20260203_000000_add_tenant_id_to_task_templates.sql
```

**Action Required:**

1. Review migration file
2. Test on development database
3. Apply to production during maintenance window
4. Verify all task_templates queries in API include tenant_id

---

## ✅ API Query Verification

### Rules for Writing Queries

#### 1. Direct tenant_id Tables

**Pattern:**

```typescript
// ✅ CORRECT
await pool.query("SELECT * FROM brokers WHERE id = ? AND tenant_id = ?", [
  brokerId,
  ENCORE_TENANT_ID,
]);

// ❌ WRONG - Missing tenant_id
await pool.query("SELECT * FROM brokers WHERE id = ?", [brokerId]);
```

#### 2. Inherited tenant_id Tables (via JOIN)

**Pattern:**

```typescript
// ✅ CORRECT - Join to parent with tenant_id
await pool.query(
  `SELECT td.* FROM task_documents td 
   INNER JOIN tasks t ON td.task_id = t.id 
   INNER JOIN loan_applications la ON t.application_id = la.id 
   WHERE td.id = ? AND la.tenant_id = ?`,
  [documentId, ENCORE_TENANT_ID],
);

// ❌ WRONG - No tenant isolation
await pool.query("SELECT * FROM task_documents WHERE id = ?", [documentId]);
```

#### 3. INSERT Operations

**Pattern:**

```typescript
// ✅ CORRECT - Include tenant_id in INSERT
await pool.query(
  "INSERT INTO brokers (tenant_id, email, ...) VALUES (?, ?, ...)",
  [ENCORE_TENANT_ID, email, ...]
);
```

#### 4. UPDATE Operations

**Pattern:**

```typescript
// ✅ CORRECT - Include tenant_id in WHERE
await pool.query(
  "UPDATE brokers SET status = ? WHERE id = ? AND tenant_id = ?",
  [status, brokerId, ENCORE_TENANT_ID],
);
```

#### 5. DELETE Operations

**Pattern:**

```typescript
// ✅ CORRECT - Include tenant_id in WHERE
await pool.query("DELETE FROM email_templates WHERE id = ? AND tenant_id = ?", [
  templateId,
  ENCORE_TENANT_ID,
]);

// For inherited tables, join to parent
await pool.query(
  `DELETE td FROM task_documents td 
   INNER JOIN tasks t ON td.task_id = t.id 
   INNER JOIN loan_applications la ON t.application_id = la.id 
   WHERE td.id = ? AND la.tenant_id = ?`,
  [documentId, ENCORE_TENANT_ID],
);
```

---

## 🔍 Current API Status

### ✅ Fixed Queries

All major queries have been updated to include proper tenant isolation:

- ✅ Broker authentication and verification
- ✅ Client authentication and verification
- ✅ Task templates (all CRUD operations)
- ✅ Task documents (create, read, delete)
- ✅ Email templates
- ✅ SMS templates
- ✅ Audit logs
- ✅ Admin role checks
- ✅ Client task updates

### 🔐 Security Implications

**Without tenant_id filtering:**

- ❌ Client A could access Client B's loan applications
- ❌ Broker from Tenant 1 could see Tenant 2's data
- ❌ Cross-tenant data leakage in reports
- ❌ Compliance violations (GDPR, data privacy)

**With proper tenant_id filtering:**

- ✅ Complete data isolation between clients
- ✅ Secure multi-tenant architecture
- ✅ Compliance with data privacy regulations
- ✅ Simplified database infrastructure

---

## 📋 Checklist for New API Endpoints

When creating a new API endpoint, verify:

- [ ] Check `database/schema.sql` for table structure
- [ ] Identify if table has `tenant_id` column
- [ ] Include `tenant_id = ?` in WHERE clause for direct tables
- [ ] Use JOIN to parent table for inherited isolation
- [ ] Include `ENCORE_TENANT_ID` as query parameter
- [ ] Test with multiple tenant_id values
- [ ] Document any exceptions (with justification)

---

## 🛠️ Testing Tenant Isolation

### Manual Testing

1. **Create test data for multiple tenants:**

```sql
INSERT INTO tenants (id, name) VALUES (1, 'Test Client 1'), (2, 'Test Client 2');
```

2. **Switch ENCORE_TENANT_ID and verify isolation:**

```typescript
// In api/index.ts
const ENCORE_TENANT_ID = 1; // Should only see Tenant 1 data
const ENCORE_TENANT_ID = 2; // Should only see Tenant 2 data
```

3. **Verify no cross-tenant access:**

- Attempt to access Tenant 2's loan application with Tenant 1's credentials
- Should return 404 or permission denied

### Automated Testing (Recommended)

Add integration tests that:

- Create data for multiple tenants
- Verify queries return only tenant-specific data
- Test edge cases (NULL tenant_id, missing tenant_id in WHERE clause)

---

## 📚 References

- **Base Repo:** https://github.com/tonatiuh19/real-state
- **Schema:** `database/schema.sql`
- **API Implementation:** `api/index.ts`
- **Migrations:** `database/migrations/`

---

## 🔄 Migration Rollout Plan

### For Existing Deployments

1. **Backup database** before applying migration
2. Run migration: `20260203_000000_add_tenant_id_to_task_templates.sql`
3. Verify migration:

```sql
SELECT COUNT(*) FROM task_templates WHERE tenant_id IS NULL; -- Should be 0
SHOW CREATE TABLE task_templates; -- Verify FK constraint
```

4. Update all client repos with latest base code
5. Test thoroughly before production deployment

### For New Client Repos

Migration will be included in initial schema setup automatically.

---

## ⚠️ Important Notes

1. **ENCORE_TENANT_ID is per-client** - Each client deployment has a unique ID
2. **Never hardcode tenant_id values** - Always use ENCORE_TENANT_ID constant
3. **Review sync scripts** - Ensure client-specific tenant_id is preserved during sync
4. **Database is shared** - All clients use the same database instance
5. **Tenant isolation is CRITICAL** - Missing tenant_id = data breach risk

---

**Last Updated:** February 3, 2026  
**Next Review:** When adding new tables or major API changes
