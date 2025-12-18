import type { VercelRequest, VercelResponse } from "@vercel/node";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper function to execute queries
async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results as T;
  } finally {
    connection.release();
  }
}

// =====================================================
// MIDDLEWARE & HELPERS
// =====================================================

interface AuthRequest extends VercelRequest {
  userId?: number;
  brokerId?: number;
  userType?: "user" | "broker";
  userRole?: string;
}

function authenticate(req: AuthRequest): {
  userId?: number;
  brokerId?: number;
  userType: "user" | "broker";
  role?: string;
} | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch {
    return null;
  }
}

function requireAuth(
  req: AuthRequest,
  res: VercelResponse,
  allowedTypes?: ("user" | "broker")[],
): boolean {
  const auth = authenticate(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  if (allowedTypes && !allowedTypes.includes(auth.userType)) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }

  req.userId = auth.userId;
  req.brokerId = auth.brokerId;
  req.userType = auth.userType;
  req.userRole = auth.role;
  return true;
}

// Generate 6-digit verification code
function generateVerificationCode(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

// Send email with verification code (placeholder - integrate with email service)
async function sendVerificationEmail(
  email: string,
  code: number,
  firstName: string,
): Promise<void> {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`Sending verification code ${code} to ${email} for ${firstName}`);
  // For now, just log it - in production, send actual email
}

