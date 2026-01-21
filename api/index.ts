import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { type RequestHandler } from "express";
import cors from "cors";
import mysql, {
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

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

// =====================================================
// EMAIL HELPER
// =====================================================

/**
 * Send broker verification email with code
 */
async function sendBrokerVerificationEmail(
  email: string,
  code: number,
  firstName: string,
): Promise<void> {
  try {
    console.log("📧 Sending broker verification email");
    console.log("   Email:", email);
    console.log("   Name:", firstName);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mail.disruptinglabs.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_SECURE === "true" || true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("❌ SMTP credentials not configured!");
      return;
    }

    await transporter.verify();

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { background-color: white; border-radius: 10px; padding: 30px; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
          .code { font-size: 36px; font-weight: bold; color: #667eea; text-align: center; padding: 25px; background-color: #f0f0f0; border-radius: 8px; margin: 25px 0; letter-spacing: 8px; }
          .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Encore Mortgage Admin</h1>
            <p>Código de Verificación</p>
          </div>
          <h2>Hola ${firstName},</h2>
          <p>Tu código de verificación es:</p>
          <div class="code">${code}</div>
          <p><strong>⏱️ Validez:</strong> Este código expirará en <strong>15 minutos</strong></p>
          <div class="footer">
            <p><strong>Encore Mortgage</strong> - Panel de Administración</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM || `"Encore Mortgage" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${code} es tu código de verificación - Admin`,
      html: emailBody,
    });

    console.log("✅ Broker verification email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending broker email:", error);
    throw error;
  }
}

/**
 * Send client verification email with code
 */
async function sendClientVerificationEmail(
  email: string,
  code: number,
  firstName: string,
): Promise<void> {
  try {
    console.log("📧 Sending client verification email");
    console.log("   Email:", email);
    console.log("   Name:", firstName);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mail.disruptinglabs.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_SECURE === "true" || true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("❌ SMTP credentials not configured!");
      return;
    }

    await transporter.verify();

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { background-color: white; border-radius: 10px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
          .code { font-size: 36px; font-weight: bold; color: #3b82f6; text-align: center; padding: 25px; background-color: #eff6ff; border-radius: 8px; margin: 25px 0; letter-spacing: 8px; border: 2px dashed #3b82f6; }
          .welcome { font-size: 18px; color: #333; margin-bottom: 20px; }
          .info { background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Encore Mortgage</h1>
            <p>Bienvenido a tu Portal de Cliente</p>
          </div>
          <div class="welcome">
            <h2>Hola ${firstName},</h2>
            <p>¡Bienvenido! Estamos emocionados de ayudarte en tu proceso de préstamo hipotecario.</p>
          </div>
          <p>Para acceder a tu portal de cliente, usa el siguiente código de verificación:</p>
          <div class="code">${code}</div>
          <div class="info">
            <p><strong>⏱️ Validez:</strong> Este código expirará en <strong>15 minutos</strong></p>
            <p><strong>🔒 Seguridad:</strong> Nunca compartas este código con nadie</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">Si no solicitaste este código, puedes ignorar este correo de forma segura.</p>
          <div class="footer">
            <p><strong>Encore Mortgage</strong></p>
            <p>Tu socio en el camino hacia tu nuevo hogar</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM || `"Encore Mortgage" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${code} es tu código de acceso - Encore Mortgage`,
      html: emailBody,
    });

    console.log("✅ Client verification email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending client email:", error);
    throw error;
  }
}

/**
 * Send client welcome email with loan application details and tasks
 */
async function sendClientLoanWelcomeEmail(
  email: string,
  firstName: string,
  applicationNumber: string,
  loanAmount: string,
  tasks: Array<{
    title: string;
    description: string;
    priority: string;
    due_date: string;
  }>,
): Promise<void> {
  try {
    console.log("📧 Sending client loan welcome email");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mail.disruptinglabs.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_SECURE === "true" || true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const taskListHTML = tasks
      .map(
        (task) => `
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0ea5e9; padding: 16px; margin: 12px 0; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <h3 style="margin: 0; color: #0c4a6e; font-size: 16px; font-weight: 600;">${task.title}</h3>
            <span style="background: ${
              task.priority === "urgent"
                ? "#dc2626"
                : task.priority === "high"
                  ? "#f59e0b"
                  : task.priority === "medium"
                    ? "#0ea5e9"
                    : "#10b981"
            }; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${task.priority}</span>
          </div>
          <p style="margin: 8px 0; color: #475569; font-size: 14px; line-height: 1.5;">${task.description}</p>
          <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">📅 Due: ${new Date(task.due_date).toLocaleDateString()}</p>
        </div>
      `,
      )
      .join("");

    const mailOptions = {
      from: `"Encore Mortgage" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🏡 Your Loan Application ${applicationNumber} - Next Steps`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
              <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <div style="font-size: 40px;">🏡</div>
              </div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Welcome to Encore Mortgage!</h1>
            </div>
            <div style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
              <p style="color: #475569; font-size: 15px;">Your loan application for <strong>$${loanAmount}</strong> has been created.</p>
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; color: #166534; font-size: 14px;">Application Number</p>
                <p style="margin: 8px 0 0 0; color: #15803d; font-size: 24px; font-weight: 700;">${applicationNumber}</p>
              </div>
              <h2 style="color: #0c4a6e; font-size: 20px;">📋 Your Next Steps</h2>
              ${taskListHTML}
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.CLIENT_URL || "http://localhost:5000"}/portal" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600;">Access Your Portal</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Client welcome email sent!");
  } catch (error) {
    console.error("❌ Error sending client welcome email:", error);
    throw error;
  }
}

// =====================================================
// MIDDLEWARE
// =====================================================

/**
 * Middleware to verify broker session
 */
const verifyBrokerSession = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No session token provided",
      });
    }

    const sessionToken = authHeader.substring(7);

    try {
      const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;

      if (decoded.userType !== "broker") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Get broker details
      const [brokers] = await pool.query<any[]>(
        "SELECT * FROM brokers WHERE id = ? AND status = 'active'",
        [decoded.brokerId],
      );

      if (brokers.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Broker not found or inactive",
        });
      }

      // Attach broker info to request
      (req as any).broker = brokers[0];
      (req as any).brokerId = decoded.brokerId;
      (req as any).brokerRole = brokers[0].role;

      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }
  } catch (error) {
    console.error("Error verifying broker session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify session",
    });
  }
};

