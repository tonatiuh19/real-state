/**
 * Edge-case smoke tests for the client task DOCUMENT UPLOAD + SUBMISSION flow.
 *
 * Covers the LA08597405 incident and its fixes:
 *  - Server guard (handleUpdateClientTask): a document task cannot be submitted
 *    for review (pending_approval) unless it has >= 1 task_documents row.
 *  - Upload ownership (handleUploadTaskDocument): a client can only attach
 *    documents to a task on their OWN loan; documents_uploaded flips to 1.
 *  - Reopen migration WHERE clause: only pending_approval + document-requiring +
 *    zero-document tasks are reopened (tasks with real files are preserved).
 *  - Document fetch scoping (handleGetTaskDocuments): client-scoped + owner-scoped.
 *
 * The SQL used here MIRRORS api/index.ts (which must stay inline for Vercel
 * serverless). If you change the handler logic, mirror it here.
 *
 * Uses synthetic @smoke-taskdoc.local data. Entire run ROLLS BACK — no real impact.
 *
 * Usage: npx tsx scripts/smoke-test-task-document-submission.ts
 */
import "dotenv/config";
import mysql, {
  type Connection,
  type RowDataPacket,
  type ResultSetHeader,
} from "mysql2/promise";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");
const OTHER_TENANT_ID = TENANT_ID === 1 ? 2 : 1;

interface CaseResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const cases: CaseResult[] = [];
const pass = (name: string, detail?: string) =>
  cases.push({ name, pass: true, detail });
const fail = (name: string, detail?: string) =>
  cases.push({ name, pass: false, detail });

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// ─── Synthetic fixture helpers ───────────────────────────────────────────────
async function insertBroker(
  conn: Connection,
  email: string,
  role = "admin",
): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO brokers
       (tenant_id, email, first_name, last_name, role, status, email_verified, created_by_broker_id, public_token)
     VALUES (?, ?, 'Smoke', 'Doc', ?, 'active', 0, NULL, UUID())`,
    [TENANT_ID, email, role],
  );
  return r.insertId;
}

async function insertClient(
  conn: Connection,
  email: string,
  brokerId: number | null,
): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO clients (tenant_id, email, first_name, last_name, phone, status, email_verified, assigned_broker_id, source)
     VALUES (?, ?, 'Smoke', 'Borrower', '5550009999', 'active', 0, ?, 'public_wizard')`,
    [TENANT_ID, email, brokerId],
  );
  return r.insertId;
}

async function insertLoan(
  conn: Connection,
  appNumber: string,
  clientId: number,
  brokerId: number | null,
): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO loan_applications
       (tenant_id, application_number, client_user_id, broker_user_id, loan_type,
        loan_amount, property_value, down_payment, status, current_step, total_steps, submitted_at)
     VALUES (?, ?, ?, ?, 'purchase', 400000, 500000, 100000, 'application_received', 1, 8, NOW())`,
    [TENANT_ID, appNumber, clientId, brokerId],
  );
  return r.insertId;
}

async function insertTemplate(
  conn: Connection,
  brokerId: number,
  opts: { title: string; withFileField: boolean; withTextField?: boolean },
): Promise<{ templateId: number; fileFieldId: number | null }> {
  const [t] = await conn.query<ResultSetHeader>(
    `INSERT INTO task_templates
       (tenant_id, title, description, task_type, priority, created_by_broker_id, requires_documents, has_custom_form)
     VALUES (?, ?, 'smoke', 'document_verification', 'high', ?, ?, ?)`,
    [
      TENANT_ID,
      opts.title,
      brokerId,
      opts.withFileField ? 1 : 0,
      opts.withTextField ? 1 : 0,
    ],
  );
  const templateId = t.insertId;
  let fileFieldId: number | null = null;

  if (opts.withFileField) {
    const [f] = await conn.query<ResultSetHeader>(
      `INSERT INTO task_form_fields
         (task_template_id, field_name, field_label, field_type, is_required, order_index)
       VALUES (?, 'document_upload', 'Attach Document', 'file_pdf', 1, 0)`,
      [templateId],
    );
    fileFieldId = f.insertId;
  }
  if (opts.withTextField) {
    await conn.query<ResultSetHeader>(
      `INSERT INTO task_form_fields
         (task_template_id, field_name, field_label, field_type, is_required, order_index)
       VALUES (?, 'notes', 'Notes', 'text', 1, 1)`,
      [templateId],
    );
  }
  return { templateId, fileFieldId };
}

async function insertTask(
  conn: Connection,
  opts: {
    templateId: number | null;
    applicationId: number;
    status?: string;
    title?: string;
  },
): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    `INSERT INTO tasks
       (tenant_id, template_id, application_id, title, task_type, status, priority)
     VALUES (?, ?, ?, ?, 'document_verification', ?, 'high')`,
    [
      TENANT_ID,
      opts.templateId,
      opts.applicationId,
      opts.title ?? "Smoke Task",
      opts.status ?? "in_progress",
    ],
  );
  return r.insertId;
}

async function getTask(conn: Connection, taskId: number): Promise<any> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT * FROM tasks WHERE id = ?`,
    [taskId],
  );
  return rows[0];
}

