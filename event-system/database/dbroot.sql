/* =====================================================
   QR BASED STUDENT EVENT ATTENDANCE SYSTEM - DB ROOT (MASSIVE RICH DATA)
   This file contains:
   1. Database Creation & Schema
   2. Roles & Categories
   3. Massive Data Generation (Users, Events, registrations, Attendances)
   ===================================================== */

USE master;
GO
IF DB_ID('event_system') IS NOT NULL
BEGIN
    ALTER DATABASE event_system SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE event_system;
END
GO

CREATE DATABASE event_system;
GO

USE event_system;
GO

---------------------------------------------------------
-- 1. SCHEMA DEFINITION
---------------------------------------------------------
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    student_code NVARCHAR(50),
    role_id INT NOT NULL REFERENCES roles(id),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL
);

CREATE TABLE event_categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(255)
);

CREATE TABLE events (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    location NVARCHAR(255) NOT NULL,
    start_time DATETIME2 NOT NULL,
    end_time DATETIME2 NOT NULL,
    max_participants INT NOT NULL,
    category_id INT REFERENCES event_categories(id),
    created_by INT NOT NULL REFERENCES users(id),
    google_sheet_id NVARCHAR(255) NULL,
    google_sheet_name NVARCHAR(255) NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    CHECK (end_time > start_time),
    CHECK (max_participants > 0)
);

CREATE TABLE registrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    qr_token NVARCHAR(255) UNIQUE NOT NULL,
    status NVARCHAR(20) DEFAULT 'registered', -- registered, attended, cancelled
    registered_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_user_event UNIQUE(user_id, event_id)
);

CREATE TABLE attendances (
    id INT IDENTITY(1,1) PRIMARY KEY,
    registration_id INT UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    checkin_time DATETIME2 DEFAULT SYSUTCDATETIME(),
    checkin_by INT NOT NULL REFERENCES users(id)
);

CREATE TABLE notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    is_read BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_reg_event ON registrations(event_id);
GO

---------------------------------------------------------
-- 2. SEED ROLES & CATEGORIES
---------------------------------------------------------
INSERT INTO roles (name) VALUES (N'admin'), (N'organizer'), (N'student');

INSERT INTO event_categories (name, description) VALUES
(N'Công nghệ', N'Workshop, lập trình, AI, Blockchain'),
(N'Kỹ năng', N'Kỹ năng mềm, giao tiếp, thuyết trình'),
(N'Sức khỏe', N'Thể thao, giải chạy, yoga'),
(N'Nghệ thuật', N'Âm nhạc, mỹ thuật, hội họa'),
(N'Sự nghiệp', N'Tư vấn hướng nghiệp, tuyển dụng');
GO

---------------------------------------------------------
-- 3. MASSIVE DATA GENERATION
---------------------------------------------------------
DECLARE @Pass NVARCHAR(255) = N'$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG'; -- 'password123'

-- ADMIN
INSERT INTO users (full_name, email, password_hash, role_id) 
VALUES (N'System Admin', N'admin@university.edu', @Pass, 1);

-- 15 ORGANIZERS
DECLARE @i INT = 1;
WHILE @i <= 15
BEGIN
    INSERT INTO users (full_name, email, password_hash, role_id)
    VALUES (N'Organizer ' + CAST(@i AS NVARCHAR(5)), N'organizer' + CAST(@i AS NVARCHAR(5)) + N'@university.edu', @Pass, 2);
    SET @i = @i + 1;
END

-- 120 STUDENTS
SET @i = 1;
DECLARE @LastName TABLE (name NVARCHAR(50));
INSERT INTO @LastName VALUES (N'Nguyễn'), (N'Trần'), (N'Lê'), (N'Phạm'), (N'Hoàng'), (N'Vũ'), (N'Phan'), (N'Đặng'), (N'Bùi'), (N'Đỗ');
DECLARE @MiddleName TABLE (name NVARCHAR(50));
INSERT INTO @MiddleName VALUES (N'Văn'), (N'Thị'), (N'Quang'), (N'Minh'), (N'Thanh'), (N'Anh'), (N'Hữu'), (N'Đắc'), (N'Thường');
DECLARE @FirstName TABLE (name NVARCHAR(50));
INSERT INTO @FirstName VALUES (N'Anh'), (N'Bình'), (N'Chi'), (N'Dũng'), (N'Em'), (N'Giang'), (N'Hương'), (N'Hùng'), (N'Khanh'), (N'Linh'), (N'Minh'), (N'Nam'), (N'Oanh'), (N'Phúc'), (N'Quân'), (N'Sơn'), (N'Tú'), (N'Vân');

WHILE @i <= 120
BEGIN
    DECLARE @fn NVARCHAR(100) = (SELECT TOP 1 name FROM @LastName ORDER BY NEWID()) + N' ' + 
                                (SELECT TOP 1 name FROM @MiddleName ORDER BY NEWID()) + N' ' + 
                                (SELECT TOP 1 name FROM @FirstName ORDER BY NEWID());
    INSERT INTO users (full_name, email, password_hash, student_code, role_id)
    VALUES (@fn, N'student' + CAST(@i AS NVARCHAR(5)) + N'@university.edu', @Pass, N'SV' + RIGHT(N'000' + CAST(@i AS NVARCHAR(5)), 5), 3);
    SET @i = @i + 1;