// =====================================================
// ROUTE HANDLERS
// =====================================================

/**
 * GET /api/health
 * Health check endpoint
 */
const handleHealth: RequestHandler = async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      success: true,
      message: "Encore Mortgage API is running",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/ping
 * Simple ping endpoint
 */
const handlePing: RequestHandler = (_req, res) => {
  res.json({ message: "pong" });
};

/**
 * POST /api/admin/auth/send-code
 * Send verification code to broker email
 */
const handleAdminSendCode: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if broker exists and is active
    const [brokers] = await pool.query<any[]>(
      "SELECT * FROM brokers WHERE email = ? AND status = 'active'",
      [normalizedEmail],
    );

    if (brokers.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Broker not found. Please contact an administrator to get access.",
      });
    }

    const broker = brokers[0];

    // Delete old sessions for this broker
    await pool.query("DELETE FROM broker_sessions WHERE broker_id = ?", [
      broker.id,
    ]);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000);

    // Create new session with 15-minute expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      `INSERT INTO broker_sessions (broker_id, session_code, is_active, expires_at) 
       VALUES (?, ?, TRUE, ?)`,
      [broker.id, code, expiresAt],
    );

    // Send email with code
    await sendBrokerVerificationEmail(normalizedEmail, code, broker.first_name);

    res.json({
      success: true,
      message: "Verification code sent to your email",
      debug_code: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (error) {
    console.error("Error sending broker verification code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send verification code",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/admin/auth/verify-code
 * Verify code and create broker session
 */
const handleAdminVerifyCode: RequestHandler = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and code are required",
      });
    }

    // Check if broker exists
    const [brokers] = await pool.query<any[]>(
      "SELECT * FROM brokers WHERE email = ? AND status = 'active'",
      [email],
    );

    if (brokers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Broker not found",
      });
    }

    const broker = brokers[0];

    // Check if code is valid
    const [sessions] = await pool.query<any[]>(
      `SELECT * FROM broker_sessions 
       WHERE broker_id = ? AND session_code = ? AND is_active = TRUE 
       AND expires_at > NOW()`,
      [broker.id, parseInt(code)],
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Generate session token (JWT)
    const sessionToken = jwt.sign(
      {
        brokerId: broker.id,
        email: broker.email,
        role: broker.role,
        userType: "broker",
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Update last login
    await pool.query("UPDATE brokers SET last_login = NOW() WHERE id = ?", [
      broker.id,
    ]);

    res.json({
      success: true,
      sessionToken,
      admin: {
        id: broker.id,
        email: broker.email,
        first_name: broker.first_name,
        last_name: broker.last_name,
        phone: broker.phone,
        role: broker.role,
        is_active: broker.status === "active",
      },
    });
  } catch (error) {
    console.error("Error verifying broker code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify code",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET /api/admin/auth/validate
 * Validate broker session token
 */
const handleAdminValidateSession: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No session token provided",
      });
    }

    const sessionToken = authHeader.substring(7);

    try {
      const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;

      if (decoded.userType !== "broker") {
        return res.status(401).json({
          success: false,
          message: "Invalid session type",
        });
      }

      // Get broker details
      const [brokers] = await pool.query<any[]>(
        "SELECT * FROM brokers WHERE id = ? AND status = 'active'",
        [decoded.brokerId],
      );

      if (brokers.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Broker not found or inactive",
        });
      }

      const broker = brokers[0];

      res.json({
        success: true,
        admin: {
          id: broker.id,
          email: broker.email,
          first_name: broker.first_name,
          last_name: broker.last_name,
          phone: broker.phone,
          role: broker.role,
          is_active: broker.status === "active",
        },
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }
  } catch (error) {
    console.error("Error validating broker session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/admin/auth/logout
 * Logout broker and invalidate sessions
 */
const handleAdminLogout: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(200).json({ success: true });
    }

    const sessionToken = authHeader.substring(7);

    try {
      const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;

      if (decoded.brokerId) {
        // Delete all sessions for this broker
        await pool.query("DELETE FROM broker_sessions WHERE broker_id = ?", [
          decoded.brokerId,
        ]);
      }
    } catch (error) {
      // Token already invalid, no problem
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error logging out broker:", error);
    res.status(500).json({
      success: false,
      message: "Failed to logout",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Create a new loan application with tasks
 */
const handleCreateLoan: RequestHandler = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      client_email,
      client_first_name,
      client_last_name,
      client_phone,
      loan_type,
      loan_amount,
      property_value,
      down_payment,
      loan_purpose,
      property_address,
      property_city,
      property_state,
      property_zip,
      property_type,
      estimated_close_date,
      notes,
      tasks,
    } = req.body;

    // Get broker ID from authenticated session
    const brokerId = (req as any).brokerId;

    // Check if client exists
    let [existingClients] = await connection.query<any[]>(
      "SELECT id FROM clients WHERE email = ?",
      [client_email],
    );

    let clientId: number;

    if (existingClients.length > 0) {
      clientId = existingClients[0].id;
      // Update client info
      await connection.query(
        "UPDATE clients SET first_name = ?, last_name = ?, phone = ?, assigned_broker_id = ? WHERE id = ?",
        [client_first_name, client_last_name, client_phone, brokerId, clientId],
      );
    } else {
      // Create new client
      const [clientResult] = await connection.query<any>(
        `INSERT INTO clients (email, first_name, last_name, phone, status, email_verified, assigned_broker_id, source) 
         VALUES (?, ?, ?, ?, 'active', 0, ?, 'broker_created')`,
        [
          client_email,
          client_first_name,
          client_last_name,
          client_phone,
          brokerId,
        ],
      );
      clientId = clientResult.insertId;
    }

    // Generate unique application number
    const applicationNumber = `LA${Date.now().toString().slice(-8)}`;

    // Create loan application
    const [loanResult] = await connection.query<any>(
      `INSERT INTO loan_applications (
        application_number, client_user_id, broker_user_id, loan_type, loan_amount,
        property_value, property_address, property_city, property_state, property_zip,
        property_type, down_payment, loan_purpose, status, current_step, total_steps,
        estimated_close_date, notes, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 1, 8, ?, ?, NOW())`,
      [
        applicationNumber,
        clientId,
        brokerId,
        loan_type,
        loan_amount,
        property_value,
        property_address,
        property_city,
        property_state,
        property_zip,
        property_type,
        down_payment,
        loan_purpose || null,
        estimated_close_date || null,
        notes || null,
      ],
    );

    const applicationId = loanResult.insertId;

    // Create tasks
    const tasksWithDates = [];
    for (const task of tasks || []) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (task.due_days || 3));

      await connection.query(
        `INSERT INTO tasks (
          application_id, title, description, task_type, status, priority,
          assigned_to_user_id, created_by_broker_id, due_date
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [
          applicationId,
          task.title,
          task.description,
          task.task_type,
          task.priority,
          clientId,
          brokerId,
          dueDate,
        ],
      );

      tasksWithDates.push({
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: dueDate.toISOString(),
      });
    }

    // Create notification for client
    await connection.query(
      `INSERT INTO notifications (user_id, title, message, notification_type, action_url)
       VALUES (?, ?, ?, 'info', '/portal')`,
      [
        clientId,
        "New Loan Application Created",
        `Your loan application ${applicationNumber} has been created. Please complete the assigned tasks.`,
      ],
    );

    await connection.commit();

    // Send welcome email to client
    try {
      await sendClientLoanWelcomeEmail(
        client_email,
        client_first_name,
        applicationNumber,
        new Intl.NumberFormat("en-US").format(parseFloat(loan_amount)),
        tasksWithDates,
      );
    } catch (emailError) {
      console.error("Email sending failed (non-fatal):", emailError);
    }

    res.json({
      success: true,
      application_id: applicationId,
      application_number: applicationNumber,
      client_id: clientId,
      tasks_created: tasks?.length || 0,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating loan:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create loan",
    });
  } finally {
    connection.release();
  }
};

