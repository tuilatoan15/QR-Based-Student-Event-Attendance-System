/* =====================================================
   QR BASED STUDENT EVENT ATTENDANCE SYSTEM DATABASE
   =====================================================
   Refactored for production readiness:
   - Removed redundant event_members table (logic covered by registrations/attendances)
   - Added proper constraints, indexes, and timestamps
   - Normalized schema with relational integrity
   - Added CHECK constraints for data validation
   - Optimized indexes for common REST API queries
   ===================================================== */

---------------------------------------------------------
-- 1. CREATE DATABASE
---------------------------------------------------------
IF DB_ID('event_system') IS NULL
BEGIN
    CREATE DATABASE event_system;
END;
GO

USE event_system;
GO

---------------------------------------------------------
-- 2. DROP TABLES (RESET)
---------------------------------------------------------
IF OBJECT_ID('dbo.audit_logs', 'U') IS NOT NULL DROP TABLE dbo.audit_logs;
IF OBJECT_ID('dbo.refresh_tokens', 'U') IS NOT NULL DROP TABLE dbo.refresh_tokens;
IF OBJECT_ID('dbo.attendances', 'U') IS NOT NULL DROP TABLE dbo.attendances;
IF OBJECT_ID('dbo.registrations', 'U') IS NOT NULL DROP TABLE dbo.registrations;
IF OBJECT_ID('dbo.events', 'U') IS NOT NULL DROP TABLE dbo.events;
IF OBJECT_ID('dbo.event_categories', 'U') IS NOT NULL DROP TABLE dbo.event_categories;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL DROP TABLE dbo.roles;
GO
---------------------------------------------------------

---------------------------------------------------------
-- 3. ROLES
---------------------------------------------------------
CREATE TABLE dbo.roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE
);
GO

INSERT INTO dbo.roles (name)
VALUES ('admin'), ('organizer'), ('student');
GO

---------------------------------------------------------
-- 4. USERS
---------------------------------------------------------
CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    student_code NVARCHAR(50) NULL,
    role_id INT NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES dbo.roles(id)
);
GO

-- Sample Users Data (passwords hashed with bcrypt, salt rounds 10)
-- Original password for all: '123456'
INSERT INTO dbo.users (full_name, email, password_hash, student_code, role_id)
VALUES 
('System Admin', 'admin@university.edu', '$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG', NULL, 1),
('Event Organizer', 'organizer@university.edu', '$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG', NULL, 2),
('Nguyen Van A', 'student1@university.edu', '$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG', 'SV001', 3),
('Tran Thi B', 'student2@university.edu', '$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG', 'SV002', 3),
('Le Van C', 'student3@university.edu', '$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG', 'SV003', 3);
GO

---------------------------------------------------------
-- 6. SAMPLE EVENT CATEGORIES
---------------------------------------------------------
INSERT INTO dbo.event_categories (name, description)
VALUES 
('Academic', 'Academic events and lectures'),
('Sports', 'Sports and recreational activities'),
('Cultural', 'Cultural and artistic events'),
('Technology', 'Technology and innovation events');
GO

---------------------------------------------------------
-- 7. SAMPLE EVENTS
---------------------------------------------------------
INSERT INTO dbo.events (title, description, location, start_time, end_time, max_participants, category_id, created_by)
VALUES 
('Introduction to Flutter Development', 'Learn the basics of Flutter mobile app development', 'Room 101', '2024-12-01 10:00:00', '2024-12-01 12:00:00', 50, 4, 2),
('Campus Basketball Tournament', 'Annual inter-department basketball championship', 'Sports Center', '2024-12-05 14:00:00', '2024-12-05 18:00:00', 100, 2, 2),
('Cultural Festival 2024', 'Celebrating diversity through music, dance and food', 'Main Auditorium', '2024-12-10 18:00:00', '2024-12-10 22:00:00', 200, 3, 2),
('AI and Machine Learning Workshop', 'Hands-on workshop on AI/ML fundamentals', 'Computer Lab', '2024-12-15 09:00:00', '2024-12-15 17:00:00', 30, 4, 2);
GO

