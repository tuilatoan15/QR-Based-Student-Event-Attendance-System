/* =====================================================
   QR BASED STUDENT EVENT ATTENDANCE SYSTEM DATABASE
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

---------------------------------------------------------
-- 5. EVENT CATEGORIES
---------------------------------------------------------
CREATE TABLE dbo.event_categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(255) NULL
);
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
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_events_category
        FOREIGN KEY (category_id)
        REFERENCES dbo.event_categories(id),

    CONSTRAINT fk_events_created_by
        FOREIGN KEY (created_by)
        REFERENCES dbo.users(id)
);
GO

---------------------------------------------------------
-- 7. REGISTRATIONS
---------------------------------------------------------
CREATE TABLE dbo.registrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    qr_token NVARCHAR(255) NOT NULL UNIQUE,
    status NVARCHAR(20) NOT NULL DEFAULT 'registered'
        CHECK (status IN ('registered','attended','cancelled')),
    registered_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

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
-- 8. ATTENDANCES (CHECK-IN)
---------------------------------------------------------
CREATE TABLE dbo.attendances (
    id INT IDENTITY(1,1) PRIMARY KEY,
    registration_id INT NOT NULL UNIQUE,
    checkin_time DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    checkin_by INT NOT NULL,

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
-- 9. REFRESH TOKENS (JWT)
---------------------------------------------------------
CREATE TABLE dbo.refresh_tokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    token NVARCHAR(500) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    is_revoked BIT NOT NULL DEFAULT 0,

    CONSTRAINT fk_refresh_user
        FOREIGN KEY (user_id)
        REFERENCES dbo.users(id)
        ON DELETE CASCADE
);
GO

---------------------------------------------------------
-- 10. AUDIT LOGS
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
-- 11. INDEXES (OPTIMIZATION)
---------------------------------------------------------
CREATE INDEX idx_users_email ON dbo.users(email);
CREATE INDEX idx_events_start_time ON dbo.events(start_time);
CREATE INDEX idx_registrations_event ON dbo.registrations(event_id);
CREATE INDEX idx_registrations_user ON dbo.registrations(user_id);
GO

/* ================= END OF FILE ================= */