/**
 * Get all loan applications (pipeline)
 */
const handleGetLoans: RequestHandler = async (req, res) => {
  try {
    const brokerId = (req as any).brokerId;
    const brokerRole = (req as any).brokerRole;

    // Admins see all loans, regular brokers see only their own
    const whereClause =
      brokerRole === "admin" ? "" : "WHERE la.broker_user_id = ?";
    const queryParams = brokerRole === "admin" ? [] : [brokerId];

    const [loans] = await pool.query<any[]>(
      `SELECT 
        la.id,
        la.application_number,
        la.loan_type,
        la.loan_amount,
        la.status,
        la.priority,
        la.estimated_close_date,
        la.created_at,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.email as client_email,
        b.first_name as broker_first_name,
        b.last_name as broker_last_name,
        (SELECT title 
         FROM tasks 
         WHERE application_id = la.id 
           AND status IN ('pending', 'in_progress')
         ORDER BY order_index ASC, due_date ASC 
         LIMIT 1) as next_task,
        (SELECT COUNT(*) 
         FROM tasks 
         WHERE application_id = la.id 
           AND status = 'completed') as completed_tasks,
        (SELECT COUNT(*) 
         FROM tasks 
         WHERE application_id = la.id) as total_tasks
      FROM loan_applications la
      INNER JOIN clients c ON la.client_user_id = c.id
      LEFT JOIN brokers b ON la.broker_user_id = b.id
      ${whereClause}
      ORDER BY la.created_at DESC`,
      queryParams,
    );

    res.json({
      success: true,
      loans,
    });
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch loans",
    });
  }
};

/**
 * GET /api/loans/:loanId
 * Get detailed loan information including all tasks
 */
