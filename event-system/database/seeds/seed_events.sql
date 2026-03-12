-- Basic categories (idempotent insert)
IF NOT EXISTS (SELECT 1 FROM event_categories)
BEGIN
  INSERT INTO event_categories (name, description)
  VALUES
    ('Academic','Academic lectures'),
    ('Sports','Sport activities'),
    ('Cultural','Cultural events'),
    ('Technology','Tech workshops');
END

-- Minimal events (requires organizer with id=2 from seed_users.sql)
IF NOT EXISTS (SELECT 1 FROM events)
BEGIN
  INSERT INTO events
    (title,description,location,start_time,end_time,max_participants,category_id,created_by,is_active,created_at)
  VALUES
    ('AI Workshop','AI and Machine Learning','Computer Lab',DATEADD(day, 7, SYSUTCDATETIME()),DATEADD(hour, 3, DATEADD(day, 7, SYSUTCDATETIME())),50,4,2,1,SYSUTCDATETIME()),
    ('Flutter Workshop','Learn Flutter basics','Room 101',DATEADD(day, 10, SYSUTCDATETIME()),DATEADD(hour, 2, DATEADD(day, 10, SYSUTCDATETIME())),60,4,2,1,SYSUTCDATETIME()),
    ('Cyber Security Seminar','Security best practices','Auditorium',DATEADD(day, 14, SYSUTCDATETIME()),DATEADD(hour, 2, DATEADD(day, 14, SYSUTCDATETIME())),120,1,2,1,SYSUTCDATETIME());
END