// =====================================================
// MAIN HANDLER - Routes all API requests
// =====================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url?.replace("/api", "") || "/";

  try {
    // =====================================================
    // AUTHENTICATION ROUTES - PASSWORDLESS
    // =====================================================

    // Client Registration
    if (path === "/auth/user/register" && method === "POST") {
      const { email, firstName, lastName, phone } = req.body;

      // Check if user already exists
      const existing: any = await query(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const result: any = await query(
        "INSERT INTO users (email, first_name, last_name, phone, email_verified) VALUES (?, ?, ?, ?, FALSE)",
        [email, firstName, lastName, phone],
      );

      return res.json({
        success: true,
        userId: result.insertId,
        message: "Registration successful. Please login with your email.",
      });
    }

    // Broker Registration
    if (path === "/auth/broker/register" && method === "POST") {
      const { email, firstName, lastName, phone, licenseNumber } = req.body;

      // Check if broker already exists
      const existing: any = await query(
        "SELECT id FROM brokers WHERE email = ?",
        [email],
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const result: any = await query(
        "INSERT INTO brokers (email, first_name, last_name, phone, license_number, role, email_verified) VALUES (?, ?, ?, ?, ?, 'broker', FALSE)",
        [email, firstName, lastName, phone, licenseNumber],
      );

      return res.json({
        success: true,
        brokerId: result.insertId,
        message: "Registration successful. Please login with your email.",
      });
    }

    // Client Login - Request Code
    if (path === "/auth/user/login" && method === "POST") {
      const { email } = req.body;

      const users: any = await query(
        "SELECT * FROM users WHERE email = ? AND status = 'active'",
        [email],
      );
      if (users.length === 0) {
        return res.status(404).json({ error: "User not found or inactive" });
      }

      const user = users[0];
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Deactivate old sessions
      await query(
        "UPDATE user_sessions SET is_active = FALSE WHERE user_id = ?",
        [user.id],
      );

      // Create new session
      await query(
        "INSERT INTO user_sessions (user_id, session_code, is_active, expires_at, ip_address, user_agent) VALUES (?, ?, TRUE, ?, ?, ?)",
        [
          user.id,
          code,
          expiresAt,
          req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
          req.headers["user-agent"],
        ],
      );

      // Send email with code
      await sendVerificationEmail(email, code, user.first_name);

      return res.json({
        success: true,
        message: "Verification code sent to your email",
      });
    }

    // Broker Login - Request Code
    if (path === "/auth/broker/login" && method === "POST") {
      const { email } = req.body;

      const brokers: any = await query(
        "SELECT * FROM brokers WHERE email = ? AND status = 'active'",
        [email],
      );
      if (brokers.length === 0) {
        return res.status(404).json({ error: "Broker not found or inactive" });
      }

      const broker = brokers[0];
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Deactivate old sessions
      await query(
        "UPDATE broker_sessions SET is_active = FALSE WHERE broker_id = ?",
        [broker.id],
      );

      // Create new session
      await query(
        "INSERT INTO broker_sessions (broker_id, session_code, is_active, expires_at, ip_address, user_agent) VALUES (?, ?, TRUE, ?, ?, ?)",
        [
          broker.id,
          code,
          expiresAt,
          req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
          req.headers["user-agent"],
        ],
      );

      // Send email with code
      await sendVerificationEmail(email, code, broker.first_name);

      return res.json({
        success: true,
        message: "Verification code sent to your email",
      });
    }

    // Client Verify Code
    if (path === "/auth/user/verify" && method === "POST") {
      const { email, code } = req.body;

      const users: any = await query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      if (users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = users[0];
      const sessions: any = await query(
        "SELECT * FROM user_sessions WHERE user_id = ? AND session_code = ? AND is_active = TRUE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [user.id, parseInt(code)],
      );

      if (sessions.length === 0) {
        return res
          .status(401)
          .json({ error: "Invalid or expired verification code" });
      }

      // Mark session as used
      await query("UPDATE user_sessions SET is_active = FALSE WHERE id = ?", [
        sessions[0].id,
      ]);

      // Update last login
      await query(
        "UPDATE users SET last_login = NOW(), email_verified = TRUE WHERE id = ?",
        [user.id],
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, userType: "user" },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: "user",
        },
      });
    }

    // Broker Verify Code
    if (path === "/auth/broker/verify" && method === "POST") {
      const { email, code } = req.body;

      const brokers: any = await query(
        "SELECT * FROM brokers WHERE email = ?",
        [email],
      );
      if (brokers.length === 0) {
        return res.status(404).json({ error: "Broker not found" });
      }

      const broker = brokers[0];
      const sessions: any = await query(
        "SELECT * FROM broker_sessions WHERE broker_id = ? AND session_code = ? AND is_active = TRUE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [broker.id, parseInt(code)],
      );

      if (sessions.length === 0) {
        return res
          .status(401)
          .json({ error: "Invalid or expired verification code" });
      }

      // Mark session as used
      await query("UPDATE broker_sessions SET is_active = FALSE WHERE id = ?", [
        sessions[0].id,
      ]);

      // Update last login
      await query(
        "UPDATE brokers SET last_login = NOW(), email_verified = TRUE WHERE id = ?",
        [broker.id],
      );

      // Generate JWT token
      const token = jwt.sign(
        { brokerId: broker.id, userType: "broker", role: broker.role },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      return res.json({
        token,
        broker: {
          id: broker.id,
          email: broker.email,
          firstName: broker.first_name,
          lastName: broker.last_name,
          role: broker.role,
          userType: "broker",
        },
      });
    }

    // Get Current User/Broker
    if (path === "/auth/me" && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      if (authReq.userType === "user") {
        const users: any = await query(
          "SELECT id, email, first_name, last_name, phone, status FROM users WHERE id = ?",
          [authReq.userId],
        );
        return res.json({ ...users[0], userType: "user" });
      } else {
        const brokers: any = await query(
          "SELECT id, email, first_name, last_name, phone, role, status, license_number FROM brokers WHERE id = ?",
          [authReq.brokerId],
        );
        return res.json({ ...brokers[0], userType: "broker" });
      }
    }

    // =====================================================
    // LEADS ROUTES
    // =====================================================

    if (path === "/leads" && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res, ["broker"])) return;

      const { status, assignedBroker } = req.query;
      let sql = "SELECT * FROM leads WHERE 1=1";
      const params: any[] = [];

      if (status) {
        sql += " AND status = ?";
        params.push(status);
      }
      if (assignedBroker) {
        sql += " AND assigned_broker_id = ?";
        params.push(assignedBroker);
      }

      sql += " ORDER BY created_at DESC";
      const leads = await query(sql, params);
      return res.json(leads);
    }

    if (path === "/leads" && method === "POST") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res, ["broker"])) return;

      const {
        source,
        firstName,
        lastName,
        email,
        phone,
        interestType,
        estimatedLoanAmount,
      } = req.body;
      const result: any = await query(
        `INSERT INTO leads (source, first_name, last_name, email, phone, interest_type, estimated_loan_amount, assigned_broker_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          source,
          firstName,
          lastName,
          email,
          phone,
          interestType,
          estimatedLoanAmount,
          authReq.brokerId,
        ],
      );
      return res.json({ id: result.insertId });
    }

    if (path.match(/^\/leads\/\d+$/) && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res, ["broker"])) return;

      const leadId = path.split("/")[2];
      const leads: any = await query("SELECT * FROM leads WHERE id = ?", [
        leadId,
      ]);
      return res.json(leads[0]);
    }

    if (path.match(/^\/leads\/\d+$/) && method === "PUT") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res, ["broker"])) return;

      const leadId = path.split("/")[2];
      const { status, notes, assignedBrokerId } = req.body;
      await query(
        "UPDATE leads SET status = ?, notes = ?, assigned_broker_id = ? WHERE id = ?",
        [status, notes, assignedBrokerId, leadId],
      );
      return res.json({ success: true });
    }

    // =====================================================
    // LOAN APPLICATIONS ROUTES
    // =====================================================

    if (path === "/applications" && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      let sql = "SELECT * FROM loan_applications";
      const params: any[] = [];

      if (authReq.userType === "user") {
        sql += " WHERE client_user_id = ?";
        params.push(authReq.userId);
      } else if (req.query.brokerId) {
        sql += " WHERE broker_user_id = ?";
        params.push(req.query.brokerId);
      } else if (req.query.status) {
        sql += " WHERE status = ?";
        params.push(req.query.status);
      }

      sql += " ORDER BY created_at DESC";
      const applications = await query(sql, params);
      return res.json(applications);
    }

    if (path === "/applications" && method === "POST") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res, ["user"])) return;

      const {
        loanType,
        loanAmount,
        propertyValue,
        propertyAddress,
        propertyCity,
        propertyState,
        propertyZip,
        propertyType,
        downPayment,
        loanPurpose,
      } = req.body;

      const applicationNumber = `APP-${Date.now()}`;
      const result: any = await query(
        `INSERT INTO loan_applications 
         (application_number, client_user_id, loan_type, loan_amount, property_value,
          property_address, property_city, property_state, property_zip, property_type,
          down_payment, loan_purpose, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
        [
          applicationNumber,
          authReq.userId,
          loanType,
          loanAmount,
          propertyValue,
          propertyAddress,
          propertyCity,
          propertyState,
          propertyZip,
          propertyType,
          downPayment,
          loanPurpose,
        ],
      );

      return res.json({ id: result.insertId, applicationNumber });
    }

    if (path.match(/^\/applications\/\d+$/) && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      const appId = path.split("/")[2];
      const apps: any = await query(
        "SELECT * FROM loan_applications WHERE id = ?",
        [appId],
      );

      const app = apps[0];
      if (!app) {
        return res.status(404).json({ error: "Application not found" });
      }

      if (
        authReq.userType === "user" &&
        app.client_user_id !== authReq.userId
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      return res.json(app);
    }

    if (path.match(/^\/applications\/\d+$/) && method === "PUT") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      const appId = path.split("/")[2];
      const updates = req.body;

      const fields = Object.keys(updates)
        .filter((k) => k !== "id")
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = Object.keys(updates)
        .filter((k) => k !== "id")
        .map((k) => updates[k]);

      await query(`UPDATE loan_applications SET ${fields} WHERE id = ?`, [
        ...values,
        appId,
      ]);

      return res.json({ success: true });
    }

    if (path.match(/^\/applications\/\d+\/submit$/) && method === "POST") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      const appId = path.split("/")[2];
      await query(
        "UPDATE loan_applications SET status = 'submitted', submitted_at = NOW() WHERE id = ?",
        [appId],
      );

      await query(
        "INSERT INTO application_status_history (application_id, from_status, to_status, changed_by_broker_id) VALUES (?, 'draft', 'submitted', ?)",
        [appId, authReq.userId],
      );

      return res.json({ success: true });
    }

    // =====================================================
    // DOCUMENTS ROUTES
    // =====================================================

    if (path === "/documents" && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      const { applicationId } = req.query;
      if (!applicationId) {
        return res.status(400).json({ error: "applicationId required" });
      }

      const documents = await query(
        "SELECT * FROM documents WHERE application_id = ? ORDER BY created_at DESC",
        [applicationId],
      );
      return res.json(documents);
    }

    if (path === "/documents" && method === "POST") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      const {
        applicationId,
        documentType,
        documentName,
        filePath,
        fileSize,
        mimeType,
      } = req.body;
      const result: any = await query(
        `INSERT INTO documents 
         (application_id, uploaded_by_user_id, document_type, document_name, file_path, file_size_bytes, mime_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          applicationId,
          authReq.userId,
          documentType,
          documentName,
          filePath,
          fileSize,
          mimeType,
        ],
      );
      return res.json({ id: result.insertId });
    }

    if (path.match(/^\/documents\/\d+\/review$/) && method === "POST") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res, ["broker"])) return;

      const docId = path.split("/")[2];
      const { status, reviewNotes } = req.body;

      await query(
        "UPDATE documents SET status = ?, review_notes = ?, reviewed_by_broker_id = ?, reviewed_at = NOW() WHERE id = ?",
        [status, reviewNotes, authReq.brokerId, docId],
      );
      return res.json({ success: true });
    }

    // =====================================================
    // TASKS ROUTES
    // =====================================================

    if (path === "/tasks" && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      let sql = "SELECT * FROM tasks WHERE 1=1";
      const params: any[] = [];

      if (req.query.assignedTo) {
        sql += " AND assigned_to_user_id = ?";
        params.push(req.query.assignedTo);
      }
      if (req.query.applicationId) {
        sql += " AND application_id = ?";
        params.push(req.query.applicationId);
      }
      if (req.query.status) {
        sql += " AND status = ?";
        params.push(req.query.status);
      }

      sql += " ORDER BY due_date ASC";
      const tasks = await query(sql, params);
      return res.json(tasks);
    }

    if (path === "/tasks" && method === "POST") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res, ["broker"])) return;

      const {
        applicationId,
        title,
        description,
        taskType,
        assignedToUserId,
        dueDate,
        priority,
      } = req.body;
      const result: any = await query(
        `INSERT INTO tasks 
         (application_id, title, description, task_type, assigned_to_user_id, created_by_broker_id, due_date, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          applicationId,
          title,
          description,
          taskType,
          assignedToUserId,
          authReq.brokerId,
          dueDate,
          priority,
        ],
      );
      return res.json({ id: result.insertId });
    }

    if (path.match(/^\/tasks\/\d+$/) && method === "PUT") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      const taskId = path.split("/")[2];
      const { status, completedAt } = req.body;
      await query(
        "UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?",
        [status, completedAt, taskId],
      );
      return res.json({ success: true });
    }

    // =====================================================
    // COMMUNICATIONS ROUTES
    // =====================================================

    if (path === "/communications" && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      const { applicationId } = req.query;
      const communications = await query(
        "SELECT * FROM communications WHERE application_id = ? ORDER BY created_at DESC",
        [applicationId],
      );
      return res.json(communications);
    }

    if (path === "/communications" && method === "POST") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      const { applicationId, toUserId, communicationType, subject, body } =
        req.body;
      const result: any = await query(
        `INSERT INTO communications 
         (application_id, from_user_id, to_user_id, communication_type, direction, subject, body, status)
         VALUES (?, ?, ?, ?, 'outbound', ?, ?, 'pending')`,
        [
          applicationId,
          authReq.userId,
          toUserId,
          communicationType,
          subject,
          body,
        ],
      );
      return res.json({ id: result.insertId });
    }

    // =====================================================
    // NOTIFICATIONS ROUTES
    // =====================================================

    if (path === "/notifications" && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      const notifications = await query(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        [authReq.userId],
      );
      return res.json(notifications);
    }

    if (path.match(/^\/notifications\/\d+\/read$/) && method === "POST") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res)) return;

      const notificationId = path.split("/")[2];
      await query(
        "UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?",
        [notificationId, authReq.userId],
      );
      return res.json({ success: true });
    }

    // =====================================================
    // CAMPAIGNS ROUTES
    // =====================================================

    if (path === "/campaigns" && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res, ["broker"])) return;

      const campaigns = await query(
        "SELECT * FROM campaigns ORDER BY created_at DESC",
      );
      return res.json(campaigns);
    }

    if (path === "/campaigns" && method === "POST") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res, ["broker"])) return;

      const {
        name,
        description,
        campaignType,
        targetAudience,
        emailTemplateId,
        smsTemplateId,
      } = req.body;
      const result: any = await query(
        `INSERT INTO campaigns 
         (name, description, campaign_type, target_audience, email_template_id, sms_template_id, created_by_broker_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          description,
          campaignType,
          JSON.stringify(targetAudience),
          emailTemplateId,
          smsTemplateId,
          authReq.brokerId,
        ],
      );
      return res.json({ id: result.insertId });
    }

    // =====================================================
    // DASHBOARD / STATS ROUTES
    // =====================================================

    if (path === "/dashboard/stats" && method === "GET") {
      const authReq = req as AuthRequest;
      if (!requireAuth(authReq, res, ["broker"])) return;

      const stats: any = {};

      const totalApplications: any = await query(
        "SELECT COUNT(*) as count FROM loan_applications",
      );
      stats.totalApplications = totalApplications[0].count;

      const activeApplications: any = await query(
        "SELECT COUNT(*) as count FROM loan_applications WHERE status IN ('submitted', 'under_review', 'underwriting')",
      );
      stats.activeApplications = activeApplications[0].count;

      const pendingTasks: any = await query(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'",
      );
      stats.pendingTasks = pendingTasks[0].count;

      const newLeads: any = await query(
        "SELECT COUNT(*) as count FROM leads WHERE status = 'new' AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)",
      );
      stats.newLeads = newLeads[0].count;

      return res.json(stats);
    }

    // =====================================================
    // HEALTH CHECK
    // =====================================================

    if (path === "/health" && method === "GET") {
      return res.json({ status: "ok", timestamp: new Date().toISOString() });
    }

    // Default 404
    return res.status(404).json({ error: "Not found" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: (error as Error).message,
    });
  }
}