const handleGetLoanDetails: RequestHandler = async (req, res) => {
  try {
    const brokerId = (req as any).brokerId;
    const brokerRole = (req as any).brokerRole;
    const loanId = req.params.loanId;

    // Admins can view any loan, regular brokers only their own
    const whereClause =
      brokerRole === "admin"
        ? "WHERE la.id = ?"
        : "WHERE la.id = ? AND la.broker_user_id = ?";
    const queryParams = brokerRole === "admin" ? [loanId] : [loanId, brokerId];

    // Get loan details with client and broker info
    const [loans] = (await pool.query(
      `SELECT 
        la.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.email as client_email,
        c.phone as client_phone,
        b.first_name as broker_first_name,
        b.last_name as broker_last_name
      FROM loan_applications la
      INNER JOIN clients c ON la.client_user_id = c.id
      LEFT JOIN brokers b ON la.broker_user_id = b.id
      ${whereClause}`,
      queryParams,
    )) as [RowDataPacket[], any];

    if (loans.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // Get all tasks for this loan
    const [tasks] = (await pool.query(
      `SELECT 
        id,
        title,
        description,
        task_type,
        status,
        priority,
        due_date,
        completed_at,
        created_at
      FROM tasks
      WHERE application_id = ?
      ORDER BY 
        CASE status
          WHEN 'overdue' THEN 1
          WHEN 'in_progress' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'completed' THEN 4
          WHEN 'cancelled' THEN 5
        END,
        due_date ASC`,
      [loanId],
    )) as [RowDataPacket[], any];

    const loan = {
      ...loans[0],
      tasks,
    };

    res.json({
      success: true,
      loan,
    });
  } catch (error) {
    console.error("Error fetching loan details:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch loan details",
    });
  }
};

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the broker
 */