async function docCount(conn: Connection, taskId: number): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM task_documents WHERE task_id = ?`,
    [taskId],
  );
  return Number(rows[0]?.c ?? 0);
}

// ─── System-under-test simulations (MIRROR api/index.ts) ─────────────────────

/** Mirrors handleUpdateClientTask guard + update. */
async function simulateClientSubmit(
  conn: Connection,
  taskId: number,
  clientId: number,
  requestedStatus: "in_progress" | "completed" | "pending_approval",
): Promise<{ ok: boolean; status?: number; reason?: string }> {
  if (
    !["in_progress", "completed", "pending_approval"].includes(requestedStatus)
  ) {
    return { ok: false, status: 400, reason: "invalid status" };
  }

  const [tasks] = await conn.query<RowDataPacket[]>(
    `SELECT t.* FROM tasks t
       INNER JOIN loan_applications la ON t.application_id = la.id
     WHERE t.id = ? AND la.client_user_id = ? AND t.tenant_id = ?`,
    [taskId, clientId, TENANT_ID],
  );
  if (tasks.length === 0) return { ok: false, status: 404, reason: "not found" };

  const actualStatus =
    requestedStatus === "completed" ? "pending_approval" : requestedStatus;

  if (actualStatus === "pending_approval") {
    const templateId = tasks[0].template_id;
    if (templateId) {
      const [ff] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM task_form_fields
         WHERE task_template_id = ?
           AND field_type IN ('file_pdf','file_image','file_upload')`,
        [templateId],
      );
      const requiresDocuments = Number(ff[0]?.cnt ?? 0) > 0;
      if (requiresDocuments) {
        const dc = await docCount(conn, taskId);
        if (dc === 0)
          return { ok: false, status: 400, reason: "no documents uploaded" };
      }
    }
  }

  const completedAt = actualStatus === "pending_approval" ? new Date() : null;
  await conn.query(
    `UPDATE tasks SET status = ?, completed_at = ?, updated_at = NOW() WHERE id = ?`,
    [actualStatus, completedAt, taskId],
  );
  return { ok: true };
}

/** Mirrors handleUploadTaskDocument (client path + ownership check). */
async function simulateClientUpload(
  conn: Connection,
  taskId: number,
  clientId: number,
  documentType: "pdf" | "image",
): Promise<{ ok: boolean; status?: number; reason?: string }> {
  const [own] = await conn.query<RowDataPacket[]>(
    `SELECT t.id FROM tasks t
       INNER JOIN loan_applications la ON t.application_id = la.id
     WHERE t.id = ? AND la.client_user_id = ? AND t.tenant_id = ?
     LIMIT 1`,
    [taskId, clientId, TENANT_ID],
  );
  if (own.length === 0) return { ok: false, status: 404, reason: "not owned" };

  await conn.query<ResultSetHeader>(
    `INSERT INTO task_documents
       (task_id, field_id, document_type, filename, original_filename, file_path, file_size, uploaded_by_user_id)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
    [
      taskId,
      documentType,
      `smoke_${Date.now()}.${documentType === "pdf" ? "pdf" : "jpg"}`,
      `original.${documentType === "pdf" ? "pdf" : "jpg"}`,
      `/data/encore/${taskId}/${documentType === "pdf" ? "pdfs" : "images"}/smoke.${documentType === "pdf" ? "pdf" : "jpg"}`,
      12345,
      clientId,
    ],
  );
  await conn.query(`UPDATE tasks SET documents_uploaded = 1 WHERE id = ?`, [
    taskId,
  ]);
  return { ok: true };
}

/** Mirrors handleGetTaskDocuments (client-scoped). */
async function fetchDocsAsClient(
  conn: Connection,
  taskId: number,
  clientId: number,
): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT td.id FROM task_documents td
       INNER JOIN tasks t ON td.task_id = t.id
       INNER JOIN loan_applications la ON t.application_id = la.id
     WHERE td.task_id = ? AND la.client_user_id = ? AND la.tenant_id = ?`,
    [taskId, clientId, TENANT_ID],
  );
  return rows.length;
}

