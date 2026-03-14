USE event_system;
GO

---------------------------------------------------------
-- ROLES
---------------------------------------------------------
IF OBJECT_ID('dbo.roles', 'U') IS NULL
BEGIN
  CREATE TABLE roles (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(50) NOT NULL UNIQUE
  );
END

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin')
  INSERT INTO roles (name) VALUES ('admin');
IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'organizer')
  INSERT INTO roles (name) VALUES ('organizer');
IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'student')
  INSERT INTO roles (name) VALUES ('student');

---------------------------------------------------------
-- USERS
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
ELSE
BEGIN
  -- Ensure updated_at column exists for existing databases
  IF COL_LENGTH('dbo.users', 'updated_at') IS NULL
    ALTER TABLE users ADD updated_at DATETIME2 NULL;
END

---------------------------------------------------------
-- EVENT CATEGORIES
---------------------------------------------------------
IF OBJECT_ID('dbo.event_categories', 'U') IS NULL
BEGIN
  CREATE TABLE event_categories (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(100) NOT NULL,
      description NVARCHAR(255)
  );
END

---------------------------------------------------------
-- EVENTS
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
      is_active BIT DEFAULT 1,
      created_at DATETIME2 DEFAULT SYSUTCDATETIME(),

      FOREIGN KEY (category_id) REFERENCES event_categories(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
  );
END

---------------------------------------------------------
-- REGISTRATIONS
---------------------------------------------------------
IF OBJECT_ID('dbo.registrations', 'U') IS NULL
BEGIN
  CREATE TABLE registrations (
      id INT IDENTITY(1,1) PRIMARY KEY,
      user_id INT NOT NULL,
      event_id INT NOT NULL,
      qr_token NVARCHAR(255) UNIQUE,
      status NVARCHAR(20) DEFAULT 'registered',
      registered_at DATETIME2 DEFAULT SYSUTCDATETIME(),

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

      UNIQUE (user_id, event_id)
  );
END

---------------------------------------------------------
-- ATTENDANCES
---------------------------------------------------------
IF OBJECT_ID('dbo.attendances', 'U') IS NULL
BEGIN
  CREATE TABLE attendances (
      id INT IDENTITY(1,1) PRIMARY KEY,
      registration_id INT UNIQUE,
      checkin_time DATETIME2 DEFAULT SYSUTCDATETIME(),
      checkin_by INT,

      FOREIGN KEY (registration_id) REFERENCES registrations(id),
      FOREIGN KEY (checkin_by) REFERENCES users(id)
  );
END

---------------------------------------------------------
-- INDEXES
---------------------------------------------------------

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_users_email' AND object_id = OBJECT_ID('dbo.users'))
  CREATE INDEX idx_users_email ON users(email);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_events_start_time' AND object_id = OBJECT_ID('dbo.events'))
  CREATE INDEX idx_events_start_time ON events(start_time);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_reg_event' AND object_id = OBJECT_ID('dbo.registrations'))
  CREATE INDEX idx_reg_event ON registrations(event_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_events_created_by' AND object_id = OBJECT_ID('dbo.events'))
  CREATE INDEX idx_events_created_by ON events(created_by);