const handleGetDashboardStats: RequestHandler = async (req, res) => {
  try {
    const brokerId = (req as any).brokerId;

    // Get total pipeline value and active applications
    const [pipelineStats] = (await pool.query(
      `SELECT 
        COALESCE(SUM(loan_amount), 0) as totalPipelineValue,
        COUNT(*) as activeApplications
      FROM loan_applications
      WHERE broker_user_id = ? 
        AND status NOT IN ('denied', 'cancelled', 'closed')`,
      [brokerId],
    )) as [RowDataPacket[], any];

    // Get average closing days (from submitted to closed)
    const [closingStats] = (await pool.query(
      `SELECT 
        COALESCE(AVG(DATEDIFF(actual_close_date, submitted_at)), 0) as avgClosingDays
      FROM loan_applications
      WHERE broker_user_id = ? 
        AND status = 'closed'
        AND actual_close_date IS NOT NULL
        AND submitted_at IS NOT NULL
        AND submitted_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)`,
      [brokerId],
    )) as [RowDataPacket[], any];

    // Get closure rate (approved/closed vs denied/cancelled)
    const [closureRateStats] = (await pool.query(
      `SELECT 
        COUNT(CASE WHEN status IN ('approved', 'closed') THEN 1 END) as successful,
        COUNT(CASE WHEN status IN ('denied', 'cancelled') THEN 1 END) as unsuccessful
      FROM loan_applications
      WHERE broker_user_id = ?
        AND status IN ('approved', 'closed', 'denied', 'cancelled')`,
      [brokerId],
    )) as [RowDataPacket[], any];

    const successful = closureRateStats[0]?.successful || 0;
    const unsuccessful = closureRateStats[0]?.unsuccessful || 0;
    const total = successful + unsuccessful;
    const closureRate = total > 0 ? (successful / total) * 100 : 0;

    // Get weekly activity (last 7 days)
    const [weeklyActivity] = (await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as applications,
        COUNT(CASE WHEN status IN ('approved', 'closed') THEN 1 END) as closed
      FROM loan_applications
      WHERE broker_user_id = ?
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC`,
      [brokerId],
    )) as [RowDataPacket[], any];

    // Get status breakdown
    const [statusBreakdown] = (await pool.query(
      `SELECT 
        status,
        COUNT(*) as count
      FROM loan_applications
      WHERE broker_user_id = ?
        AND status NOT IN ('denied', 'cancelled')
      GROUP BY status
      ORDER BY count DESC`,
      [brokerId],
    )) as [RowDataPacket[], any];

    const stats = {
      totalPipelineValue: parseFloat(pipelineStats[0]?.totalPipelineValue || 0),
      activeApplications: parseInt(pipelineStats[0]?.activeApplications || 0),
      avgClosingDays: Math.round(
        parseFloat(closingStats[0]?.avgClosingDays || 0),
      ),
      closureRate: Math.round(closureRate * 10) / 10,
      weeklyActivity: weeklyActivity.map((row: any) => ({
        date: row.date,
        applications: parseInt(row.applications),
        closed: parseInt(row.closed),
      })),
      statusBreakdown: statusBreakdown.map((row: any) => ({
        status: row.status,
        count: parseInt(row.count),
      })),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard stats",
    });
  }
};

/**
 * Get all clients
 */
const handleGetClients: RequestHandler = async (req, res) => {
  try {
    const brokerId = (req as any).brokerId;

    const [clients] = await pool.query<any[]>(
      `SELECT 
        c.id,
        c.email,
        c.first_name,
        c.last_name,
        c.phone,
        c.status,
        c.created_at,
        COUNT(DISTINCT la.id) as total_applications,
        SUM(CASE WHEN la.status IN ('submitted', 'under_review', 'documents_pending', 'underwriting', 'conditional_approval') THEN 1 ELSE 0 END) as active_applications
      FROM clients c
      LEFT JOIN loan_applications la ON c.id = la.client_user_id
      WHERE c.assigned_broker_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC`,
      [brokerId],
    );

    res.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch clients",
    });
  }
};

/**
 * Get all tasks
 */
/**
 * Get brokers (admin/superadmin only)
 */
const handleGetBrokers: RequestHandler = async (req, res) => {
  let connection;
  try {
    const brokerId = (req as any).brokerId;
    if (!brokerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    connection = await pool.getConnection();

    // Check if requesting broker is admin or superadmin
    const [brokerRows] = (await connection.execute(
      "SELECT role FROM brokers WHERE id = ?",
      [brokerId],
    )) as [RowDataPacket[], any];

    if (brokerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Broker not found",
      });
    }

    const brokerRole = brokerRows[0].role;
    if (brokerRole !== "admin" && brokerRole !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all brokers",
      });
    }

    // Fetch all active brokers
    const [brokers] = (await connection.execute(
      `SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        phone, 
        role, 
        status, 
        email_verified, 
        last_login
      FROM brokers 
      WHERE status = 'active'
      ORDER BY first_name, last_name`,
    )) as [RowDataPacket[], any];

    res.json({
      success: true,
      brokers,
    });
  } catch (error) {
    console.error("Error fetching brokers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brokers",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Create a new broker (admin only)
 */
const handleCreateBroker: RequestHandler = async (req, res) => {
  try {
    const brokerId = (req as any).brokerId;
    const {
      email,
      first_name,
      last_name,
      phone,
      role,
      license_number,
      specializations,
    } = req.body;

    // Check if requesting broker is admin
    const [adminCheck] = (await pool.query(
      "SELECT role FROM brokers WHERE id = ?",
      [brokerId],
    )) as [RowDataPacket[], any];

    if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only admins can create brokers",
      });
    }

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: "Email, first name, and last name are required",
      });
    }

    // Check if email already exists
    const [existing] = (await pool.query(
      "SELECT id FROM brokers WHERE email = ?",
      [email],
    )) as [RowDataPacket[], any];

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: "A broker with this email already exists",
      });
    }

    // Insert new broker
    const [result] = (await pool.query(
      `INSERT INTO brokers 
        (email, first_name, last_name, phone, role, license_number, specializations, status, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0)`,
      [
        email,
        first_name,
        last_name,
        phone || null,
        role || "broker",
        license_number || null,
        specializations ? JSON.stringify(specializations) : null,
      ],
    )) as [ResultSetHeader, any];

    const [newBroker] = (await pool.query(
      "SELECT id, email, first_name, last_name, phone, role, status, license_number, specializations, email_verified, created_at FROM brokers WHERE id = ?",
      [result.insertId],
    )) as [RowDataPacket[], any];

    res.json({
      success: true,
      broker: newBroker[0],
      message: "Broker created successfully",
    });
  } catch (error) {
    console.error("Error creating broker:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create broker",
    });
  }
};

/**
 * Update a broker (admin only)
 */
const handleUpdateBroker: RequestHandler = async (req, res) => {
  try {
    const brokerId = (req as any).brokerId;
    const { brokerId: targetBrokerId } = req.params;
    const {
      first_name,
      last_name,
      phone,
      role,
      status,
      license_number,
      specializations,
    } = req.body;

    // Check if requesting broker is admin
    const [adminCheck] = (await pool.query(
      "SELECT role FROM brokers WHERE id = ?",
      [brokerId],
    )) as [RowDataPacket[], any];

    if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only admins can update brokers",
      });
    }

    // Check if target broker exists
    const [existing] = (await pool.query(
      "SELECT id FROM brokers WHERE id = ?",
      [targetBrokerId],
    )) as [RowDataPacket[], any];

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Broker not found",
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (first_name !== undefined) {
      updates.push("first_name = ?");
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push("last_name = ?");
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone || null);
    }
    if (role !== undefined) {
      updates.push("role = ?");
      values.push(role);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (license_number !== undefined) {
      updates.push("license_number = ?");
      values.push(license_number || null);
    }
    if (specializations !== undefined) {
      updates.push("specializations = ?");
      values.push(specializations ? JSON.stringify(specializations) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    values.push(targetBrokerId);

    await pool.query(
      `UPDATE brokers SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const [updatedBroker] = (await pool.query(
      "SELECT id, email, first_name, last_name, phone, role, status, license_number, specializations, email_verified, last_login, created_at FROM brokers WHERE id = ?",
      [targetBrokerId],
    )) as [RowDataPacket[], any];

    res.json({
      success: true,
      broker: updatedBroker[0],
      message: "Broker updated successfully",
    });
  } catch (error) {
    console.error("Error updating broker:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update broker",
    });
  }
};

/**
 * Delete a broker (admin only)
 */
const handleDeleteBroker: RequestHandler = async (req, res) => {
  try {
    const brokerId = (req as any).brokerId;
    const { brokerId: targetBrokerId } = req.params;

    // Check if requesting broker is admin
    const [adminCheck] = (await pool.query(
      "SELECT role FROM brokers WHERE id = ?",
      [brokerId],
    )) as [RowDataPacket[], any];

    if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only admins can delete brokers",
      });
    }

    // Prevent self-deletion
    if (parseInt(targetBrokerId) === brokerId) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete your own account",
      });
    }

    // Check if target broker exists
    const [existing] = (await pool.query(
      "SELECT id, first_name, last_name FROM brokers WHERE id = ?",
      [targetBrokerId],
    )) as [RowDataPacket[], any];

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Broker not found",
      });
    }

    // Instead of deleting, set status to inactive (soft delete)
    await pool.query("UPDATE brokers SET status = 'inactive' WHERE id = ?", [
      targetBrokerId,
    ]);

    res.json({
      success: true,
      message: `Broker ${existing[0].first_name} ${existing[0].last_name} has been deactivated`,
    });
  } catch (error) {
    console.error("Error deleting broker:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete broker",
    });
  }
};