// ─── Test suite ──────────────────────────────────────────────────────────────
async function runTests(conn: Connection) {
  const runId = `SMKTD${Date.now()}`;
  const broker = await insertBroker(conn, `${runId}@smoke-taskdoc.local`);
  const clientA = await insertClient(
    conn,
    `${runId}-a@smoke-taskdoc.local`,
    broker,
  );
  const clientB = await insertClient(
    conn,
    `${runId}-b@smoke-taskdoc.local`,
    broker,
  );
  const loanA = await insertLoan(conn, `${runId}-LA-A`, clientA, broker);
  const loanB = await insertLoan(conn, `${runId}-LA-B`, clientB, broker);

  const docTpl = await insertTemplate(conn, broker, {
    title: `${runId} DocTpl`,
    withFileField: true,
  });
  const textTpl = await insertTemplate(conn, broker, {
    title: `${runId} TextTpl`,
    withFileField: false,
    withTextField: true,
  });

  // ── 1. Document task, 0 docs → submit BLOCKED (the core LA08597405 bug) ──
  const task1 = await insertTask(conn, {
    templateId: docTpl.templateId,
    applicationId: loanA,
    status: "in_progress",
  });
  const r1 = await simulateClientSubmit(conn, task1, clientA, "completed");
  if (!r1.ok && r1.status === 400)
    pass("guard: document task with 0 documents is BLOCKED from submission");
  else fail("guard: 0-doc submission should be blocked", JSON.stringify(r1));
  const t1 = await getTask(conn, task1);
  if (t1.status === "in_progress")
    pass("guard: blocked task stays in_progress (not pending_approval)");
  else fail("guard: blocked task status", t1.status);

  // ── 2. Upload a PDF then submit → ALLOWED ──
  const up2 = await simulateClientUpload(conn, task1, clientA, "pdf");
  if (up2.ok) pass("upload: client uploads PDF to own task");
  else fail("upload: own-task PDF upload", JSON.stringify(up2));
  const t1AfterUp = await getTask(conn, task1);
  if (t1AfterUp.documents_uploaded === 1)
    pass("upload: documents_uploaded flips to 1");
  else fail("upload: documents_uploaded flag", String(t1AfterUp.documents_uploaded));
  const r2 = await simulateClientSubmit(conn, task1, clientA, "completed");
  if (r2.ok) pass("guard: task WITH a document can be submitted");
  else fail("guard: doc-present submission", JSON.stringify(r2));
  const t1Final = await getTask(conn, task1);
  if (t1Final.status === "pending_approval" && t1Final.completed_at)
    pass("guard: submitted task is pending_approval with completed_at set");
  else
    fail(
      "guard: submitted task final state",
      `${t1Final.status}/${t1Final.completed_at}`,
    );

  // ── 3. Image document also satisfies the guard ──
  const task3 = await insertTask(conn, {
    templateId: docTpl.templateId,
    applicationId: loanA,
  });
  await simulateClientUpload(conn, task3, clientA, "image");
  const r3 = await simulateClientSubmit(conn, task3, clientA, "completed");
  if (r3.ok) pass("guard: an IMAGE document satisfies the requirement");
  else fail("guard: image doc submission", JSON.stringify(r3));

  // ── 4. Multiple documents → still allowed ──
  const task4 = await insertTask(conn, {
    templateId: docTpl.templateId,
    applicationId: loanA,
  });
  await simulateClientUpload(conn, task4, clientA, "pdf");
  await simulateClientUpload(conn, task4, clientA, "image");
  if ((await docCount(conn, task4)) === 2)
    pass("upload: multiple documents attach to one task");
  else fail("upload: multiple docs", String(await docCount(conn, task4)));
  const r4 = await simulateClientSubmit(conn, task4, clientA, "completed");
  if (r4.ok) pass("guard: multi-document task submits fine");
  else fail("guard: multi-doc submission", JSON.stringify(r4));

  // ── 5. Non-document task (text-only) submits with 0 docs ──
  const task5 = await insertTask(conn, {
    templateId: textTpl.templateId,
    applicationId: loanA,
  });
  const r5 = await simulateClientSubmit(conn, task5, clientA, "completed");
  if (r5.ok) pass("guard: text-only task (no file field) submits with 0 docs");
  else fail("guard: text-only submission", JSON.stringify(r5));

  // ── 6. Task with NO template → guard skipped, submits ──
  const task6 = await insertTask(conn, {
    templateId: null,
    applicationId: loanA,
  });
  const r6 = await simulateClientSubmit(conn, task6, clientA, "completed");
  if (r6.ok) pass("guard: task without template_id is not blocked");
  else fail("guard: no-template submission", JSON.stringify(r6));

  // ── 7. in_progress transition never blocked (even with 0 docs) ──
  const task7 = await insertTask(conn, {
    templateId: docTpl.templateId,
    applicationId: loanA,
    status: "pending",
  });
  const r7 = await simulateClientSubmit(conn, task7, clientA, "in_progress");
  if (r7.ok && (await getTask(conn, task7)).status === "in_progress")
    pass("guard: in_progress transition allowed with 0 docs");
  else fail("guard: in_progress transition", JSON.stringify(r7));

  // ── 8. Cross-client upload BLOCKED (ownership) ──
  const task8 = await insertTask(conn, {
    templateId: docTpl.templateId,
    applicationId: loanB, // belongs to clientB
  });
  const up8 = await simulateClientUpload(conn, task8, clientA, "pdf"); // clientA attacks
  if (!up8.ok && up8.status === 404)
    pass("ownership: client CANNOT upload to another client's task");
  else fail("ownership: cross-client upload should be blocked", JSON.stringify(up8));
  if ((await docCount(conn, task8)) === 0)
    pass("ownership: no stray document row created on blocked upload");
  else fail("ownership: stray doc created", String(await docCount(conn, task8)));

  // ── 9. Cross-client submit BLOCKED (ownership) ──
  const r9 = await simulateClientSubmit(conn, task8, clientA, "completed");
  if (!r9.ok && r9.status === 404)
    pass("ownership: client CANNOT submit another client's task");
  else fail("ownership: cross-client submit", JSON.stringify(r9));

  // ── 10. Invalid status rejected ──
  const r10 = await simulateClientSubmit(
    conn,
    task5,
    clientA,
    "approved" as any,
  );
  if (!r10.ok && r10.status === 400)
    pass("guard: invalid status value is rejected");
  else fail("guard: invalid status", JSON.stringify(r10));

  // ── 11. Client-scoped document fetch returns own docs, hides others ──
  const ownDocs = await fetchDocsAsClient(conn, task1, clientA);
  if (ownDocs === 1) pass("fetch: client sees documents on own task");
  else fail("fetch: own docs count", String(ownDocs));
  const crossDocs = await fetchDocsAsClient(conn, task1, clientB);
  if (crossDocs === 0)
    pass("fetch: client canNOT see documents on another client's task");
  else fail("fetch: cross-client doc visibility leak", String(crossDocs));

  // ── 12. Reopen migration WHERE clause behaviour ──
  // Build the exact scenarios the incident produced:
  //   (a) pending_approval + file field + 0 docs  → should REOPEN
  //   (b) pending_approval + file field + 1 doc   → should PRESERVE
  //   (c) pending_approval + NO file field        → should PRESERVE
  //   (d) in_progress + file field + 0 docs       → should PRESERVE
  const orphan = await insertTask(conn, {
    templateId: docTpl.templateId,
    applicationId: loanA,
    status: "pending_approval",
  });
  const withDoc = await insertTask(conn, {
    templateId: docTpl.templateId,
    applicationId: loanA,
    status: "pending_approval",
  });
  await conn.query(
    `INSERT INTO task_documents (task_id, document_type, filename, original_filename, file_path, file_size)
     VALUES (?, 'pdf', 'x.pdf', 'x.pdf', '/data/encore/x/pdfs/x.pdf', 1)`,
    [withDoc],
  );
  const textPending = await insertTask(conn, {
    templateId: textTpl.templateId,
    applicationId: loanA,
    status: "pending_approval",
  });
  const inProgOrphan = await insertTask(conn, {
    templateId: docTpl.templateId,
    applicationId: loanA,
    status: "in_progress",
  });

  // Run the ACTUAL migration statement.
  await conn.query(
    `UPDATE tasks t
     SET t.status = 'reopened', t.completed_at = NULL, t.documents_uploaded = 0,
         t.form_completed = 0, t.reopened_at = NOW(),
         t.reopen_reason = 'smoke', t.updated_at = NOW()
     WHERE t.status = 'pending_approval'
       AND t.template_id IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM task_form_fields tff
         WHERE tff.task_template_id = t.template_id
           AND tff.field_type IN ('file_pdf','file_image')
       )
       AND NOT EXISTS (
         SELECT 1 FROM task_documents td WHERE td.task_id = t.id
       )`,
  );

  if ((await getTask(conn, orphan)).status === "reopened")
    pass("migration: orphan (pending_approval, 0 docs, doc-required) is reopened");
  else
    fail(
      "migration: orphan not reopened",
      (await getTask(conn, orphan)).status,
    );
  if ((await getTask(conn, withDoc)).status === "pending_approval")
    pass("migration: task WITH a document is preserved (not reopened)");
  else
    fail(
      "migration: doc task wrongly reopened",
      (await getTask(conn, withDoc)).status,
    );
  if ((await getTask(conn, textPending)).status === "pending_approval")
    pass("migration: text-only pending task is preserved");
  else
    fail(
      "migration: text task wrongly reopened",
      (await getTask(conn, textPending)).status,
    );
  if ((await getTask(conn, inProgOrphan)).status === "in_progress")
    pass("migration: in_progress orphan is untouched");
  else
    fail(
      "migration: in_progress wrongly reopened",
      (await getTask(conn, inProgOrphan)).status,
    );

  // ── 13. Reopened task can be re-submitted after re-upload ──
  const reopened = await getTask(conn, orphan);
  if (reopened.status === "reopened" && reopened.completed_at === null)
    pass("migration: reopened task has completed_at cleared");
  else fail("migration: reopened completed_at", String(reopened.completed_at));
  // client re-uploads and re-submits
  await conn.query(`UPDATE tasks SET status = 'in_progress' WHERE id = ?`, [
    orphan,
  ]);
  await simulateClientUpload(conn, orphan, clientA, "pdf");
  const r13 = await simulateClientSubmit(conn, orphan, clientA, "completed");
  if (r13.ok && (await getTask(conn, orphan)).status === "pending_approval")
    pass("recovery: reopened task re-submits successfully after re-upload");
  else fail("recovery: reopened re-submit", JSON.stringify(r13));

  // ── 14. Tenant isolation: other-tenant client cannot submit/fetch ──
  // Simulate a mismatched tenant by querying with OTHER_TENANT_ID scope.
  const [isoRows] = await conn.query<RowDataPacket[]>(
    `SELECT t.id FROM tasks t
       INNER JOIN loan_applications la ON t.application_id = la.id
     WHERE t.id = ? AND la.client_user_id = ? AND t.tenant_id = ?`,
    [task1, clientA, OTHER_TENANT_ID],
  );
  if (isoRows.length === 0)
    pass("tenant: task not visible under a different tenant_id scope");
  else fail("tenant: cross-tenant leak", String(isoRows.length));

  // ── 15. Data integrity: task_documents.document_type enum only pdf/image ──
  let enumOk = false;
  try {
    await conn.query(
      `INSERT INTO task_documents (task_id, document_type, filename, original_filename, file_path)
       VALUES (?, 'video', 'x', 'x', 'x')`,
      [task1],
    );
  } catch {
    enumOk = true;
  }
  if (enumOk)
    pass("schema: task_documents.document_type rejects values other than pdf/image");
  else fail("schema: document_type enum not enforced");
}

async function main() {
  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? "3306"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl: { rejectUnauthorized: true },
  });

  try {
    await conn.beginTransaction();
    await runTests(conn);
    await conn.rollback();
    console.log("\n=== Task Document Submission Smoke Tests ===\n");
    let failed = 0;
    for (const c of cases) {
      console.log(
        `${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`,
      );
      if (!c.pass) failed++;
    }
    console.log(
      `\n${cases.length - failed}/${cases.length} passed (transaction rolled back)\n`,
    );
    if (failed > 0) process.exit(1);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
