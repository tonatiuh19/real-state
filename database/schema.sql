-- =====================================================
-- LOAN BROKER MANAGEMENT SYSTEM - MYSQL SCHEMA
-- =====================================================
-- For use with Hostgator MySQL Database
-- Designed for Vercel deployment

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- Clients table - separate authentication for clients
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Brokers table - separate authentication for brokers and admins
CREATE TABLE brokers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('broker', 'admin') NOT NULL DEFAULT 'broker',
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    license_number VARCHAR(100),
    specializations JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User login sessions - passwordless authentication with email codes
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_code INT(6) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_code (session_code),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Broker login sessions - passwordless authentication with email codes
CREATE TABLE broker_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    broker_id INT NOT NULL,
    session_code INT(6) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE,
    INDEX idx_broker_id (broker_id),
    INDEX idx_session_code (session_code),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date_of_birth DATE,
    ssn_last_four VARCHAR(4),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'USA',
    employment_status ENUM('employed', 'self_employed', 'unemployed', 'retired'),
    employer_name VARCHAR(255),
    annual_income DECIMAL(12, 2),
    credit_score INT,
    avatar_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE broker_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    broker_id INT NOT NULL,
    bio TEXT,
    office_address VARCHAR(255),
    office_city VARCHAR(100),
    office_state VARCHAR(50),
    office_zip VARCHAR(10),
    avatar_url VARCHAR(500),
    years_experience INT,
    total_loans_closed INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE,
    UNIQUE KEY (broker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEADS & CLIENTS
-- =====================================================

CREATE TABLE leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source ENUM('website', 'referral', 'social_media', 'cold_call', 'event', 'other') NOT NULL,
    source_details VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    interest_type ENUM('purchase', 'refinance', 'home_equity', 'commercial', 'other') NOT NULL,
    estimated_loan_amount DECIMAL(12, 2),
    property_type ENUM('single_family', 'condo', 'multi_family', 'commercial', 'land', 'other'),
    status ENUM('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost') NOT NULL DEFAULT 'new',
    assigned_broker_id INT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    converted_to_client_id INT,
    FOREIGN KEY (assigned_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_assigned_broker (assigned_broker_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lead_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    activity_type ENUM('call', 'email', 'sms', 'meeting', 'note', 'status_change') NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    performed_by_broker_id INT,
    scheduled_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    INDEX idx_lead_id (lead_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_scheduled_at (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LOAN APPLICATIONS
-- =====================================================

CREATE TABLE loan_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL UNIQUE,
    client_user_id INT NOT NULL,
    broker_user_id INT,
    loan_type ENUM('purchase', 'refinance', 'home_equity', 'commercial', 'construction', 'other') NOT NULL,
    loan_amount DECIMAL(12, 2) NOT NULL,
    property_value DECIMAL(12, 2),
    property_address VARCHAR(255),
    property_city VARCHAR(100),
    property_state VARCHAR(50),
    property_zip VARCHAR(10),
    property_type ENUM('single_family', 'condo', 'multi_family', 'commercial', 'land', 'other'),
    down_payment DECIMAL(12, 2),
    loan_purpose TEXT,
    status ENUM(
        'draft',
        'submitted',
        'under_review',
        'documents_pending',
        'underwriting',
        'conditional_approval',
        'approved',
        'denied',
        'closed',
        'cancelled'
    ) NOT NULL DEFAULT 'draft',
    current_step INT DEFAULT 1,
    total_steps INT DEFAULT 8,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    estimated_close_date DATE,
    actual_close_date DATE,
    interest_rate DECIMAL(5, 3),
    loan_term_months INT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submitted_at DATETIME,
    FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (broker_user_id) REFERENCES brokers(id) ON DELETE SET NULL,
    INDEX idx_application_number (application_number),
    INDEX idx_client (client_user_id),
    INDEX idx_broker (broker_user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE application_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by_broker_id INT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    INDEX idx_application_id (application_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DOCUMENTS
-- =====================================================

CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT,
    uploaded_by_user_id INT,
    uploaded_by_broker_id INT,
    document_type ENUM(
        'id_verification',
        'income_verification',
        'bank_statement',
        'tax_return',
        'pay_stub',
        'employment_letter',
        'credit_report',
        'property_appraisal',
        'purchase_agreement',
        'title_report',
        'insurance',
        'other'
    ) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes INT,
    mime_type VARCHAR(100),
    status ENUM('pending_review', 'approved', 'rejected', 'expired') DEFAULT 'pending_review',
    is_required BOOLEAN DEFAULT FALSE,
    reviewed_by_broker_id INT,
    reviewed_at DATETIME,
    review_notes TEXT,
    expiration_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_broker_id) REFERENCES brokers(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    CHECK (uploaded_by_user_id IS NOT NULL OR uploaded_by_broker_id IS NOT NULL),
    INDEX idx_application_id (application_id),
    INDEX idx_document_type (document_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TASKS & WORKFLOWS
-- =====================================================

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT,
    lead_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type ENUM('document_collection', 'follow_up', 'review', 'approval', 'closing', 'other') NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'overdue') NOT NULL DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assigned_to_user_id INT,
    assigned_to_broker_id INT,
    created_by_broker_id INT,
    due_date DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    INDEX idx_application_id (application_id),
    INDEX idx_assigned_to_user (assigned_to_user_id),
    INDEX idx_assigned_to_broker (assigned_to_broker_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workflow_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    loan_type ENUM('purchase', 'refinance', 'home_equity', 'commercial', 'construction', 'other'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workflow_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_template_id INT NOT NULL,
    step_order INT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_description TEXT,
    auto_assign_to ENUM('client', 'broker'),
    estimated_days INT,
    is_required BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (workflow_template_id) REFERENCES workflow_templates(id) ON DELETE CASCADE,
    INDEX idx_workflow_template (workflow_template_id),
    INDEX idx_step_order (step_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMMUNICATIONS
-- =====================================================

CREATE TABLE communications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT,
    lead_id INT,
    from_user_id INT,
    from_broker_id INT,
    to_user_id INT,
    to_broker_id INT,
    communication_type ENUM('email', 'sms', 'call', 'internal_note') NOT NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    subject VARCHAR(255),
    body TEXT,
    status ENUM('pending', 'sent', 'delivered', 'failed', 'read') DEFAULT 'pending',
    external_id VARCHAR(255),
    metadata JSON,
    scheduled_at DATETIME,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications(id) ON DELETE SET NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (from_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    INDEX idx_application_id (application_id),
    INDEX idx_lead_id (lead_id),
    INDEX idx_communication_type (communication_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    template_type ENUM('welcome', 'status_update', 'document_request', 'approval', 'denial', 'custom') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_type (template_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sms_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    body VARCHAR(1600) NOT NULL,
    template_type ENUM('reminder', 'status_update', 'document_request', 'custom') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_type (template_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MARKETING & CAMPAIGNS
-- =====================================================

CREATE TABLE campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type ENUM('email', 'sms', 'mixed') NOT NULL,
    status ENUM('draft', 'scheduled', 'active', 'paused', 'completed') NOT NULL DEFAULT 'draft',
    target_audience JSON,
    email_template_id INT,
    sms_template_id INT,
    scheduled_start DATETIME,
    scheduled_end DATETIME,
    created_by_broker_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (email_template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (sms_template_id) REFERENCES sms_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_campaign_type (campaign_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE campaign_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    user_id INT,
    lead_id INT,
    email VARCHAR(255),
    phone VARCHAR(20),
    status ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed') DEFAULT 'pending',
    sent_at DATETIME,
    opened_at DATETIME,
    clicked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMPLIANCE & AUDIT
-- =====================================================

CREATE TABLE compliance_checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    checklist_name VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by_broker_id INT,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (completed_by_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    INDEX idx_application_id (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE compliance_checklist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by_broker_id INT,
    completed_at DATETIME,
    notes TEXT,
    FOREIGN KEY (checklist_id) REFERENCES compliance_checklists(id) ON DELETE CASCADE,
    FOREIGN KEY (completed_by_broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    INDEX idx_checklist_id (checklist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    broker_id INT,
    actor_type ENUM('user', 'broker') NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    changes JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_broker_id (broker_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NOTIFICATIONS & REMINDERS
-- =====================================================

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default admin broker (passwordless - will login with email code)
INSERT INTO brokers (email, first_name, last_name, role, email_verified) 
VALUES ('admin@example.com', 'Admin', 'User', 'admin', TRUE);

-- Insert default workflow template
INSERT INTO workflow_templates (name, description, loan_type, is_active)
VALUES ('Standard Purchase Loan', 'Default workflow for purchase loans', 'purchase', TRUE);

-- Insert workflow steps
INSERT INTO workflow_steps (workflow_template_id, step_order, step_name, step_description, estimated_days) VALUES
(1, 1, 'Application Submission', 'Client submits initial application', 1),
(1, 2, 'Document Collection', 'Gather required documents', 3),
(1, 3, 'Initial Review', 'Broker reviews application', 2),
(1, 4, 'Credit Check', 'Run credit report', 1),
(1, 5, 'Underwriting', 'Loan underwriting process', 5),
(1, 6, 'Appraisal', 'Property appraisal', 7),
(1, 7, 'Final Approval', 'Final loan approval', 2),
(1, 8, 'Closing', 'Loan closing and funding', 3);

-- Insert default email templates
INSERT INTO email_templates (name, subject, body_html, template_type) VALUES
('Welcome Client', 'Welcome to Our Loan Services', '<p>Dear {{first_name}},</p><p>Welcome! We''re excited to help you with your loan application.</p>', 'welcome'),
('Application Submitted', 'Your Loan Application Has Been Received', '<p>Dear {{first_name}},</p><p>We have received your application #{{application_number}}. We will review it shortly.</p>', 'status_update'),
('Documents Required', 'Additional Documents Needed', '<p>Dear {{first_name}},</p><p>Please upload the following documents to proceed with your application.</p>', 'document_request');

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'Loan Broker Pro', 'string', 'Company name'),
('support_email', 'support@example.com', 'string', 'Support email address'),
('max_file_upload_mb', '10', 'number', 'Maximum file upload size in MB'),
('enable_sms', 'true', 'boolean', 'Enable SMS notifications'),
('enable_email', 'true', 'boolean', 'Enable email notifications');
