/*
  Demo data generator (SQL Server / T-SQL)

  Generates:
  - 100 students
  - 20 events
  - 500 registrations (randomized)

  Assumptions:
  - roles inserted by migration 001 (admin=1, organizer=2, student=3)
  - organizer user exists with id=2 from seed_users.sql
*/

-- Create 100 students if they don't exist
DECLARE @i INT = 1;
WHILE @i <= 100
BEGIN
  DECLARE @email NVARCHAR(255) = CONCAT('student', @i, '@university.edu');
  DECLARE @name NVARCHAR(255) = CONCAT('Student ', @i);
  DECLARE @code NVARCHAR(50) = CONCAT('SV', RIGHT(CONCAT('000', @i), 3));

  IF NOT EXISTS (SELECT 1 FROM users WHERE email = @email)
  BEGIN
    INSERT INTO users (full_name, email, password_hash, student_code, role_id, is_active, created_at)
    VALUES (@name, @email, '$2b$10$erzpoTBZRrCo6upEaDuoUeEuTWOP7na4.lOdC93BgDASxDI/HQJ/.', @code, 3, 1, SYSUTCDATETIME());
  END

  SET @i += 1;
END

-- Create 20 demo events if there are fewer than 20
DECLARE @eventCount INT = (SELECT COUNT(1) FROM events);
IF @eventCount < 20
BEGIN
  DECLARE @titles TABLE (t NVARCHAR(255));
  INSERT INTO @titles (t) VALUES
    ('AI Workshop'),
    ('Flutter Workshop'),
    ('Web Development Bootcamp'),
    ('Cyber Security Seminar'),
    ('Startup Talk'),
    ('Cloud Computing Intro'),
    ('Data Science Meetup'),
    ('UI/UX Design Talk'),
    ('Networking Basics'),
    ('DevOps Practices'),
    ('Mobile App Hackathon'),
    ('React Workshop'),
    ('SQL Server Deep Dive'),
    ('Product Management 101'),
    ('Career Mentorship'),
    ('Blockchain Seminar'),
    ('IoT Showcase'),
    ('Machine Learning Lab'),
    ('Open Source Meetup'),
    ('Tech Career Fair');

  ;WITH numbered AS (
    SELECT ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS rn, t
    FROM @titles
  )
  INSERT INTO events
    (title, description, location, start_time, end_time, max_participants, category_id, created_by, is_active, created_at)
  SELECT
    n.t,
    CONCAT(n.t, ' - demo event'),
    CONCAT('Room ', 100 + n.rn),
    d.start_dt,
    DATEADD(hour, d.duration_hours, d.start_dt),
    (ABS(CHECKSUM(NEWID())) % 71) + 30, -- 30..100
    ((ABS(CHECKSUM(NEWID())) % 4) + 1), -- category 1..4
    2,
    1,
    SYSUTCDATETIME()
  FROM numbered n
  CROSS APPLY (
    SELECT
      DATEADD(day, (ABS(CHECKSUM(NEWID())) % 60) + 1, SYSUTCDATETIME()) AS start_dt,
      (ABS(CHECKSUM(NEWID())) % 4) + 2 AS duration_hours
  ) d
  WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.title = n.t);
END

-- Generate up to 500 registrations (skip duplicates by constraint)
;WITH students AS (
  SELECT TOP (100) id AS user_id
  FROM users
  WHERE role_id = 3
  ORDER BY id
),
evs AS (
  SELECT TOP (20) id AS event_id
  FROM events
  ORDER BY id
),
pairs AS (
  -- Cross join gives 2000 possible pairs; pick 500 random pairs.
  SELECT TOP (500)
    s.user_id,
    e.event_id,
    CONVERT(NVARCHAR(255), NEWID()) AS qr_token
  FROM students s
  CROSS JOIN evs e
  ORDER BY NEWID()
)
INSERT INTO registrations (user_id, event_id, qr_token, status, registered_at)
SELECT
  p.user_id,
  p.event_id,
  p.qr_token,
  'registered',
  SYSUTCDATETIME()
FROM pairs p
WHERE NOT EXISTS (
  SELECT 1
  FROM registrations r
  WHERE r.user_id = p.user_id AND r.event_id = p.event_id
);