---------------------------------------------------------
-- 6. EVENTS
---------------------------------------------------------
CREATE TABLE dbo.events (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    location NVARCHAR(255) NOT NULL,
    start_time DATETIME2 NOT NULL,
    end_time DATETIME2 NOT NULL,
    max_participants INT NOT NULL CHECK (max_participants > 0),
    category_id INT NULL,
    created_by INT NOT NULL,
    google_sheet_id NVARCHAR(255) NULL,
    google_sheet_name NVARCHAR(255) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT fk_events_category
        FOREIGN KEY (category_id)
        REFERENCES dbo.event_categories(id),

    CONSTRAINT fk_events_created_by
        FOREIGN KEY (created_by)
        REFERENCES dbo.users(id),

    CONSTRAINT chk_events_end_after_start
        CHECK (end_time > start_time)
);
GO

---------------------------------------------------------
-- 8. REGISTRATIONS
---------------------------------------------------------
CREATE TABLE dbo.registrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    qr_token NVARCHAR(255) NOT NULL UNIQUE,
    status NVARCHAR(20) NOT NULL DEFAULT 'registered'
        CHECK (status IN ('registered','attended','cancelled')),
    registered_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT fk_reg_user
        FOREIGN KEY (user_id)
        REFERENCES dbo.users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reg_event
        FOREIGN KEY (event_id)
        REFERENCES dbo.events(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_user_event UNIQUE (user_id, event_id)
);
GO

---------------------------------------------------------
-- 9. ATTENDANCES (CHECK-IN)
---------------------------------------------------------
CREATE TABLE dbo.attendances (
    id INT IDENTITY(1,1) PRIMARY KEY,
    registration_id INT NOT NULL UNIQUE,
    checkin_time DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    checkin_by INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT fk_attendance_registration
        FOREIGN KEY (registration_id)
        REFERENCES dbo.registrations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_admin
        FOREIGN KEY (checkin_by)
        REFERENCES dbo.users(id)
);
GO

---------------------------------------------------------
-- 10. REFRESH TOKENS (JWT)
---------------------------------------------------------
CREATE TABLE dbo.refresh_tokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    token NVARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    is_revoked BIT NOT NULL DEFAULT 0,

    CONSTRAINT fk_refresh_user
        FOREIGN KEY (user_id)
        REFERENCES dbo.users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_refresh_expires_future
        CHECK (expires_at > SYSUTCDATETIME())
);
GO

---------------------------------------------------------
-- 11. AUDIT LOGS
---------------------------------------------------------
CREATE TABLE dbo.audit_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL,
    action NVARCHAR(255) NOT NULL,
    entity_name NVARCHAR(100) NOT NULL,
    entity_id INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES dbo.users(id)
);
GO

---------------------------------------------------------
-- 12. INDEXES (OPTIMIZATION)
---------------------------------------------------------
CREATE INDEX idx_users_email ON dbo.users(email);
CREATE INDEX idx_users_student_code ON dbo.users(student_code);
CREATE INDEX idx_events_start_time ON dbo.events(start_time);
CREATE INDEX idx_events_category ON dbo.events(category_id);
CREATE INDEX idx_reg_user ON dbo.registrations(user_id);
CREATE INDEX idx_reg_event ON dbo.registrations(event_id);
CREATE INDEX idx_reg_status ON dbo.registrations(status);
CREATE INDEX idx_qr_token ON dbo.registrations(qr_token);
CREATE INDEX idx_attendances_checkin_time ON dbo.attendances(checkin_time);
CREATE INDEX idx_refresh_tokens_token ON dbo.refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON dbo.refresh_tokens(expires_at);
CREATE INDEX idx_audit_logs_user ON dbo.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON dbo.audit_logs(entity_name, entity_id);
GO

/* ================= END OF FILE ================= */