/**
 * Get task templates (for Tasks management page)
 */
const handleGetTaskTemplates: RequestHandler = async (req, res) => {
  try {
    const brokerId = (req as any).brokerId;

    const [templates] = await pool.query<any[]>(
      `SELECT 
        id,
        title,
        description,
        task_type,
        priority,
        default_due_days,
        order_index,
        is_active,
        created_at,
        updated_at
      FROM task_templates
      WHERE created_by_broker_id = ?
      ORDER BY order_index ASC, created_at DESC`,
      [brokerId],
    );

    res.json({
      success: true,
      tasks: templates, // Keep same property name for compatibility
    });
  } catch (error) {
    console.error("Error fetching task templates:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch task templates",
    });
  }
};

/**
 * Create a new task template
 */
const handleCreateTaskTemplate: RequestHandler = async (req, res) => {
  try {
    const brokerId = (req as any).brokerId;
    const {
      title,
      description,
      task_type,
      priority,
      due_date, // Convert to default_due_days
      application_id, // Ignore this for templates
    } = req.body;

    // Validate required fields
    if (!title || !task_type || !priority) {
      res.status(400).json({
        success: false,
        error: "Title, task type, and priority are required",
      });
      return;
    }

    // Calculate default_due_days if due_date provided
    let defaultDueDays = null;
    if (due_date) {
      const dueDate = new Date(due_date);
      const now = new Date();
      const diffTime = dueDate.getTime() - now.getTime();
      defaultDueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (defaultDueDays < 0) defaultDueDays = 1;
    }

    // Get max order_index to append new template at end
    const [maxOrder] = await pool.query<any[]>(
      "SELECT COALESCE(MAX(order_index), 0) as max_order FROM task_templates WHERE created_by_broker_id = ?",
      [brokerId],
    );
    const orderIndex = (maxOrder[0]?.max_order || 0) + 1;

    // Insert task template
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO task_templates (
        title,
        description,
        task_type,
        priority,
        default_due_days,
        order_index,
        is_active,
        created_by_broker_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW())`,
      [
        title,
        description || null,
        task_type,
        priority,
        defaultDueDays,
        orderIndex,
        brokerId,
      ],
    );

    const templateId = result.insertId;

    // Fetch the created template
    const [templates] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM task_templates WHERE id = ?",
      [templateId],
    );

    res.json({
      success: true,
      task: templates[0], // Keep same property name for compatibility
      message: "Task template created successfully",
    });
  } catch (error) {
    console.error("Error creating task template:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create task",
    });
  }
};

/**
 * Update task status (PATCH - partial update)
 */
const handleUpdateTask: RequestHandler = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const completedAt = status === "completed" ? new Date() : null;

    await pool.query(
      "UPDATE tasks SET status = ?, completed_at = ?, updated_at = NOW() WHERE id = ?",
      [status, completedAt, taskId],
    );

    res.json({
      success: true,
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update task",
    });
  }
};

/**
 * Update full task template (PUT - full update)
 */
const handleUpdateTaskTemplateFull: RequestHandler = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      task_type,
      priority,
      due_date,
      application_id, // Ignore for templates
    } = req.body;

    // Validate required fields
    if (!title || !task_type || !priority) {
      return res.status(400).json({
        success: false,
        error: "Title, task_type, and priority are required",
      });
    }

    // Validate priority
    const validPriorities = ["low", "medium", "high", "urgent"];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: "Priority must be low, medium, high, or urgent",
      });
    }

    // Calculate default_due_days if due_date provided
    let defaultDueDays = null;
    if (due_date) {
      const dueDate = new Date(due_date);
      const now = new Date();
      const diffTime = dueDate.getTime() - now.getTime();
      defaultDueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (defaultDueDays < 0) defaultDueDays = 1;
    }

    // Update task template in database
    await pool.query(
      "UPDATE task_templates SET title = ?, description = ?, task_type = ?, priority = ?, default_due_days = ?, updated_at = NOW() WHERE id = ?",
      [title, description || null, task_type, priority, defaultDueDays, taskId],
    );

    // Fetch updated template
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM task_templates WHERE id = ?",
      [taskId],
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Task template not found after update",
      });
    }

    res.json({
      success: true,
      message: "Task template updated successfully",
      task: rows[0],
    });
  } catch (error) {
    console.error("Error updating task template:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update task template",
    });
  }
};

/**
 * Delete task template
 */
const handleDeleteTaskTemplate: RequestHandler = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Check if template exists
    const [existingRows] = await pool.query<RowDataPacket[]>(
      "SELECT id, title FROM task_templates WHERE id = ?",
      [taskId],
    );

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Task template not found",
      });
    }

    // Delete template (task instances will have template_id set to NULL via CASCADE)
    await pool.query("DELETE FROM task_templates WHERE id = ?", [taskId]);

    res.json({
      success: true,
      message: "Task template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task template:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete task template",
    });
  }
};

/**
 * Get all email templates
 */
const handleGetEmailTemplates: RequestHandler = async (req, res) => {
  try {
    const [templates] = (await pool.query(
      `SELECT 
        id,
        name,
        subject,
        body_html,
        body_text,
        template_type,
        is_active,
        created_at,
        updated_at
      FROM email_templates
      ORDER BY created_at DESC`,
    )) as [RowDataPacket[], any];

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch email templates",
    });
  }
};

/**
 * Create email template
 */
const handleCreateEmailTemplate: RequestHandler = async (req, res) => {
  try {
    const { name, subject, body_html, body_text, template_type, is_active } =
      req.body;

    if (!name || !subject || !body_html || !template_type) {
      return res.status(400).json({
        success: false,
        error: "Name, subject, body_html, and template_type are required",
      });
    }

    const [result] = (await pool.query(
      `INSERT INTO email_templates 
        (name, subject, body_html, body_text, template_type, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        subject,
        body_html,
        body_text || null,
        template_type,
        is_active !== false ? 1 : 0,
      ],
    )) as [ResultSetHeader, any];

    const [templates] = (await pool.query(
      "SELECT * FROM email_templates WHERE id = ?",
      [result.insertId],
    )) as [RowDataPacket[], any];

    res.json({
      success: true,
      template: templates[0],
      message: "Email template created successfully",
    });
  } catch (error) {
    console.error("Error creating email template:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create email template",
    });
  }
};

