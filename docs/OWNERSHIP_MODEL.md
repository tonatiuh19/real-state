# Broker Ownership Model

This document defines how data access is scoped to brokers across the API.

---

## Role Hierarchy

| Role                      | Access Scope                                                            |
| ------------------------- | ----------------------------------------------------------------------- |
| `superadmin`              | Full tenant-wide access — all clients, loans, tasks, threads            |
| `admin` (Mortgage Banker) | Own data only — access via all three ownership paths (same as `broker`) |
| `broker` (Partner Broker) | Own data only — access via all three ownership paths below              |

---

## The Three Ownership Paths

Any broker can access a client or loan through **any one** of these three paths:

| #   | Path                              | Column                                | Table               |
| --- | --------------------------------- | ------------------------------------- | ------------------- |
| 1   | **Direct client assignment**      | `clients.assigned_broker_id`          | `clients`           |
| 2   | **Mortgage banker on the loan**   | `loan_applications.broker_user_id`    | `loan_applications` |
| 3   | **Partner broker via share-link** | `loan_applications.partner_broker_id` | `loan_applications` |

Access is granted when **at least one** of these conditions is true for the requesting broker.

### Standard SQL Pattern (for non-admin brokers)

```sql
LEFT JOIN clients c ON c.id = la.client_user_id
WHERE (
  la.broker_user_id = :brokerId
  OR la.partner_broker_id = :brokerId
  OR c.assigned_broker_id = :brokerId
)
AND la.tenant_id = 1
```

---

## Constant

```typescript
const MORTGAGE_TENANT_ID = 1;
```

All queries are scoped to this tenant.

---

## Handler Access Map

### READ Handlers

| Handler                        | Route                            | Admin Access                                                                       | Partner Access                                                                     |
| ------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `handleGetLoans`               | `GET /api/loans`                 | 3-path ownership JOIN                                                              | 3-path ownership JOIN                                                              |
| `handleGetLoanDetails`         | `GET /api/loans/:loanId`         | 3-path ownership JOIN                                                              | 3-path ownership JOIN                                                              |
| `handleGetClients`             | `GET /api/clients`               | 3-path ownership JOIN                                                              | 3-path ownership JOIN                                                              |
| `handleGetClientDetailProfile` | `GET /api/clients/:clientId`     | 3-path ownership subquery                                                          | 3-path ownership subquery                                                          |
| `handleGetDashboardStats`      | `GET /api/dashboard/stats`       | 3-path scoped aggregates                                                           | 3-path scoped aggregates                                                           |
| `handleGetBrokerMetrics`       | `GET /api/broker/metrics`        | 3-path scoped                                                                      | 3-path scoped                                                                      |
| `handleGetAnnualMetrics`       | `GET /api/broker/annual-metrics` | 3-path scoped                                                                      | 3-path scoped                                                                      |
| `handleGetAllTaskDocuments`    | `GET /api/task-documents`        | 3-path ownership JOIN                                                              | 3-path ownership JOIN                                                              |
| `handleGetConversationThreads` | `GET /api/conversations`         | Thread assigned to broker, unassigned, participated in, OR loan linked via 3 paths | Thread assigned to broker, unassigned, participated in, OR loan linked via 3 paths |

### WRITE / MUTATE Handlers

| Handler                    | Route                             | Access Check                                                           |
| -------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| `handleUpdateLoanStatus`   | `PATCH /api/loans/:loanId/status` | `superadmin` = open; `admin/broker` = must own via any of 3 paths      |
| `handleUpdateLoanDetails`  | `PUT /api/loans/:loanId`          | 3-path ownership check                                                 |
| `handleUpdateClient`       | `PUT /api/clients/:clientId`      | 3-path ownership subquery                                              |
| `handleDeleteClient`       | `DELETE /api/clients/:clientId`   | `superadmin` = open; `admin/broker` = must own via 3-path              |
| `handleUpdateTask`         | `PATCH /api/tasks/:taskId`        | `superadmin` = open; `admin/broker` = must own linked loan via 3 paths |
| `handleApproveTask`        | `POST /api/tasks/:taskId/approve` | `superadmin` = open; `admin/broker` = must own linked loan via 3 paths |
| `handleReopenTask`         | `POST /api/tasks/:taskId/reopen`  | `superadmin` = open; `admin/broker` = must own linked loan via 3 paths |
| `handleDeleteTaskInstance` | `DELETE /api/tasks/:taskId`       | `superadmin` = open; `admin/broker` = must own linked loan via 3 paths |

### Correctly Unrestricted Handlers

| Handler                                                                                | Reason                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `handleCreateLoan`                                                                     | Sets `broker_user_id = brokerId` and `assigned_broker_id = brokerId` on creation (self-assigns)        |
| `handleCreateClient`                                                                   | Sets `assigned_broker_id = brokerId` on creation                                                       |
| `handlePublicApply`                                                                    | Share-link flow: sets `broker_user_id` (admin) and `partner_broker_id` (partner) from share-link token |
| `handleSendMessage`                                                                    | Thread access filtered upstream; no additional ownership check needed                                  |
| `handleDeleteConversationMessage`                                                      | Checks `from_broker_id = brokerId OR thread_owner = brokerId`                                          |
| Admin-only handlers (`handleAssignBroker`, `handleAssignPartner`, template CRUD, etc.) | Gated by `admin/superadmin` role — not reachable by partner brokers                                    |

---

## Task Ownership

Tasks are always linked to a loan application:

```
tasks.application_id → loan_applications.id → clients.id
```

Broker ownership of a task is determined by ownership of the **linked loan**, using the same 3-path model.

---

## Conversation Thread Ownership

Threads are visible to a broker if **any** of the following are true:

1. `conversation_threads.broker_id = brokerId` — directly assigned
2. `conversation_threads.broker_id IS NULL` — unassigned (shared inbox)
3. Broker sent a message in the thread (`communications.from_broker_id = brokerId`)
4. The thread's linked loan is owned by the broker via any of the 3 ownership paths

---

## Data Flow on Creation

```
Share Link Created (admin) → partner_broker_id token embedded
Client submits application via share link → loan_applications.partner_broker_id = partner
Client assigned to admin mortgage banker → loan_applications.broker_user_id = admin
                                         → clients.assigned_broker_id = admin
```

Both brokers can then access the same loan/client via their respective ownership paths.

---

## Auth Middleware

All broker routes are protected by `verifyBrokerSession`, which:

- Validates the JWT session token
- Sets `req.brokerId` (numeric ID)
- Sets `req.brokerRole` (`superadmin` | `admin` | `broker`)

Handlers then use `req.brokerId` and `req.brokerRole` to apply the correct scope.
