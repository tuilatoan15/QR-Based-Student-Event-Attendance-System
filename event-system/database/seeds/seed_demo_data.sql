USE event_system;
GO

---------------------------------------------------------
-- SAMPLE CATEGORIES
---------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM event_categories)
BEGIN
    INSERT INTO event_categories (name, description)
    VALUES
    ('Academic','Academic lectures and seminars'),
    ('Sports','Sport activities and competitions'),
    ('Cultural','Cultural and social events'),
    ('Technology','Tech workshops and hackathons');
END
GO

---------------------------------------------------------
-- SAMPLE USERS
-- All passwords are 'password123'
---------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@university.edu')
    INSERT INTO users (full_name,email,password_hash,student_code,role_id)
    VALUES ('System Admin','admin@university.edu','$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG',NULL,1);

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'organizer@university.edu')
    INSERT INTO users (full_name,email,password_hash,student_code,role_id)
    VALUES ('Event Organizer','organizer@university.edu','$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG',NULL,2);

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'student1@university.edu')
    INSERT INTO users (full_name,email,password_hash,student_code,role_id)
    VALUES ('Nguyen Van A','student1@university.edu','$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG','SV001',3);

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'student2@university.edu')
    INSERT INTO users (full_name,email,password_hash,student_code,role_id)
    VALUES ('Tran Thi B','student2@university.edu','$2b$10$sI/rsbkKcqWyNB8yYbLTZeuNnq..u4tOIA2yZpCkefXs8VF8ZuBwG','SV002',3);
GO

---------------------------------------------------------
-- SAMPLE EVENTS (Created by organizer)
---------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM events)
BEGIN
    DECLARE @OrgId INT = (SELECT id FROM users WHERE email = 'organizer@university.edu');
    
    INSERT INTO events (title,description,location,start_time,end_time,max_participants,category_id,created_by)
    VALUES
    ('Flutter Workshop','Learn Flutter basics','Room 101','2025-12-01 10:00','2025-12-01 12:00',50,4,@OrgId),
    ('Basketball Tournament','Annual event','Sports Center','2025-12-05 14:00','2025-12-05 18:00',100,2,@OrgId),
    ('AI Workshop','AI and Machine Learning','Computer Lab','2025-12-15 09:00','2025-12-15 17:00',30,4,@OrgId);
END
GO