/**
 * Update email template
 */
const handleUpdateEmailTemplate: RequestHandler = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, subject, body_html, body_text, template_type, is_active } =
      req.body;

    // Check if template exists
    const [existingRows] = (await pool.query(
      "SELECT id FROM email_templates WHERE id = ?",
      [templateId],
    )) as [RowDataPacket[], any];

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Email template not found",
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (subject !== undefined) {
      updates.push("subject = ?");
      values.push(subject);
    }
    if (body_html !== undefined) {
      updates.push("body_html = ?");
      values.push(body_html);
    }
    if (body_text !== undefined) {
      updates.push("body_text = ?");
      values.push(body_text);
    }
    if (template_type !== undefined) {
      updates.push("template_type = ?");
      values.push(template_type);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    values.push(templateId);

    await pool.query(
      `UPDATE email_templates SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const [templates] = (await pool.query(
      "SELECT * FROM email_templates WHERE id = ?",
      [templateId],
    )) as [RowDataPacket[], any];

    res.json({
      success: true,
      template: templates[0],
      message: "Email template updated successfully",
    });
  } catch (error) {
    console.error("Error updating email template:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update email template",
    });
  }
};

/**
 * Delete email template
 */
const handleDeleteEmailTemplate: RequestHandler = async (req, res) => {
  try {
    const { templateId } = req.params;

    // Check if template exists
    const [existingRows] = (await pool.query(
      "SELECT id, name FROM email_templates WHERE id = ?",
      [templateId],
    )) as [RowDataPacket[], any];

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Email template not found",
      });
    }

    await pool.query("DELETE FROM email_templates WHERE id = ?", [templateId]);

    res.json({
      success: true,
      message: `Email template "${existingRows[0].name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting email template:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete email template",
    });
  }
};

/**
 * Get all SMS templates
 */
const handleGetSmsTemplates: RequestHandler = async (req, res) => {
  try {
    const [templates] = (await pool.query(
      "SELECT * FROM sms_templates ORDER BY created_at DESC",
    )) as [RowDataPacket[], any];

    res.json({
      success: true,
      templates: templates.map((template: any) => ({
        ...template,
        is_active: Boolean(template.is_active),
      })),
    });
  } catch (error) {
    console.error("Error fetching SMS templates:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch SMS templates",
    });
  }
};

/**
 * Create SMS template
 */
const handleCreateSmsTemplate: RequestHandler = async (req, res) => {
  try {
    const { name, body, template_type, is_active } = req.body;

    // Validate required fields
    if (!name || !body || !template_type) {
      return res.status(400).json({
        success: false,
        error: "Name, body, and template_type are required",
      });
    }

    // Check character limit (1600 as per schema)
    if (body.length > 1600) {
      return res.status(400).json({
        success: false,
        error: "SMS body cannot exceed 1600 characters",
      });
    }

    const [result] = (await pool.query(
      `INSERT INTO sms_templates 
        (name, body, template_type, is_active) 
       VALUES (?, ?, ?, ?)`,
      [name, body, template_type, is_active !== false ? 1 : 0],
    )) as [ResultSetHeader, any];

    const [templates] = (await pool.query(
      "SELECT * FROM sms_templates WHERE id = ?",
      [result.insertId],
    )) as [RowDataPacket[], any];

    res.json({
      success: true,
      template: {
        ...templates[0],
        is_active: Boolean(templates[0].is_active),
      },
      message: "SMS template created successfully",
    });
  } catch (error) {
    console.error("Error creating SMS template:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create SMS template",
    });
  }
};

/**
 * Update SMS template
 */