END
GO

-- 25 EVENTS
DECLARE @OrgBaseId INT = (SELECT MIN(id) FROM users WHERE role_id = 2);
DECLARE @CatBaseId INT = (SELECT MIN(id) FROM event_categories);
DECLARE @e INT = 1;
WHILE @e <= 25
BEGIN
    DECLARE @oid INT = @OrgBaseId + (@e % 15);
    DECLARE @cid INT = @CatBaseId + (@e % 5);
    DECLARE @dayDiff INT = (@e % 60) - 30; -- Some past, some future
    DECLARE @stime DATETIME2 = DATEADD(day, @dayDiff, SYSUTCDATETIME());
    SET @stime = DATETIME2FROMPARTS(YEAR(@stime), MONTH(@stime), DAY(@stime), 8 + (@e % 10), 0, 0, 0, 0);
    
    INSERT INTO events (title, description, location, start_time, end_time, max_participants, category_id, created_by)
    VALUES (
        N'Sự kiện ' + CAST(@e AS NVARCHAR(5)) + N': ' + 
        CASE (@e % 5) 
            WHEN 0 THEN N'Workshop Lập trình' 
            WHEN 1 THEN N'Talkshow Kỹ năng' 
            WHEN 2 THEN N'Giải chạy Marathon' 
            WHEN 3 THEN N'Đêm nhạc sinh viên' 
            ELSE N'Hội chợ việc làm' 
        END,
        N'Mô tả chi tiết cho sự kiện số ' + CAST(@e AS NVARCHAR(5)) + N'. Đây là không gian giao lưu bổ ích.',
        N'Địa điểm ' + CAST((@e % 10) + 1 AS NVARCHAR(5)),
        @stime,
        DATEADD(hour, 3, @stime),
        30 + (@e * 5),
        @cid,
        @oid
    );
    SET @e = @e + 1;
END
GO

-- ~600 REGISTRATIONS
-- Each student registers for 5 random events
DECLARE @s INT;
DECLARE @sMin INT = (SELECT MIN(id) FROM users WHERE role_id = 3);
DECLARE @sMax INT = (SELECT MAX(id) FROM users WHERE role_id = 3);
DECLARE @eMin INT = (SELECT MIN(id) FROM events);
DECLARE @eMax INT = (SELECT MAX(id) FROM events);

SET @s = @sMin;
WHILE @s <= @sMax
BEGIN
    DECLARE @count INT = 0;
    WHILE @count < 5
    BEGIN
        DECLARE @eid INT = @eMin + (ABS(CHECKSUM(NEWID())) % (@eMax - @eMin + 1));
        IF NOT EXISTS (SELECT 1 FROM registrations WHERE user_id = @s AND event_id = @eid)
        BEGIN
            INSERT INTO registrations (user_id, event_id, qr_token, status)
            VALUES (@s, @eid, N'QR_' + CAST(@s AS NVARCHAR(10)) + N'_' + CAST(@eid AS NVARCHAR(10)), N'registered');
            SET @count = @count + 1;
        END
    END
    SET @s = @s + 1;
END
GO

-- 120 ATTENDANCES
-- Pick past events and mark some registrations as 'attended'
DECLARE @pastEventId INT;
DECLARE past_event_cursor CURSOR FOR 
SELECT id FROM events WHERE start_time < SYSUTCDATETIME();

OPEN past_event_cursor;
FETCH NEXT FROM past_event_cursor INTO @pastEventId;

DECLARE @totalCheckins INT = 0;
WHILE @@FETCH_STATUS = 0 AND @totalCheckins < 120
BEGIN
    -- For each past event, mark up to 15 people as attended
    DECLARE @regId INT;
    DECLARE reg_cursor CURSOR FOR 
    SELECT TOP 15 id FROM registrations WHERE event_id = @pastEventId AND status = N'registered';
    
    OPEN reg_cursor;
    FETCH NEXT FROM reg_cursor INTO @regId;
    WHILE @@FETCH_STATUS = 0 AND @totalCheckins < 120
    BEGIN
        -- Update Registration
        UPDATE registrations SET status = N'attended' WHERE id = @regId;
        
        -- Insert Attendance
        DECLARE @organizerId INT = (SELECT created_by FROM events WHERE id = @pastEventId);
        INSERT INTO attendances (registration_id, checkin_time, checkin_by)
        VALUES (@regId, DATEADD(minute, ABS(CHECKSUM(NEWID())) % 60, (SELECT start_time FROM events WHERE id = @pastEventId)), @organizerId);
        
        SET @totalCheckins = @totalCheckins + 1;
        FETCH NEXT FROM reg_cursor INTO @regId;
    END
    CLOSE reg_cursor;
    DEALLOCATE reg_cursor;
    
    FETCH NEXT FROM past_event_cursor INTO @pastEventId;
END
CLOSE past_event_cursor;
DEALLOCATE past_event_cursor;
GO
