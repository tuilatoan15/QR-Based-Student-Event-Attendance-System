/* =====================================================
   QR BASED STUDENT EVENT ATTENDANCE SYSTEM - MASTER SCHEMA
   Database: SQL Server
   ===================================================== */

USE event_system;
GO

---------------------------------------------------------
-- 1. ROLES
---------------------------------------------------------
IF OBJECT_ID('dbo.roles', 'U') IS NULL
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL UNIQUE
    );
END

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin') INSERT INTO roles (name) VALUES ('admin');
IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'organizer') INSERT INTO roles (name) VALUES ('organizer');
IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'student') INSERT INTO roles (name) VALUES ('student');
GO

---------------------------------------------------------
-- 2. USERS
---------------------------------------------------------
IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        full_name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        student_code NVARCHAR(50),
        role_id INT NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,

        FOREIGN KEY (role_id) REFERENCES roles(id)
    );
END
GO

---------------------------------------------------------
-- 3. EVENT CATEGORIES
---------------------------------------------------------
IF OBJECT_ID('dbo.event_categories', 'U') IS NULL
BEGIN
    CREATE TABLE event_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(255)
    );
END
GO

---------------------------------------------------------
-- 4. EVENTS
---------------------------------------------------------
IF OBJECT_ID('dbo.events', 'U') IS NULL
BEGIN
    CREATE TABLE events (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        location NVARCHAR(255) NOT NULL,
        start_time DATETIME2 NOT NULL,
        end_time DATETIME2 NOT NULL,
        max_participants INT NOT NULL,
        category_id INT,
        created_by INT NOT NULL,
        google_sheet_id NVARCHAR(255) NULL,
        google_sheet_name NVARCHAR(255) NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,

        FOREIGN KEY (category_id) REFERENCES event_categories(id),
        FOREIGN KEY (created_by) REFERENCES users(id),

        CHECK (end_time > start_time),
        CHECK (max_participants > 0)
    );
END
GO

---------------------------------------------------------
-- 5. REGISTRATIONS
---------------------------------------------------------
IF OBJECT_ID('dbo.registrations', 'U') IS NULL
BEGIN
    CREATE TABLE registrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        event_id INT NOT NULL,
        qr_token NVARCHAR(255) UNIQUE NOT NULL,
        status NVARCHAR(20) DEFAULT 'registered',
        registered_at DATETIME2 DEFAULT SYSUTCDATETIME(),

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

        CONSTRAINT uq_user_event UNIQUE(user_id, event_id)
    );
END
GO

---------------------------------------------------------
-- 6. ATTENDANCES
---------------------------------------------------------
IF OBJECT_ID('dbo.attendances', 'U') IS NULL
BEGIN
    CREATE TABLE attendances (
        id INT IDENTITY(1,1) PRIMARY KEY,
        registration_id INT UNIQUE NOT NULL,
        checkin_time DATETIME2 DEFAULT SYSUTCDATETIME(),
        checkin_by INT NOT NULL,

        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
        FOREIGN KEY (checkin_by) REFERENCES users(id)
    );
END
GO

---------------------------------------------------------
-- 7. REFRESH TOKENS
---------------------------------------------------------
IF OBJECT_ID('dbo.refresh_tokens', 'U') IS NULL
BEGIN
    CREATE TABLE refresh_tokens (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        token NVARCHAR(500) UNIQUE NOT NULL,
        expires_at DATETIME2 NOT NULL,
        is_revoked BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

---------------------------------------------------------
-- 8. AUDIT LOGS
---------------------------------------------------------
IF OBJECT_ID('dbo.audit_logs', 'U') IS NULL
BEGIN
    CREATE TABLE audit_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        action NVARCHAR(255) NOT NULL,
        entity_name NVARCHAR(100),
        entity_id INT,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),

        FOREIGN KEY (user_id) REFERENCES users(id)
    );
END
GO

---------------------------------------------------------
-- 9. INDEXES
---------------------------------------------------------

-- Users
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_users_email' AND object_id = OBJECT_ID('dbo.users'))
    CREATE INDEX idx_users_email ON users(email);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_users_student_code' AND object_id = OBJECT_ID('dbo.users'))
    CREATE INDEX idx_users_student_code ON users(student_code);

-- Events
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_events_start_time' AND object_id = OBJECT_ID('dbo.events'))
    CREATE INDEX idx_events_start_time ON events(start_time);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_events_category' AND object_id = OBJECT_ID('dbo.events'))
    CREATE INDEX idx_events_category ON events(category_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_events_created_by' AND object_id = OBJECT_ID('dbo.events'))
    CREATE INDEX idx_events_created_by ON events(created_by);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_events_google_sheet_id' AND object_id = OBJECT_ID('dbo.events'))
    CREATE INDEX idx_events_google_sheet_id ON events(google_sheet_id);

-- Registrations
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_reg_user' AND object_id = OBJECT_ID('dbo.registrations'))
    CREATE INDEX idx_reg_user ON registrations(user_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_reg_event' AND object_id = OBJECT_ID('dbo.registrations'))
    CREATE INDEX idx_reg_event ON registrations(event_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_qr_token' AND object_id = OBJECT_ID('dbo.registrations'))
    CREATE INDEX idx_qr_token ON registrations(qr_token);

-- Attendances
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_attendance_checkin' AND object_id = OBJECT_ID('dbo.attendances'))
    CREATE INDEX idx_attendance_checkin ON attendances(checkin_time);
GO