const handleUpdateSmsTemplate: RequestHandler = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, body, template_type, is_active } = req.body;

    // Check if template exists
    const [existingRows] = (await pool.query(
      "SELECT id FROM sms_templates WHERE id = ?",
      [templateId],
    )) as [RowDataPacket[], any];

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "SMS template not found",
      });
    }

    // Check character limit if body is being updated
    if (body && body.length > 1600) {
      return res.status(400).json({
        success: false,
        error: "SMS body cannot exceed 1600 characters",
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (body !== undefined) {
      updates.push("body = ?");
      values.push(body);
    }
    if (template_type !== undefined) {
      updates.push("template_type = ?");
      values.push(template_type);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    values.push(templateId);

    await pool.query(
      `UPDATE sms_templates SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const [templates] = (await pool.query(
      "SELECT * FROM sms_templates WHERE id = ?",
      [templateId],
    )) as [RowDataPacket[], any];

    res.json({
      success: true,
      template: {
        ...templates[0],
        is_active: Boolean(templates[0].is_active),
      },
      message: "SMS template updated successfully",
    });
  } catch (error) {
    console.error("Error updating SMS template:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update SMS template",
    });
  }
};

/**
 * Delete SMS template
 */
const handleDeleteSmsTemplate: RequestHandler = async (req, res) => {
  try {
    const { templateId } = req.params;

    // Check if template exists
    const [existingRows] = (await pool.query(
      "SELECT id, name FROM sms_templates WHERE id = ?",
      [templateId],
    )) as [RowDataPacket[], any];

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "SMS template not found",
      });
    }

    await pool.query("DELETE FROM sms_templates WHERE id = ?", [templateId]);

    res.json({
      success: true,
      message: `SMS template "${existingRows[0].name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting SMS template:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete SMS template",
    });
  }
};

// =====================================================
// SERVER INITIALIZATION
// =====================================================

// Create the Express app once (reused across invocations)
let app: express.Application | null = null;

function createServer() {
  console.log("Creating Express server for Vercel...");

  const expressApp = express();

  // Middleware
  expressApp.use(cors());
  expressApp.use(express.json({ limit: "10mb" }));
  expressApp.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Log requests
  expressApp.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // ==================== CONFIGURE API ROUTES ====================

  // Health & ping
  expressApp.get("/api/health", handleHealth);
  expressApp.get("/api/ping", handlePing);

  // Broker auth routes (no auth required)
  expressApp.post("/api/admin/auth/send-code", handleAdminSendCode);
  expressApp.post("/api/admin/auth/verify-code", handleAdminVerifyCode);
  expressApp.get("/api/admin/auth/validate", handleAdminValidateSession);
  expressApp.post("/api/admin/auth/logout", handleAdminLogout);

  // Protected routes (require broker session)
  expressApp.get(
    "/api/dashboard/stats",
    verifyBrokerSession,
    handleGetDashboardStats,
  );
  expressApp.post("/api/loans/create", verifyBrokerSession, handleCreateLoan);
  expressApp.get("/api/loans", verifyBrokerSession, handleGetLoans);
  expressApp.get(
    "/api/loans/:loanId",
    verifyBrokerSession,
    handleGetLoanDetails,
  );
  expressApp.get("/api/clients", verifyBrokerSession, handleGetClients);
  expressApp.get("/api/brokers", verifyBrokerSession, handleGetBrokers);
  expressApp.post("/api/brokers", verifyBrokerSession, handleCreateBroker);
  expressApp.put(
    "/api/brokers/:brokerId",
    verifyBrokerSession,
    handleUpdateBroker,
  );
  expressApp.delete(
    "/api/brokers/:brokerId",
    verifyBrokerSession,
    handleDeleteBroker,
  );
  expressApp.get("/api/tasks", verifyBrokerSession, handleGetTaskTemplates);
  expressApp.post("/api/tasks", verifyBrokerSession, handleCreateTaskTemplate);
  expressApp.patch("/api/tasks/:taskId", verifyBrokerSession, handleUpdateTask);
  expressApp.put(
    "/api/tasks/:taskId",
    verifyBrokerSession,
    handleUpdateTaskTemplateFull,
  );
  expressApp.delete(
    "/api/tasks/:taskId",
    verifyBrokerSession,
    handleDeleteTaskTemplate,
  );

  // Email template routes (require broker session)
  expressApp.get(
    "/api/email-templates",
    verifyBrokerSession,
    handleGetEmailTemplates,
  );
  expressApp.post(
    "/api/email-templates",
    verifyBrokerSession,
    handleCreateEmailTemplate,
  );
  expressApp.put(
    "/api/email-templates/:templateId",
    verifyBrokerSession,
    handleUpdateEmailTemplate,
  );
  expressApp.delete(
    "/api/email-templates/:templateId",
    verifyBrokerSession,
    handleDeleteEmailTemplate,
  );

  // SMS Templates routes
  expressApp.get(
    "/api/sms-templates",
    verifyBrokerSession,
    handleGetSmsTemplates,
  );
  expressApp.post(
    "/api/sms-templates",
    verifyBrokerSession,
    handleCreateSmsTemplate,
  );
  expressApp.put(
    "/api/sms-templates/:templateId",
    verifyBrokerSession,
    handleUpdateSmsTemplate,
  );
  expressApp.delete(
    "/api/sms-templates/:templateId",
    verifyBrokerSession,
    handleDeleteSmsTemplate,
  );

  // 404 handler - only for API routes
  expressApp.use("/api", (_req, res, next) => {
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        message: "API endpoint not found",
      });
    } else {
      next();
    }
  });

  // Error handler
  expressApp.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("Express error:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    },
  );

  return expressApp;
}

function getApp() {
  if (!app) {
    console.log("Initializing Express app for serverless...");
    app = createServer();
  }
  return app;
}

// Export createServer for development use
export { createServer };

// Export handler for Vercel serverless
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const expressApp = getApp();
    expressApp(req as any, res as any);
  } catch (error) {
    console.error("API Handler Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          code: "500",
          message: "A server error has occurred",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
};
