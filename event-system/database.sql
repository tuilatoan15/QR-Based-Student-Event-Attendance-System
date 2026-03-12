/* =====================================================
   QR BASED STUDENT EVENT ATTENDANCE SYSTEM DATABASE
   Production Ready Version
   ===================================================== */

---------------------------------------------------------
-- 1. CREATE DATABASE
---------------------------------------------------------
IF DB_ID('event_system') IS NULL
BEGIN
    CREATE DATABASE event_system;
END
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
CREATE TABLE roles (
    id INT IDENTITY PRIMARY KEY,
    name NVARCHAR(50) UNIQUE NOT NULL
);
GO

INSERT INTO roles (name)
VALUES ('admin'), ('organizer'), ('student');
GO

---------------------------------------------------------
-- 4. USERS
---------------------------------------------------------
CREATE TABLE users (
    id INT IDENTITY PRIMARY KEY,
    full_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    student_code NVARCHAR(50),
    role_id INT NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2,

    FOREIGN KEY (role_id) REFERENCES roles(id)
);
GO

---------------------------------------------------------
-- 5. EVENT CATEGORIES
---------------------------------------------------------
CREATE TABLE event_categories (
    id INT IDENTITY PRIMARY KEY,
    name NVARCHAR(100) UNIQUE NOT NULL,
    description NVARCHAR(255)
);
GO

INSERT INTO event_categories (name, description)
VALUES
('Academic','Academic lectures'),
('Sports','Sport activities'),
('Cultural','Cultural events'),
('Technology','Tech workshops');
GO

---------------------------------------------------------
-- 6. EVENTS
---------------------------------------------------------
CREATE TABLE events (
    id INT IDENTITY PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    location NVARCHAR(255) NOT NULL,
    start_time DATETIME2 NOT NULL,
    end_time DATETIME2 NOT NULL,
    max_participants INT NOT NULL,
    category_id INT,
    created_by INT NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2,

    FOREIGN KEY (category_id) REFERENCES event_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id),

    CHECK (end_time > start_time),
    CHECK (max_participants > 0)
);
GO

---------------------------------------------------------
-- 7. REGISTRATIONS
---------------------------------------------------------
CREATE TABLE registrations (
    id INT IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    qr_token NVARCHAR(255) UNIQUE NOT NULL,
    status NVARCHAR(20) DEFAULT 'registered',
    registered_at DATETIME2 DEFAULT SYSUTCDATETIME(),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

    CONSTRAINT uq_user_event UNIQUE(user_id,event_id)
);
GO

---------------------------------------------------------
-- 8. ATTENDANCES
---------------------------------------------------------
CREATE TABLE attendances (
    id INT IDENTITY PRIMARY KEY,
    registration_id INT UNIQUE NOT NULL,
    checkin_time DATETIME2 DEFAULT SYSUTCDATETIME(),
    checkin_by INT NOT NULL,

    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (checkin_by) REFERENCES users(id)
);
GO

---------------------------------------------------------
-- 9. REFRESH TOKENS
---------------------------------------------------------
CREATE TABLE refresh_tokens (
    id INT IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    token NVARCHAR(500) UNIQUE NOT NULL,
    expires_at DATETIME2 NOT NULL,
    is_revoked BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

---------------------------------------------------------
-- 10. AUDIT LOGS
---------------------------------------------------------
CREATE TABLE audit_logs (
    id INT IDENTITY PRIMARY KEY,
    user_id INT,
    action NVARCHAR(255) NOT NULL,
    entity_name NVARCHAR(100),
    entity_id INT,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),

    FOREIGN KEY (user_id) REFERENCES users(id)
);
GO

---------------------------------------------------------
-- 11. SAMPLE USERS
---------------------------------------------------------
INSERT INTO users (full_name,email,password_hash,student_code,role_id)
VALUES
('System Admin','admin@university.edu','$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG',NULL,1),
('Event Organizer','organizer@university.edu','$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG',NULL,2),
('Nguyen Van A','student1@university.edu','$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG','SV001',3),
('Tran Thi B','student2@university.edu','$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG','SV002',3),
('Le Van C','student3@university.edu','$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG','SV003',3);
GO

---------------------------------------------------------
-- 12. SAMPLE EVENTS
---------------------------------------------------------
INSERT INTO events
(title,description,location,start_time,end_time,max_participants,category_id,created_by)
VALUES
('Flutter Workshop','Learn Flutter basics','Room 101','2025-12-01 10:00','2025-12-01 12:00',50,4,2),
('Basketball Tournament','Annual basketball event','Sports Center','2025-12-05 14:00','2025-12-05 18:00',100,2,2),
('Cultural Festival','Music and food festival','Auditorium','2025-12-10 18:00','2025-12-10 22:00',200,3,2),
('AI Workshop','AI and Machine Learning','Computer Lab','2025-12-15 09:00','2025-12-15 17:00',30,4,2);
GO

---------------------------------------------------------
-- 13. INDEXES
---------------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_code ON users(student_code);

CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_category ON events(category_id);

CREATE INDEX idx_reg_user ON registrations(user_id);
CREATE INDEX idx_reg_event ON registrations(event_id);
CREATE INDEX idx_qr_token ON registrations(qr_token);

CREATE INDEX idx_attendance_checkin ON attendances(checkin_time);
GO