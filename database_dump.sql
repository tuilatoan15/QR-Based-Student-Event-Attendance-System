/*
    QR-Based Student Event Attendance System
    SQL Server Database Schema (Matching MongoDB Structure)
    No Data inserted
*/

-- 1. Use existing or create database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'qr_attendance')
BEGIN
    CREATE DATABASE qr_attendance;
END
GO

USE qr_attendance;
GO

-- 2. Drop existing tables (Reverse priority)
IF OBJECT_ID('notifications', 'U') IS NOT NULL DROP TABLE notifications;
IF OBJECT_ID('attendances', 'U') IS NOT NULL DROP TABLE attendances;
IF OBJECT_ID('registrations', 'U') IS NOT NULL DROP TABLE registrations;
IF OBJECT_ID('reports', 'U') IS NOT NULL DROP TABLE reports;
IF OBJECT_ID('organizer_infos', 'U') IS NOT NULL DROP TABLE organizer_infos;
IF OBJECT_ID('events', 'U') IS NOT NULL DROP TABLE events;
IF OBJECT_ID('event_categories', 'U') IS NOT NULL DROP TABLE event_categories;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
IF OBJECT_ID('counters', 'U') IS NOT NULL DROP TABLE counters;
GO

-- 3. Create Tables

-- Counters (used for legacy SQL ID generation)
CREATE TABLE counters (
    id NVARCHAR(50) PRIMARY KEY,
    seq INT NOT NULL DEFAULT 0
);

-- Users
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_sql_id INT NULL,
    full_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(MAX) NOT NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'student',
    student_code NVARCHAR(50) NULL,
    avatar NVARCHAR(MAX) NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Event Categories
CREATE TABLE event_categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- Events
CREATE TABLE events (
    id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_sql_id INT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    category_id INT NULL,
    location NVARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    max_participants INT DEFAULT 0,
    images NVARCHAR(MAX) NULL, -- JSON or Comma separated
    is_active BIT DEFAULT 1,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES event_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Organizer Infos
CREATE TABLE organizer_infos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    organization_name NVARCHAR(255) NOT NULL,
    position NVARCHAR(100) NULL,
    phone NVARCHAR(20) NULL,
    bio NVARCHAR(MAX) NULL,
    approval_status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reject_reason NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Registrations
CREATE TABLE registrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_sql_id INT NULL,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    qr_token NVARCHAR(100) NOT NULL UNIQUE,
    status NVARCHAR(20) DEFAULT 'registered', -- 'registered', 'attended', 'cancelled'
    registered_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Attendances
CREATE TABLE attendances (
    id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_sql_id INT NULL,
    registration_id INT NOT NULL,
    event_id INT NOT NULL,
    student_id INT NOT NULL,
    checked_in_by INT NOT NULL,
    checkin_time DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (registration_id) REFERENCES registrations(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (checked_in_by) REFERENCES users(id)
);

-- Reports
CREATE TABLE reports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_sql_id INT NULL,
    user_id INT NOT NULL,
    type NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'responded', 'closed'
    admin_reply NVARCHAR(MAX) NULL,
    replied_at DATETIME NULL,
    replied_by INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (replied_by) REFERENCES users(id)
);

-- Notifications
CREATE TABLE notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    legacy_sql_id INT NULL,
    user_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(50) DEFAULT 'info',
    is_read BIT DEFAULT 0,
    event_id INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);
GO

PRINT 'SQL Server schema for "qr_attendance" created successfully with 9 tables.';
